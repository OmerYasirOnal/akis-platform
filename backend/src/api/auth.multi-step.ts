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
import { sendError } from '../utils/errorHandler.js';

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
  const isDevMode = process.env.DEV_MODE === 'true';
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
      return sendError(reply, request, 'EMAIL_IN_USE', 'Email already registered');
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
      console.error('[Auth] Failed to send verification email:', error);

      if (error instanceof Error && error.message === 'TOO_MANY_ATTEMPTS') {
        return sendError(reply, request, 'RATE_LIMITED', 'Too many verification attempts. Please wait 15 minutes.');
      }

      // Roll back pending user so the email can be retried on next signup attempt.
      try {
        await db.delete(users).where(eq(users.id, created.id));
      } catch (cleanupError) {
        console.error('[Auth] Failed to rollback user after email delivery failure:', cleanupError);
      }

      return sendError(
        reply,
        request,
        'EMAIL_DELIVERY_FAILED',
        'Unable to send verification email. Please try again later.',
      );
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
      return sendError(reply, request, 'USER_NOT_FOUND', 'User not found');
    }

    if (user.status !== 'pending_verification') {
      return sendError(reply, request, 'ALREADY_VERIFIED', 'User already verified');
    }

    // Hash and store password
    const passwordHash = await hashPassword(body.password);
    
    if (isDevMode) {
      const [updatedUser] = await db
        .update(users)
        .set({
          passwordHash,
          status: 'active',
          emailVerified: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, body.userId))
        .returning();

      const resolvedUser = updatedUser ?? {
        ...user,
        passwordHash,
        status: 'active' as const,
        emailVerified: true,
      };

      const jwt = await sign({
        sub: resolvedUser.id,
        email: resolvedUser.email,
        name: resolvedUser.name,
      });
      reply.setCookie(env.AUTH_COOKIE_NAME, jwt, cookieOpts);

      return {
        ok: true,
        message: 'Password set successfully (DEV_MODE verification bypass)',
        verificationBypassed: true,
        user: sanitizeUser(resolvedUser),
        needsDataSharingConsent: resolvedUser.dataSharingConsent === null,
      };
    }

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
      verificationBypassed: false,
    };
  });

  // Step 3: Verify Email Code
  fastify.post('/verify-email', async (request, reply) => {
    const body = VerifyEmailSchema.parse(request.body);

    try {
      const isValid = await verificationService.verifyCode(body.userId, body.code);

      if (!isValid) {
        return sendError(reply, request, 'INVALID_CODE', 'Invalid or expired verification code');
      }

      // Get updated user
      const user = await db.query.users.findFirst({
        where: eq(users.id, body.userId),
      });

      if (!user) {
        return sendError(reply, request, 'USER_NOT_FOUND', 'User not found');
      }

      // Generate JWT and set cookie
      const jwt = await sign({
        sub: user.id,
        email: user.email,
        name: user.name,
      });

      reply.setCookie(env.AUTH_COOKIE_NAME, jwt, cookieOpts);

      // Send welcome email (fire-and-forget — don't block verification)
      emailService.sendWelcomeEmail(user.email, user.name ?? undefined).catch((err) => {
        console.error('[Auth] Failed to send welcome email:', err);
      });

      return {
        user: sanitizeUser(user),
        message: 'Email verified successfully',
      };
    } catch (error) {
      console.error('[Auth] Verification error:', error);
      return sendError(reply, request, 'INTERNAL_ERROR', 'Failed to verify email');
    }
  });

  // Resend verification code
  fastify.post('/resend-code', async (request, reply) => {
    const body = ResendCodeSchema.parse(request.body);

    const user = await db.query.users.findFirst({
      where: eq(users.id, body.userId),
    });

    if (!user) {
      return sendError(reply, request, 'USER_NOT_FOUND', 'User not found');
    }

    if (user.emailVerified) {
      return sendError(reply, request, 'ALREADY_VERIFIED', 'Email already verified');
    }

    try {
      await verificationService.sendVerificationCode(user.id, user.email, user.name);

      return {
        ok: true,
        message: 'Verification code resent',
      };
    } catch (error) {
      if (error instanceof Error && error.message === 'TOO_MANY_ATTEMPTS') {
        return sendError(reply, request, 'RATE_LIMITED', 'Too many attempts. Please wait 15 minutes.');
      }

      console.error('[Auth] Failed to resend code:', error);
      return sendError(reply, request, 'INTERNAL_ERROR', 'Failed to send verification code');
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
      return sendError(reply, request, 'USER_NOT_FOUND', 'No account found with this email');
    }

    if (user.status === 'pending_verification' || !user.emailVerified) {
      if (isDevMode && user.status !== 'disabled' && user.status !== 'deleted') {
        const [promotedUser] = await db
          .update(users)
          .set({
            status: 'active',
            emailVerified: true,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id))
          .returning();

        const resolvedUser = promotedUser ?? {
          ...user,
          status: 'active' as const,
          emailVerified: true,
        };

        return {
          userId: resolvedUser.id,
          email: resolvedUser.email,
          requiresPassword: true,
          status: resolvedUser.status,
        };
      }
      return sendError(reply, request, 'EMAIL_NOT_VERIFIED', 'Email not verified', { userId: user.id });
    }

    if (user.status === 'disabled') {
      return sendError(reply, request, 'USER_DISABLED', 'Account suspended');
    }

    if (user.status === 'deleted') {
      return sendError(reply, request, 'USER_NOT_FOUND', 'No account found with this email');
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
      return sendError(reply, request, 'USER_NOT_FOUND', 'User not found');
    }

    // Verify password
    const isValid = await verifyPassword(body.password, user.passwordHash);
    
    if (!isValid) {
      return sendError(reply, request, 'INVALID_CREDENTIALS', 'Incorrect password');
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
        return sendError(reply, request, 'UNAUTHORIZED', 'Authentication required');
      }

      // Attach userId to request for handler
      try {
        const { verify } = await import('../services/auth/jwt.js');
        const payload = await verify<{ sub: string }>(token);
        request.userId = payload.sub;
      } catch {
        clearSessionCookie(reply);
        return sendError(reply, request, 'UNAUTHORIZED', 'Invalid session');
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
