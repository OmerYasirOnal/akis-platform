import "server-only";

/**
 * GitHub App Authentication
 * Implements JWT → Installation Access Token flow
 * 
 * Security:
 * - Short-lived tokens (~1 hour)
 * - Least-privilege, repo-scoped permissions
 * - Easy revocation (uninstall App → all tokens invalidated)
 * - Server-only module (build-time enforced)
 */

import jwt from 'jsonwebtoken';

interface GitHubAppConfig {
  appId: string;
  installationId: string;
  privateKey: string;
}

/**
 * Create GitHub App JWT token (valid for 10 minutes)
 * Used to authenticate as the GitHub App itself
 */
export function createGitHubAppJWT(appId: string, privateKey: string): string {
  const now = Math.floor(Date.now() / 1000);
  
  const payload = {
    iat: now - 60,           // Issued at (1 min ago to account for clock drift)
    exp: now + 9 * 60,       // Expires in 9 minutes
    iss: appId,              // Issuer (GitHub App ID)
  };

  return jwt.sign(payload, privateKey, { algorithm: 'RS256' });
}

/**
 * Exchange JWT for Installation Access Token
 * This token is used for actual GitHub API calls
 * 
 * @returns Installation access token (valid ~1 hour)
 */
export async function getInstallationToken(
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
      console.error('[GitHub App] Token exchange failed:', error);
      return { error: error.message || `HTTP ${response.status}` };
    }

    const data = await response.json();
    
    console.log('[GitHub App] ✅ Installation token acquired, expires:', data.expires_at);
    
    return {
      token: data.token,
      expiresAt: data.expires_at,
    };
  } catch (error: any) {
    console.error('[GitHub App] Exception during token exchange:', error);
    return { error: error.message };
  }
}

/**
 * Get GitHub App Installation Token from environment variables
 * This is the main function to call when you need a token
 */
export async function getGitHubAppToken(): Promise<string | null> {
  const appId = process.env.GITHUB_APP_ID;
  const installationId = process.env.GITHUB_APP_INSTALLATION_ID;
  const privateKeyPem = process.env.GITHUB_APP_PRIVATE_KEY_PEM;

  if (!appId || !installationId || !privateKeyPem) {
    console.warn('[GitHub App] Missing credentials in environment');
    return null;
  }

  // Normalize newlines in private key (in case stored as escaped string)
  const normalizedKey = privateKeyPem.replace(/\\n/g, '\n');

  const result = await getInstallationToken(appId, installationId, normalizedKey);
  
  if ('error' in result) {
    console.error('[GitHub App] Failed to get token:', result.error);
    return null;
  }

  return result.token;
}

/**
 * Token cache to avoid excessive API calls
 * Tokens are valid for ~1 hour, we renew at 55 minutes
 */
interface TokenCache {
  token: string;
  expiresAt: Date;
}

let tokenCache: TokenCache | null = null;

/**
 * Get cached token or fetch new one
 * Automatically refreshes if expired or expiring soon (< 5 min remaining)
 */
export async function getCachedGitHubAppToken(): Promise<string | null> {
  const now = new Date();
  
  // Check if cached token is still valid (more than 5 minutes left)
  if (tokenCache && tokenCache.expiresAt > new Date(now.getTime() + 5 * 60 * 1000)) {
    console.log('[GitHub App] Using cached token');
    return tokenCache.token;
  }

  // Token expired or expiring soon, fetch new one
  console.log('[GitHub App] Fetching new token...');
  const appId = process.env.GITHUB_APP_ID;
  const installationId = process.env.GITHUB_APP_INSTALLATION_ID;
  const privateKeyPem = process.env.GITHUB_APP_PRIVATE_KEY_PEM;

  if (!appId || !installationId || !privateKeyPem) {
    console.warn('[GitHub App] Missing credentials');
    return null;
  }

  // Normalize newlines in private key (in case stored as escaped string)
  const normalizedKey = privateKeyPem.replace(/\\n/g, '\n');

  const result = await getInstallationToken(appId, installationId, normalizedKey);
  
  if ('error' in result) {
    console.error('[GitHub App] Failed to get token:', result.error);
    return null;
  }

  // Cache the token
  tokenCache = {
    token: result.token,
    expiresAt: new Date(result.expiresAt),
  };

  return result.token;
}

