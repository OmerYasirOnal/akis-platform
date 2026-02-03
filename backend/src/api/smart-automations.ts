/**
 * Smart Automations API Routes
 * CRUD operations for smart automations + run triggers
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../utils/auth.js';
import { db } from '../db/client.js';
import {
  smartAutomations,
  smartAutomationRuns,
  smartAutomationItems,
} from '../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { automationExecutor } from '../services/smart-automations/index.js';

// =============================================================================
// Zod Schemas
// =============================================================================

const sourceSchema = z.object({
  url: z.string().url(),
  type: z.enum(['rss', 'webpage']).default('rss'),
});

const createAutomationSchema = z.object({
  name: z.string().min(1).max(255),
  topics: z.array(z.string().min(1)).min(1, 'At least one topic is required'),
  sources: z.array(sourceSchema).min(1, 'At least one source is required'),
  scheduleTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format').default('09:00'),
  timezone: z.string().default('Europe/Istanbul'),
  outputLanguage: z.enum(['tr', 'en']).default('tr'),
  style: z.enum(['linkedin']).default('linkedin'),
  deliveryInApp: z.boolean().default(true),
  deliverySlack: z.boolean().default(false),
  slackChannel: z.string().optional(),
  enabled: z.boolean().default(true),
});

const updateAutomationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  topics: z.array(z.string().min(1)).min(1).optional(),
  sources: z.array(sourceSchema).min(1).optional(),
  scheduleTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  timezone: z.string().optional(),
  outputLanguage: z.enum(['tr', 'en']).optional(),
  style: z.enum(['linkedin']).optional(),
  deliveryInApp: z.boolean().optional(),
  deliverySlack: z.boolean().optional(),
  slackChannel: z.string().nullable().optional(),
  enabled: z.boolean().optional(),
});

const idParamSchema = z.object({
  id: z.string().uuid(),
});

const runIdParamSchema = z.object({
  id: z.string().uuid(),
  runId: z.string().uuid(),
});

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Calculate next run timestamp based on schedule time and timezone
 */
function calculateNextRunAt(scheduleTime: string, timezone: string): Date {
  const [hours, minutes] = scheduleTime.split(':').map(Number);
  const now = new Date();

  // Create date in the specified timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '0';

  const currentHour = parseInt(getPart('hour'));
  const currentMinute = parseInt(getPart('minute'));

  // Calculate if we should schedule for today or tomorrow
  const scheduleForTomorrow =
    currentHour > hours || (currentHour === hours && currentMinute >= minutes);

  // Create the next run date
  const nextRun = new Date(now);
  if (scheduleForTomorrow) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  // Set time components (approximate - timezone handling is simplified)
  nextRun.setHours(hours, minutes, 0, 0);

  return nextRun;
}

// =============================================================================
// Routes
// =============================================================================

