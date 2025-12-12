/**
 * Email Verification Service
 * Handles generation, storage, and validation of email verification codes
 */

import { db } from '../../db/client.js';
import { emailVerificationTokens, users } from '../../db/schema.js';
import { eq, and, gte, lt, isNull } from 'drizzle-orm';
import type { EmailService } from '../email/EmailService.js';

export interface VerificationCodeOptions {
  ttlMinutes?: number;
}

export class VerificationService {
  private readonly emailService: EmailService;
  private readonly ttlMinutes: number;

  constructor(emailService: EmailService, options: VerificationCodeOptions = {}) {
    this.emailService = emailService;
    this.ttlMinutes = options.ttlMinutes || 15;
  }

  /**
   * Generate a random 6-digit code
   */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Create and send a new verification code for a user
   * @throws Error if rate limit exceeded or email service fails
   */
  async sendVerificationCode(userId: string, email: string, name?: string): Promise<void> {
    // Check rate limit: max 3 unused codes in last 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    
    const recentTokens = await db.query.emailVerificationTokens.findMany({
      where: and(
        eq(emailVerificationTokens.userId, userId),
        gte(emailVerificationTokens.createdAt, fifteenMinutesAgo),
        isNull(emailVerificationTokens.usedAt)
      ),
    });

    if (recentTokens.length >= 3) {
      throw new Error('TOO_MANY_ATTEMPTS');
    }

    // Generate new code
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + this.ttlMinutes * 60 * 1000);

    // Store in database
    await db.insert(emailVerificationTokens).values({
      userId,
      email: email.toLowerCase(),
      code,
      expiresAt,
    });

    // Send email
    await this.emailService.sendVerificationCode(email, code, name);
  }

  /**
   * Verify a code for a user
   * @returns userId if valid, null if invalid/expired
   * @throws Error if too many invalid attempts
   */
  async verifyCode(userId: string, code: string): Promise<boolean> {
    // Find the most recent unused token for this user with this code
    const token = await db.query.emailVerificationTokens.findFirst({
      where: and(
        eq(emailVerificationTokens.userId, userId),
        eq(emailVerificationTokens.code, code),
        isNull(emailVerificationTokens.usedAt)
      ),
      orderBy: (tokens, { desc }) => [desc(tokens.createdAt)],
    });

    if (!token) {
      return false;
    }

    // Check if expired
    if (new Date() > token.expiresAt) {
      return false;
    }

    // Mark as used
    await db
      .update(emailVerificationTokens)
      .set({ usedAt: new Date() })
      .where(eq(emailVerificationTokens.id, token.id));

    // Update user status
    await db
      .update(users)
      .set({
        emailVerified: true,
        status: 'active',
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return true;
  }

  /**
   * Clean up expired tokens (can be run periodically)
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await db
      .delete(emailVerificationTokens)
      .where(
        lt(emailVerificationTokens.expiresAt, new Date())
      )
      .returning();

    return result.length;
  }
}

