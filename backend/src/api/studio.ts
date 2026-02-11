import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/client.js';
import { studioSessions } from '../db/schema.js';
import { requireAuth } from '../utils/auth.js';

const sessionIdParams = z.object({ sessionId: z.string().uuid() });

const createSessionSchema = z.object({
  title: z.string().trim().min(1).max(256),
  repoUrl: z.string().url().max(512).optional(),
  branch: z.string().max(256).optional(),
});

const updateSessionSchema = z.object({
  title: z.string().trim().min(1).max(256).optional(),
  state: z.enum(['active', 'paused', 'completed', 'archived']).optional(),
  workspace: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const listQuerySchema = z.object({
  state: z.enum(['active', 'paused', 'completed', 'archived']).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function studioRoutes(app: FastifyInstance) {
  // List sessions
  app.get('/sessions', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await requireAuth(request);
    const query = listQuerySchema.parse(request.query);

    const conditions = [eq(studioSessions.userId, user.id)];
    if (query.state) conditions.push(eq(studioSessions.state, query.state));

    const rows = await db.select().from(studioSessions)
      .where(and(...conditions))
      .orderBy(desc(studioSessions.updatedAt))
      .limit(query.limit).offset(query.offset);

    return reply.send({ sessions: rows });
  });

  // Create session
  app.post('/sessions', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await requireAuth(request);
    const body = createSessionSchema.parse(request.body);

    const [session] = await db.insert(studioSessions).values({
      userId: user.id,
      title: body.title,
      repoUrl: body.repoUrl ?? null,
      branch: body.branch ?? null,
    }).returning();

    return reply.code(201).send(session);
  });

  // Get session by ID
  app.get('/sessions/:sessionId', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await requireAuth(request);
    const { sessionId } = sessionIdParams.parse(request.params);

    const [session] = await db.select().from(studioSessions)
      .where(and(eq(studioSessions.id, sessionId), eq(studioSessions.userId, user.id)))
      .limit(1);

    if (!session) return reply.code(404).send({ error: 'Session not found' });
    return reply.send(session);
  });

  // Update session
  app.put('/sessions/:sessionId', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await requireAuth(request);
    const { sessionId } = sessionIdParams.parse(request.params);
    const body = updateSessionSchema.parse(request.body);

    const [updated] = await db.update(studioSessions)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(studioSessions.id, sessionId), eq(studioSessions.userId, user.id)))
      .returning();

    if (!updated) return reply.code(404).send({ error: 'Session not found' });
    return reply.send(updated);
  });

  // File tree (stub — reads workspace.files from session metadata)
  app.get('/sessions/:sessionId/files', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await requireAuth(request);
    const { sessionId } = sessionIdParams.parse(request.params);

    const [session] = await db.select().from(studioSessions)
      .where(and(eq(studioSessions.id, sessionId), eq(studioSessions.userId, user.id)))
      .limit(1);

    if (!session) return reply.code(404).send({ error: 'Session not found' });
    const workspace = session.workspace as Record<string, unknown>;
    return reply.send({ files: workspace.files ?? [] });
  });
}
