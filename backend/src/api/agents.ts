import { FastifyInstance } from 'fastify';
import { z } from 'zod';

// Request validation schemas
const submitJobSchema = z.object({
  type: z.string().min(1).max(50),
  payload: z.unknown().optional(),
});

const jobIdParamsSchema = z.object({
  id: z.string().uuid(),
});

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

        // TODO: Call orchestrator.submitJob(body)
        // const jobId = await orchestrator.submitJob(body);
        // return { jobId, status: 'pending' };

        reply.code(501).send({ error: 'Not implemented' });
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
        // Validate params with Zod
        const params = jobIdParamsSchema.parse(request.params);

        // TODO: Get job status from orchestrator or database
        // const job = await db.select().from(jobs).where(eq(jobs.id, params.id)).limit(1);
        // if (!job.length) {
        //   reply.code(404).send({ error: 'Job not found' });
        //   return;
        // }
        // return { id: job[0].id, state: job[0].state, ... };

        reply.code(501).send({ error: 'Not implemented' });
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

