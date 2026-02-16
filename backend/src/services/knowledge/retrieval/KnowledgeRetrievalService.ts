import { db } from '../../../db/client.js';
import { knowledgeDocuments, knowledgeChunks } from '../../../db/schema.js';
import { eq, and, ilike, desc, sql } from 'drizzle-orm';
import type { RetrievalResult, RetrievalOptions } from './types.js';
import { getPiriRAGService } from '../../rag/PiriRAGService.js';

const DEFAULT_MAX_RESULTS = 10;
const DEFAULT_MAX_TOKENS = 4000;
const DEFAULT_KEYWORD_WEIGHT = 0.55;
const DEFAULT_SEMANTIC_WEIGHT = 0.45;

export class KnowledgeRetrievalService {
  async search(
    query: string,
    options: RetrievalOptions = {}
  ): Promise<RetrievalResult[]> {
    return this.searchKeyword(query, options);
  }

  async searchHybrid(
    query: string,
    options: RetrievalOptions = {}
  ): Promise<RetrievalResult[]> {
    const maxResults = options.maxResults ?? DEFAULT_MAX_RESULTS;
    const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
    const keywordWeight = options.keywordWeight ?? DEFAULT_KEYWORD_WEIGHT;
    const semanticWeight = options.semanticWeight ?? DEFAULT_SEMANTIC_WEIGHT;

    const [keywordResults, semanticResults] = await Promise.all([
      this.searchKeyword(query, { ...options, maxResults: maxResults * 2, maxTokens: maxTokens * 2 }),
      this.searchSemantic(query, maxResults * 2),
    ]);

    const merged = this.mergeHybridResults(
      keywordResults,
      semanticResults,
      keywordWeight,
      semanticWeight
    );

    return this.applyTokenBudget(merged, maxResults, maxTokens);
  }

  protected async searchKeyword(
    query: string,
    options: RetrievalOptions = {}
  ): Promise<RetrievalResult[]> {
    const {
      maxResults = DEFAULT_MAX_RESULTS,
      maxTokens = DEFAULT_MAX_TOKENS,
      filters = {},
      includeProposed = false,
    } = options;

    const conditions = [];

    if (filters.workspaceId) {
      conditions.push(eq(knowledgeDocuments.workspaceId, filters.workspaceId));
    }

    if (filters.agentType) {
      conditions.push(eq(knowledgeDocuments.agentType, filters.agentType));
    }

    if (filters.docType) {
      conditions.push(eq(knowledgeDocuments.docType, filters.docType));
    }

    if (includeProposed) {
      conditions.push(
        sql`${knowledgeDocuments.status} IN ('approved', 'proposed')`
      );
    } else {
      conditions.push(eq(knowledgeDocuments.status, 'approved'));
    }

    const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 2);
    
    if (keywords.length > 0) {
      const keywordConditions = keywords.map(keyword => 
        ilike(knowledgeChunks.content, `%${keyword}%`)
      );
      conditions.push(sql`(${sql.join(keywordConditions, sql` OR `)})`);
    }

    const results = await db
      .select({
        documentId: knowledgeDocuments.id,
        chunkId: knowledgeChunks.id,
        content: knowledgeChunks.content,
        tokenCount: knowledgeChunks.tokenCount,
        title: knowledgeDocuments.title,
        sourcePath: knowledgeDocuments.sourcePath,
        commitSha: knowledgeDocuments.commitSha,
        docType: knowledgeDocuments.docType,
      })
      .from(knowledgeChunks)
      .innerJoin(knowledgeDocuments, eq(knowledgeChunks.documentId, knowledgeDocuments.id))
      .where(and(...conditions))
      .orderBy(desc(knowledgeDocuments.updatedAt))
      .limit(maxResults * 2);

    const scoredResults: RetrievalResult[] = results.map(row => {
      const contentLower = row.content.toLowerCase();
      const keywordMatches = keywords.filter(k => contentLower.includes(k)).length;
      const score = keywordMatches / Math.max(keywords.length, 1);

      return {
        documentId: row.documentId,
        chunkId: row.chunkId,
        content: row.content,
        score,
        keywordScore: score,
        semanticScore: 0,
        retrievalMethod: 'keyword',
        provenance: {
          title: row.title,
          sourcePath: row.sourcePath ?? undefined,
          commitSha: row.commitSha ?? undefined,
          docType: row.docType,
        },
      };
    });

    scoredResults.sort((a, b) => b.score - a.score);

