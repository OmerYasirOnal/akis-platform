import { db } from '../../../db/client.js';
import { knowledgeDocuments, knowledgeChunks } from '../../../db/schema.js';
import { eq, and, ilike, desc, sql } from 'drizzle-orm';
import type { RetrievalResult, RetrievalOptions } from './types.js';

const DEFAULT_MAX_RESULTS = 10;
const DEFAULT_MAX_TOKENS = 4000;

export class KnowledgeRetrievalService {
  async search(
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
        provenance: {
          title: row.title,
          sourcePath: row.sourcePath ?? undefined,
          commitSha: row.commitSha ?? undefined,
          docType: row.docType,
        },
      };
    });

    scoredResults.sort((a, b) => b.score - a.score);

    let totalTokens = 0;
    const budgetedResults: RetrievalResult[] = [];

    for (const result of scoredResults) {
      const tokenCount = Math.ceil(result.content.length / 4);
      if (totalTokens + tokenCount > maxTokens) break;
      if (budgetedResults.length >= maxResults) break;
      
      totalTokens += tokenCount;
      budgetedResults.push(result);
    }

    return budgetedResults;
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
}

export const knowledgeRetrievalService = new KnowledgeRetrievalService();
