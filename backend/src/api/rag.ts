/**
 * RAG API Routes — Proxy to Piri RAG Engine
 *
 * All mutation routes require authentication via requireAuth().
 * Piri must be configured via PIRI_BASE_URL env var.
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { inArray } from 'drizzle-orm';
import { db } from '../db/client.js';
import { knowledgeDocuments } from '../db/schema.js';
import { getPiriRAGService } from '../services/rag/PiriRAGService.js';
import { knowledgeRetrievalService } from '../services/knowledge/retrieval/KnowledgeRetrievalService.js';
import type { RetrievalResult } from '../services/knowledge/retrieval/types.js';
import { requireAuth } from '../utils/auth.js';

const DEFAULT_KEYWORD_WEIGHT = 0.55;
const DEFAULT_SEMANTIC_WEIGHT = 0.45;
const DEFAULT_EVAL_TOP_K = 5;
const DEFAULT_EVAL_MAX_TOKENS = 4000;

const ragEvaluationSchema = z.object({
  queries: z.array(z.string().min(1)).min(1).max(30),
  topK: z.coerce.number().int().min(1).max(20).default(DEFAULT_EVAL_TOP_K),
  maxTokens: z.coerce.number().int().min(500).max(8000).default(DEFAULT_EVAL_MAX_TOKENS),
  includeProposed: z.boolean().default(false),
  keywordWeight: z.coerce.number().min(0).max(1).default(DEFAULT_KEYWORD_WEIGHT),
  semanticWeight: z.coerce.number().min(0).max(1).default(DEFAULT_SEMANTIC_WEIGHT),
  minResultsThreshold: z.coerce.number().int().min(1).max(20).default(1),
});

type EvaluationQueryDetail = {
  query: string;
  resultCount: number;
  topScore: number;
  thresholdMet: boolean;
  stabilityOverlap: number;
  retrievalMix: {
    keyword: number;
    semantic: number;
    hybrid: number;
  };
};

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function toMetric(value: number): number {
  return Math.round(clampScore(value) * 100) / 100;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function topKChunkIds(results: RetrievalResult[], topK: number): Set<string> {
  return new Set(results.slice(0, topK).map((result) => result.chunkId));
}

function computeOverlap(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const id of a) {
    if (b.has(id)) intersection += 1;
  }
  const denominator = Math.max(a.size, b.size);
  if (denominator === 0) return 0;
  return intersection / denominator;
}

function extractFreshnessScore(metadata: Record<string, unknown> | null | undefined): number | null {
  if (!metadata || typeof metadata !== 'object') {
    return null;
  }
  const freshness = metadata.freshness;
  if (!freshness || typeof freshness !== 'object') {
    return null;
  }
  const score = (freshness as { score?: unknown }).score;
  if (typeof score !== 'number') {
    return null;
  }
  return clampScore(score);
}

function ensurePiri(reply: FastifyReply) {
  const piri = getPiriRAGService();
  if (!piri) {
    reply.code(503).send({
      error: {
        code: 'RAG_NOT_CONFIGURED',
        message: 'Piri RAG Engine is not configured. Set PIRI_BASE_URL in environment.',
      },
    });
    return null;
  }
  return piri;
}

export async function ragRoutes(fastify: FastifyInstance) {
  // Health / status (no auth — used by readiness probes)
  fastify.get('/api/rag/status', async (_request, reply) => {
    const piri = getPiriRAGService();
    if (!piri) {
      return reply.send({ configured: false, healthy: false });
    }
    try {
      const health = await piri.health();
      const info = await piri.info();
      return reply.send({
        configured: true,
        healthy: health.status === 'ok',
        version: health.version,
        rag_ready: health.rag_ready,
        model: info.model,
        backend: info.backend,
        rag_status: info.rag_status,
      });
    } catch {
      return reply.send({ configured: true, healthy: false, error: 'Piri unreachable' });
    }
  });

  // RAG Query
  fastify.post('/api/rag/query', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await requireAuth(request);
    } catch {
      return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const piri = ensurePiri(reply);
    if (!piri) return;

    const { question, top_k, max_new_tokens, temperature } = request.body as {
      question: string;
      top_k?: number;
      max_new_tokens?: number;
      temperature?: number;
    };

    if (!question?.trim()) {
      return reply.code(400).send({ error: { code: 'INVALID_INPUT', message: 'question is required' } });
    }

    try {
      const result = await piri.query(question, top_k, max_new_tokens, temperature);
      return reply.send(result);
    } catch (err) {
      return reply.code(502).send({
        error: { code: 'RAG_QUERY_FAILED', message: err instanceof Error ? err.message : 'Unknown error' },
      });
    }
  });

  // Semantic Search
  fastify.post('/api/rag/search', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await requireAuth(request);
    } catch {
      return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const piri = ensurePiri(reply);
    if (!piri) return;

    const { query, top_k } = request.body as { query: string; top_k?: number };

    if (!query?.trim()) {
      return reply.code(400).send({ error: { code: 'INVALID_INPUT', message: 'query is required' } });
    }

    try {
      const result = await piri.search(query, top_k);
      return reply.send(result);
    } catch (err) {
      return reply.code(502).send({
        error: { code: 'RAG_SEARCH_FAILED', message: err instanceof Error ? err.message : 'Unknown error' },
      });
    }
  });

  // Web Search + Auto-learn
  fastify.post('/api/rag/web-search', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await requireAuth(request);
    } catch {
      return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const piri = ensurePiri(reply);
    if (!piri) return;

    const { query, max_results, auto_learn, top_k } = request.body as {
      query: string;
      max_results?: number;
      auto_learn?: boolean;
      top_k?: number;
    };

    if (!query?.trim()) {
      return reply.code(400).send({ error: { code: 'INVALID_INPUT', message: 'query is required' } });
    }

    try {
      const result = await piri.webSearch(query, max_results, auto_learn, top_k);
      return reply.send(result);
    } catch (err) {
      return reply.code(502).send({
        error: { code: 'RAG_WEB_SEARCH_FAILED', message: err instanceof Error ? err.message : 'Unknown error' },
      });
    }
  });

  // Learn text
  fastify.post('/api/rag/learn', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await requireAuth(request);
    } catch {
      return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const piri = ensurePiri(reply);
    if (!piri) return;

    const { text, source_name, chunk_size } = request.body as {
      text: string;
      source_name?: string;
      chunk_size?: number;
    };

    if (!text?.trim()) {
      return reply.code(400).send({ error: { code: 'INVALID_INPUT', message: 'text is required' } });
    }

    try {
      const result = await piri.learn(text, source_name, chunk_size);
      return reply.send(result);
    } catch (err) {
      return reply.code(502).send({
        error: { code: 'RAG_LEARN_FAILED', message: err instanceof Error ? err.message : 'Unknown error' },
      });
    }
  });

  // Stats
  fastify.get('/api/rag/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await requireAuth(request);
    } catch {
      return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const piri = ensurePiri(reply);
    if (!piri) return;

    try {
      const result = await piri.stats();
      return reply.send(result);
    } catch (err) {
      return reply.code(502).send({
        error: { code: 'RAG_STATS_FAILED', message: err instanceof Error ? err.message : 'Unknown error' },
      });
    }
  });

  // Evaluation metrics for hybrid retrieval
  fastify.post('/api/rag/evaluation/run', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await requireAuth(request);
    } catch {
      return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const parsed = ragEvaluationSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid evaluation payload',
          details: parsed.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
      });
    }

    const payload = parsed.data;
    const uniqueQueries: string[] = [];
    const seenQueries = new Set<string>();

    for (const raw of payload.queries) {
      const normalized = raw.trim();
      if (!normalized) continue;
      if (!seenQueries.has(normalized)) {
        seenQueries.add(normalized);
        uniqueQueries.push(normalized);
      }
    }

    if (uniqueQueries.length === 0) {
      return reply.code(400).send({
        error: {
          code: 'INVALID_INPUT',
          message: 'At least one non-empty query is required',
        },
      });
    }

    const queryDetails: EvaluationQueryDetail[] = [];
    const allResults: RetrievalResult[] = [];

    for (const query of uniqueQueries) {
      const [firstRun, secondRun] = await Promise.all([
        knowledgeRetrievalService.searchHybrid(query, {
          maxResults: payload.topK,
          maxTokens: payload.maxTokens,
          includeProposed: payload.includeProposed,
          keywordWeight: payload.keywordWeight,
          semanticWeight: payload.semanticWeight,
        }),
        knowledgeRetrievalService.searchHybrid(query, {
          maxResults: payload.topK,
          maxTokens: payload.maxTokens,
          includeProposed: payload.includeProposed,
          keywordWeight: payload.keywordWeight,
          semanticWeight: payload.semanticWeight,
        }),
      ]);

      const overlap = computeOverlap(topKChunkIds(firstRun, payload.topK), topKChunkIds(secondRun, payload.topK));
      const topScore = firstRun[0]?.score ?? 0;
      const resultCount = firstRun.length;
      const thresholdMet = resultCount >= payload.minResultsThreshold;

      const retrievalMix = firstRun.reduce(
        (acc, item) => {
          if (item.retrievalMethod === 'semantic') acc.semantic += 1;
          else if (item.retrievalMethod === 'hybrid') acc.hybrid += 1;
          else acc.keyword += 1;
          return acc;
        },
        { keyword: 0, semantic: 0, hybrid: 0 }
      );

      queryDetails.push({
        query,
        resultCount,
        topScore: toMetric(topScore),
        thresholdMet,
        stabilityOverlap: toMetric(overlap),
        retrievalMix,
      });

      allResults.push(...firstRun.slice(0, payload.topK));
    }

    const coverage = average(queryDetails.map((detail) => (detail.thresholdMet ? 1 : 0)));
    const relevance = average(allResults.map((result) => clampScore(result.score)));
    const provenance = average(
      allResults.map((result) => (result.provenance.title && result.provenance.docType ? 1 : 0))
    );
    const stability = average(queryDetails.map((detail) => detail.stabilityOverlap));

    const documentIds = Array.from(
      new Set(
        allResults
          .map((result) => result.documentId)
          .filter((id) => !id.startsWith('semantic:'))
      )
    );

    const freshnessByDocumentId = new Map<string, number>();
    if (documentIds.length > 0) {
      const rows = await db
        .select({ id: knowledgeDocuments.id, metadata: knowledgeDocuments.metadata })
        .from(knowledgeDocuments)
        .where(inArray(knowledgeDocuments.id, documentIds));

      for (const row of rows) {
        freshnessByDocumentId.set(
          row.id,
          extractFreshnessScore(row.metadata as Record<string, unknown> | null) ?? 0.5
        );
      }
    }

    const freshness = average(
      allResults.map((result) => {
        if (result.documentId.startsWith('semantic:')) return 0.5;
        return freshnessByDocumentId.get(result.documentId) ?? 0.5;
      })
    );

    const executedAt = new Date().toISOString();
    return reply.send({
      runId: randomUUID(),
      executedAt,
      config: {
        queryCount: uniqueQueries.length,
        topK: payload.topK,
        maxTokens: payload.maxTokens,
        includeProposed: payload.includeProposed,
        keywordWeight: payload.keywordWeight,
        semanticWeight: payload.semanticWeight,
        minResultsThreshold: payload.minResultsThreshold,
      },
      metrics: {
        relevance: toMetric(relevance),
        coverage: toMetric(coverage),
        freshness: toMetric(freshness),
        provenance: toMetric(provenance),
        stability: toMetric(stability),
      },
      queries: queryDetails,
    });
  });
}
