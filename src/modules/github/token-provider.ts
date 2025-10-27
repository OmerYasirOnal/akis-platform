import "server-only";

/**
 * Unified GitHub Token Provider
 * 
 * Priority:
 * 1. GitHub App Installation Token (server-side, short-lived, secure)
 * 2. OAuth User Token (dev-only fallback when ALLOW_OAUTH_FALLBACK=true)
 * 
 * Security:
 * - Tokens never exposed to client
 * - Auto-refresh before expiry
 * - Correlation IDs for observability
 * - Structured logging with redaction
 * - OAuth fallback DISABLED by default (safe-by-default)
 */

import { getCachedGitHubAppToken } from '@/lib/auth/github-app';
import { logger } from '@/lib/utils/logger';

export interface TokenProviderOptions {
  /**
   * Correlation ID for tracking requests
   */
  correlationId?: string;

  /**
   * Force OAuth usage (bypass GitHub App)
   * Only use for development/testing
   * @deprecated Use ALLOW_OAUTH_FALLBACK env instead
   */
  forceOAuth?: boolean;

  /**
   * User's OAuth token (from session/cookie)
   * Should only be passed from server-side session
   */
  userToken?: string;

  /**
   * Repository context (for logging)
   */
  repo?: {
    owner: string;
    name: string;
  };

  /**
   * Actor context (for structured logging)
   */
  actor?: {
    mode: 'oauth_user' | 'app_bot' | 'service_account';
    installationId?: number;
    githubLogin?: string;
  };
}

export interface TokenProviderResult {
  token: string;
  source: 'github_app' | 'oauth' | 'none';
  expiresAt?: Date;
}

export interface TokenProviderError {
  error: string;
  source: 'github_app' | 'oauth' | 'none';
  actionable: {
    type: 'install_app' | 'connect_oauth' | 'check_env';
    message: string;
    ctaText: string;
  };
}

/**
 * Check if OAuth fallback is allowed
 * Safe-by-default: only allowed in development when explicitly enabled
 */
function isOAuthFallbackAllowed(): boolean {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const explicitlyAllowed = process.env.ALLOW_OAUTH_FALLBACK === 'true';
  
  return isDevelopment && explicitlyAllowed;
}

/**
 * Get GitHub token with intelligent fallback
 * Server-side only - NEVER call from client
 */
export async function getGitHubToken(
  options: TokenProviderOptions = {}
): Promise<TokenProviderResult | TokenProviderError> {
  const correlationId = options.correlationId || Math.random().toString(36).substring(7);
  const repoInfo = options.repo ? `${options.repo.owner}/${options.repo.name}` : 'unknown';
  const actorInfo = options.actor 
    ? `actor=${options.actor.mode}${options.actor.installationId ? ` installation=${options.actor.installationId}` : ''}${options.actor.githubLogin ? ` user=${options.actor.githubLogin}` : ''}`
    : 'actor=unknown';

  logger.info('TokenProvider', `[${correlationId}] Getting token for ${repoInfo} (${actorInfo})`);

  // Priority 1: GitHub App Installation Token (preferred)
  if (!options.forceOAuth) {
    try {
      const appToken = await getCachedGitHubAppToken();
      
      if (appToken) {
        const installationId = options.actor?.installationId || process.env.GITHUB_APP_INSTALLATION_ID || 'unknown';
        logger.info('TokenProvider', `[${correlationId}] ✅ Using GitHub App token (installation: ${installationId})`);
        return {
          token: appToken,
          source: 'github_app',
          // Note: expiresAt is managed internally by getCachedGitHubAppToken
        };
      }

      logger.warn('TokenProvider', `[${correlationId}] ⚠️ GitHub App token unavailable (${actorInfo})`);
    } catch (error: any) {
      logger.error('TokenProvider', `[${correlationId}] ❌ GitHub App error: ${error.message}`);
    }
  }

  // Priority 2: OAuth User Token (guarded dev-only fallback)
  if (options.userToken && isOAuthFallbackAllowed()) {
    const userInfo = options.actor?.githubLogin ? `user=${options.actor.githubLogin}` : 'user=unknown';
    logger.warn(
      'TokenProvider', 
      `[${correlationId}] ⚠️ DEV MODE: Using OAuth fallback (${userInfo}, ALLOW_OAUTH_FALLBACK=true). Not recommended for production.`
    );
    return {
      token: options.userToken,
      source: 'oauth',
    };
  }

  // OAuth requested but not allowed
  if (options.userToken && !isOAuthFallbackAllowed()) {
    logger.error(
      'TokenProvider',
      `[${correlationId}] ❌ OAuth fallback DISABLED. Set ALLOW_OAUTH_FALLBACK=true in .env.local for dev mode.`
    );
  }

  // No token available - return actionable error
  logger.error('TokenProvider', `[${correlationId}] ❌ No auth credentials found (${actorInfo})`);

  // Determine which CTA to show
  const hasAppEnv = process.env.GITHUB_APP_ID && 
                    process.env.GITHUB_APP_INSTALLATION_ID && 
                    process.env.GITHUB_APP_PRIVATE_KEY_PEM;

  if (!hasAppEnv) {
    return {
      error: 'GitHub App not configured',
      source: 'github_app',
      actionable: {
        type: 'install_app',
        message: 'GitHub App credentials missing. Install AKIS GitHub App or configure environment variables.',
        ctaText: 'Install AKIS GitHub App',
      },
    };
  }

  // App is configured but token failed, suggest OAuth (if allowed)
  if (isOAuthFallbackAllowed()) {
    return {
      error: 'Authentication required',
      source: 'oauth',
      actionable: {
        type: 'connect_oauth',
        message: 'Connect your GitHub account to run AKIS Scribe Agent.',
        ctaText: 'Connect GitHub (OAuth)',
      },
    };
  }

  // Production mode or OAuth not allowed
  return {
    error: 'GitHub App authentication failed',
    source: 'github_app',
    actionable: {
      type: 'check_env',
      message: 'GitHub App credentials are configured but token acquisition failed. Check your GITHUB_APP_PRIVATE_KEY_PEM format.',
      ctaText: 'Check Environment Variables',
    },
  };
}

/**
 * Validate if token is valid (basic format check)
 */
export function isValidGitHubToken(token: string): boolean {
  if (!token || token.trim() === '') {
    return false;
  }

  // GitHub token prefixes:
  // - ghp_ (Personal Access Token)
  // - gho_ (OAuth token)
  // - ghs_ (Server/App token)
  // - ghu_ (User token)
  // - ghr_ (Refresh token)
  const validPrefixes = ['ghp_', 'gho_', 'ghs_', 'ghu_', 'ghr_'];
  
  return validPrefixes.some(prefix => token.startsWith(prefix));
}

/**
 * Test token by making API call
 * Server-side only
 */
export async function testGitHubToken(token: string): Promise<{
  valid: boolean;
  user?: string;
  scopes?: string[];
  rateLimit?: {
    limit: number;
    remaining: number;
    reset: Date;
  };
  error?: string;
}> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      return {
        valid: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    const scopes = response.headers.get('x-oauth-scopes')?.split(', ') || [];
    
    const rateLimit = {
      limit: parseInt(response.headers.get('x-ratelimit-limit') || '0'),
      remaining: parseInt(response.headers.get('x-ratelimit-remaining') || '0'),
      reset: new Date(parseInt(response.headers.get('x-ratelimit-reset') || '0') * 1000),
    };

    logger.info('TokenProvider', `✅ Token valid for user: ${data.login}`);
    
    return {
      valid: true,
      user: data.login,
      scopes,
      rateLimit,
    };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message,
    };
  }
}

