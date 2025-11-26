import type { FastifyInstance, FastifyReply } from 'fastify';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import { hashPassword, verifyPassword } from '../services/auth/password.js';
import { sign, verify } from '../services/auth/jwt.js';
import { cookieOpts, env } from '../lib/env.js';

type User = typeof users.$inferSelect;

const SignupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const sanitizeUser = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
});

function clearSessionCookie(reply: FastifyReply) {
  reply.setCookie(env.AUTH_COOKIE_NAME, '', { ...cookieOpts, maxAge: 0 });
}

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

  fastify.post('/signup', async (request, reply) => {
    const body = SignupSchema.parse(request.body);

    const existing = await db.query.users.findFirst({
      where: eq(users.email, body.email.toLowerCase()),
    });

    if (existing) {
      return reply.code(409).send({ error: 'Email in use' });
    }

    const passwordHash = await hashPassword(body.password);
    const [created] = await db
      .insert(users)
      .values({
        name: body.name,
        email: body.email.toLowerCase(),
        passwordHash,
      })
      .returning();

    const jwt = await sign({ sub: created.id, email: created.email, name: created.name });
    reply.setCookie(env.AUTH_COOKIE_NAME, jwt, cookieOpts);

    return reply.code(201).send(sanitizeUser(created));
  });

  fastify.post('/login', async (request, reply) => {
    const body = LoginSchema.parse(request.body);

    const user = await db.query.users.findFirst({
      where: eq(users.email, body.email.toLowerCase()),
    });

    if (!user) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    const isValid = await verifyPassword(body.password, user.passwordHash);
    if (!isValid) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    const jwt = await sign({ sub: user.id, email: user.email, name: user.name });
    reply.setCookie(env.AUTH_COOKIE_NAME, jwt, cookieOpts);

    return sanitizeUser(user);
  });

  fastify.post(
    '/logout',
    {
      schema: {
        tags: ['auth'],
        description: 'Logout current user by clearing session cookie',
        body: {
          type: 'object',
          additionalProperties: true, // Accept empty body or any object
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
      // Allow empty body - don't parse if no content
      config: {
        rawBody: false,
      },
    },
    async (_request, reply) => {
      clearSessionCookie(reply);
      return { ok: true };
    }
  );

  fastify.get('/me', async (request, reply) => {
    const token = request.cookies?.[env.AUTH_COOKIE_NAME];
    if (!token) {
      return reply.code(401).send({ user: null });
    }

    try {
      const payload = await verify<{ sub: string }>(token);
      const user = await db.query.users.findFirst({
        where: eq(users.id, payload.sub),
      });

      if (!user) {
        clearSessionCookie(reply);
        return reply.code(401).send({ user: null });
      }

      return sanitizeUser(user);
    } catch {
      clearSessionCookie(reply);
      return reply.code(401).send({ user: null });
    }
  });
}
