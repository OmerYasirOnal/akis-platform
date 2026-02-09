/**
 * SMTP Email Service
 *
 * Production-ready email sending via any SMTP relay (Gmail, Mailgun, SES, etc.).
 * Uses nodemailer under the hood.
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport/index.js';
import { BaseEmailService, type EmailMessage } from './EmailService.js';

export interface SmtpEmailConfig {
  host: string;
  port: number;
  secure: boolean;       // true for 465, false for 587/25
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
}

export class SmtpEmailService extends BaseEmailService {
  private readonly transporter: Transporter<SMTPTransport.SentMessageInfo>;
  private readonly from: string;
  private readonly replyTo: string | undefined;

  constructor(config: SmtpEmailConfig) {
    super();

    this.from = `"${config.fromName}" <${config.fromEmail}>`;
    this.replyTo = config.replyTo;

    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
      // Sensible timeouts for OCI Free Tier
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 30_000,
    });
  }

  /**
   * Verify SMTP connection is alive.
   * Safe to call at startup; never throws (returns boolean).
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (err) {
      console.error('[SmtpEmailService] SMTP connection verification failed:', err);
      return false;
    }
  }

  async sendEmail(
    message: EmailMessage,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to: message.to,
        replyTo: this.replyTo,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });

      console.log('[SmtpEmailService] Email sent:', info.messageId);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error('[SmtpEmailService] Failed to send email:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown SMTP error',
      };
    }
  }
}

/**
 * Check whether SMTP env vars are fully configured.
 * Never throws — safe for readiness probes.
 */
export function isSmtpConfigured(): boolean {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM_EMAIL } = process.env;
  return !!(SMTP_HOST && SMTP_USER && SMTP_PASS && SMTP_FROM_EMAIL);
}
