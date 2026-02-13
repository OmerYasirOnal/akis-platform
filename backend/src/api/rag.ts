/**
 * RAG API Routes — Proxy to Piri RAG Engine
 *
 * All mutation routes require authentication via requireAuth().
 * Piri must be configured via PIRI_BASE_URL env var.
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getPiriRAGService } from '../services/rag/PiriRAGService.js';
import { requireAuth } from '../utils/auth.js';

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
}
