import type { FastifyInstance, FastifyReply } from 'fastify';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import { hashPassword, verifyPassword } from '../services/auth/password.js';
import { sign, verify } from '../services/auth/jwt.js';
import { cookieOpts, env } from '../lib/env.js';
import { getEnv } from '../config/env.js';
import { createEmailService } from '../services/email/index.js';
import { registerMultiStepAuthRoutes } from './auth.multi-step.js';
import { registerOAuthRoutes } from './auth.oauth.js';
import { registerInviteRoutes } from './auth.invite.js';
import { sendError } from '../utils/errorHandler.js';

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
  // Initialize email service
  const config = getEnv();
  const emailService = createEmailService({
    provider: config.EMAIL_PROVIDER,
    // Resend
    apiKey: config.RESEND_API_KEY,
    fromEmail: config.RESEND_FROM_EMAIL,
    // SMTP
    smtpHost: config.SMTP_HOST,
    smtpPort: config.SMTP_PORT,
    smtpSecure: config.SMTP_SECURE,
    smtpUser: config.SMTP_USER,
    smtpPass: config.SMTP_PASS,
    smtpFromName: config.SMTP_FROM_NAME,
    smtpFromEmail: config.SMTP_FROM_EMAIL,
    smtpReplyTo: config.SMTP_REPLY_TO,
    // Shared
    publicLogoUrl: config.PUBLIC_LOGO_URL,
    ttlMinutes: config.EMAIL_VERIFICATION_TOKEN_TTL_MINUTES,
  });

  // Register multi-step auth routes
  await registerMultiStepAuthRoutes(fastify, emailService);

  // Register OAuth routes (S0.4.2)
  await registerOAuthRoutes(fastify);

  // Register invite routes (WL-1)
  await registerInviteRoutes(fastify, emailService);

  // Legacy routes (deprecated - kept for backwards compatibility)
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

  // DEPRECATED: Single-step signup (kept for backwards compatibility)
  fastify.post('/signup', async (request, reply) => {
    const body = SignupSchema.parse(request.body);

    const existing = await db.query.users.findFirst({
      where: eq(users.email, body.email.toLowerCase()),
    });

    if (existing) {
      return sendError(reply, request, 'EMAIL_IN_USE', 'Email in use');
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

  // DEPRECATED: Single-step login (kept for backwards compatibility)
  fastify.post('/login', async (request, reply) => {
    const body = LoginSchema.parse(request.body);

    const user = await db.query.users.findFirst({
      where: eq(users.email, body.email.toLowerCase()),
    });

    if (!user) {
      return sendError(reply, request, 'INVALID_CREDENTIALS', 'Invalid credentials');
    }

    const isValid = await verifyPassword(body.password, user.passwordHash);
    if (!isValid) {
      return sendError(reply, request, 'INVALID_CREDENTIALS', 'Invalid credentials');
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
        // No body validation - logout accepts empty body
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
