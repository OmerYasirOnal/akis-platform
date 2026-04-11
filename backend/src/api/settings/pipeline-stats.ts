/**
 * Pipeline Stats API
 * GET /settings/pipeline-stats — kullanıcının pipeline istatistikleri
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../../db/client.js';
import { pipelines } from '../../db/schema.js';
import { eq, desc, sql } from 'drizzle-orm';
import { requireAuth } from '../../utils/auth.js';
import { sendError } from '../../utils/errorHandler.js';

export async function pipelineStatsRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/pipeline-stats',
    async (request: FastifyRequest, reply: FastifyReply) => {
      let user;
      try {
        user = await requireAuth(request);
      } catch (err: unknown) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
          return sendError(reply, request, 'UNAUTHORIZED', 'Authentication required');
        }
        throw err;
      }

      // Aggregate stats — tek sorgu
      const [agg] = await db
        .select({
          totalPipelines: sql<number>`COUNT(*)::int`,
          successCount: sql<number>`COUNT(*) FILTER (WHERE ${pipelines.stage} IN ('completed', 'completed_partial'))::int`,
          avgScribeMs: sql<number | null>`AVG(
            CASE WHEN ${pipelines.metrics}->>'scribeCompletedAt' IS NOT NULL
                  AND ${pipelines.metrics}->>'startedAt' IS NOT NULL
            THEN EXTRACT(EPOCH FROM (
              (${pipelines.metrics}->>'scribeCompletedAt')::timestamptz
              - (${pipelines.metrics}->>'startedAt')::timestamptz
            )) * 1000
            END
          )::int`,
          avgProtoMs: sql<number | null>`AVG(
            CASE WHEN ${pipelines.metrics}->>'protoCompletedAt' IS NOT NULL
                  AND ${pipelines.metrics}->>'approvedAt' IS NOT NULL
            THEN EXTRACT(EPOCH FROM (
              (${pipelines.metrics}->>'protoCompletedAt')::timestamptz
              - (${pipelines.metrics}->>'approvedAt')::timestamptz
            )) * 1000
            END
          )::int`,
          avgTraceMs: sql<number | null>`AVG(
            CASE WHEN ${pipelines.metrics}->>'traceCompletedAt' IS NOT NULL
                  AND ${pipelines.metrics}->>'protoCompletedAt' IS NOT NULL
            THEN EXTRACT(EPOCH FROM (
              (${pipelines.metrics}->>'traceCompletedAt')::timestamptz
              - (${pipelines.metrics}->>'protoCompletedAt')::timestamptz
            )) * 1000
            END
          )::int`,
          avgTotalMs: sql<number | null>`AVG((${pipelines.metrics}->>'totalDurationMs')::numeric)::int`,
        })
        .from(pipelines)
        .where(eq(pipelines.userId, user.id));

      const totalPipelines = agg?.totalPipelines ?? 0;
      const successCount = agg?.successCount ?? 0;
      const successRate = totalPipelines > 0
        ? Math.round((successCount / totalPipelines) * 100)
        : 0;

      // Son 10 pipeline
      const recent = await db
        .select({
          id: pipelines.id,
          title: pipelines.title,
          stage: pipelines.stage,
          createdAt: pipelines.createdAt,
          durationMs: sql<number | null>`(${pipelines.metrics}->>'totalDurationMs')::int`,
        })
        .from(pipelines)
        .where(eq(pipelines.userId, user.id))
        .orderBy(desc(pipelines.createdAt))
        .limit(10);

      // ── New analytics queries (graceful degradation) ───────────────

      // Error frequency — group by error code
      let errorFrequency: Array<{ code: string; count: number }> = [];
      try {
        const efRows = await db.execute<{ code: string; count: string }>(
          sql`SELECT error->>'code' AS code, COUNT(*)::text AS count
              FROM pipelines
              WHERE error IS NOT NULL AND user_id = ${user.id}
              GROUP BY error->>'code'
              ORDER BY COUNT(*) DESC
              LIMIT 10`,
        );
        errorFrequency = efRows.rows.map((r) => ({ code: r.code ?? 'unknown', count: Number(r.count) }));
      } catch { /* agent_activities or column may not exist yet */ }

      // Model distribution from agent_activities
      let modelDistribution: Array<{ model: string; count: number }> = [];
      try {
        const mdRows = await db.execute<{ model: string; count: string }>(
          sql`SELECT aa.model, COUNT(*)::text AS count
              FROM agent_activities aa
              JOIN pipelines p ON aa.pipeline_id = p.id
              WHERE p.user_id = ${user.id}
              GROUP BY aa.model
              ORDER BY COUNT(*) DESC`,
        );
        modelDistribution = mdRows.rows.map((r) => ({ model: r.model ?? 'unknown', count: Number(r.count) }));
      } catch { /* table may not exist yet */ }

      // Token usage per agent
      let tokenUsage: Array<{ agent: string; inputTokens: number; outputTokens: number }> = [];
      try {
        const tuRows = await db.execute<{ agent: string; input_tokens: string; output_tokens: string }>(
          sql`SELECT aa.agent,
                     COALESCE(SUM(aa.input_tokens), 0)::text AS input_tokens,
                     COALESCE(SUM(aa.output_tokens), 0)::text AS output_tokens
              FROM agent_activities aa
              JOIN pipelines p ON aa.pipeline_id = p.id
              WHERE p.user_id = ${user.id}
              GROUP BY aa.agent`,
        );
        tokenUsage = tuRows.rows.map((r) => ({
          agent: r.agent,
          inputTokens: Number(r.input_tokens),
          outputTokens: Number(r.output_tokens),
        }));
      } catch { /* table may not exist yet */ }

      // Retry patterns per stage
      let retryPatterns: Array<{ stage: string; retries: number }> = [];
      try {
        const rpRows = await db.execute<{ stage: string; retries: string }>(
          sql`SELECT stage::text,
                     COUNT(*) FILTER (WHERE (metrics->>'retryCount')::int > 0)::text AS retries
              FROM pipelines
              WHERE user_id = ${user.id}
              GROUP BY stage`,
        );
        retryPatterns = rpRows.rows.map((r) => ({ stage: r.stage, retries: Number(r.retries) }));
      } catch { /* metrics column format may differ */ }

      return reply.code(200).send({
        totalPipelines,
        successRate,
        avgDurations: {
          scribeMs: agg?.avgScribeMs ?? null,
          protoMs: agg?.avgProtoMs ?? null,
          traceMs: agg?.avgTraceMs ?? null,
          totalMs: agg?.avgTotalMs ?? null,
        },
        recentPipelines: recent.map((r) => ({
          id: r.id,
          title: r.title,
          stage: r.stage,
          createdAt: r.createdAt.toISOString(),
          durationMs: r.durationMs,
        })),
        errorFrequency,
        modelDistribution,
        tokenUsage,
        retryPatterns,
      });
    },
  );
}
