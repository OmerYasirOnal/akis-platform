/**
 * OAuth PKCE (Proof Key for Code Exchange) Implementation
 * 
 * Implements PKCE S256 for OAuth authorization code flow.
 * Part of Phase 2: Security Hardening (Gate-B requirement)
 * 
 * @module server/security/pkce
 */

import { randomBytes, createHash } from 'crypto';

/**
 * Generate a cryptographically secure code verifier
 * 
 * PKCE spec requires 43-128 characters from [A-Z, a-z, 0-9, -, ., _, ~]
 * We use 32 random bytes (256 bits) encoded as base64url = 43 characters
 */
export function generateCodeVerifier(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Generate code challenge from code verifier using S256 method
 * 
 * S256: BASE64URL(SHA256(code_verifier))
 * 
 * @param codeVerifier - The code verifier to hash
 * @returns Code challenge (base64url-encoded SHA-256 hash)
 */
export function generateCodeChallenge(codeVerifier: string): string {
  return createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');
}

/**
 * Verify that a code verifier matches a code challenge
 * 
 * @param codeVerifier - Code verifier from storage
 * @param codeChallenge - Code challenge from OAuth state
 * @returns true if valid, false otherwise
 */
export function verifyCodeChallenge(
  codeVerifier: string,
  codeChallenge: string
): boolean {
  const expectedChallenge = generateCodeChallenge(codeVerifier);
  return expectedChallenge === codeChallenge;
}

/**
 * Generate PKCE pair (verifier + challenge)
 * 
 * @returns Object with code_verifier and code_challenge
 */
export function generatePKCEPair(): {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
} {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  
  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: 'S256',
  };
}

/**
 * OAuth state storage interface (for PKCE verifier + state)
 */
export interface OAuthState {
  state: string;
  codeVerifier: string;
  codeChallenge: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * In-memory OAuth state store (POC - will be replaced with Redis/DB)
 * Key: state parameter, Value: OAuthState
 */
const oauthStateStore = new Map<string, OAuthState>();

/**
 * Store OAuth state (PKCE verifier + state parameter)
 * 
 * @param state - Random state parameter
 * @param codeVerifier - PKCE code verifier
 * @param codeChallenge - PKCE code challenge
 * @param ttlMs - Time to live in milliseconds (default: 10 minutes)
 */
export function storeOAuthState(
  state: string,
  codeVerifier: string,
  codeChallenge: string,
  ttlMs: number = 10 * 60 * 1000 // 10 minutes
): void {
  const now = Date.now();
  
  oauthStateStore.set(state, {
    state,
    codeVerifier,
    codeChallenge,
    createdAt: now,
    expiresAt: now + ttlMs,
  });
  
  // Cleanup expired states (simple in-memory cleanup)
  setTimeout(() => {
    oauthStateStore.delete(state);
  }, ttlMs);
}

/**
 * Retrieve and delete OAuth state (one-time use)
 * 
 * @param state - State parameter from OAuth callback
 * @returns OAuthState if found and not expired, null otherwise
 */
export function consumeOAuthState(state: string): OAuthState | null {
  const oauthState = oauthStateStore.get(state);
  
  if (!oauthState) {
    return null;
  }
  
  // Check expiry
  if (Date.now() > oauthState.expiresAt) {
    oauthStateStore.delete(state);
    return null;
  }
  
  // One-time use: delete after retrieval
  oauthStateStore.delete(state);
  
  return oauthState;
}

/**
 * Generate random state parameter for OAuth
 * 
 * @returns Random state string (32 bytes base64url)
 */
export function generateOAuthState(): string {
  return randomBytes(32).toString('base64url');
}

