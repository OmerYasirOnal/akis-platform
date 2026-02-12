/**
 * Knowledge Sources API — CRUD for the Source Registry
 * S0.6: Verified Knowledge Acquisition
 *
 * POST   /api/knowledge/sources       — register a new source
 * GET    /api/knowledge/sources       — list sources (filterable by domain, status)
 * GET    /api/knowledge/sources/:id   — get source + provenance stats
 * PATCH  /api/knowledge/sources/:id   — update source metadata
 * DELETE /api/knowledge/sources/:id   — soft-deactivate source
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client.js';
import { knowledgeSources, knowledgeChunks, knowledgeTags, knowledgeProvenance } from '../db/schema.js';
import { requireAdmin } from '../utils/auth.js';
import { eq, and, sql, ilike, inArray } from 'drizzle-orm';

// ── Validation schemas ──

const createSourceSchema = z.object({
  name: z.string().min(1).max(300),
  sourceUrl: z.string().url().max(2000),
  licenseType: z.enum([
    'apache-2.0', 'mit', 'bsd-2-clause', 'bsd-3-clause', 'cc-by-4.0', 'cc-by-sa-4.0',
    'cc0-1.0', 'mpl-2.0', 'isc', 'unlicense', 'public-domain', 'custom-open', 'unknown',
  ]).default('unknown'),
  accessMethod: z.enum(['api', 'git_clone', 'http_scrape', 'rss', 'manual_upload']),
  domain: z.string().min(1).max(100),
  refreshIntervalHours: z.number().int().min(1).max(8760).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const updateSourceSchema = z.object({
  name: z.string().min(1).max(300).optional(),
  licenseType: z.enum([
    'apache-2.0', 'mit', 'bsd-2-clause', 'bsd-3-clause', 'cc-by-4.0', 'cc-by-sa-4.0',
    'cc0-1.0', 'mpl-2.0', 'isc', 'unlicense', 'public-domain', 'custom-open', 'unknown',
  ]).optional(),
  refreshIntervalHours: z.number().int().min(1).max(8760).optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const listQuerySchema = z.object({
  domain: z.string().optional(),
  verificationStatus: z.enum(['unverified', 'single_source', 'cross_verified', 'stale', 'conflicted']).optional(),
  isActive: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function knowledgeRoutes(fastify: FastifyInstance) {
  // POST /api/knowledge/sources
  fastify.post(
    '/api/knowledge/sources',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await requireAdmin(request);
        const body = createSourceSchema.parse(request.body);

        const [inserted] = await db
          .insert(knowledgeSources)
          .values({
            name: body.name,
            sourceUrl: body.sourceUrl,
            licenseType: body.licenseType,
            accessMethod: body.accessMethod,
            domain: body.domain,
            refreshIntervalHours: body.refreshIntervalHours ?? 168,
            metadata: body.metadata ?? null,
          })
          .returning();

        return reply.code(201).send(inserted);
      } catch (err: unknown) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
          return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
        }
        if (err instanceof Error && err.message === 'FORBIDDEN') {
          return reply.code(403).send({ error: { code: 'FORBIDDEN', message: 'Admin access required' } });
        }
        throw err;
      }
    }
  );

  // GET /api/knowledge/sources
  fastify.get(
    '/api/knowledge/sources',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await requireAdmin(request);
        const query = listQuerySchema.parse(request.query);

        const conditions = [];
        if (query.domain) {
          conditions.push(eq(knowledgeSources.domain, query.domain));
        }
        if (query.verificationStatus) {
          conditions.push(eq(knowledgeSources.verificationStatus, query.verificationStatus));
        }
        if (query.isActive !== undefined) {
          conditions.push(eq(knowledgeSources.isActive, query.isActive === 'true'));
        }

        const where = conditions.length > 0 ? and(...conditions) : undefined;

        const rows = await db
          .select()
          .from(knowledgeSources)
          .where(where)
          .limit(query.limit)
          .offset(query.offset)
          .orderBy(knowledgeSources.createdAt);

        const [{ count }] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(knowledgeSources)
          .where(where);

        return reply.send({ items: rows, total: count });
      } catch (err: unknown) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
          return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
        }
        if (err instanceof Error && err.message === 'FORBIDDEN') {
          return reply.code(403).send({ error: { code: 'FORBIDDEN', message: 'Admin access required' } });
        }
        throw err;
      }
    }
  );

  // GET /api/knowledge/sources/:id
  fastify.get(
    '/api/knowledge/sources/:id',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await requireAdmin(request);
        const { id } = (request.params as { id: string });

        const [source] = await db
          .select()
          .from(knowledgeSources)
          .where(eq(knowledgeSources.id, id))
          .limit(1);

        if (!source) {
          return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Knowledge source not found' } });
        }

        return reply.send(source);
      } catch (err: unknown) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
          return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
        }
        if (err instanceof Error && err.message === 'FORBIDDEN') {
          return reply.code(403).send({ error: { code: 'FORBIDDEN', message: 'Admin access required' } });
        }
        throw err;
      }
    }
  );

  // PUT /api/knowledge/sources/:id (update)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (fastify as any).put(
    '/api/knowledge/sources/:id',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await requireAdmin(request);
        const { id } = (request.params as { id: string });
        const body = updateSourceSchema.parse(request.body);

        const updates: Record<string, unknown> = { updatedAt: new Date() };
        if (body.name !== undefined) updates.name = body.name;
        if (body.licenseType !== undefined) updates.licenseType = body.licenseType;
        if (body.refreshIntervalHours !== undefined) updates.refreshIntervalHours = body.refreshIntervalHours;
        if (body.isActive !== undefined) updates.isActive = body.isActive;
        if (body.metadata !== undefined) updates.metadata = body.metadata;

        const [updated] = await db
          .update(knowledgeSources)
          .set(updates)
          .where(eq(knowledgeSources.id, id))
          .returning();

        if (!updated) {
          return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Knowledge source not found' } });
        }

        return reply.send(updated);
      } catch (err: unknown) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
          return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
        }
        if (err instanceof Error && err.message === 'FORBIDDEN') {
          return reply.code(403).send({ error: { code: 'FORBIDDEN', message: 'Admin access required' } });
        }
        throw err;
      }
    }
  );

  // DELETE /api/knowledge/sources/:id — soft-deactivate
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (fastify as any).delete(
    '/api/knowledge/sources/:id',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await requireAdmin(request);
        const { id } = (request.params as { id: string });

        const [deactivated] = await db
          .update(knowledgeSources)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(knowledgeSources.id, id))
          .returning({ id: knowledgeSources.id });

        if (!deactivated) {
          return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Knowledge source not found' } });
        }

        return reply.code(204).send();
      } catch (err: unknown) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
          return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
        }
        if (err instanceof Error && err.message === 'FORBIDDEN') {
          return reply.code(403).send({ error: { code: 'FORBIDDEN', message: 'Admin access required' } });
        }
        throw err;
      }
    }
  );

  // ── Chunks search ──

  const chunkSearchSchema = z.object({
    tag: z.string().optional(),
    query: z.string().optional(),
    verified: z.enum(['true', 'false']).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
  });

  // GET /api/knowledge/chunks — search chunks by tag, query, verification status
  fastify.get(
    '/api/knowledge/chunks',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await requireAdmin(request);
        const params = chunkSearchSchema.parse(request.query);

        // If tag filter is specified, get chunk IDs that have that tag
        let taggedChunkIds: string[] | undefined;
        if (params.tag) {
          const tagRows = await db
            .select({ chunkId: knowledgeTags.chunkId })
            .from(knowledgeTags)
            .where(eq(knowledgeTags.tag, params.tag));
          taggedChunkIds = tagRows.map(r => r.chunkId);
          if (taggedChunkIds.length === 0) {
            return reply.send({ items: [], total: 0 });
          }
        }

        const conditions = [];
        if (taggedChunkIds && taggedChunkIds.length > 0) {
          conditions.push(inArray(knowledgeChunks.id, taggedChunkIds));
        }
        if (params.query) {
          conditions.push(ilike(knowledgeChunks.content, `%${params.query}%`));
        }

        // If verified=true, filter to chunks that have at least one cross_verified provenance
        if (params.verified === 'true') {
          const verifiedChunkRows = await db
            .select({ chunkId: knowledgeProvenance.chunkId })
            .from(knowledgeProvenance)
            .where(eq(knowledgeProvenance.verificationStatus, 'cross_verified'));
          const verifiedIds = verifiedChunkRows.map(r => r.chunkId);
          if (verifiedIds.length === 0) {
            return reply.send({ items: [], total: 0 });
          }
          conditions.push(inArray(knowledgeChunks.id, verifiedIds));
        }

        const where = conditions.length > 0 ? and(...conditions) : undefined;

        const rows = await db
          .select()
          .from(knowledgeChunks)
          .where(where)
          .limit(params.limit)
          .offset(params.offset)
          .orderBy(knowledgeChunks.createdAt);

        const [{ count }] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(knowledgeChunks)
          .where(where);

        return reply.send({ items: rows, total: count });
      } catch (err: unknown) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
          return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
        }
        if (err instanceof Error && err.message === 'FORBIDDEN') {
          return reply.code(403).send({ error: { code: 'FORBIDDEN', message: 'Admin access required' } });
        }
        throw err;
      }
    }
  );
}
