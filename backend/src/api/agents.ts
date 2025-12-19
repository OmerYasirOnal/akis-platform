import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AgentOrchestrator } from '../core/orchestrator/AgentOrchestrator.js';
import { db } from '../db/client.js';
import { jobs, jobPlans, jobAudits, agentConfigs } from '../db/schema.js';
import { eq, desc, and, sql } from 'drizzle-orm';
import { JobNotFoundError } from '../core/errors.js';
import { metrics } from './metrics.js';
import { formatErrorResponse, getStatusCodeForError } from '../utils/errorHandler.js';
import { requireAuth } from '../utils/auth.js';

// Request validation schemas
// Legacy payload schema (backward compatible)
const scribePayloadSchema = z.object({
  owner: z.string().min(1, 'owner field is required'),
  repo: z.string().min(1, 'repo field is required'),
  baseBranch: z.string().min(1, 'baseBranch field is required'),
  featureBranch: z.string().optional(),
  targetPath: z.string().optional(),
  taskDescription: z.string().optional(),
  // Maintain backward compatibility for legacy tests if needed, or remove 'doc'
  doc: z.string().optional(),
});

// Config-aware payload schema (S0.4.6)
const scribeConfigAwarePayloadSchema = z.object({
  mode: z.enum(['from_config', 'test', 'run']).optional(),
  config_id: z.string().uuid().optional(),
  dryRun: z.boolean().optional(),
}).passthrough(); // Allow additional fields for backward compat

const tracePayloadSchema = z.object({
  spec: z.string().min(1, 'spec field is required and must be a non-empty string'),
});

const protoPayloadSchema = z.object({
  goal: z.string().min(1, 'goal field is required and must be a non-empty string').optional(),
}).passthrough(); // Allow additional fields

