/**
 * Mock Email Service
 * Used for development and testing - logs emails to console instead of sending
 */

import { BaseEmailService, EmailMessage } from './EmailService.js';

export class MockEmailService extends BaseEmailService {
  async sendEmail(message: EmailMessage): Promise<{ success: boolean; messageId?: string }> {
    console.log('[MockEmailService] Email would be sent:');
    console.log(`  To: ${message.to}`);
    console.log(`  Subject: ${message.subject}`);
    
    if (message.text) {
      console.log(`  Text:\n${message.text}`);
    }
    
    // Extract verification code from text if present
    const codeMatch = message.text?.match(/verification code is: (\d{6})/);
    if (codeMatch) {
      console.log(`\n  ⚠️  VERIFICATION CODE: ${codeMatch[1]}\n`);
    }

    return {
      success: true,
      messageId: `mock-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    };
  }
}

