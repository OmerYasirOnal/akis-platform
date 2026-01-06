import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AgentOrchestrator } from '../core/orchestrator/AgentOrchestrator.js';
import { db } from '../db/client.js';
import { jobs, jobPlans, jobAudits, jobTraces, jobArtifacts, agentConfigs, jobComments } from '../db/schema.js';
import { eq, desc, and, sql, asc } from 'drizzle-orm';
import { JobNotFoundError, MissingAIKeyError, ModelNotAllowedError } from '../core/errors.js';
import { metrics } from './metrics.js';
import { formatErrorResponse, getStatusCodeForError } from '../utils/errorHandler.js';
import { requireAuth } from '../utils/auth.js';
import { getUserAiKeyStatus } from '../services/ai/user-ai-keys.js';
import { getScribeModelAllowlist, isModelAllowed } from '../services/ai/modelAllowlist.js';

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

        // S0.4.6+: Handle config-aware payloads for Scribe
        let enrichedPayload = body.payload;
        let aiModel: string | undefined;
        let aiProvider: string | undefined;

        if (body.type === 'scribe') {
          let userId: string;
          try {
            const user = await requireAuth(request);
            userId = user.id;
          } catch (authError) {
            const errorResponse = formatErrorResponse(request, authError);
            reply.code(401).send(errorResponse);
            return;
          }

          const keyStatus = await getUserAiKeyStatus(userId, 'openai');
          if (!keyStatus.configured) {
            throw new MissingAIKeyError('openai');
          }

          const allowlist = getScribeModelAllowlist();
          if (allowlist.length === 0) {
            throw new ModelNotAllowedError('openai', 'unknown', allowlist);
          }

          if (body.payload && typeof body.payload === 'object') {
            const payload = body.payload as Record<string, unknown>;
            const isConfigAware = 
              payload.mode === 'from_config' || 
              payload.mode === 'test' || 
              payload.mode === 'run' || 
              typeof payload.config_id === 'string';

            let modelOverride: string | null = null;

            if (isConfigAware) {
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

              modelOverride = config.llmModelOverride ?? null;

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
              if (config.triggerMode) {
                (enrichedPayload as Record<string, unknown>).triggerMode = config.triggerMode;
              }
              if (config.scheduleCron) {
                (enrichedPayload as Record<string, unknown>).scheduleCron = config.scheduleCron;
              }
              if (config.includeGlobs && config.includeGlobs.length > 0) {
                (enrichedPayload as Record<string, unknown>).includeGlobs = config.includeGlobs;
              }
              if (config.excludeGlobs && config.excludeGlobs.length > 0) {
                (enrichedPayload as Record<string, unknown>).excludeGlobs = config.excludeGlobs;
              }
            } else {
              // Legacy payload: require auth for user-scoped AI key
              enrichedPayload = { ...payload, userId };
              if (typeof payload.llmModelOverride === 'string') {
                modelOverride = payload.llmModelOverride;
              }
              if (typeof payload.model === 'string') {
                modelOverride = payload.model;
              }
            }

            if (modelOverride && !isModelAllowed(modelOverride, allowlist)) {
              throw new ModelNotAllowedError('openai', modelOverride, allowlist);
            }

            const modelToUse = modelOverride || allowlist[0];
            if (!isModelAllowed(modelToUse, allowlist)) {
              throw new ModelNotAllowedError('openai', modelToUse, allowlist);
            }

            aiModel = modelToUse;
            aiProvider = 'openai';
            enrichedPayload = {
              ...(enrichedPayload as Record<string, unknown>),
              llmModelOverride: modelToUse,
            };
          }
        }

        // Submit job (creates DB row with pending state)
        const jobId = await orchestrator.submitJob({
          type: body.type,
          payload: enrichedPayload,
          requiresStrictValidation: body.requiresStrictValidation,
          aiModel,
          aiProvider,
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
        const includeTrace = includeFlags.includes('trace');
        const includeArtifacts = includeFlags.includes('artifacts');

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

        // S1.0: Fetch trace events if requested
        let traces: unknown[] = [];
        if (includeTrace) {
          try {
            const traceRows = await db
              .select()
              .from(jobTraces)
              .where(eq(jobTraces.jobId, params.id))
              .orderBy(asc(jobTraces.timestamp))
              .limit(500); // Limit to 500 trace events
            traces = traceRows.map((row) => ({
              id: row.id,
              eventType: row.eventType,
              stepId: row.stepId,
              title: row.title,
              detail: row.detail,
              durationMs: row.durationMs,
              status: row.status,
              correlationId: row.correlationId,
              gatewayUrl: row.gatewayUrl,
              errorCode: row.errorCode,
              timestamp: row.timestamp,
            }));
          } catch (error) {
            // Don't fail request if trace fetch fails
            console.error(`Failed to fetch traces for job ${params.id}:`, error);
          }
        }

        // S1.0: Fetch artifacts if requested
        let artifacts: unknown[] = [];
        if (includeArtifacts) {
          try {
            const artifactRows = await db
              .select()
              .from(jobArtifacts)
              .where(eq(jobArtifacts.jobId, params.id))
              .orderBy(asc(jobArtifacts.createdAt))
              .limit(100); // Limit to 100 artifacts
            artifacts = artifactRows.map((row) => ({
              id: row.id,
              artifactType: row.artifactType,
              path: row.path,
              operation: row.operation,
              sizeBytes: row.sizeBytes,
              contentHash: row.contentHash,
              preview: row.preview,
              metadata: row.metadata,
              createdAt: row.createdAt,
            }));
          } catch (error) {
            // Don't fail request if artifacts fetch fails
            console.error(`Failed to fetch artifacts for job ${params.id}:`, error);
          }
        }

        // Return job data with optional plan/audit/trace/artifacts
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
          rawErrorPayload: job.rawErrorPayload,
          mcpGatewayUrl: job.mcpGatewayUrl,
          aiProvider: job.aiProvider,
          aiModel: job.aiModel,
          aiTotalDurationMs: job.aiTotalDurationMs,
          aiInputTokens: job.aiInputTokens,
          aiOutputTokens: job.aiOutputTokens,
          aiTotalTokens: job.aiTotalTokens,
          aiEstimatedCostUsd: job.aiEstimatedCostUsd,
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
        if (includeTrace) {
          response.trace = traces;
        }
        if (includeArtifacts) {
          response.artifacts = artifacts;
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

  // POST /api/agents/jobs/:id/approve - Approve a job for execution (S1.2)
  fastify.post(
    '/api/agents/jobs/:id/approve',
    {
      schema: {
        description: 'Approve a PLAN_ONLY job for execution',
        tags: ['agents'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        body: {
          type: 'object',
          properties: {
            comment: { type: 'string', maxLength: 1000 },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        // Require authentication
        const user = await requireAuth(request);

        // Validate params
        const params = jobIdParamsSchema.parse(request.params);
        const body = request.body as { comment?: string };

        // Load job
        const [job] = await db.select().from(jobs).where(eq(jobs.id, params.id)).limit(1);
        if (!job) {
          throw new JobNotFoundError(params.id);
        }

        // Validate approval eligibility
        if (!job.requiresApproval) {
          return reply.code(400).send({
            error: {
              code: 'INVALID_OPERATION',
              message: 'This job does not require approval',
            },
          });
        }

        if (job.state !== 'awaiting_approval') {
          return reply.code(400).send({
            error: {
              code: 'INVALID_STATE',
              message: `Job is in state "${job.state}" and cannot be approved. Only jobs in "awaiting_approval" state can be approved.`,
            },
          });
        }

        if (job.approvedBy || job.approvedAt) {
          return reply.code(400).send({
            error: {
              code: 'ALREADY_APPROVED',
              message: 'This job has already been approved',
            },
          });
        }

        // Update job with approval info
        const approvedAt = new Date();
        await db
          .update(jobs)
          .set({
            approvedBy: user.id,
            approvedAt,
            approvalComment: body.comment || null,
            updatedAt: new Date(),
          })
          .where(eq(jobs.id, params.id));

        // PR-1: Resume job execution after approval
        try {
          await orchestrator.resumeApprovedJob(params.id);
        } catch (resumeError) {
          // Log but don't fail the approval - job is still marked approved
          console.error(`Failed to resume job ${params.id} after approval:`, resumeError);
        }

        return reply.code(200).send({
          success: true,
          message: 'Job approved successfully. Execution resumed.',
          approvedBy: user.id,
          approvedAt: approvedAt.toISOString(),
        });
      } catch (error) {
        const errorResponse = formatErrorResponse(request, error);
        const statusCode = getStatusCodeForError(errorResponse.error.code);
        reply.code(statusCode).send(errorResponse);
      }
    }
  );

  // POST /api/agents/jobs/:id/reject - Reject a job (S1.2)
  fastify.post(
    '/api/agents/jobs/:id/reject',
    {
      schema: {
        description: 'Reject a PLAN_ONLY job',
        tags: ['agents'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        body: {
          type: 'object',
          properties: {
            comment: { type: 'string', maxLength: 1000 },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        // Require authentication
        const user = await requireAuth(request);

        // Validate params
        const params = jobIdParamsSchema.parse(request.params);
        const body = request.body as { comment?: string };

        // Load job
        const [job] = await db.select().from(jobs).where(eq(jobs.id, params.id)).limit(1);
        if (!job) {
          throw new JobNotFoundError(params.id);
        }

        // Validate rejection eligibility
        if (!job.requiresApproval) {
          return reply.code(400).send({
            error: {
              code: 'INVALID_OPERATION',
              message: 'This job does not require approval',
            },
          });
        }

        if (job.state !== 'awaiting_approval') {
          return reply.code(400).send({
            error: {
              code: 'INVALID_STATE',
              message: `Job is in state "${job.state}" and cannot be rejected. Only jobs in "awaiting_approval" state can be rejected.`,
            },
          });
        }

        // Update job with rejection info
        await db
          .update(jobs)
          .set({
            rejectedBy: user.id,
            rejectedAt: new Date(),
            approvalComment: body.comment || null,
            state: 'failed', // Mark as failed since it won't be executed
            error: 'Job rejected by user',
            updatedAt: new Date(),
          })
          .where(eq(jobs.id, params.id));

        return reply.code(200).send({
          success: true,
          message: 'Job rejected successfully',
          rejectedBy: user.id,
          rejectedAt: new Date().toISOString(),
        });
      } catch (error) {
        const errorResponse = formatErrorResponse(request, error);
        const statusCode = getStatusCodeForError(errorResponse.error.code);
        reply.code(statusCode).send(errorResponse);
      }
    }
  );

  // ============================================================================
  // PR-2: Feedback Loop - Comments & Revisions
  // ============================================================================

  // GET /api/agents/jobs/:id/comments - Get job comments
  fastify.get(
    '/api/agents/jobs/:id/comments',
    {
      schema: {
        description: 'Get all comments for a job',
        tags: ['agents'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const params = jobIdParamsSchema.parse(request.params);

        // Verify job exists
        const [job] = await db.select().from(jobs).where(eq(jobs.id, params.id)).limit(1);
        if (!job) {
          throw new JobNotFoundError(params.id);
        }

        // Get comments
        const comments = await db
          .select()
          .from(jobComments)
          .where(eq(jobComments.jobId, params.id))
          .orderBy(asc(jobComments.createdAt));

        return { comments };
      } catch (error) {
        const errorResponse = formatErrorResponse(request, error);
        const statusCode = getStatusCodeForError(errorResponse.error.code);
        reply.code(statusCode).send(errorResponse);
      }
    }
  );

  // POST /api/agents/jobs/:id/comments - Add a comment to a job
  fastify.post(
    '/api/agents/jobs/:id/comments',
    {
      schema: {
        description: 'Add a comment to a job (PR-2 feedback loop)',
        tags: ['agents'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        body: {
          type: 'object',
          required: ['text'],
          properties: {
            text: { type: 'string', minLength: 1, maxLength: 5000 },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        // Require authentication
        const user = await requireAuth(request);

        const params = jobIdParamsSchema.parse(request.params);
        const body = request.body as { text: string };

        // Verify job exists
        const [job] = await db.select().from(jobs).where(eq(jobs.id, params.id)).limit(1);
        if (!job) {
          throw new JobNotFoundError(params.id);
        }

        // Insert comment
        const [comment] = await db
          .insert(jobComments)
          .values({
            jobId: params.id,
            userId: user.id,
            commentText: body.text,
          })
          .returning();

        // Record audit event
        await db.insert(jobAudits).values({
          jobId: params.id,
          phase: 'execute', // Use execute phase for user feedback
          payload: {
            type: 'USER_COMMENT_ADDED',
            commentId: comment.id,
            userId: user.id,
            textPreview: body.text.substring(0, 100),
          },
        });

        return reply.code(201).send({
          success: true,
          comment: {
            id: comment.id,
            jobId: comment.jobId,
            userId: comment.userId,
            text: comment.commentText,
            createdAt: comment.createdAt,
          },
        });
      } catch (error) {
        const errorResponse = formatErrorResponse(request, error);
        const statusCode = getStatusCodeForError(errorResponse.error.code);
        reply.code(statusCode).send(errorResponse);
      }
    }
  );

  // POST /api/agents/jobs/:id/revise - Request a revision (create new job with parent link)
  fastify.post(
    '/api/agents/jobs/:id/revise',
    {
      schema: {
        description: 'Request a revision of a completed job (PR-2 feedback loop)',
        tags: ['agents'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        body: {
          type: 'object',
          required: ['instruction'],
          properties: {
            instruction: { type: 'string', minLength: 1, maxLength: 5000 },
            mode: { type: 'string', enum: ['edit', 'regenerate'], default: 'edit' },
            scope: { type: 'string', enum: ['files', 'plan', 'both'], default: 'files' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        // Require authentication
        const user = await requireAuth(request);

        const params = jobIdParamsSchema.parse(request.params);
        const body = request.body as { instruction: string; mode?: string; scope?: string };

        // Load parent job
        const [parentJob] = await db.select().from(jobs).where(eq(jobs.id, params.id)).limit(1);
        if (!parentJob) {
          throw new JobNotFoundError(params.id);
        }

        // Validate parent job is completed or failed (can revise either)
        if (parentJob.state !== 'completed' && parentJob.state !== 'failed') {
          return reply.code(400).send({
            error: {
              code: 'INVALID_STATE',
              message: `Cannot revise a job in state "${parentJob.state}". Only completed or failed jobs can be revised.`,
            },
          });
        }

        // Get parent job's artifacts (files produced)
        const parentArtifacts = await db
          .select()
          .from(jobArtifacts)
          .where(eq(jobArtifacts.jobId, params.id));

        // Get parent job's comments (as context)
        const parentComments = await db
          .select()
          .from(jobComments)
          .where(eq(jobComments.jobId, params.id))
          .orderBy(asc(jobComments.createdAt));

        // Build enhanced payload for revision job
        const parentPayload = (parentJob.payload || {}) as Record<string, unknown>;
        const revisionPayload = {
          ...parentPayload,
          // Add revision context
          revisionContext: {
            parentJobId: params.id,
            instruction: body.instruction,
            mode: body.mode || 'edit',
            scope: body.scope || 'files',
            // Include parent artifacts as documents to edit
            parentArtifacts: parentArtifacts.map(a => ({
              type: a.artifactType,
              path: a.path,
              operation: a.operation,
              preview: a.preview,
              metadata: a.metadata,
            })),
            // Include parent comments as feedback context
            feedbackComments: parentComments.map(c => ({
              text: c.commentText,
              createdAt: c.createdAt,
            })),
          },
          // Ensure userId is set
          userId: user.id,
        };

        // Create revision job
        const newJobId = await orchestrator.submitJob({
          type: parentJob.type,
          payload: revisionPayload,
          requiresStrictValidation: parentJob.requiresStrictValidation,
          aiModel: parentJob.aiModel ?? undefined,
          aiProvider: parentJob.aiProvider ?? undefined,
        });

        // Update revision job with parent reference
        await db
          .update(jobs)
          .set({
            parentJobId: params.id,
            revisionNote: body.instruction,
          })
          .where(eq(jobs.id, newJobId));

        // Record audit event on parent
        await db.insert(jobAudits).values({
          jobId: params.id,
          phase: 'execute',
          payload: {
            type: 'REVISION_REQUESTED',
            childJobId: newJobId,
            instruction: body.instruction.substring(0, 200),
            mode: body.mode || 'edit',
            requestedBy: user.id,
          },
        });

        // Start the revision job
        try {
          await orchestrator.startJob(newJobId);
        } catch (startError) {
          console.error(`Failed to start revision job ${newJobId}:`, startError);
          // Job is still created, user can retry
        }

        return reply.code(201).send({
          success: true,
          message: 'Revision job created',
          newJobId,
          parentJobId: params.id,
        });
      } catch (error) {
        const errorResponse = formatErrorResponse(request, error);
        const statusCode = getStatusCodeForError(errorResponse.error.code);
        reply.code(statusCode).send(errorResponse);
      }
    }
  );

  // GET /api/agents/jobs/:id/revisions - Get revision chain (children of this job)
  fastify.get(
    '/api/agents/jobs/:id/revisions',
    {
      schema: {
        description: 'Get revision chain for a job (child jobs)',
        tags: ['agents'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const params = jobIdParamsSchema.parse(request.params);

        // Verify job exists
        const [job] = await db.select().from(jobs).where(eq(jobs.id, params.id)).limit(1);
        if (!job) {
          throw new JobNotFoundError(params.id);
        }

        // Get child revisions
        const revisions = await db
          .select({
            id: jobs.id,
            state: jobs.state,
            revisionNote: jobs.revisionNote,
            createdAt: jobs.createdAt,
            completedAt: jobs.updatedAt,
          })
          .from(jobs)
          .where(eq(jobs.parentJobId, params.id))
          .orderBy(desc(jobs.createdAt));

        // Get parent job if this is a revision
        let parentJob = null;
        if (job.parentJobId) {
          const [parent] = await db
            .select({
              id: jobs.id,
              state: jobs.state,
              createdAt: jobs.createdAt,
            })
            .from(jobs)
            .where(eq(jobs.id, job.parentJobId))
            .limit(1);
          parentJob = parent || null;
        }

        return {
          parentJob,
          revisions,
          isRevision: Boolean(job.parentJobId),
          revisionNote: job.revisionNote,
        };
      } catch (error) {
        const errorResponse = formatErrorResponse(request, error);
        const statusCode = getStatusCodeForError(errorResponse.error.code);
        reply.code(statusCode).send(errorResponse);
      }
    }
  );
}
