/**
 * CSRF Validation Middleware
 * 
 * Validates CSRF tokens on state-changing requests.
 * Part of Phase 2: Security Hardening (Gate-B requirement)
 * 
 * @module server/middleware/csrf
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateCSRFToken, generateCSRFTokenPair } from '@/server/security/csrf';
import { SESSION_CONFIG } from '@/server/session/config';

/**
 * Validate CSRF token for state-changing requests
 * 
 * @param request - Next.js request
 * @returns NextResponse with error if invalid, null if valid
 */
export async function validateCSRF(request: NextRequest): Promise<NextResponse | null> {
  // Only validate state-changing methods
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    return null; // GET/HEAD/OPTIONS don't need CSRF
  }
  
  // Skip CSRF for webhooks (they use webhook secret)
  if (request.nextUrl.pathname.includes('/webhooks')) {
    return null;
  }
  
  // Get session ID from cookie
  const sessionId = request.cookies.get(SESSION_CONFIG.COOKIE_NAME)?.value;
  
  if (!sessionId) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'No session found' },
      { status: 401 }
    );
  }
  
  // Get CSRF token from header or body
  const csrfToken =
    request.headers.get('X-CSRF-Token') ||
    request.headers.get('x-csrf-token');
  
  if (!csrfToken) {
    return NextResponse.json(
      {
        error: 'CSRF token required',
        message: 'X-CSRF-Token header is required for state-changing requests',
      },
      { status: 403 }
    );
  }
  
  // Validate token
  if (!validateCSRFToken(sessionId, csrfToken)) {
    return NextResponse.json(
      {
        error: 'Invalid CSRF token',
        message: 'CSRF token is invalid or expired',
      },
      { status: 403 }
    );
  }
  
  return null; // Valid
}

/**
 * Get CSRF token for current session
 * 
 * @param request - Next.js request
 * @returns CSRF token pair or null if no session
 */
export function getCSRFToken(request: NextRequest): {
  token: string;
  headerName: string;
  expiresAt: Date;
} | null {
  const sessionId = request.cookies.get(SESSION_CONFIG.COOKIE_NAME)?.value;
  
  if (!sessionId) {
    return null;
  }
  
  return generateCSRFTokenPair(sessionId);
}

