import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AgentOrchestrator } from '../core/orchestrator/AgentOrchestrator.js';
import { db } from '../db/client.js';
import { jobs, jobPlans, jobAudits, agentRuns } from '../db/schema.js';
import { eq, desc, and, sql, lt, lte, gte } from 'drizzle-orm';
import { JobNotFoundError } from '../core/errors.js';
import { metrics } from './metrics.js';
import { formatErrorResponse, getStatusCodeForError } from '../utils/errorHandler.js';

// Request validation schemas
const scribePayloadSchema = z.object({
  doc: z.string().min(1, 'doc field is required and must be a non-empty string'),
});

const tracePayloadSchema = z.object({
  spec: z.string().min(1, 'spec field is required and must be a non-empty string'),
});

const protoPayloadSchema = z.object({
  goal: z.string().min(1, 'goal field is required and must be a non-empty string').optional(),
}).passthrough(); // Allow additional fields

const submitJobSchema = z.object({
  type: z.enum(['scribe', 'trace', 'proto']),
  payload: z.unknown().optional(),
}).superRefine((data, ctx) => {
  // Validate payload based on agent type
  if (data.payload && typeof data.payload === 'object') {
    if (data.type === 'scribe') {
      const result = scribePayloadSchema.safeParse(data.payload);
      if (!result.success) {
        result.error.errors.forEach((err) => {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Scribe payload validation: ${err.message}`,
            path: ['payload', ...err.path],
          });
        });
      }
    } else if (data.type === 'trace') {
      const result = tracePayloadSchema.safeParse(data.payload);
      if (!result.success) {
        result.error.errors.forEach((err) => {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Trace payload validation: ${err.message}`,
            path: ['payload', ...err.path],
          });
        });
      }
    } else if (data.type === 'proto') {
      const result = protoPayloadSchema.safeParse(data.payload);
      if (!result.success) {
        result.error.errors.forEach((err) => {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Proto payload validation: ${err.message}`,
            path: ['payload', ...err.path],
          });
        });
      }
    }
  } else if (data.type === 'scribe' || data.type === 'trace') {
    // Scribe and Trace require payload
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `${data.type} agent requires a payload object`,
      path: ['payload'],
    });
  }
});

const runAgentSchema = z.object({
  agentType: z.enum(['scribe', 'trace', 'proto']),
  repoFullName: z.string().min(1),
  branch: z.string().min(1),
  modelId: z.string().min(1).optional(),
  params: z.record(z.string(), z.unknown()).optional(),
  tokenEstimate: z.number().int().nonnegative().optional(),
  autoChunk: z.boolean().optional(),
  consent: z
    .object({
      premium: z.boolean().optional(),
    })
    .optional(),
});

const runIdParamsSchema = z.object({
  id: z.string().uuid(),
});

const modelsQuerySchema = z.object({
  plan: z.enum(['free', 'premium', 'all']).default('all').optional(),
});

const runsListQuerySchema = z.object({
  agentType: z.enum(['scribe', 'trace', 'proto']).optional(),
  status: z.enum(['queued', 'running', 'completed', 'failed']).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

const jobIdParamsSchema = z.object({
  id: z.string().uuid(),
});

const includeQuerySchema = z.object({
  include: z.string().optional(), // Comma-separated: 'plan,audit'
});

type AgentKind = 'scribe' | 'trace' | 'proto';

const AGENT_PARAM_KEYS: Record<AgentKind, string> = {
  scribe: 'doc',
  trace: 'spec',
  proto: 'goal',
};

function tokenEstimateFromText(text: string): number {
  return Math.ceil(text.length / 4);
}

function extractTextSegments(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => extractTextSegments(item));
  }
  if (value && typeof value === 'object') {
    return Object.values(value).flatMap((item) => extractTextSegments(item));
  }
  return [];
}

function estimateTokens(agent: AgentKind, params?: Record<string, unknown>): number {
  if (!params) {
    return 0;
  }
  const key = AGENT_PARAM_KEYS[agent];
  if (key && typeof params[key] !== 'undefined') {
    return extractTextSegments(params[key]).reduce<number>(
      (sum, segment) => sum + tokenEstimateFromText(segment),
      0,
    );
  }
  return Object.values(params).reduce<number>(
    (sum, value) =>
      sum +
      extractTextSegments(value).reduce<number>(
        (inner, segment) => inner + tokenEstimateFromText(segment),
        0,
      ),
    0,
  );
}

function applyAutoChunk(
  agent: AgentKind,
  params: Record<string, unknown> | undefined,
  contextWindow: number
): { params: Record<string, unknown>; field: string; chunks: number; tokenEstimate: number } {
  const key = AGENT_PARAM_KEYS[agent];
  const clone = structuredClone(params ?? {});

  if (!key) {
    return {
      params: clone,
      field: 'payload',
      chunks: 1,
      tokenEstimate: estimateTokens(agent, params),
    };
  }

  const source = params?.[key];
  if (!source || typeof source !== 'string') {
    return {
      params: clone,
      field: key,
      chunks: 1,
      tokenEstimate: estimateTokens(agent, params),
    };
  }

  const maxTokensPerChunk = Math.max(1, Math.floor(contextWindow * 0.9));
  const maxCharsPerChunk = maxTokensPerChunk * 4;
  const segments: string[] = [];

  for (let cursor = 0; cursor < source.length; cursor += maxCharsPerChunk) {
    segments.push(source.slice(cursor, cursor + maxCharsPerChunk));
  }

  clone[key] = segments;

  const nextEstimate = segments.reduce<number>(
    (sum, segment) => sum + tokenEstimateFromText(segment),
    0,
  );

  return {
    params: clone,
    field: key,
    chunks: segments.length,
    tokenEstimate: nextEstimate,
  };
}

// Initialize orchestrator (will be injected from server.app.ts)
let orchestrator: AgentOrchestrator;

export function setOrchestrator(orch: AgentOrchestrator): void {
  orchestrator = orch;
}

export async function agentsRoutes(fastify: FastifyInstance) {
  fastify.get('/agents/run', async (request, reply) => {
    if (!request.user) {
      reply.code(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Oturum açmanız gerekiyor.',
        },
      });
      return;
    }

    const parseResult = runsListQuerySchema.safeParse(request.query ?? {});
    if (!parseResult.success) {
      reply.code(400).send({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Geçersiz agent geçmişi sorgusu.',
          details: parseResult.error.flatten(),
        },
      });
      return;
    }

    const { agentType, status, limit, cursor, from, to } = parseResult.data;
    const conditions = [eq(agentRuns.userId, request.user.id)];

    if (agentType) {
      conditions.push(eq(agentRuns.agentType, agentType));
    }

    if (status) {
      conditions.push(eq(agentRuns.status, status));
    }

    if (from) {
      const fromDate = new Date(from);
      if (!Number.isNaN(fromDate.getTime())) {
        conditions.push(gte(agentRuns.createdAt, fromDate));
      }
    }

    if (to) {
      const toDate = new Date(to);
      if (!Number.isNaN(toDate.getTime())) {
        conditions.push(lte(agentRuns.createdAt, toDate));
      }
    }

    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!Number.isNaN(cursorDate.getTime())) {
        conditions.push(lt(agentRuns.createdAt, cursorDate));
      }
    }

    const whereClause = and(...conditions);

    const rows = await db
      .select()
      .from(agentRuns)
      .where(whereClause)
      .orderBy(desc(agentRuns.createdAt))
      .limit(limit + 1);

    let nextCursor: string | null = null;
    if (rows.length > limit) {
      const last = rows[limit - 1];
      nextCursor = last.createdAt.toISOString();
      rows.splice(limit);
    }

    reply.send({
      items: rows,
      nextCursor,
    });
  });

  fastify.get('/models', async (request, reply) => {
    const parseResult = modelsQuerySchema.safeParse(request.query ?? {});
    if (!parseResult.success) {
      reply.code(400).send({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Geçersiz model sorgusu.',
        },
      });
      return;
    }

    const planFilter = (parseResult.data?.plan ?? 'all') as 'free' | 'premium' | 'all';
    const router = fastify.modelRouter;
    const models =
      planFilter === 'all' ? router.list('all') : router.list(planFilter as 'free' | 'premium');

    reply.send({ models });
  });

  fastify.post('/agents/run', async (request, reply) => {
    if (!request.user) {
      reply.code(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Oturum açmanız gerekiyor.',
        },
      });
      return;
    }

    const parseResult = runAgentSchema.safeParse(request.body);
    if (!parseResult.success) {
      reply.code(400).send({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Agent çalıştırma isteği doğrulanamadı.',
          details: parseResult.error.flatten(),
        },
      });
      return;
    }

    const { agentType, repoFullName, branch, modelId, params, tokenEstimate, autoChunk, consent } =
      parseResult.data;

    let model;
    try {
      model = fastify.modelRouter.resolve(agentType, modelId);
    } catch (error) {
      reply.code(400).send({
        error: {
          code: 'MODEL_NOT_ALLOWED',
          message: error instanceof Error ? error.message : String(error),
        },
      });
      return;
    }

    const hasPremiumConsent = model.plan === 'premium' && Boolean(consent?.premium);

    if (model.plan === 'premium' && !hasPremiumConsent) {
      reply.code(412).send({
        error: {
          code: 'PREMIUM_CONSENT_REQUIRED',
          message: 'Premium model kullanımı için bilgilendirilmiş onay gerekiyor.',
        },
      });
      return;
    }

    let estimatedTokens =
      typeof tokenEstimate === 'number' && Number.isFinite(tokenEstimate) && tokenEstimate >= 0
        ? tokenEstimate
        : estimateTokens(agentType, params);

    const notes: string[] = [];
    if (!fastify.featureFlags.aiEnabled) {
      notes.push('AI servis anahtarı eksik olduğu için mock yanıtlar üretilecek.');
    }

    if (hasPremiumConsent) {
      notes.push('Premium model için kullanıcı onayı alındı.');
    }

    if (estimatedTokens >= Math.floor(model.contextWindow * 0.8)) {
      notes.push(
        `Token tahmini (${estimatedTokens}) "${model.label}" bağlam sınırının %80 üzerine çıktı (${model.contextWindow}).`
      );
    }

    let processedParams: Record<string, unknown> = structuredClone(params ?? {});

    if (estimatedTokens > model.contextWindow) {
      if (!autoChunk) {
        reply.code(422).send({
          error: {
            code: 'CONTEXT_LIMIT_EXCEEDED',
            message:
              'Seçilen model için bağlam sınırı aşılmak üzere. Lütfen girdiyi küçültün ya da otomatik segmentasyonu etkinleştirin.',
          },
        });
        return;
      }

      const chunkResult = applyAutoChunk(agentType, params, model.contextWindow);
      processedParams = chunkResult.params;
      estimatedTokens = chunkResult.tokenEstimate;
      notes.push(
        `Otomatik segmentasyon etkin: "${chunkResult.field}" alanı ${chunkResult.chunks} parçada işlendi.`
      );
    }

    const [run] = await db
      .insert(agentRuns)
      .values({
        userId: request.user.id,
        agentType,
        repoFullName,
        branch,
        modelId: model.id,
        plan: model.plan,
        premiumConsent: hasPremiumConsent,
        premiumConsentAt: hasPremiumConsent ? new Date() : null,
        contextTokens: estimatedTokens,
        notes,
      })
      .returning();

    try {
      const jobId = await orchestrator.submitJob({
        type: agentType,
        payload: {
          ...processedParams,
          repoFullName,
          branch,
          modelId: model.id,
          params: processedParams,
          metadata: {
            tokenEstimate: estimatedTokens,
            autoChunk: Boolean(autoChunk),
            plan: model.plan,
            runId: run.id,
          },
          notes,
        },
      });

      void orchestrator.startJob(jobId).catch((error) => {
        fastify.log.error(
          {
            err: error,
            jobId,
            runId: run.id,
          },
          'agent run execution failed'
        );
      });

      reply.code(202).send({
        run: {
          id: run.id,
          status: run.status,
          agentType: run.agentType,
          repoFullName: run.repoFullName,
          branch: run.branch,
          modelId: run.modelId,
          plan: run.plan,
          contextTokens: run.contextTokens,
          notes,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await db
        .update(agentRuns)
        .set({
          status: 'failed',
          error: errorMessage,
          updatedAt: new Date(),
        })
        .where(eq(agentRuns.id, run.id));

      reply.code(500).send({
        error: {
          code: 'AGENT_SUBMIT_FAILED',
          message: errorMessage,
        },
      });
    }
  });

  fastify.get('/agents/run/:id/status', async (request, reply) => {
    if (!request.user) {
      reply.code(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Oturum açmanız gerekiyor.',
        },
      });
      return;
    }

    const parseResult = runIdParamsSchema.safeParse(request.params);
    if (!parseResult.success) {
      reply.code(400).send({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Geçersiz agent run kimliği.',
        },
      });
      return;
    }

    const [row] = await db
      .select({
        run: agentRuns,
        job: jobs,
      })
      .from(agentRuns)
      .leftJoin(jobs, eq(agentRuns.jobId, jobs.id))
      .where(eq(agentRuns.id, parseResult.data.id))
      .limit(1);

    if (!row || row.run.userId !== request.user.id) {
      reply.code(404).send({
        error: {
          code: 'RUN_NOT_FOUND',
          message: 'Agent çalıştırması bulunamadı.',
        },
      });
      return;
    }

    reply.send({
      run: {
        id: row.run.id,
        status: row.run.status,
        agentType: row.run.agentType,
        repoFullName: row.run.repoFullName,
        branch: row.run.branch,
        modelId: row.run.modelId,
        plan: row.run.plan,
        error: row.run.error,
        inputTokens: row.run.inputTokens,
        outputTokens: row.run.outputTokens,
        costUsd: row.run.costUsd,
        createdAt: row.run.createdAt,
        updatedAt: row.run.updatedAt,
        notes: row.run.notes,
        job: row.job
          ? {
              id: row.job.id,
              state: row.job.state,
              result: row.job.result,
              error: row.job.error,
              updatedAt: row.job.updatedAt,
            }
          : null,
      },
    });
  });

  fastify.get('/agents/run/:id/logs', async (request, reply) => {
    if (!request.user) {
      reply.code(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Oturum açmanız gerekiyor.',
        },
      });
      return;
    }

    const parseResult = runIdParamsSchema.safeParse(request.params);
    if (!parseResult.success) {
      reply.code(400).send({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Geçersiz agent run kimliği.',
        },
      });
      return;
    }

    const [runRow] = await db.select().from(agentRuns).where(eq(agentRuns.id, parseResult.data.id)).limit(1);
    if (!runRow || runRow.userId !== request.user.id) {
      reply.code(404).send({
        error: {
          code: 'RUN_NOT_FOUND',
          message: 'Agent çalıştırması bulunamadı.',
        },
      });
      return;
    }

    if (!runRow.jobId) {
      reply.send({
        runId: runRow.id,
        plan: null,
        audits: [],
      });
      return;
    }

    const [planRow] = await db
      .select()
      .from(jobPlans)
      .where(eq(jobPlans.jobId, runRow.jobId))
      .limit(1);

    const audits = await db
      .select()
      .from(jobAudits)
      .where(eq(jobAudits.jobId, runRow.jobId))
      .orderBy(desc(jobAudits.createdAt));

    reply.send({
      runId: runRow.id,
      plan: planRow
        ? {
            steps: planRow.steps,
            rationale: planRow.rationale,
            createdAt: planRow.createdAt,
          }
        : null,
      audits: audits.map((audit) => ({
        id: audit.id,
        phase: audit.phase,
        payload: audit.payload,
        createdAt: audit.createdAt,
      })),
    });
  });

  // POST /agents/jobs
  fastify.post(
    '/agents/jobs',
    {
      schema: {
        body: {
          type: 'object',
          required: ['type'],
          properties: {
            type: { type: 'string', minLength: 1, maxLength: 50 },
            payload: { type: 'object' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        // Validate request body with Zod
        const body = submitJobSchema.parse(request.body);

        // Submit job (creates DB row with pending state)
        const jobId = await orchestrator.submitJob({
          type: body.type,
          payload: body.payload,
        });

        // Phase 7.B: Record job created metric
        metrics.jobsCreated.inc({ type: body.type });

        // Start job immediately (executes agent and transitions to completed/failed)
        let finalState = 'pending';
        try {
          await orchestrator.startJob(jobId);
          // Query final state after execution
          const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
          if (job) {
            finalState = job.state;
            // Phase 7.B: Record job completion/failure metrics
            if (finalState === 'completed') {
              metrics.jobsCompleted.inc({ type: body.type });
            } else if (finalState === 'failed') {
              metrics.jobsFailed.inc({ type: body.type });
            }
          }
        } catch (_startError) {
          // If start fails, job is already marked as failed in DB
          // Query state to return accurate status
          try {
            const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
            if (job) {
              finalState = job.state;
              if (finalState === 'failed') {
                metrics.jobsFailed.inc({ type: body.type });
              }
            }
          } catch {
            // If we can't query, default to pending
          }
        }

        return { jobId, state: finalState };
      } catch (error) {
        // Phase 7.E: Use unified error model
        const errorResponse = formatErrorResponse(request, error);
        const statusCode = getStatusCodeForError(errorResponse.error.code);
        reply.code(statusCode).send(errorResponse);
      }
    }
  );

  // GET /agents/jobs/:id
  fastify.get(
    '/agents/jobs/:id',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            include: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        // Validate params with Zod (UUID format)
        const params = jobIdParamsSchema.parse(request.params);
        const query = includeQuerySchema.parse(request.query || {});

        // Parse include flags
        const includeFlags = query.include
          ? query.include.split(',').map((s) => s.trim().toLowerCase())
          : [];
        const includePlan = includeFlags.includes('plan');
        const includeAudit = includeFlags.includes('audit');

        // Fetch job from database
        let job;
        try {
          const result = await db.select().from(jobs).where(eq(jobs.id, params.id)).limit(1);
          if (!result.length) {
            const errorResponse = formatErrorResponse(request, new JobNotFoundError(params.id));
            reply.code(404).send(errorResponse);
            return;
          }
          job = result[0];
        } catch (error) {
          const errorResponse = formatErrorResponse(request, error);
          const statusCode = getStatusCodeForError(errorResponse.error.code);
          reply.code(statusCode).send(errorResponse);
          return;
        }

        // Phase 5.F: Fetch plan if requested
        let plan = null;
        if (includePlan) {
          try {
            const [planRow] = await db
              .select()
              .from(jobPlans)
              .where(eq(jobPlans.jobId, params.id))
              .limit(1);
            if (planRow) {
              plan = {
                steps: planRow.steps,
                rationale: planRow.rationale,
                createdAt: planRow.createdAt,
              };
            }
          } catch (error) {
            // Don't fail request if plan fetch fails
            console.error(`Failed to fetch plan for job ${params.id}:`, error);
          }
        }

        // Phase 5.F: Fetch audit entries if requested
        let audits: unknown[] = [];
        if (includeAudit) {
          try {
            const auditRows = await db
              .select()
              .from(jobAudits)
              .where(eq(jobAudits.jobId, params.id))
              .orderBy(desc(jobAudits.createdAt))
              .limit(50); // Limit to recent 50 audits
            audits = auditRows.map((row) => ({
              phase: row.phase,
              payload: row.payload,
              createdAt: row.createdAt,
            }));
          } catch (error) {
            // Don't fail request if audit fetch fails
            console.error(`Failed to fetch audits for job ${params.id}:`, error);
          }
        }

        // Return job data with optional plan/audit
        const response: Record<string, unknown> = {
          id: job.id,
          type: job.type,
          state: job.state,
          payload: job.payload,
          result: job.result,
          error: job.error,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
        };

        if (includePlan) {
          response.plan = plan;
        }
        if (includeAudit) {
          response.audit = audits;
        }

        return response;
      } catch (error) {
        // Phase 7.E: Use unified error model
        const errorResponse = formatErrorResponse(request, error);
        const statusCode = getStatusCodeForError(errorResponse.error.code);
        reply.code(statusCode).send(errorResponse);
      }
    }
  );

  // Phase 7.D: GET /agents/jobs - List jobs with filtering and pagination
  // Cursor encoding: base64(createdAt|id) for deterministic pagination
  const jobsListQuerySchema = z.object({
    type: z.enum(['scribe', 'trace', 'proto']).optional(),
    state: z.enum(['pending', 'running', 'completed', 'failed']).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    cursor: z.string().optional(), // base64 encoded cursor
  });

  fastify.get(
    '/agents/jobs',
    {
      schema: {
        description: 'List jobs with filtering and cursor pagination',
        tags: ['agents'],
        querystring: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['scribe', 'trace', 'proto'] },
            state: { type: 'string', enum: ['pending', 'running', 'completed', 'failed'] },
            limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
            cursor: { type: 'string', description: 'Base64-encoded cursor for pagination (format: base64(createdAt|id))' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    type: { type: 'string' },
                    state: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
              nextCursor: { type: 'string', format: 'uuid', nullable: true },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        // Validate query params with Zod
        const query = jobsListQuerySchema.parse(request.query || {});

        // Build where clause
        const conditions = [];
        if (query.type) {
          conditions.push(eq(jobs.type, query.type));
        }
        if (query.state) {
          conditions.push(eq(jobs.state, query.state));
        }
        if (query.cursor) {
          // Decode cursor: base64(createdAt|id)
          try {
            const decoded = Buffer.from(query.cursor, 'base64').toString('utf-8');
            const [cursorCreatedAt, cursorId] = decoded.split('|');
            if (cursorCreatedAt && cursorId) {
              // Get jobs with createdAt < cursorCreatedAt OR (createdAt = cursorCreatedAt AND id < cursorId)
              conditions.push(
                sql`${jobs.createdAt} < ${cursorCreatedAt}::timestamp OR (${jobs.createdAt} = ${cursorCreatedAt}::timestamp AND ${jobs.id} < ${cursorId}::uuid)`
              );
            }
          } catch {
            // Invalid cursor format - ignore cursor and return first page
          }
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // Fetch jobs ordered by createdAt DESC
        const limit = query.limit + 1; // Fetch one extra to determine if there's a next page
        const jobRows = await db
          .select({
            id: jobs.id,
            type: jobs.type,
            state: jobs.state,
            createdAt: jobs.createdAt,
            updatedAt: jobs.updatedAt,
          })
          .from(jobs)
          .where(whereClause)
          .orderBy(desc(jobs.createdAt), desc(jobs.id))
          .limit(limit);

        // Determine next cursor: base64(createdAt|id) of the last item
        let nextCursor: string | null = null;
        if (jobRows.length > query.limit) {
          // There's a next page - encode cursor from last item
          const lastJob = jobRows[query.limit - 1];
          const cursorValue = `${lastJob.createdAt.toISOString()}|${lastJob.id}`;
          nextCursor = Buffer.from(cursorValue, 'utf-8').toString('base64');
          jobRows.pop(); // Remove the extra item
        }

        return {
          items: jobRows,
          nextCursor,
        };
      } catch (error) {
        // Phase 7.E: Use unified error model
        const errorResponse = formatErrorResponse(request, error);
        const statusCode = getStatusCodeForError(errorResponse.error.code);
        reply.code(statusCode).send(errorResponse);
      }
    }
  );
}

