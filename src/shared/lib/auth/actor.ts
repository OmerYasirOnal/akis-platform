import "server-only";

/**
 * Actor Context System
 * 
 * Enables AKIS Scribe Agent to run headlessly under GitHub App (no OAuth user required)
 * while preserving attribution and observability.
 * 
 * Feature Flag: SCRIBE_ALLOW_APP_BOT_FALLBACK (default: true)
 */

import { logger } from "@/shared/lib/utils/logger";

export type ActorMode = "oauth_user" | "app_bot" | "service_account";

export interface Actor {
  /**
   * Authentication mode used
   */
  mode: ActorMode;
  
  /**
   * Platform user ID (if oauth_user mode)
   */
  userId?: string;
  
  /**
   * GitHub login for attribution (best-effort)
   */
  githubLogin?: string;
  
  /**
   * GitHub App installation ID (if app_bot mode)
   */
  installationId?: number;
  
  /**
   * Correlation ID for request tracking
   */
  correlationId?: string;
}

export interface ActorResolveOptions {
  /**
   * OAuth user token (from session/cookie)
   */
  userToken?: string;
  
  /**
   * User ID from platform database
   */
  userId?: string;
  
  /**
   * GitHub login (from OAuth user info)
   */
  githubLogin?: string;
  
  /**
   * GitHub App installation ID (from environment or session)
   */
  installationId?: number;
  
  /**
   * Correlation ID for logging
   */
  correlationId?: string;
}

/**
 * Check if app_bot fallback is enabled
 * Can be disabled via SCRIBE_ALLOW_APP_BOT_FALLBACK=false for rollback
 */
export function isAppBotFallbackEnabled(): boolean {
  return process.env.SCRIBE_ALLOW_APP_BOT_FALLBACK !== 'false';
}

/**
 * Resolve Actor with intelligent fallback
 * 
 * Priority:
 * 1. OAuth user (if available) → oauth_user mode
 * 2. GitHub App installation (if available and fallback enabled) → app_bot mode
 * 3. Fail (if no auth available or fallback disabled)
 * 
 * @throws Error if no authentication is available and app_bot fallback is disabled
 */
export function resolveActorOrFallback(options: ActorResolveOptions = {}): Actor {
  const correlationId = options.correlationId || Math.random().toString(36).substring(7);
  
  // Priority 1: OAuth User
  if (options.userToken && options.userId) {
    logger.info('Actor', `[${correlationId}] Resolved as oauth_user: ${options.githubLogin || options.userId}`);
    return {
      mode: "oauth_user",
      userId: options.userId,
      githubLogin: options.githubLogin,
      installationId: options.installationId,
      correlationId,
    };
  }
  
  // Priority 2: App Bot (if fallback enabled)
  if (options.installationId && isAppBotFallbackEnabled()) {
    logger.info('Actor', `[${correlationId}] Resolved as app_bot (installation: ${options.installationId})`);
    return {
      mode: "app_bot",
      installationId: options.installationId,
      githubLogin: 'akis-app[bot]', // GitHub App bot identity
      correlationId,
    };
  }
  
  // Priority 3: Fallback from environment
  const envInstallationId = process.env.GITHUB_APP_INSTALLATION_ID;
  if (envInstallationId && isAppBotFallbackEnabled()) {
    const installationId = parseInt(envInstallationId, 10);
    logger.info('Actor', `[${correlationId}] Resolved as app_bot from env (installation: ${installationId})`);
    return {
      mode: "app_bot",
      installationId,
      githubLogin: 'akis-app[bot]',
      correlationId,
    };
  }
  
  // No authentication available
  if (!isAppBotFallbackEnabled()) {
    logger.error('Actor', `[${correlationId}] ❌ No OAuth user and app_bot fallback disabled (SCRIBE_ALLOW_APP_BOT_FALLBACK=false)`);
    throw new Error('Authentication required. OAuth user not found and app_bot fallback is disabled.');
  }
  
  logger.error('Actor', `[${correlationId}] ❌ No authentication available: no OAuth user, no GitHub App installation, no env fallback`);
  throw new Error('Authentication required. Please connect your GitHub account or install AKIS GitHub App.');
}

/**
 * Get commit author info based on actor mode
 * Returns author name and email for git commits
 */
export function getCommitAuthor(actor: Actor): { name: string; email: string } {
  switch (actor.mode) {
    case "oauth_user":
      return {
        name: actor.githubLogin || 'AKIS User',
        email: actor.githubLogin 
          ? `${actor.githubLogin}@users.noreply.github.com`
          : 'noreply@akis.dev',
      };
    
    case "app_bot":
      return {
        name: 'AKIS Scribe Agent',
        email: 'akis-scribe[bot]@users.noreply.github.com',
      };
    
    case "service_account":
      return {
        name: 'AKIS Service',
        email: 'service@akis.dev',
      };
  }
}

/**
 * Get banner message for UI based on actor mode
 */
export function getActorBanner(actor: Actor): { text: string; type: 'info' | 'warning' | 'success' } | null {
  if (actor.mode === "app_bot") {
    return {
      text: `🤖 Running as AKIS App bot (installation ${actor.installationId})`,
      type: 'info',
    };
  }
  
  return null;
}

/**
 * Check if actor requires OAuth user
 * Some flows (e.g., user preferences) require OAuth user
 */
export function requiresOAuthUser(actor: Actor): boolean {
  return actor.mode !== "oauth_user";
}

/**
 * Create actionable error for OAuth-required flows
 */
export function createOAuthRequiredError(correlationId?: string): {
  code: string;
  message: string;
  action: string;
  ctaText: string;
} {
  return {
    code: 'oauth_required',
    message: 'This action requires you to connect your GitHub account.',
    action: 'connect_github',
    ctaText: 'Connect GitHub',
  };
}