const submitJobSchema = z.object({
  type: z.enum(['scribe', 'trace', 'proto']),
  payload: z.unknown().optional(),
  /** If true, the job will use a stronger model for final validation */
  requiresStrictValidation: z.boolean().optional().default(false),
}).superRefine((data, ctx) => {
  // S0.4.6: Skip validation if config-aware payload (validation happens in route handler after config load)
  if (data.payload && typeof data.payload === 'object') {
    const payload = data.payload as Record<string, unknown>;
    
    // Check if this is a config-aware payload
    const isConfigAware = 
      payload.mode === 'from_config' || 
      payload.mode === 'test' || 
      payload.mode === 'run' || 
      typeof payload.config_id === 'string';
    
    if (data.type === 'scribe') {
      if (isConfigAware) {
        // Config-aware: validate schema but don't require owner/repo/baseBranch
        const result = scribeConfigAwarePayloadSchema.safeParse(data.payload);
        if (!result.success) {
          result.error.errors.forEach((err) => {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Scribe config-aware payload validation: ${err.message}`,
              path: ['payload', ...err.path],
            });
          });
        }
      } else {
        // Legacy: validate full payload
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

const jobIdParamsSchema = z.object({
  id: z.string().uuid(),
});

const includeQuerySchema = z.object({
  include: z.string().optional(), // Comma-separated: 'plan,audit'
});

function extractCorrelationIdFromText(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0) return null;
  const match = value.match(/Correlation ID:\s*([A-Za-z0-9._-]+)/i);
  return match?.[1] || null;
}

// Initialize orchestrator (will be injected from server.app.ts)
let orchestrator: AgentOrchestrator;

export function setOrchestrator(orch: AgentOrchestrator): void {
  orchestrator = orch;
}

export async function agentsRoutes(fastify: FastifyInstance) {
  // POST /api/agents/jobs
  fastify.post(
    '/api/agents/jobs',
    {
      schema: {
        description: 'Create and start a new agent job',
        tags: ['agents'],
        body: {
          type: 'object',
          required: ['type'],
          properties: {
            type: { type: 'string', enum: ['scribe', 'trace', 'proto'] },
            payload: { type: 'object' },
            requiresStrictValidation: { type: 'boolean', default: false },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              jobId: { type: 'string', format: 'uuid' },
              state: { type: 'string', enum: ['pending', 'running', 'completed', 'failed'] },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        // Validate request body with Zod
        const body = submitJobSchema.parse(request.body);

        // S0.4.6: Handle config-aware payloads for Scribe
        let enrichedPayload = body.payload;
        
        if (body.type === 'scribe' && body.payload && typeof body.payload === 'object') {
          const payload = body.payload as Record<string, unknown>;
          const isConfigAware = 
            payload.mode === 'from_config' || 
            payload.mode === 'test' || 
            payload.mode === 'run' || 
            typeof payload.config_id === 'string';

          if (isConfigAware) {
            // Load user config and derive payload
            let userId: string | undefined;
            
            try {
              const user = await requireAuth(request);
              userId = user.id;
            } catch (authError) {
              const errorResponse = formatErrorResponse(request, authError);
              reply.code(401).send(errorResponse);
              return;
            }

            // Load config from DB
            let config;
            try {
              config = await db.query.agentConfigs.findFirst({
                where: and(
                  eq(agentConfigs.userId, userId),
                  eq(agentConfigs.agentType, 'scribe')
                ),
              });
            } catch (dbError) {
              throw new Error(`Failed to load Scribe configuration: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
            }

            if (!config) {
              throw new Error('Scribe configuration not found. Please configure Scribe first at /dashboard/agents/scribe');
            }

            // Validate config has required fields
            if (!config.repositoryOwner || !config.repositoryName || !config.baseBranch) {
              throw new Error('Scribe configuration incomplete. Missing repository owner, name, or base branch. Please complete configuration at /dashboard/agents/scribe');
            }

            // Transform config to legacy payload format
            enrichedPayload = {
              ...payload, // Keep mode, dryRun, etc.
              owner: config.repositoryOwner,
              repo: config.repositoryName,
              baseBranch: config.baseBranch,
              userId, // Add userId for orchestrator
            };
            
            // Add optional fields from config
            if (config.branchPattern) {
              (enrichedPayload as Record<string, unknown>).branchPattern = config.branchPattern;
            }
            if (config.targetPlatform) {
              (enrichedPayload as Record<string, unknown>).targetPlatform = config.targetPlatform;
            }
            if (config.targetConfig && typeof config.targetConfig === 'object' && config.targetConfig !== null) {
              (enrichedPayload as Record<string, unknown>).targetConfig = config.targetConfig;
            }
            if (config.prTitleTemplate) {
              (enrichedPayload as Record<string, unknown>).prTitleTemplate = config.prTitleTemplate;
            }
            if (typeof config.prBodyTemplate === 'string' || config.prBodyTemplate === null) {
              (enrichedPayload as Record<string, unknown>).prBodyTemplate = config.prBodyTemplate;
            }
            if (typeof config.autoMerge === 'boolean') {
              (enrichedPayload as Record<string, unknown>).autoMerge = config.autoMerge;
            }
          } else {
            // Legacy payload: try to get userId if auth is available
            try {
              const user = await requireAuth(request);
              enrichedPayload = { ...payload, userId: user.id };
            } catch {
              // No auth required for legacy payloads (backward compat)
              enrichedPayload = payload;
            }
          }
        }

        // Submit job (creates DB row with pending state)
        const jobId = await orchestrator.submitJob({
          type: body.type,
          payload: enrichedPayload,
          requiresStrictValidation: body.requiresStrictValidation,
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

  // GET /api/agents/jobs/:id
  fastify.get(
    '/api/agents/jobs/:id',
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
        const correlationId =
          extractCorrelationIdFromText(job.errorMessage) || extractCorrelationIdFromText(job.error);

        const response: Record<string, unknown> = {
          id: job.id,
          type: job.type,
          state: job.state,
          payload: job.payload,
          result: job.result,
          error: job.error,
          errorCode: job.errorCode,
          errorMessage: job.errorMessage,
          correlationId,
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

  // Phase 7.D: GET /api/agents/jobs - List jobs with filtering and pagination
  // Cursor encoding: base64(createdAt|id) for deterministic pagination
  const jobsListQuerySchema = z.object({
    type: z.enum(['scribe', 'trace', 'proto']).optional(),
    state: z.enum(['pending', 'running', 'completed', 'failed']).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    cursor: z.string().optional(), // base64 encoded cursor
  });

  fastify.get(
    '/api/agents/jobs',
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
                    errorCode: { type: 'string', nullable: true },
                    errorMessage: { type: 'string', nullable: true },
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
            errorCode: jobs.errorCode,
            errorMessage: jobs.errorMessage,
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

