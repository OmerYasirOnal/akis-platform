/**
 * Invite Service
 * Handles creation, validation, and acceptance of user invitations.
 * Admin-only: invite tokens are 64-char hex, expire after 7 days.
 */

import { randomBytes } from 'node:crypto';
import { db } from '../../db/client.js';
import { inviteTokens, users } from '../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import type { EmailService } from '../email/EmailService.js';
import { inviteHtml, inviteText } from '../email/templates.js';

export interface InviteCreateResult {
  inviteId: string;
  token: string;
  email: string;
  expiresAt: Date;
}

export interface InviteValidateResult {
  valid: boolean;
  email?: string;
  inviterName?: string;
  expiresAt?: Date;
  /** If the email already has an account */
  existingUser?: boolean;
}

export class InviteService {
  private readonly emailService: EmailService;
  private readonly expiryDays: number;
  private readonly publicUrl: string;
  private readonly logoUrl?: string;

  constructor(
    emailService: EmailService,
    opts: {
      expiryDays?: number;
      publicUrl: string;
      logoUrl?: string;
    },
  ) {
    this.emailService = emailService;
    this.expiryDays = opts.expiryDays ?? 7;
    this.publicUrl = opts.publicUrl;
    this.logoUrl = opts.logoUrl;
  }

  /**
   * Generate a cryptographically secure 64-char hex token
   */
  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Create a new invitation and send the invite email.
   * @param invitedByUserId  Admin user creating the invite
   * @param email            Recipient email address
   * @returns Invite metadata
   */
  async createInvite(invitedByUserId: string, email: string): Promise<InviteCreateResult> {
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already has an active account
    const existingUser = await db.query.users.findFirst({
      where: and(eq(users.email, normalizedEmail)),
    });

    if (existingUser && existingUser.status === 'active') {
      throw new Error('EMAIL_ALREADY_ACTIVE');
    }

    // Check for existing pending invite to same email
    const existingInvite = await db.query.inviteTokens.findFirst({
      where: and(
        eq(inviteTokens.email, normalizedEmail),
        eq(inviteTokens.status, 'pending'),
      ),
    });

    if (existingInvite) {
      // Revoke old invite before creating new one
      await db
        .update(inviteTokens)
        .set({ status: 'revoked' })
        .where(eq(inviteTokens.id, existingInvite.id));
    }

    // Get inviter name for the email
    const inviter = await db.query.users.findFirst({
      where: eq(users.id, invitedByUserId),
    });

    const inviterName = inviter?.name ?? 'AKIS Admin';

    // Create invite token
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + this.expiryDays * 24 * 60 * 60 * 1000);

    const [invite] = await db
      .insert(inviteTokens)
      .values({
        token,
        email: normalizedEmail,
        invitedBy: invitedByUserId,
        status: 'pending',
        expiresAt,
      })
      .returning();

    // Build invite URL
    const inviteUrl = `${this.publicUrl}/auth/invite/${token}`;

    // Send email
    await this.emailService.sendEmail({
      to: normalizedEmail,
      subject: 'AKIS Platform — Davet',
      html: inviteHtml({
        inviterName,
        recipientEmail: normalizedEmail,
        inviteUrl,
        logoUrl: this.logoUrl,
      }),
      text: inviteText({
        inviterName,
        recipientEmail: normalizedEmail,
        inviteUrl,
      }),
    });

    return {
      inviteId: invite.id,
      token: invite.token,
      email: invite.email,
      expiresAt: invite.expiresAt,
    };
  }

  /**
   * Validate an invite token without consuming it.
   */
  async validateToken(token: string): Promise<InviteValidateResult> {
    const invite = await db.query.inviteTokens.findFirst({
      where: eq(inviteTokens.token, token),
    });

    if (!invite) {
      return { valid: false };
    }

    if (invite.status !== 'pending') {
      return { valid: false };
    }

    if (new Date() > invite.expiresAt) {
      // Auto-expire
      await db
        .update(inviteTokens)
        .set({ status: 'expired' })
        .where(eq(inviteTokens.id, invite.id));
      return { valid: false };
    }

    // Get inviter name
    const inviter = await db.query.users.findFirst({
      where: eq(users.id, invite.invitedBy),
    });

    // Check if email already has an account
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, invite.email),
    });

    return {
      valid: true,
      email: invite.email,
      inviterName: inviter?.name ?? 'AKIS Admin',
      expiresAt: invite.expiresAt,
      existingUser: !!existingUser && existingUser.status === 'active',
    };
  }

  /**
   * Accept an invite — mark token as used and link to user.
   */
  async acceptInvite(token: string, userId: string): Promise<boolean> {
    const invite = await db.query.inviteTokens.findFirst({
      where: and(
        eq(inviteTokens.token, token),
        eq(inviteTokens.status, 'pending'),
      ),
    });

    if (!invite || new Date() > invite.expiresAt) {
      return false;
    }

    await db
      .update(inviteTokens)
      .set({
        status: 'accepted',
        acceptedBy: userId,
        acceptedAt: new Date(),
      })
      .where(eq(inviteTokens.id, invite.id));

    return true;
  }
}
