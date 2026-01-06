import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../../utils/auth.js';
import {
  deleteUserAiKey,
  getUserAiKeyStatus,
  normalizeApiKey,
  upsertUserAiKey,
  type AIKeyProvider,
} from '../../services/ai/user-ai-keys.js';

const providerSchema = z.enum(['openai']);

const upsertSchema = z.object({
  provider: providerSchema.default('openai'),
  apiKey: z
    .string()
    .min(20, 'API key must be at least 20 characters')
    .regex(/^\S+$/, 'API key must not include whitespace')
    .regex(/^sk-[A-Za-z0-9_-]+$/, 'API key must start with sk-'),
});

const deleteSchema = z.object({
  provider: providerSchema.default('openai'),
});

export async function aiKeysRoutes(fastify: FastifyInstance) {
  // GET /api/settings/ai-keys/status
  fastify.get(
    '/ai-keys/status',
    {
      schema: {
        tags: ['settings'],
        response: {
          200: {
            type: 'object',
            properties: {
              provider: { type: 'string' },
              configured: { type: 'boolean' },
              last4: { type: ['string', 'null'] },
              updatedAt: { type: ['string', 'null'] },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = await requireAuth(request);
        const status = await getUserAiKeyStatus(user.id, 'openai');
        return reply.code(200).send(status);
      } catch (err: unknown) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
          return reply.code(401).send({
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required',
            },
          });
        }
        throw err;
      }
    }
  );

  // PUT /api/settings/ai-keys
  (fastify as any).put(
    '/ai-keys',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '1 minute',
        },
      },
      schema: {
        tags: ['settings'],
        body: {
          type: 'object',
          required: ['apiKey'],
          properties: {
            provider: { type: 'string', enum: ['openai'], default: 'openai' },
            apiKey: { type: 'string', minLength: 20 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              provider: { type: 'string' },
              configured: { type: 'boolean' },
              last4: { type: ['string', 'null'] },
              updatedAt: { type: ['string', 'null'] },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = await requireAuth(request);
        const body = upsertSchema.parse(request.body);
        const provider = body.provider as AIKeyProvider;
        const normalized = normalizeApiKey(body.apiKey);

        const status = await upsertUserAiKey(user.id, provider, normalized);
        return reply.code(200).send(status);
      } catch (err: unknown) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
          return reply.code(401).send({
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required',
            },
          });
        }
        if (err instanceof z.ZodError) {
          return reply.code(400).send({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid API key payload',
              details: err.errors,
            },
          });
        }
        throw err;
      }
    }
  );

  // DELETE /api/settings/ai-keys
  (fastify as any).delete(
    '/ai-keys',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute',
        },
      },
      schema: {
        tags: ['settings'],
        body: {
          type: 'object',
          properties: {
            provider: { type: 'string', enum: ['openai'], default: 'openai' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              ok: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = await requireAuth(request);
        const body = deleteSchema.parse(request.body ?? {});
        const provider = body.provider as AIKeyProvider;

        await deleteUserAiKey(user.id, provider);
        return reply.code(200).send({ ok: true });
      } catch (err: unknown) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
          return reply.code(401).send({
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required',
            },
          });
        }
        if (err instanceof z.ZodError) {
          return reply.code(400).send({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid request',
              details: err.errors,
            },
          });
        }
        throw err;
      }
    }
  );
}
