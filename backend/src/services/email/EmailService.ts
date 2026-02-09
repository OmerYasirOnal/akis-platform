/**
 * Email Service Interface
 * Abstraction for sending emails via different providers
 */

import {
  verificationCodeHtml,
  verificationCodeText,
  welcomeHtml,
  welcomeText,
} from './templates.js';

export interface EmailMessage {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface EmailServiceConfig {
  provider: 'mock' | 'resend' | 'smtp';
  apiKey?: string;
  fromEmail?: string;
}

export interface EmailService {
  sendEmail(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }>;
  sendVerificationCode(to: string, code: string, name?: string): Promise<void>;
  sendWelcomeEmail(to: string, name?: string, loginUrl?: string): Promise<void>;
}

export abstract class BaseEmailService implements EmailService {
  /** Override in subclass to inject PUBLIC_LOGO_URL */
  protected logoUrl?: string;
  /** Override in subclass to set TTL shown in email copy */
  protected ttlMinutes = 15;

  abstract sendEmail(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }>;

  async sendVerificationCode(to: string, code: string, name?: string): Promise<void> {
    const templateParams = {
      code,
      name,
      ttlMinutes: this.ttlMinutes,
      logoUrl: this.logoUrl,
    };

    const result = await this.sendEmail({
      to,
      subject: 'AKIS Platform — E-posta Doğrulama Kodu',
      text: verificationCodeText(templateParams),
      html: verificationCodeHtml(templateParams),
    });

    if (!result.success) {
      throw new Error(`Failed to send verification email: ${result.error || 'Unknown error'}`);
    }
  }

  async sendWelcomeEmail(to: string, name?: string, loginUrl?: string): Promise<void> {
    const templateParams = { name, loginUrl, logoUrl: this.logoUrl };

    const result = await this.sendEmail({
      to,
      subject: 'AKIS Platform — Hoş Geldiniz!',
      text: welcomeText(templateParams),
      html: welcomeHtml(templateParams),
    });

    if (!result.success) {
      throw new Error(`Failed to send welcome email: ${result.error || 'Unknown error'}`);
    }
  }
}

