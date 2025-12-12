/**
 * Multi-Step Authentication Routes
 * Implements Cursor-style auth flows with email verification
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import { hashPassword, verifyPassword } from '../services/auth/password.js';
import { sign } from '../services/auth/jwt.js';
import { cookieOpts, env } from '../lib/env.js';
import { VerificationService } from '../services/auth/verification.js';
import type { EmailService } from '../services/email/index.js';

type User = typeof users.$inferSelect;

// Validation schemas
const SignupStartSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
});

const SignupPasswordSchema = z.object({
  userId: z.string().uuid(),
  password: z.string().min(8).max(100),
});

const VerifyEmailSchema = z.object({
  userId: z.string().uuid(),
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
});

const ResendCodeSchema = z.object({
  userId: z.string().uuid(),
});

const LoginStartSchema = z.object({
  email: z.string().email(),
});

const LoginCompleteSchema = z.object({
  userId: z.string().uuid(),
  password: z.string().min(8),
});

const UpdatePreferencesSchema = z.object({
  dataSharingConsent: z.boolean().optional(),
  hasSeenBetaWelcome: z.boolean().optional(),
});

// Helper to sanitize user data
const sanitizeUser = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  status: user.status,
  emailVerified: user.emailVerified,
  dataSharingConsent: user.dataSharingConsent,
  hasSeenBetaWelcome: user.hasSeenBetaWelcome,
});

// Helper to clear session cookie
function clearSessionCookie(reply: FastifyReply) {
  reply.setCookie(env.AUTH_COOKIE_NAME, '', { ...cookieOpts, maxAge: 0 });
}

export async function registerMultiStepAuthRoutes(
  fastify: FastifyInstance,
  emailService: EmailService
) {
  const verificationService = new VerificationService(emailService, {
    ttlMinutes: 15, // Can be made configurable
  });

  /**
   * SIGNUP FLOW
   */

  // Step 1: Name + Email
  fastify.post('/signup/start', async (request, reply) => {
    const body = SignupStartSchema.parse(request.body);
    const email = body.email.toLowerCase();

    // Check if email already exists
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existing) {
      return reply.code(409).send({
        error: 'Email already registered',
        code: 'EMAIL_IN_USE',
      });
    }

    // Create user in pending state (no password yet)
    const [created] = await db
      .insert(users)
      .values({
        name: `${body.firstName} ${body.lastName}`,
        email,
        passwordHash: '', // Will be set in next step
        status: 'pending_verification',
        emailVerified: false,
      })
      .returning();

    // Send verification code
    try {
      await verificationService.sendVerificationCode(created.id, email, created.name);
    } catch (error) {
      // If email fails, still return success but log error
      console.error('[Auth] Failed to send verification email:', error);
      
      if (error instanceof Error && error.message === 'TOO_MANY_ATTEMPTS') {
        return reply.code(429).send({
          error: 'Too many verification attempts. Please wait 15 minutes.',
          code: 'RATE_LIMITED',
        });
      }
    }

    return reply.code(201).send({
      userId: created.id,
      email: created.email,
      message: 'Verification code sent to your email',
      status: 'pending_verification',
    });
  });

  // Step 2: Set Password
  fastify.post('/signup/password', async (request, reply) => {
    const body = SignupPasswordSchema.parse(request.body);

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.id, body.userId),
    });

    if (!user) {
      return reply.code(404).send({
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    if (user.status !== 'pending_verification') {
      return reply.code(403).send({
        error: 'User already verified',
        code: 'ALREADY_VERIFIED',
      });
    }

    // Hash and store password
    const passwordHash = await hashPassword(body.password);
    
    await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, body.userId));

    return {
      ok: true,
      message: 'Password set successfully',
    };
  });

  // Step 3: Verify Email Code
  fastify.post('/verify-email', async (request, reply) => {
    const body = VerifyEmailSchema.parse(request.body);

    try {
      const isValid = await verificationService.verifyCode(body.userId, body.code);

      if (!isValid) {
        return reply.code(400).send({
          error: 'Invalid or expired verification code',
          code: 'INVALID_CODE',
        });
      }

      // Get updated user
      const user = await db.query.users.findFirst({
        where: eq(users.id, body.userId),
      });

      if (!user) {
        return reply.code(404).send({
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        });
      }

      // Generate JWT and set cookie
      const jwt = await sign({
        sub: user.id,
        email: user.email,
        name: user.name,
      });
      
      reply.setCookie(env.AUTH_COOKIE_NAME, jwt, cookieOpts);

      return {
        user: sanitizeUser(user),
        message: 'Email verified successfully',
      };
    } catch (error) {
      console.error('[Auth] Verification error:', error);
      
      return reply.code(500).send({
        error: 'Failed to verify email',
        code: 'INTERNAL_ERROR',
      });
    }
  });

  // Resend verification code
  fastify.post('/resend-code', async (request, reply) => {
    const body = ResendCodeSchema.parse(request.body);

    const user = await db.query.users.findFirst({
      where: eq(users.id, body.userId),
    });

    if (!user) {
      return reply.code(404).send({
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    if (user.emailVerified) {
      return reply.code(403).send({
        error: 'Email already verified',
        code: 'ALREADY_VERIFIED',
      });
    }

    try {
      await verificationService.sendVerificationCode(user.id, user.email, user.name);

      return {
        ok: true,
        message: 'Verification code resent',
      };
    } catch (error) {
      if (error instanceof Error && error.message === 'TOO_MANY_ATTEMPTS') {
        return reply.code(429).send({
          error: 'Too many attempts. Please wait 15 minutes.',
          code: 'RATE_LIMITED',
        });
      }

      console.error('[Auth] Failed to resend code:', error);
      
      return reply.code(500).send({
        error: 'Failed to send verification code',
        code: 'INTERNAL_ERROR',
      });
    }
  });

  /**
   * LOGIN FLOW
   */

  // Step 1: Email Check
  fastify.post('/login/start', async (request, reply) => {
    const body = LoginStartSchema.parse(request.body);
    const email = body.email.toLowerCase();

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return reply.code(404).send({
        error: 'No account found with this email',
        code: 'USER_NOT_FOUND',
      });
    }

    if (user.status === 'pending_verification' || !user.emailVerified) {
      return reply.code(403).send({
        error: 'Email not verified',
        code: 'EMAIL_NOT_VERIFIED',
        userId: user.id,
      });
    }

    if (user.status === 'disabled') {
      return reply.code(403).send({
        error: 'Account suspended',
        code: 'USER_DISABLED',
      });
    }

    if (user.status === 'deleted') {
      return reply.code(404).send({
        error: 'No account found with this email',
        code: 'USER_NOT_FOUND',
      });
    }

    return {
      userId: user.id,
      email: user.email,
      requiresPassword: true,
      status: user.status,
    };
  });

  // Step 2: Password Verification
  fastify.post('/login/complete', async (request, reply) => {
    const body = LoginCompleteSchema.parse(request.body);

    const user = await db.query.users.findFirst({
      where: eq(users.id, body.userId),
    });

    if (!user) {
      return reply.code(404).send({
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    // Verify password
    const isValid = await verifyPassword(body.password, user.passwordHash);
    
    if (!isValid) {
      return reply.code(401).send({
        error: 'Incorrect password',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Generate JWT and set cookie
    const jwt = await sign({
      sub: user.id,
      email: user.email,
      name: user.name,
    });
    
    reply.setCookie(env.AUTH_COOKIE_NAME, jwt, cookieOpts);

    return {
      user: sanitizeUser(user),
      needsDataSharingConsent: user.dataSharingConsent === null,
    };
  });

  /**
   * USER PREFERENCES
   */

  // Update user preferences (requires auth)
  fastify.post('/update-preferences', {
    preHandler: async (request: FastifyRequest & { userId?: string }, reply: FastifyReply) => {
      // Simple auth check - extract user from cookie
      const token = request.cookies?.[env.AUTH_COOKIE_NAME];
      
      if (!token) {
        return reply.code(401).send({
          error: 'Unauthorized',
          code: 'UNAUTHORIZED',
        });
      }

      // Attach userId to request for handler
      try {
        const { verify } = await import('../services/auth/jwt.js');
        const payload = await verify<{ sub: string }>(token);
        request.userId = payload.sub;
      } catch {
        clearSessionCookie(reply);
        return reply.code(401).send({
          error: 'Invalid session',
          code: 'UNAUTHORIZED',
        });
      }
    },
  }, async (request: FastifyRequest & { userId?: string }, _reply) => {
    const body = UpdatePreferencesSchema.parse(request.body);
    const userId = request.userId as string;

    const updates: Partial<User> = {
      updatedAt: new Date(),
    };

    if (body.dataSharingConsent !== undefined) {
      updates.dataSharingConsent = body.dataSharingConsent;
    }

    if (body.hasSeenBetaWelcome !== undefined) {
      updates.hasSeenBetaWelcome = body.hasSeenBetaWelcome;
    }

    await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId));

    return { ok: true };
  });
}

