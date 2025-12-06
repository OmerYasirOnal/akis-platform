/**
 * Email Service Interface
 * Abstraction for sending emails via different providers
 */

export interface EmailMessage {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface EmailServiceConfig {
  provider: 'mock' | 'resend';
  apiKey?: string;
  fromEmail?: string;
}

export interface EmailService {
  sendEmail(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }>;
  sendVerificationCode(to: string, code: string, name?: string): Promise<void>;
}

export abstract class BaseEmailService implements EmailService {
  abstract sendEmail(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }>;

  async sendVerificationCode(to: string, code: string, name?: string): Promise<void> {
    const greeting = name ? `Hi ${name},` : 'Hello,';
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0A1215; color: #07D1AF; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #fff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px; }
            .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #07D1AF; text-align: center; padding: 20px; background: #f5f5f5; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>AKIS Platform</h1>
            </div>
            <div class="content">
              <p>${greeting}</p>
              <p>Thank you for signing up for AKIS Platform. To complete your registration, please verify your email address using the code below:</p>
              <div class="code">${code}</div>
              <p>This code will expire in <strong>15 minutes</strong>.</p>
              <p>If you didn't request this code, please ignore this email.</p>
              <p>Best regards,<br>The AKIS Team</p>
            </div>
            <div class="footer">
              <p>© 2025 AKIS Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
${greeting}

Thank you for signing up for AKIS Platform.

Your verification code is: ${code}

This code will expire in 15 minutes.

If you didn't request this code, please ignore this email.

Best regards,
The AKIS Team

© 2025 AKIS Platform
    `.trim();

    const result = await this.sendEmail({
      to,
      subject: 'Verify your email for AKIS Platform',
      text,
      html,
    });

    if (!result.success) {
      throw new Error(`Failed to send verification email: ${result.error || 'Unknown error'}`);
    }
  }
}

