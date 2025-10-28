/**
 * CSRF Token Endpoint
 * 
 * Returns CSRF token for current session.
 * Part of Phase 2: Security Hardening (Gate-B requirement)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCSRFToken } from '@/server/middleware/csrf';

export async function GET(req: NextRequest) {
  const csrfData = getCSRFToken(req);
  
  if (!csrfData) {
    return NextResponse.json(
      { error: 'No session found' },
      { status: 401 }
    );
  }
  
  return NextResponse.json({
    csrfToken: csrfData.token,
    headerName: csrfData.headerName,
    expiresAt: csrfData.expiresAt.toISOString(),
  });
}

