/**
 * DEPRECATED: Use @/lib/github/token-provider instead
 * This file is kept for backward compatibility
 * 
 * @deprecated Import from @/lib/github/token-provider
 */

import { getGitHubToken as getGitHubTokenNew, TokenProviderOptions as TokenProviderOptionsNew } from '../github/token-provider';
import { logger } from '../utils/logger';

export interface TokenProviderOptions {
  /**
   * User's OAuth token from client-side
   * This should come from localStorage/cookie
   */
  userToken?: string;

  /**
   * Force GitHub App usage (ignore user token)
   * @deprecated Use forceOAuth in new provider
   */
  forceGitHubApp?: boolean;

  /**
   * Repository owner (for logging)
   */
  owner?: string;

  /**
   * Repository name (for logging)
   */
  repo?: string;
}

/**
 * Get GitHub token with intelligent fallback
 * 
 * @deprecated Use getGitHubToken from @/lib/github/token-provider
 * @param options Token provider options
 * @returns GitHub access token
 * @throws Error if no token available
 */
export async function getGitHubToken(options: TokenProviderOptions = {}): Promise<string> {
  logger.warn('GitHubToken', 'DEPRECATED: Use @/lib/github/token-provider instead');

  const newOptions: TokenProviderOptionsNew = {
    userToken: options.userToken,
    forceOAuth: !options.forceGitHubApp, // Inverted logic
    repo: options.owner && options.repo ? {
      owner: options.owner,
      name: options.repo,
    } : undefined,
  };

  const result = await getGitHubTokenNew(newOptions);

  if ('error' in result) {
    throw new Error(result.error);
  }

  return result.token;
}

/**
 * Validate if a token is valid (basic check)
 * 
 * @param token GitHub token
 * @returns true if token looks valid
 */
export function isValidToken(token: string): boolean {
  if (!token || token.trim() === '') {
    return false;
  }

  // GitHub tokens usually start with:
  // - ghp_ (Personal Access Token)
  // - gho_ (OAuth token)
  // - ghs_ (Server token)
  // - ghu_ (User token)
  // - ghr_ (Refresh token)
  const validPrefixes = ['ghp_', 'gho_', 'ghs_', 'ghu_', 'ghr_'];
  
  return validPrefixes.some(prefix => token.startsWith(prefix));
}

/**
 * Test GitHub token by making a simple API call
 * 
 * @param token GitHub token to test
 * @returns true if token works
 */
export async function testGitHubToken(token: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`[GitHub Token] ✅ Token valid for user: ${data.login}`);
      return true;
    }

    console.error(`[GitHub Token] ❌ Token test failed: ${response.status} ${response.statusText}`);
    return false;
  } catch (error: any) {
    console.error(`[GitHub Token] ❌ Token test error: ${error.message}`);
    return false;
  }
}

