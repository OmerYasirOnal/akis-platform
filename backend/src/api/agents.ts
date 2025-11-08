import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AgentOrchestrator } from '../core/orchestrator/AgentOrchestrator.js';
import { db } from '../db/client.js';
import { jobs, jobPlans, jobAudits } from '../db/schema.js';
import { eq, desc, and, sql } from 'drizzle-orm';
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

const jobIdParamsSchema = z.object({
  id: z.string().uuid(),
});

const includeQuerySchema = z.object({
  include: z.string().optional(), // Comma-separated: 'plan,audit'
});

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