    return this.applyTokenBudget(scoredResults, maxResults, maxTokens);
  }

  async getDocumentById(documentId: string) {
    const [doc] = await db
      .select()
      .from(knowledgeDocuments)
      .where(eq(knowledgeDocuments.id, documentId))
      .limit(1);

    return doc ?? null;
  }

  async getChunksByDocumentId(documentId: string) {
    return db
      .select()
      .from(knowledgeChunks)
      .where(eq(knowledgeChunks.documentId, documentId))
      .orderBy(knowledgeChunks.chunkIndex);
  }

  protected async searchSemantic(query: string, maxResults: number): Promise<RetrievalResult[]> {
    const piri = getPiriRAGService();
    if (!piri) {
      return [];
    }

    try {
      const semantic = await piri.search(query, maxResults);
      return semantic.results.map((item, index) => {
        const semanticScore = this.clampScore(item.score);
        const idBase = this.hashText(`${item.source}:${item.content.slice(0, 120)}`);
        return {
          documentId: `semantic:${idBase}`,
          chunkId: `semantic:${index}:${idBase}`,
          content: item.content,
          score: semanticScore,
          keywordScore: 0,
          semanticScore,
          retrievalMethod: 'semantic',
          provenance: {
            title: item.source || 'Piri Semantic Search',
            sourcePath: item.source || undefined,
            docType: 'semantic_external',
          },
        };
      });
    } catch {
      return [];
    }
  }

  private mergeHybridResults(
    keywordResults: RetrievalResult[],
    semanticResults: RetrievalResult[],
    keywordWeight: number,
    semanticWeight: number
  ): RetrievalResult[] {
    const map = new Map<string, RetrievalResult>();

    const upsert = (result: RetrievalResult, channel: 'keyword' | 'semantic') => {
      const key = this.normalizeForMerge(result.content);
      const existing = map.get(key);
      const nextKeyword = channel === 'keyword'
        ? result.keywordScore ?? result.score
        : existing?.keywordScore ?? 0;
      const nextSemantic = channel === 'semantic'
        ? result.semanticScore ?? result.score
        : existing?.semanticScore ?? 0;

      const fusedScore = this.computeFusedScore(
        nextKeyword,
        nextSemantic,
        keywordWeight,
        semanticWeight
      );

      const merged: RetrievalResult = {
        ...(existing ?? result),
        content: existing?.content ?? result.content,
        keywordScore: nextKeyword,
        semanticScore: nextSemantic,
        score: fusedScore,
        retrievalMethod:
          nextKeyword > 0 && nextSemantic > 0
            ? 'hybrid'
            : nextSemantic > 0
              ? 'semantic'
              : 'keyword',
      };

      if (!existing || result.score > existing.score) {
        merged.documentId = result.documentId;
        merged.chunkId = result.chunkId;
        merged.provenance = result.provenance;
      }

      map.set(key, merged);
    };

    for (const result of keywordResults) {
      upsert(result, 'keyword');
    }
    for (const result of semanticResults) {
      upsert(result, 'semantic');
    }

    return Array.from(map.values()).sort((a, b) => b.score - a.score);
  }

  private computeFusedScore(
    keywordScore: number,
    semanticScore: number,
    keywordWeight: number,
    semanticWeight: number
  ): number {
    const hasKeyword = keywordScore > 0;
    const hasSemantic = semanticScore > 0;
    const weightSum =
      (hasKeyword ? keywordWeight : 0) +
      (hasSemantic ? semanticWeight : 0);

    if (weightSum <= 0) {
      return 0;
    }

    const fused = ((keywordScore * keywordWeight) + (semanticScore * semanticWeight)) / weightSum;
    return Math.round(this.clampScore(fused) * 100) / 100;
  }

  private applyTokenBudget(
    results: RetrievalResult[],
    maxResults: number,
    maxTokens: number
  ): RetrievalResult[] {
    let totalTokens = 0;
    const budgetedResults: RetrievalResult[] = [];

    for (const result of results) {
      const tokenCount = Math.ceil(result.content.length / 4);
      if (totalTokens + tokenCount > maxTokens) break;
      if (budgetedResults.length >= maxResults) break;

      totalTokens += tokenCount;
      budgetedResults.push(result);
    }

    return budgetedResults;
  }

  private normalizeForMerge(content: string): string {
    return content.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private clampScore(score: number): number {
    if (!Number.isFinite(score)) return 0;
    if (score < 0) return 0;
    if (score > 1) return 1;
    return score;
  }

  private hashText(value: string): string {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
      hash = (hash << 5) - hash + value.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  }
}

export const knowledgeRetrievalService = new KnowledgeRetrievalService();
