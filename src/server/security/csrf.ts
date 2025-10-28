/**
 * CSRF Token Management
 * 
 * Implements anti-CSRF token generation and validation.
 * Part of Phase 2: Security Hardening (Gate-B requirement)
 * 
 * @module server/security/csrf
 */

import { randomBytes, createHmac } from 'crypto';

const CSRF_SECRET = process.env.SESSION_SECRET || 'fallback-dev-secret-change-in-production';

/**
 * Generate a CSRF token tied to a session ID
 * 
 * Format: timestamp:signature
 * Signature = HMAC-SHA256(sessionId + timestamp, CSRF_SECRET)
 */
export function generateCSRFToken(sessionId: string): string {
  const timestamp = Date.now().toString();
  const signature = createHmac('sha256', CSRF_SECRET)
    .update(`${sessionId}:${timestamp}`)
    .digest('base64url');
  
  return `${timestamp}:${signature}`;
}

/**
 * Validate a CSRF token against a session ID
 * 
 * @param sessionId - Session ID from cookie
 * @param token - CSRF token from header/body
 * @param maxAgeMs - Maximum token age in milliseconds (default: 1 hour)
 * @returns true if valid, false otherwise
 */
export function validateCSRFToken(
  sessionId: string,
  token: string,
  maxAgeMs: number = 60 * 60 * 1000 // 1 hour
): boolean {
  try {
    const [timestamp, signature] = token.split(':');
    
    if (!timestamp || !signature) {
      return false;
    }
    
    // Check token age
    const tokenTime = parseInt(timestamp, 10);
    const now = Date.now();
    
    if (isNaN(tokenTime) || now - tokenTime > maxAgeMs) {
      return false;
    }
    
    // Verify signature
    const expectedSignature = createHmac('sha256', CSRF_SECRET)
      .update(`${sessionId}:${timestamp}`)
      .digest('base64url');
    
    return signature === expectedSignature;
  } catch {
    return false;
  }
}

/**
 * Generate a CSRF token for use in forms/AJAX
 * Returns both token and meta for embedding
 */
export function generateCSRFTokenPair(sessionId: string): {
  token: string;
  headerName: string;
  expiresAt: Date;
} {
  const token = generateCSRFToken(sessionId);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  
  return {
    token,
    headerName: 'X-CSRF-Token',
    expiresAt,
  };
}
