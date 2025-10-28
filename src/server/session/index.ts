/**
 * Session Management Module
 * 
 * Exports session functionality for HTTPOnly cookie-based sessions.
 * Part of Phase 1: Data Layer & Sessions (Scaffold)
 * 
 * @module server/session
 */

export { SESSION_CONFIG } from './config';
export {
  createSession,
  getSession,
  deleteSession,
  setSessionCookie,
  clearSessionCookie,
  getSessionFromRequest,
  requireSession,
  generateSessionId,
  cleanupExpiredSessions,
  type SessionData,
} from './middleware';

