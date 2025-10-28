/**
 * Session Configuration
 * 
 * This module provides session configuration for HTTPOnly cookie-based sessions.
 * Part of Phase 1: Data Layer & Sessions (Scaffold)
 * 
 * @module server/session/config
 */

export const SESSION_CONFIG = {
  /**
   * Feature flag: Enable server-only session storage
   * When false, keeps current localStorage behavior (deprecated)
   * When true, uses HTTPOnly cookies (secure)
   */
  SERVER_ONLY: process.env.SESSION_SERVER_ONLY === 'true',

  /**
   * Session cookie name
   */
  COOKIE_NAME: 'akis_session',

  /**
   * Session expiry (30 days in seconds)
   */
  MAX_AGE: 30 * 24 * 60 * 60, // 30 days

  /**
   * Cookie options for security
   */
  COOKIE_OPTIONS: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    // NOTE: Phase-2 will enforce CSRF token on all state-changing POSTs.
  },

  /**
   * Session secret for signing (from env or auto-generate)
   */
  SECRET: process.env.SESSION_SECRET || 'fallback-dev-secret-change-in-production',

  /**
   * Deprecation warning flag
   */
  WARN_LOCALSTORAGE: !process.env.SESSION_SERVER_ONLY && process.env.NODE_ENV === 'production',
} as const;

/**
 * Log deprecation warning if SESSION_SERVER_ONLY is false in production
 */
if (SESSION_CONFIG.WARN_LOCALSTORAGE) {
  console.warn(
    '[DEPRECATED] localStorage sessions are deprecated. ' +
    'Set SESSION_SERVER_ONLY=true to enable HTTPOnly cookie sessions.'
  );
}

