/**
 * Unified GitHub Token Provider
 * 
 * Priority (REVERSED from legacy):
 * 1. GitHub App Installation Token (server-side, short-lived, secure)
 * 2. OAuth User Token (fallback for dev/testing)
 * 
 * Security:
 * - Tokens never exposed to client
 * - Auto-refresh before expiry
 * - Correlation IDs for observability
 * - Structured logging with redaction
 */

import { getCachedGitHubAppToken } from '../auth/github-app';
import { logger } from '../utils/logger';

export interface TokenProviderOptions {
  /**
   * Correlation ID for tracking requests
   */
  correlationId?: string;

  /**
   * Force OAuth usage (bypass GitHub App)
   * Only use for development/testing
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
 * Get GitHub token with intelligent fallback
 * Server-side only - NEVER call from client
 */
export async function getGitHubToken(
  options: TokenProviderOptions = {}
): Promise<TokenProviderResult | TokenProviderError> {
  // Client-side guard
  if (typeof window !== 'undefined') {
    throw new Error('SECURITY: getGitHubToken must only be called server-side');
  }

  const correlationId = options.correlationId || Math.random().toString(36).substring(7);
  const repoInfo = options.repo ? `${options.repo.owner}/${options.repo.name}` : 'unknown';

  logger.info('TokenProvider', `[${correlationId}] Getting token for ${repoInfo}`);

  // Priority 1: GitHub App Installation Token (preferred)
  if (!options.forceOAuth) {
    try {
      const appToken = await getCachedGitHubAppToken();
      
      if (appToken) {
        logger.info('TokenProvider', `[${correlationId}] ✅ Using GitHub App token`);
        return {
          token: appToken,
          source: 'github_app',
          // Note: expiresAt is managed internally by getCachedGitHubAppToken
        };
      }

      logger.warn('TokenProvider', `[${correlationId}] ⚠️ GitHub App token unavailable`);
    } catch (error: any) {
      logger.error('TokenProvider', `[${correlationId}] ❌ GitHub App error: ${error.message}`);
    }
  }

  // Priority 2: OAuth User Token (fallback)
  if (options.userToken) {
    logger.info('TokenProvider', `[${correlationId}] ✅ Using OAuth token`);
    return {
      token: options.userToken,
      source: 'oauth',
    };
  }

  // No token available - return actionable error
  logger.error('TokenProvider', `[${correlationId}] ❌ No auth credentials found`);

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

  // App is configured but token failed, suggest OAuth
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
  if (typeof window !== 'undefined') {
    throw new Error('SECURITY: testGitHubToken must only be called server-side');
  }

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

