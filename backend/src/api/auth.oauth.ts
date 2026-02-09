/**
 * OAuth Authentication Routes (S0.4.2-BE-2)
 * Implements GitHub and Google OAuth login with existing AKIS session mechanism
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { db } from '../db/client.js';
import { users, oauthAccounts } from '../db/schema.js';
import { sign } from '../services/auth/jwt.js';
import { cookieOpts, env } from '../lib/env.js';
import { getEnv } from '../config/env.js';
import { HttpClient } from '../services/http/HttpClient.js';

// PostgreSQL error codes for constraint violations
const PG_UNIQUE_VIOLATION = '23505';

// OAuth provider configuration
interface OAuthProviderConfig {
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scopes: string[];
  clientId: string;
  clientSecret: string;
}

// OAuth user profile (normalized across providers)
interface OAuthUserProfile {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

// OAuth state TTL configuration
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// State storage for CSRF protection (in-memory for now, could use Redis in production)
const oauthStateStore = new Map<string, { provider: string; createdAt: number }>();

// Check if a state token has expired based on TTL
function isStateExpired(createdAt: number, nowMs: number = Date.now()): boolean {
  return nowMs - createdAt > STATE_TTL_MS;
}

// Cleanup expired states (background maintenance - not for correctness)
// Note: TTL is enforced at callback time via isStateExpired(), cleanup is just housekeeping
function cleanupExpiredStates() {
  const now = Date.now();
  for (const [state, data] of oauthStateStore.entries()) {
    if (isStateExpired(data.createdAt, now)) {
      oauthStateStore.delete(state);
    }
  }
}

// Generate cryptographically secure state parameter
function generateState(): string {
  return randomBytes(32).toString('hex');
}

// Get OAuth provider configuration
function getProviderConfig(provider: string): OAuthProviderConfig | null {
  const config = getEnv();
  
  if (provider === 'github') {
    if (!config.GITHUB_OAUTH_CLIENT_ID || !config.GITHUB_OAUTH_CLIENT_SECRET) {
      return null;
    }
    return {
      authUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      userInfoUrl: 'https://api.github.com/user',
      scopes: ['user:email'],
      clientId: config.GITHUB_OAUTH_CLIENT_ID,
      clientSecret: config.GITHUB_OAUTH_CLIENT_SECRET,
    };
  }
  
  if (provider === 'google') {
    if (!config.GOOGLE_OAUTH_CLIENT_ID || !config.GOOGLE_OAUTH_CLIENT_SECRET) {
      return null;
    }
    return {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
      scopes: ['openid', 'email', 'profile'],
      clientId: config.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: config.GOOGLE_OAUTH_CLIENT_SECRET,
    };
  }
  
  return null;
}

// Fetch user profile from GitHub
async function fetchGitHubProfile(accessToken: string, httpClient: HttpClient): Promise<OAuthUserProfile> {
  // Get user info
  const userResponse = await httpClient.get('https://api.github.com/user', accessToken);
  if (!userResponse.ok) {
    throw new Error(`GitHub user API failed: ${userResponse.status}`);
  }
  const userData = await userResponse.json() as { id: number; name?: string; login: string; email?: string };
  
  // IMPORTANT: Email verification status MUST come from /user/emails endpoint
  // The presence of email in /user endpoint does NOT imply verification
  // GitHub's /user.email is just a convenience field, not a verification indicator
  
  let email: string | undefined;
  let emailVerified = false;
  
  // Always try to fetch /user/emails for accurate verification status
  const emailResponse = await httpClient.get('https://api.github.com/user/emails', accessToken);
  
  if (emailResponse.ok) {
    const emails = await emailResponse.json() as Array<{ email: string; primary: boolean; verified: boolean }>;
    
    // Priority: primary+verified > any verified > primary > first available
    const primaryVerified = emails.find(e => e.primary && e.verified);
    const anyVerified = emails.find(e => e.verified);
    const primaryAny = emails.find(e => e.primary);
    const firstEmail = emails[0];
    
    const selectedEmail = primaryVerified || anyVerified || primaryAny || firstEmail;
    
    if (selectedEmail) {
      email = selectedEmail.email;
      emailVerified = selectedEmail.verified; // ONLY true if /user/emails says verified
    }
  }
  
  // Fallback: use /user.email if /user/emails failed or returned empty
  // BUT keep emailVerified=false since we couldn't confirm verification
  if (!email && userData.email) {
    email = userData.email;
    emailVerified = false; // Cannot confirm verification without /user/emails
    console.warn(`[OAuth:GitHub] Using fallback email from /user endpoint, verification status unknown`);
  }
  
  if (!email) {
    // Throw specific error for missing email (user needs to set email or grant permission)
    throw new Error('OAUTH_MISSING_EMAIL');
  }
  
  return {
    id: String(userData.id),
    email: email.toLowerCase(),
    name: userData.name || userData.login,
    emailVerified,
  };
}

// Fetch user profile from Google
async function fetchGoogleProfile(accessToken: string, httpClient: HttpClient): Promise<OAuthUserProfile> {
  const response = await httpClient.get('https://www.googleapis.com/oauth2/v2/userinfo', accessToken);
  if (!response.ok) {
    throw new Error(`Google userinfo API failed: ${response.status}`);
  }
  const data = await response.json() as { id: string; email: string; name?: string; given_name?: string; family_name?: string; verified_email: boolean };
  
  // Build name with fallbacks: name > given_name + family_name > email prefix
  const email = data.email.toLowerCase();
  let name = data.name;
  if (!name && (data.given_name || data.family_name)) {
    name = [data.given_name, data.family_name].filter(Boolean).join(' ');
  }
  if (!name) {
    // Use email prefix as last resort (e.g., "user" from "user@gmail.com")
    name = email.split('@')[0];
  }
  
  return {
    id: data.id,
    email,
    name,
    emailVerified: data.verified_email,
  };
}

// Exchange authorization code for access token
async function exchangeCodeForToken(
  provider: string,
  code: string,
  redirectUri: string,
  providerConfig: OAuthProviderConfig,
): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
  const params = new URLSearchParams();
  params.append('client_id', providerConfig.clientId);
  params.append('client_secret', providerConfig.clientSecret);
  params.append('code', code);
  params.append('redirect_uri', redirectUri);
  
  if (provider === 'github') {
    // GitHub expects params in body
    const response = await fetch(providerConfig.tokenUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    
    if (!response.ok) {
      throw new Error(`GitHub token exchange failed: ${response.status}`);
    }
    
    const data = await response.json() as { access_token: string; error?: string; error_description?: string };
    if (data.error) {
      throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`);
    }
    
    return { accessToken: data.access_token };
  }
  
  if (provider === 'google') {
    params.append('grant_type', 'authorization_code');
    
    const response = await fetch(providerConfig.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    
    if (!response.ok) {
      throw new Error(`Google token exchange failed: ${response.status}`);
    }
    
    const data = await response.json() as { 
      access_token: string; 
      refresh_token?: string; 
      expires_in?: number;
      error?: string; 
      error_description?: string 
    };
    if (data.error) {
      throw new Error(`Google OAuth error: ${data.error_description || data.error}`);
    }
    
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  }
  
  throw new Error(`Unknown provider: ${provider}`);
}

// Helper for HTTP redirects (Fastify doesn't have built-in redirect)
function redirect(reply: FastifyReply, url: string) {
  return reply.header('Location', url).code(302).send();
}

export async function registerOAuthRoutes(fastify: FastifyInstance) {
  const httpClient = new HttpClient({ timeout: 10000, retries: 2 });
  const config = getEnv();

  const githubConfigured = !!(config.GITHUB_OAUTH_CLIENT_ID && config.GITHUB_OAUTH_CLIENT_SECRET);
  const googleConfigured = !!(config.GOOGLE_OAUTH_CLIENT_ID && config.GOOGLE_OAUTH_CLIENT_SECRET);
  console.log(`[OAuth] Providers: github=${githubConfigured ? 'configured' : 'NOT configured'}, google=${googleConfigured ? 'configured' : 'NOT configured'}`);
  if (githubConfigured || googleConfigured) {
    console.log(`[OAuth] Callback base: ${config.BACKEND_URL}/auth/oauth/<provider>/callback`);
  }

  // Cleanup expired states periodically
  const cleanupInterval = setInterval(cleanupExpiredStates, 60000); // Every minute
  
  // Ensure cleanup on server close
  fastify.addHook('onClose', () => {
    clearInterval(cleanupInterval);
  });
  
  /**
   * GET /auth/oauth/:provider
   * Initiates OAuth flow by redirecting to provider
   */
  fastify.get('/oauth/:provider', async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as { provider: string };
    const provider = params.provider;
    
    // Validate provider
    if (provider !== 'github' && provider !== 'google') {
      return reply.code(400).send({
        error: { code: 'INVALID_PROVIDER', message: 'Invalid OAuth provider' },
        requestId: request.id,
      });
    }
    
    // Get provider config
    const providerConfig = getProviderConfig(provider);
    if (!providerConfig) {
      return reply.code(503).send({
        error: { code: 'OAUTH_NOT_CONFIGURED', message: `${provider} OAuth is not configured` },
        requestId: request.id,
      });
    }
    
    // Generate state for CSRF protection
    const state = generateState();
    oauthStateStore.set(state, { provider, createdAt: Date.now() });
    
    // Build authorization URL
    const redirectUri = `${config.BACKEND_URL}/auth/oauth/${provider}/callback`;
    const authParams = new URLSearchParams({
      client_id: providerConfig.clientId,
      redirect_uri: redirectUri,
      scope: providerConfig.scopes.join(' '),
      state,
    });
    
    // Provider-specific parameters
    if (provider === 'google') {
      authParams.append('response_type', 'code');
      authParams.append('access_type', 'offline');
      authParams.append('prompt', 'consent');
    }
    
    const authUrl = `${providerConfig.authUrl}?${authParams.toString()}`;
    
    // Dev-only: Log OAuth App client_id prefix (no secrets) to verify correct credentials
    if (provider === 'github' && config.NODE_ENV !== 'production') {
      console.log(`[OAuth:GitHub] Login using OAuth App client_id=${providerConfig.clientId.substring(0, 6)}...`);
    }
    
    console.log(`[OAuth] Flow initiated for provider: ${provider}, state: ${state.substring(0, 8)}...`);
    
    return redirect(reply, authUrl);
  });

  if (config.NODE_ENV !== 'production') {
    /**
     * DEV ONLY: alias for legacy callback paths (e.g., /auth/oauth/github/cb)
     * Keeps local OAuth callback mismatches from breaking the flow.
     */
    fastify.get('/oauth/:provider/cb', async (request: FastifyRequest, reply: FastifyReply) => {
      const params = request.params as { provider: string };
      const query = request.query as Record<string, string | string[] | undefined>;
      const search = new URLSearchParams();

      for (const [key, value] of Object.entries(query)) {
        if (Array.isArray(value)) {
          value.forEach((item) => {
            if (item) {
              search.append(key, item);
            }
          });
        } else if (value) {
          search.append(key, value);
        }
      }

      const queryString = search.toString();
      const target = `/auth/oauth/${params.provider}/callback${queryString ? `?${queryString}` : ''}`;
      return redirect(reply, target);
    });
  }

  /**
   * GET /auth/oauth/:provider/callback
   * Handles OAuth callback from provider
   */
  fastify.get('/oauth/:provider/callback', async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as { provider: string };
    const query = request.query as { 
      code?: string; 
      state?: string; 
      error?: string; 
      error_description?: string 
    };
    
    const provider = params.provider;
    const { code, state, error, error_description } = query;
    
    const frontendUrl = config.FRONTEND_URL;
    
    // Handle OAuth errors from provider
    if (error) {
      console.warn(`[OAuth] Error from provider ${provider}: ${error} - ${error_description}`);
      // URL-encode error parameter to prevent URL parsing issues and parameter injection
      const encodedError = encodeURIComponent(`oauth_${error}`);
      return redirect(reply, `${frontendUrl}/login?error=${encodedError}`);
    }
    
    // Atomic state consumption: retrieve AND delete in one operation
    // This prevents race conditions where two callbacks could both pass validation
    // before either deletes the state (single-use CSRF protection)
    if (!state) {
      console.warn(`[OAuth] Missing state for provider: ${provider}`);
      return redirect(reply, `${frontendUrl}/login?error=oauth_invalid_state`);
    }
    
    // Atomically consume the state: get data and delete in one logical operation
    // A second callback with the same state will get undefined and fail
    const stateData = oauthStateStore.get(state);
    const wasDeleted = oauthStateStore.delete(state); // Consume immediately (single-use)
    
    // If state didn't exist or wasn't deleted, it's invalid (possibly already consumed)
    if (!stateData || !wasDeleted) {
      console.warn(`[OAuth] Invalid or already-consumed state for provider: ${provider}`);
      return redirect(reply, `${frontendUrl}/login?error=oauth_invalid_state`);
    }
    
    // Now validate the consumed state data (TTL check)
    if (isStateExpired(stateData.createdAt)) {
      console.warn(`[OAuth] State expired for provider: ${provider}, age: ${Date.now() - stateData.createdAt}ms`);
      return redirect(reply, `${frontendUrl}/login?error=oauth_invalid_state`);
    }
    
    // Verify state matches provider
    if (stateData.provider !== provider) {
      console.warn(`[OAuth] State provider mismatch: expected ${stateData.provider}, got ${provider}`);
      return redirect(reply, `${frontendUrl}/login?error=oauth_invalid_state`);
    }
    
    // Validate code
    if (!code) {
      console.warn(`[OAuth] Missing authorization code for provider: ${provider}`);
      return redirect(reply, `${frontendUrl}/login?error=oauth_missing_code`);
    }
    
    // Get provider config
    const providerConfig = getProviderConfig(provider);
    if (!providerConfig) {
      return redirect(reply, `${frontendUrl}/login?error=oauth_not_configured`);
    }
    
    try {
      // Exchange code for tokens
      const redirectUri = `${config.BACKEND_URL}/auth/oauth/${provider}/callback`;
      const tokens = await exchangeCodeForToken(provider, code, redirectUri, providerConfig);
      
      // Fetch user profile
      let profile: OAuthUserProfile;
      if (provider === 'github') {
        profile = await fetchGitHubProfile(tokens.accessToken, httpClient);
      } else {
        profile = await fetchGoogleProfile(tokens.accessToken, httpClient);
      }
      
      console.log(`[OAuth] Profile fetched for provider: ${provider}, email: ${profile.email.substring(0, 3)}***, emailVerified: ${profile.emailVerified}`);
      
      // Find or create user (concurrency-safe)
      // Use findOrCreate pattern with unique constraint handling
      let user = await db.query.users.findFirst({
        where: eq(users.email, profile.email),
      });
      
      let isNewUser = false;
      
      if (!user) {
        // Create new user from OAuth
        // Determine status based on email verification (aligns with email/password policy)
        // Only set 'active' if provider verified the email; otherwise 'pending_verification'
        const initialStatus = profile.emailVerified ? 'active' : 'pending_verification';
        
        try {
          const [created] = await db
            .insert(users)
            .values({
              name: profile.name,
              email: profile.email,
              passwordHash: '', // OAuth users don't have a password
              status: initialStatus,
              emailVerified: profile.emailVerified,
              dataSharingConsent: null, // Will need to go through onboarding
              hasSeenBetaWelcome: false,
            })
            .returning();
          user = created;
          isNewUser = true;
          
          console.log(`[OAuth] New user created via ${provider}: ${user.id}, status: ${initialStatus}`);
        } catch (insertError: unknown) {
          // Handle race condition: if another request created the user concurrently,
          // catch the unique constraint violation and re-fetch the existing user
          const pgError = insertError as { code?: string };
          if (pgError.code === PG_UNIQUE_VIOLATION) {
            console.log(`[OAuth] Concurrent insert detected for email: ${profile.email.substring(0, 3)}***, re-fetching existing user`);
            user = await db.query.users.findFirst({
              where: eq(users.email, profile.email),
            });
            
            if (!user) {
              // This should not happen, but handle gracefully
              console.error(`[OAuth] User not found after unique constraint violation`);
              return redirect(reply, `${frontendUrl}/login?error=oauth_failed`);
            }
            // Continue with existing user (not a new user)
            isNewUser = false;
            // NOTE: Fall through to unified status validation below
          } else {
            // Re-throw other errors
            throw insertError;
          }
        }
      }
      
      // ========================================================================
      // UNIFIED EMAIL VERIFICATION & STATUS VALIDATION (applies to ALL paths)
      // This block runs for: new users, existing users, AND race-condition re-fetched users
      // Decision is based on user.status + profile.emailVerified, NOT on isNewUser
      // ========================================================================
      
      // Check user status first (consistent with email/password flow)
      if (user.status === 'disabled') {
        console.warn(`[OAuth] User ${user.id} is disabled`);
        return redirect(reply, `${frontendUrl}/login?error=account_disabled`);
      }
      if (user.status === 'deleted') {
        console.warn(`[OAuth] User ${user.id} is deleted`);
        return redirect(reply, `${frontendUrl}/login?error=account_not_found`);
      }
      
      // Handle pending_verification status (applies to new AND existing users)
      // This is the key fix: even if race condition sets isNewUser=false, this check still runs
      if (user.status === 'pending_verification') {
        if (profile.emailVerified) {
          // Provider verified email, upgrade user to active
          await db
            .update(users)
            .set({ 
              status: 'active', 
              emailVerified: true, 
              updatedAt: new Date() 
            })
            .where(eq(users.id, user.id));
          user = { ...user, status: 'active', emailVerified: true };
          console.log(`[OAuth] User ${user.id} upgraded from pending_verification to active via ${provider}`);
        } else {
          // Provider did not verify email - CANNOT proceed (consistent with email/password)
          // This applies to ALL paths: new user, existing user, OR race-condition re-fetch
          console.warn(`[OAuth] User ${user.id} has pending_verification status and OAuth provider did not verify email`);
          // Do NOT link OAuth account or create session for unverified users
          return redirect(reply, `${frontendUrl}/login?error=email_not_verified`);
        }
      } else if (profile.emailVerified && !user.emailVerified) {
        // Update email verified status if provider confirms it (for active users)
        await db
          .update(users)
          .set({ emailVerified: true, updatedAt: new Date() })
          .where(eq(users.id, user.id));
        user = { ...user, emailVerified: true };
      }
      
      console.log(`[OAuth] User validation passed for ${user.id}, isNewUser: ${isNewUser}, status: ${user.status}`);
      
      // Link OAuth account if not already linked
      const existingOAuthAccount = await db.query.oauthAccounts.findFirst({
        where: and(
          eq(oauthAccounts.userId, user.id),
          eq(oauthAccounts.provider, provider as 'github' | 'google')
        ),
      });
      
      if (!existingOAuthAccount) {
        // Create new OAuth account link
        await db.insert(oauthAccounts).values({
          userId: user.id,
          provider: provider as 'github' | 'google',
          providerAccountId: profile.id,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenExpiresAt: tokens.expiresIn 
            ? new Date(Date.now() + tokens.expiresIn * 1000)
            : undefined,
        });
        
        console.log(`[OAuth] Account linked for user ${user.id} with provider ${provider}`);
      } else {
        // Update existing OAuth account tokens
        await db
          .update(oauthAccounts)
          .set({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken ?? existingOAuthAccount.refreshToken,
            tokenExpiresAt: tokens.expiresIn 
              ? new Date(Date.now() + tokens.expiresIn * 1000)
              : existingOAuthAccount.tokenExpiresAt,
            updatedAt: new Date(),
          })
          .where(eq(oauthAccounts.id, existingOAuthAccount.id));
      }
      
      // Generate JWT and set session cookie (same as normal login)
      const jwt = await sign({
        sub: user.id,
        email: user.email,
        name: user.name,
      });
      
      reply.setCookie(env.AUTH_COOKIE_NAME, jwt, cookieOpts);
      
      // Determine redirect based on onboarding gates (same as normal login)
      let redirectPath = '/dashboard';
      
      if (user.dataSharingConsent === null) {
        redirectPath = '/auth/privacy-consent';
      } else if (!user.hasSeenBetaWelcome) {
        redirectPath = '/auth/welcome-beta';
      }
      
      console.log(`[OAuth] Login successful for user ${user.id}, isNewUser: ${isNewUser}, redirecting to: ${redirectPath}`);
      
      return redirect(reply, `${frontendUrl}${redirectPath}`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(`[OAuth] Callback error for provider ${provider}: ${errorMessage}`);
      
      // Map specific errors to user-friendly error codes
      let errorCode = 'oauth_failed';
      
      if (errorMessage === 'OAUTH_MISSING_EMAIL') {
        errorCode = 'oauth_missing_email';
        console.error(`[OAuth] ${provider} user has no accessible email. User may need to:`);
        console.error(`  - Set a public email in their ${provider} profile`);
        console.error(`  - Grant email permission (user:email scope for GitHub)`);
        console.error(`  - Revoke and re-authorize the OAuth app`);
      } else if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
        // PostgreSQL error when oauth_accounts table is missing
        errorCode = 'oauth_db_not_migrated';
        console.error(`[OAuth] Database migration required! Run: cd backend && pnpm db:migrate`);
        console.error(`[OAuth] Missing table: oauth_accounts (migration 0007_modern_nova.sql)`);
      } else if (errorMessage.includes('23505')) {
        // Unique constraint violation - race condition (should be handled, but just in case)
        errorCode = 'oauth_failed';
      }
      
      return redirect(reply, `${frontendUrl}/login?error=${errorCode}`);
    }
  });
}