export async function smartAutomationsRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/smart-automations - Create new automation
   */
  fastify.post(
    '/api/smart-automations',
    {
      schema: {
        tags: ['smart-automations'],
        body: {
          type: 'object',
          required: ['name', 'topics', 'sources'],
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = await requireAuth(request);
        const body = createAutomationSchema.parse(request.body);


        // Calculate initial next run time
        const nextRunAt = body.enabled
          ? calculateNextRunAt(body.scheduleTime, body.timezone)
          : null;

        const [automation] = await db
          .insert(smartAutomations)
          .values({
            userId: user.id,
            name: body.name,
            topics: body.topics,
            sources: body.sources,
            scheduleTime: body.scheduleTime,
            timezone: body.timezone,
            outputLanguage: body.outputLanguage,
            style: body.style,
            deliveryInApp: body.deliveryInApp,
            deliverySlack: body.deliverySlack,
            slackChannel: body.slackChannel,
            enabled: body.enabled,
            nextRunAt,
          })
          .returning();

        return reply.code(201).send(automation);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({
            error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: error.errors },
          });
        }
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
          return reply.code(401).send({ error: { code: 'UNAUTHORIZED' } });
        }
        fastify.log.error(error, 'Failed to create automation');
        return reply.code(500).send({ error: { code: 'INTERNAL_ERROR' } });
      }
    }
  );

  /**
   * GET /api/smart-automations - List user's automations
   */
  fastify.get(
    '/api/smart-automations',
    {
      schema: {
        tags: ['smart-automations'],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = await requireAuth(request);

        const automations = await db
          .select()
          .from(smartAutomations)
          .where(eq(smartAutomations.userId, user.id))
          .orderBy(desc(smartAutomations.createdAt));

        // Get last run status for each automation
        const automationsWithStatus = await Promise.all(
          automations.map(async (automation) => {
            const [lastRun] = await db
              .select({
                id: smartAutomationRuns.id,
                status: smartAutomationRuns.status,
                createdAt: smartAutomationRuns.createdAt,
                itemCount: smartAutomationRuns.itemCount,
              })
              .from(smartAutomationRuns)
              .where(eq(smartAutomationRuns.automationId, automation.id))
              .orderBy(desc(smartAutomationRuns.createdAt))
              .limit(1);

            return {
              ...automation,
              lastRun: lastRun || null,
            };
          })
        );

        return reply.send({ automations: automationsWithStatus });
      } catch (error) {
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
          return reply.code(401).send({ error: { code: 'UNAUTHORIZED' } });
        }
        fastify.log.error(error, 'Failed to list automations');
        return reply.code(500).send({ error: { code: 'INTERNAL_ERROR' } });
      }
    }
  );

  /**
   * GET /api/smart-automations/:id - Get automation detail with recent runs
   */
  fastify.get(
    '/api/smart-automations/:id',
    {
      schema: {
        tags: ['smart-automations'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = await requireAuth(request);
        const { id } = idParamSchema.parse(request.params);

        const [automation] = await db
          .select()
          .from(smartAutomations)
          .where(and(eq(smartAutomations.id, id), eq(smartAutomations.userId, user.id)))
          .limit(1);

        if (!automation) {
          return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Automation not found' } });
        }

        // Get recent runs (last 10)
        const runs = await db
          .select()
          .from(smartAutomationRuns)
          .where(eq(smartAutomationRuns.automationId, id))
          .orderBy(desc(smartAutomationRuns.createdAt))
          .limit(10);

        return reply.send({
          automation,
          runs,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', details: error.errors } });
        }
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
          return reply.code(401).send({ error: { code: 'UNAUTHORIZED' } });
        }
        fastify.log.error(error, 'Failed to get automation');
        return reply.code(500).send({ error: { code: 'INTERNAL_ERROR' } });
      }
    }
  );

  /**
   * PUT /api/smart-automations/:id - Update automation
   */
  fastify.put(
    '/api/smart-automations/:id',
    {
      schema: {
        tags: ['smart-automations'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = await requireAuth(request);
        const { id } = idParamSchema.parse(request.params);
        const body = updateAutomationSchema.parse(request.body);

        // Check ownership
        const [existing] = await db
          .select()
          .from(smartAutomations)
          .where(and(eq(smartAutomations.id, id), eq(smartAutomations.userId, user.id)))
          .limit(1);

        if (!existing) {
          return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Automation not found' } });
        }

        // Calculate next run if schedule changed
        let nextRunAt = existing.nextRunAt;
        const scheduleTime = body.scheduleTime || existing.scheduleTime;
        const timezone = body.timezone || existing.timezone;
        const enabled = body.enabled ?? existing.enabled;

        if (enabled && (body.scheduleTime || body.timezone || body.enabled !== undefined)) {
          nextRunAt = calculateNextRunAt(scheduleTime, timezone);
        } else if (!enabled) {
          nextRunAt = null;
        }

        const [updated] = await db
          .update(smartAutomations)
          .set({
            ...body,
            nextRunAt,
            updatedAt: new Date(),
          })
          .where(eq(smartAutomations.id, id))
          .returning();

        return reply.send(updated);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', details: error.errors } });
        }
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
          return reply.code(401).send({ error: { code: 'UNAUTHORIZED' } });
        }
        fastify.log.error(error, 'Failed to update automation');
        return reply.code(500).send({ error: { code: 'INTERNAL_ERROR' } });
      }
    }
  );

  /**
   * DELETE /api/smart-automations/:id - Delete automation
   */
  fastify.route({
    method: 'DELETE',
    url: '/api/smart-automations/:id',
    schema: {
      tags: ['smart-automations'],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string', format: 'uuid' } },
      },
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = await requireAuth(request);
        const { id } = idParamSchema.parse(request.params);

        // Check ownership
        const [existing] = await db
          .select()
          .from(smartAutomations)
          .where(and(eq(smartAutomations.id, id), eq(smartAutomations.userId, user.id)))
          .limit(1);

        if (!existing) {
          return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Automation not found' } });
        }

        await db.delete(smartAutomations).where(eq(smartAutomations.id, id));

        return reply.code(204).send();
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', details: error.errors } });
        }
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
          return reply.code(401).send({ error: { code: 'UNAUTHORIZED' } });
        }
        fastify.log.error(error, 'Failed to delete automation');
        return reply.code(500).send({ error: { code: 'INTERNAL_ERROR' } });
      }
    },
  });

  /**
   * POST /api/smart-automations/:id/run - Trigger manual run
   */
  fastify.post(
    '/api/smart-automations/:id/run',
    {
      schema: {
        tags: ['smart-automations'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = await requireAuth(request);
        const { id } = idParamSchema.parse(request.params);

        // Check ownership
        const [existing] = await db
          .select()
          .from(smartAutomations)
          .where(and(eq(smartAutomations.id, id), eq(smartAutomations.userId, user.id)))
          .limit(1);

        if (!existing) {
          return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Automation not found' } });
        }

        // Execute automation
        const result = await automationExecutor.execute(id);

        return reply.send({
          success: result.success,
          runId: result.runId,
          itemCount: result.itemCount,
          error: result.error,
          errorCode: result.errorCode,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', details: error.errors } });
        }
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
          return reply.code(401).send({ error: { code: 'UNAUTHORIZED' } });
        }
        fastify.log.error(error, 'Failed to run automation');
        return reply.code(500).send({ error: { code: 'INTERNAL_ERROR' } });
      }
    }
  );

  /**
   * GET /api/smart-automations/:id/runs/:runId - Get run detail with items
   */
  fastify.get(
    '/api/smart-automations/:id/runs/:runId',
    {
      schema: {
        tags: ['smart-automations'],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = await requireAuth(request);
        const { id, runId } = runIdParamSchema.parse(request.params);

        // Check ownership
        const [automation] = await db
          .select()
          .from(smartAutomations)
          .where(and(eq(smartAutomations.id, id), eq(smartAutomations.userId, user.id)))
          .limit(1);

        if (!automation) {
          return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Automation not found' } });
        }

        // Get run
        const [run] = await db
          .select()
          .from(smartAutomationRuns)
          .where(and(eq(smartAutomationRuns.id, runId), eq(smartAutomationRuns.automationId, id)))
          .limit(1);

        if (!run) {
          return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Run not found' } });
        }

        // Get items
        const items = await db
          .select()
          .from(smartAutomationItems)
          .where(eq(smartAutomationItems.runId, runId))
          .orderBy(smartAutomationItems.createdAt);

        return reply.send({ run, items });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', details: error.errors } });
        }
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
          return reply.code(401).send({ error: { code: 'UNAUTHORIZED' } });
        }
        fastify.log.error(error, 'Failed to get run detail');
        return reply.code(500).send({ error: { code: 'INTERNAL_ERROR' } });
      }
    }
  );

  /**
   * POST /api/smart-automations/:id/runs/:runId/resend-slack - Resend Slack notification
   */
  fastify.post(
    '/api/smart-automations/:id/runs/:runId/resend-slack',
    {
      schema: {
        tags: ['smart-automations'],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = await requireAuth(request);
        const { id, runId } = runIdParamSchema.parse(request.params);

        // Check ownership
        const [automation] = await db
          .select()
          .from(smartAutomations)
          .where(and(eq(smartAutomations.id, id), eq(smartAutomations.userId, user.id)))
          .limit(1);

        if (!automation) {
          return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Automation not found' } });
        }

        // Verify run belongs to automation
        const [run] = await db
          .select()
          .from(smartAutomationRuns)
          .where(and(eq(smartAutomationRuns.id, runId), eq(smartAutomationRuns.automationId, id)))
          .limit(1);

        if (!run) {
          return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Run not found' } });
        }

        // Resend notification
        const result = await automationExecutor.resendSlackNotification(runId);

        return reply.send(result);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', details: error.errors } });
        }
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
          return reply.code(401).send({ error: { code: 'UNAUTHORIZED' } });
        }
        fastify.log.error(error, 'Failed to resend Slack notification');
        return reply.code(500).send({ error: { code: 'INTERNAL_ERROR' } });
      }
    }
  );
}
