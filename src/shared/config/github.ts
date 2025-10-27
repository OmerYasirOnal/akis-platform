import "server-only";

/**
 * GitHub Configuration Validator
 * 
 * Validates GitHub App credentials at startup (server-side only)
 * Fails fast with clear error messages if misconfigured
 * 
 * Safe-by-default: OAuth fallback disabled in production
 */

export class MissingGitHubAppCredentialsError extends Error {
  constructor(public readonly missingKeys: string[]) {
    super(
      `GitHub App credentials missing: ${missingKeys.join(', ')}. ` +
      `See .env.local.template for setup instructions.`
    );
    this.name = 'MissingGitHubAppCredentialsError';
  }
}

export interface GitHubConfig {
  appId: string;
  installationId: string;
  privateKeyPem: string;
  oauthClientId?: string;
  oauthClientSecret?: string;
  allowOAuthFallback: boolean;
}

/**
 * Validate and return GitHub configuration
 * Throws if required credentials are missing in production
 */
export function validateGitHubConfig(): GitHubConfig | null {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const allowOAuthFallback = process.env.ALLOW_OAUTH_FALLBACK === 'true';

  // Required for GitHub App
  const appId = process.env.GITHUB_APP_ID;
  const installationId = process.env.GITHUB_APP_INSTALLATION_ID;
  const privateKeyPem = process.env.GITHUB_APP_PRIVATE_KEY_PEM;

  // Optional OAuth credentials
  const oauthClientId = process.env.GITHUB_CLIENT_ID;
  const oauthClientSecret = process.env.GITHUB_CLIENT_SECRET;

  // Check GitHub App credentials
  const hasAppCredentials = !!(appId && installationId && privateKeyPem);

  if (hasAppCredentials) {
    console.log('[GitHubConfig] ✅ GitHub App credentials configured');
    return {
      appId: appId!,
      installationId: installationId!,
      privateKeyPem: privateKeyPem!,
      oauthClientId,
      oauthClientSecret,
      allowOAuthFallback: isDevelopment && allowOAuthFallback,
    };
  }

  // GitHub App not configured
  const missingKeys = [];
  if (!appId) missingKeys.push('GITHUB_APP_ID');
  if (!installationId) missingKeys.push('GITHUB_APP_INSTALLATION_ID');
  if (!privateKeyPem) missingKeys.push('GITHUB_APP_PRIVATE_KEY_PEM');

  // In production, GitHub App is REQUIRED
  if (!isDevelopment) {
    console.error('[GitHubConfig] ❌ PRODUCTION: GitHub App credentials required');
    throw new MissingGitHubAppCredentialsError(missingKeys);
  }

  // In development, allow OAuth fallback if explicitly enabled
  if (allowOAuthFallback && oauthClientId && oauthClientSecret) {
    console.warn('[GitHubConfig] ⚠️ DEV MODE: Using OAuth fallback (GitHub App not configured)');
    console.warn('[GitHubConfig] ⚠️ This is NOT recommended for production');
    return {
      appId: '',
      installationId: '',
      privateKeyPem: '',
      oauthClientId,
      oauthClientSecret,
      allowOAuthFallback: true,
    };
  }

  // Development without GitHub App or OAuth
  console.warn('[GitHubConfig] ⚠️ GitHub authentication not fully configured');
  console.warn('[GitHubConfig] ⚠️ Missing GitHub App credentials:', missingKeys.join(', '));
  console.warn('[GitHubConfig] ⚠️ To enable OAuth fallback, set ALLOW_OAUTH_FALLBACK=true');
  console.warn('[GitHubConfig] ⚠️ See .env.local.template for setup instructions');

  return null;
}

/**
 * Get GitHub App credentials (validated)
 * Returns null if not configured, logs warning
 */
export function getGitHubAppCredentials(): {
  appId: string;
  installationId: string;
  privateKeyPem: string;
} | null {
  const config = validateGitHubConfig();
  
  if (!config || !config.appId || !config.installationId || !config.privateKeyPem) {
    return null;
  }

  return {
    appId: config.appId,
    installationId: config.installationId,
    privateKeyPem: config.privateKeyPem,
  };
}

/**
 * Check if OAuth fallback is allowed
 * Safe-by-default: only in development with explicit flag
 */
export function isOAuthFallbackAllowed(): boolean {
  const config = validateGitHubConfig();
  return config?.allowOAuthFallback ?? false;
}

/**
 * Run configuration check on startup
 * Call this in a server-side initialization (e.g., app/layout.tsx or middleware)
 */
export function runStartupConfigCheck(): void {
  try {
    const config = validateGitHubConfig();
    
    if (config) {
      console.log('[GitHubConfig] ✅ Startup validation passed');
      if (config.allowOAuthFallback) {
        console.warn('[GitHubConfig] ⚠️ DEV MODE: OAuth fallback enabled');
      }
    } else {
      console.warn('[GitHubConfig] ⚠️ GitHub configuration incomplete');
    }
  } catch (error) {
    if (error instanceof MissingGitHubAppCredentialsError) {
      console.error('[GitHubConfig] ❌ FATAL:', error.message);
      // In production, you might want to throw here to prevent startup
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    } else {
      console.error('[GitHubConfig] ❌ Unexpected error:', error);
    }
  }
}

