import "server-only";

/**
 * ✅ SSOT: GitHub Token Provider (PHASE 3 Consolidated)
 * 
 * Single Source of Truth for GitHub Installation Tokens
 * Implements: JWT → Installation Access Token flow with caching
 * 
 * Security:
 * - Server-only (build-time enforced)
 * - Short-lived tokens (~1 hour, auto-refresh)
 * - 2-minute safety margin before expiry
 * - Tokens never exposed to client
 * - Structured logging with correlation IDs
 * 
 * Priority:
 * 1. GitHub App Installation Token (production)
 * 2. OAuth User Token (dev-only fallback, guarded)
 */

import jwt from 'jsonwebtoken';
import { logger } from "@/shared/lib/utils/logger";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface InstallationToken {
  token: string;
  expiresAt: string;
}

export interface TokenProvider {
  getInstallationToken(params?: { 
    installationId?: number; 
    repo?: string;
    correlationId?: string;
  }): Promise<InstallationToken>;
}

export interface TokenProviderOptions {
  correlationId?: string;
  forceOAuth?: boolean;
  userToken?: string;
  repo?: { owner: string; name: string; };
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

// ============================================================================
// TOKEN CACHE (5-minute safety window)
// ============================================================================

interface TokenCache {
  token: string;
  expiresAt: Date;
}

let tokenCache: TokenCache | null = null;

// ============================================================================
// CORE PRIMITIVES (Consolidated from github-app.ts)
// ============================================================================

/**
 * Create GitHub App JWT token (valid for 10 minutes)
 * Used to authenticate as the GitHub App itself
 * 
 * @internal - Use getInstallationToken() instead
 */
function createGitHubAppJWT(appId: string, privateKey: string): string {
  const now = Math.floor(Date.now() / 1000);
  
  const payload = {
    iat: now - 60,           // Issued at (1 min ago for clock drift)
    exp: now + 9 * 60,       // Expires in 9 minutes
    iss: appId,              // Issuer (GitHub App ID)
  };

  return jwt.sign(payload, privateKey, { algorithm: 'RS256' });
}

/**
 * Exchange JWT for Installation Access Token
 * This token is used for actual GitHub API calls
 * 
 * @internal - Use getInstallationToken() instead
 * @returns Installation access token (valid ~1 hour)
 */
async function exchangeJWTForInstallationToken(
  appId: string,
  installationId: string,
  privateKey: string
): Promise<{ token: string; expiresAt: string } | { error: string }> {
  try {
    // Step 1: Create JWT
    const jwtToken = createGitHubAppJWT(appId, privateKey);

    // Step 2: Exchange JWT for Installation Access Token
    const response = await fetch(
      `https://api.github.com/app/installations/${installationId}/access_tokens`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      logger.error('TokenProvider', `Token exchange failed: ${error.message || `HTTP ${response.status}`}`);
      return { error: error.message || `HTTP ${response.status}` };
    }

    const data = await response.json();
    
    logger.info('TokenProvider', `✅ Installation token acquired, expires: ${data.expires_at}`);
    
    return {
      token: data.token,
      expiresAt: data.expires_at,
    };
  } catch (error: any) {
    logger.error('TokenProvider', `Exception during token exchange: ${error.message}`);
    return { error: error.message };
  }
}

// ============================================================================
// PUBLIC API (Minimal Interface)
// ============================================================================

/**
 * ✅ SSOT: Get GitHub Installation Token
 * 
 * Automatically handles:
 * - Environment variable reading (APP_ID, INSTALLATION_ID, PRIVATE_KEY_PEM)
 * - JWT creation and exchange
 * - Token caching with 5-minute safety window (auto-refresh)
 * - PEM format normalization (handles \n escaping)
 * 
 * @param params - Optional parameters
 * @param params.installationId - Override installation ID (defaults to env GITHUB_APP_INSTALLATION_ID)
 * @param params.repo - Repository context for logging
 * @param params.correlationId - Tracking ID for observability
 * 
 * @returns Installation token with expiry, or throws error
 * 
 * @example
 * ```ts
 * const { token } = await getInstallationToken();
 * const octokit = new Octokit({ auth: token });
 * ```
 */
export async function getInstallationToken(params?: {
  installationId?: number;
  repo?: string;
  correlationId?: string;
}): Promise<InstallationToken> {
  const correlationId = params?.correlationId || Math.random().toString(36).substring(7);
  const now = new Date();
  
  // Check cache first (5-minute safety margin)
  if (tokenCache && tokenCache.expiresAt > new Date(now.getTime() + 5 * 60 * 1000)) {
    logger.info('TokenProvider', `[${correlationId}] Using cached token (expires: ${tokenCache.expiresAt.toISOString()})`);
    return {
      token: tokenCache.token,
      expiresAt: tokenCache.expiresAt.toISOString(),
    };
  }

  // Fetch new token
  logger.info('TokenProvider', `[${correlationId}] Fetching new installation token...`);
  
  const appId = process.env.GITHUB_APP_ID;
  const installationId = params?.installationId?.toString() || process.env.GITHUB_APP_INSTALLATION_ID;
  const privateKeyPem = process.env.GITHUB_APP_PRIVATE_KEY_PEM;

  if (!appId || !installationId || !privateKeyPem) {
    const missing = [];
    if (!appId) missing.push('GITHUB_APP_ID');
    if (!installationId) missing.push('GITHUB_APP_INSTALLATION_ID');
    if (!privateKeyPem) missing.push('GITHUB_APP_PRIVATE_KEY_PEM');
    
    const errorMsg = `GitHub App credentials missing: ${missing.join(', ')}`;
    logger.error('TokenProvider', `[${correlationId}] ❌ ${errorMsg}`);
    throw new Error(errorMsg);
  }

  // Normalize PEM (handles \n escape sequences from env vars)
  const normalizedKey = privateKeyPem.replace(/\\n/g, '\n');

  const result = await exchangeJWTForInstallationToken(appId, installationId, normalizedKey);
  
  if ('error' in result) {
    logger.error('TokenProvider', `[${correlationId}] ❌ Token exchange failed: ${result.error}`);
    throw new Error(`Failed to get installation token: ${result.error}`);
  }

  // Cache the token
  tokenCache = {
    token: result.token,
    expiresAt: new Date(result.expiresAt),
  };

  logger.info('TokenProvider', `[${correlationId}] ✅ Token cached until ${tokenCache.expiresAt.toISOString()}`);

  return {
    token: result.token,
    expiresAt: result.expiresAt,
  };
}

/**
 * ✅ Get cached token or fetch new one (alias for backward compatibility)
 * 
 * @deprecated Use getInstallationToken() instead
 */
export async function getCachedGitHubAppToken(): Promise<string | null> {
  try {
    const { token } = await getInstallationToken();
    return token;
  } catch (error) {
    logger.error('TokenProvider', `getCachedGitHubAppToken failed: ${error}`);
    return null;
  }
}

// ============================================================================
// LEGACY API (OAuth Fallback - Dev Only, Safe-by-Default)
// ============================================================================

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
 * Get GitHub token with intelligent fallback (OAuth support)
 * 
 * @deprecated Use getInstallationToken() for production. This function
 * supports OAuth fallback for development only.
 * 
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
      const { token, expiresAt } = await getInstallationToken({ correlationId });
      
      const installationId = options.actor?.installationId || process.env.GITHUB_APP_INSTALLATION_ID || 'unknown';
      logger.info('TokenProvider', `[${correlationId}] ✅ Using GitHub App token (installation: ${installationId})`);
      return {
        token,
        source: 'github_app',
        expiresAt: new Date(expiresAt),
      };
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

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

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
