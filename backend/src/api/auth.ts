import { randomUUID } from 'crypto';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { getEnv } from '../config/env.js';
import { sessionService } from '../services/session/SessionService.js';

const env = getEnv();

const devLoginSchema = z.object({
  email: z.string().email(),
});

export async function authRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/health',
    {
      schema: {
        tags: ['auth'],
        response: {
          200: {
            type: 'object',
            properties: {
              ok: { type: 'boolean' },
              ts: { type: 'string' },
            },
          },
        },
      },
    },
    async () => {
      return {
        ok: true,
        ts: new Date().toISOString(),
      };
    }
  );

  fastify.get(
    '/me',
    {
      schema: {
        tags: ['auth'],
        response: {
          200: {
            type: 'object',
            properties: {
              user: {
                anyOf: [
                  {
                    type: 'null',
                  },
                  {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      email: { type: 'string' },
                    },
                    required: ['id', 'email'],
                  },
                ],
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const sessionId = request.authSessionId;

      if (!sessionId) {
        return { user: null };
      }

      const session = sessionService.get(sessionId);

      if (!session) {
        reply.clearAuthCookie();
        return { user: null };
      }

      return { user: session.user };
    }
  );

  fastify.post(
    '/dev-login',
    {
      schema: {
        tags: ['auth'],
        body: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                },
                required: ['id', 'email'],
              },
            },
            required: ['user'],
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (env.NODE_ENV !== 'development') {
        return reply.code(403).send({
          error: {
            code: 'DEV_LOGIN_DISABLED',
            message: 'Dev login sadece geliştirme ortamında kullanılabilir.',
          },
        });
      }

      const result = devLoginSchema.safeParse(request.body);

      if (!result.success) {
        return reply.code(400).send({
          error: {
            code: 'INVALID_REQUEST',
            message: 'Geçersiz giriş isteği.',
            details: result.error.flatten(),
          },
        });
      }

      const user = {
        id: randomUUID(),
        email: result.data.email.toLowerCase(),
      };

      const session = sessionService.create(user);

      reply.setAuthCookie(session.id);

      return { user: session.user };
    }
  );

  fastify.post(
    '/logout',
    {
      schema: {
        tags: ['auth'],
        response: {
          200: {
            type: 'object',
            properties: {
              ok: { type: 'boolean' },
            },
            required: ['ok'],
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const sessionId = request.authSessionId;

      if (sessionId) {
        sessionService.destroy(sessionId);
      }

      reply.clearAuthCookie();

      return { ok: true };
    }
  );
}


