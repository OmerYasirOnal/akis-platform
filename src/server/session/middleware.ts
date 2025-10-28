/**
 * Session Middleware
 * 
 * Provides HTTPOnly cookie-based session management.
 * Part of Phase 1: Data Layer & Sessions (Scaffold)
 * 
 * @module server/session/middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { SESSION_CONFIG } from './config';
import { randomBytes } from 'crypto';

export interface SessionData {
  userId: string;
  provider: 'github';
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  scopes: string[];
  createdAt: Date;
  expiresAt: Date;
  lastAccessedAt: Date;
}

/**
 * In-memory session store (POC - will be replaced with DB in production)
 * Key: session ID, Value: session data
 */
const sessionStore = new Map<string, SessionData>();

/**
 * Generate a secure session ID
 */
export function generateSessionId(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Create a new session
 */
export async function createSession(data: Omit<SessionData, 'createdAt' | 'expiresAt' | 'lastAccessedAt'>): Promise<string> {
  const sessionId = generateSessionId();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_CONFIG.MAX_AGE * 1000);

  const sessionData: SessionData = {
    ...data,
    createdAt: now,
    expiresAt,
    lastAccessedAt: now,
  };

  sessionStore.set(sessionId, sessionData);

  // TODO: Phase 2 - Store in database instead of memory
  // await prisma.session.create({
  //   data: {
  //     id: sessionId,
  //     userId: data.userId,
  //     provider: data.provider,
  //     accessToken: encryptToken(data.accessToken),
  //     refreshToken: data.refreshToken ? encryptToken(data.refreshToken) : null,
  //     tokenExpiresAt: data.tokenExpiresAt,
  //     scopes: data.scopes,
  //     expiresAt,
  //   },
  // });

  return sessionId;
}

/**
 * Get session by ID
 */
export async function getSession(sessionId: string): Promise<SessionData | null> {
  const session = sessionStore.get(sessionId);
  
  if (!session) {
    return null;
  }

  // Check if expired
  if (new Date() > session.expiresAt) {
    sessionStore.delete(sessionId);
    return null;
  }

  // Update last accessed time
  session.lastAccessedAt = new Date();

  // TODO: Phase 2 - Fetch from database
  // const session = await prisma.session.findUnique({
  //   where: { id: sessionId },
  //   include: { user: true },
  // });
  //
  // if (!session || new Date() > session.expiresAt) {
  //   return null;
  // }
  //
  // await prisma.session.update({
  //   where: { id: sessionId },
  //   data: { lastAccessedAt: new Date() },
  // });
  //
  // return {
  //   ...session,
  //   accessToken: decryptToken(session.accessToken),
  //   refreshToken: session.refreshToken ? decryptToken(session.refreshToken) : undefined,
  // };

  return session;
}

/**
 * Delete session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  sessionStore.delete(sessionId);

  // TODO: Phase 2 - Delete from database
  // await prisma.session.delete({
  //   where: { id: sessionId },
  // });
}

/**
 * Set session cookie in response
 */
export function setSessionCookie(response: NextResponse, sessionId: string): NextResponse {
  response.cookies.set({
    name: SESSION_CONFIG.COOKIE_NAME,
    value: sessionId,
    ...SESSION_CONFIG.COOKIE_OPTIONS,
    maxAge: SESSION_CONFIG.MAX_AGE,
  });

  return response;
}

/**
 * Clear session cookie
 */
export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.delete(SESSION_CONFIG.COOKIE_NAME);
  return response;
}

/**
 * Get session from request
 */
export async function getSessionFromRequest(request: NextRequest): Promise<SessionData | null> {
  if (!SESSION_CONFIG.SERVER_ONLY) {
    // Feature flag is off - skip session middleware
    return null;
  }

  const sessionId = request.cookies.get(SESSION_CONFIG.COOKIE_NAME)?.value;
  
  if (!sessionId) {
    return null;
  }

  return getSession(sessionId);
}

/**
 * Session middleware for API routes
 * 
 * Usage:
 * ```typescript
 * export async function GET(req: NextRequest) {
 *   const session = await requireSession(req);
 *   if (!session) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *   }
 *   // ... use session
 * }
 * ```
 */
export async function requireSession(request: NextRequest): Promise<SessionData | null> {
  return getSessionFromRequest(request);
}

/**
 * Cleanup expired sessions (run periodically)
 */
export function cleanupExpiredSessions(): void {
  const now = new Date();
  
  for (const [sessionId, session] of sessionStore.entries()) {
    if (now > session.expiresAt) {
      sessionStore.delete(sessionId);
    }
  }

  // TODO: Phase 2 - Cleanup in database
  // await prisma.session.deleteMany({
  //   where: {
  //     expiresAt: { lt: new Date() },
  //   },
  // });
}

// Run cleanup every hour
if (typeof window === 'undefined') {
  setInterval(cleanupExpiredSessions, 60 * 60 * 1000);
}

