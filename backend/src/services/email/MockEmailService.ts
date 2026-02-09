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
    
    // Extract verification code from text if present (supports both EN and TR templates)
    const codeMatch = message.text?.match(/(?:verification code is|kodu kullanın):\s*(\d{6})/);
    // Also try standalone 6-digit code on its own line (TR template format)
    const standaloneMatch = !codeMatch ? message.text?.match(/^\s+(\d{6})\s*$/m) : null;
    const foundCode = codeMatch?.[1] ?? standaloneMatch?.[1];
    if (foundCode) {
      console.log(`\n  ⚠️  VERIFICATION CODE: ${foundCode}\n`);
    }

    return {
      success: true,
      messageId: `mock-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    };
  }
}

