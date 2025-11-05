import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AgentOrchestrator } from '../core/orchestrator/AgentOrchestrator.js';
import { db } from '../db/client.js';
import { jobs } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { JobNotFoundError, InvalidStateTransitionError, DatabaseError } from '../core/errors.js';

// Request validation schemas
const submitJobSchema = z.object({
  type: z.enum(['scribe', 'trace', 'proto']),
  payload: z.unknown().optional(),
});

const jobIdParamsSchema = z.object({
  id: z.string().uuid(),
});

// Initialize orchestrator (in production, inject tools/MCP adapters here)
const orchestrator = new AgentOrchestrator();

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

        // Start job immediately (executes agent and transitions to completed/failed)
        let finalState = 'pending';
        try {
          await orchestrator.startJob(jobId);
          // Query final state after execution
          const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
          if (job) {
            finalState = job.state;
          }
        } catch (startError) {
          // If start fails, job is already marked as failed in DB
          // Query state to return accurate status
          try {
            const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
            if (job) {
              finalState = job.state;
            }
          } catch {
            // If we can't query, default to pending
          }
        }

        return { jobId, state: finalState };
      } catch (error) {
        if (error instanceof z.ZodError) {
          reply.code(400).send({
            error: 'Validation failed',
            details: error.errors,
          });
          return;
        }
        // Wrap structured errors for API
        if (error instanceof DatabaseError || error instanceof InvalidStateTransitionError) {
          reply.code(500).send({
            error: error.name,
            message: error.message,
          });
          return;
        }
        reply.code(500).send({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
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
      },
    },
    async (request, reply) => {
      try {
        // Validate params with Zod (UUID format)
        const params = jobIdParamsSchema.parse(request.params);

        // Fetch job from database
        let job;
        try {
          const result = await db.select().from(jobs).where(eq(jobs.id, params.id)).limit(1);
          if (!result.length) {
            reply.code(404).send({
              error: 'Job not found',
              message: `Job with id ${params.id} does not exist`,
            });
            return;
          }
          job = result[0];
        } catch (error) {
          reply.code(500).send({
            error: 'Database error',
            message: error instanceof Error ? error.message : 'Failed to fetch job',
          });
          return;
        }

        // Return job data (without sensitive data if any)
        return {
          id: job.id,
          type: job.type,
          state: job.state,
          payload: job.payload,
          result: job.result,
          error: job.error,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          reply.code(400).send({
            error: 'Validation failed',
            details: error.errors,
          });
          return;
        }
        reply.code(500).send({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );
}

