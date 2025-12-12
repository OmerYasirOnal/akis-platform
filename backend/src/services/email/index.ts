/**
 * Email Service Factory
 * Creates appropriate email service based on configuration
 */

import { EmailService } from './EmailService.js';
import { MockEmailService } from './MockEmailService.js';
import { ResendEmailService } from './ResendEmailService.js';

export * from './EmailService.js';
export * from './MockEmailService.js';
export * from './ResendEmailService.js';

export interface EmailServiceFactoryConfig {
  provider: 'mock' | 'resend';
  apiKey?: string;
  fromEmail?: string;
}

export function createEmailService(config: EmailServiceFactoryConfig): EmailService {
  // Always use mock in test environment
  if (process.env.NODE_ENV === 'test') {
    console.log('[EmailService] Using MockEmailService (test environment)');
    return new MockEmailService();
  }

  // Use mock if explicitly requested
  if (config.provider === 'mock') {
    console.log('[EmailService] Using MockEmailService (configured)');
    return new MockEmailService();
  }

  // Use Resend for production
  if (config.provider === 'resend') {
    if (!config.apiKey || !config.fromEmail) {
      throw new Error(
        'EMAIL_PROVIDER is set to "resend" but RESEND_API_KEY or RESEND_FROM_EMAIL is missing. ' +
        'Please set these environment variables or use EMAIL_PROVIDER=mock for development.'
      );
    }

    console.log('[EmailService] Using ResendEmailService');
    return new ResendEmailService({
      apiKey: config.apiKey,
      fromEmail: config.fromEmail,
    });
  }

  throw new Error(`Unknown email provider: ${config.provider}`);
}

