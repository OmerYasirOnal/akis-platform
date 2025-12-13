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

type User = typeof users.$inferSelect;

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

// State storage for CSRF protection (in-memory for now, could use Redis in production)
const oauthStateStore = new Map<string, { provider: string; createdAt: number }>();

// Cleanup expired states (older than 10 minutes)
function cleanupExpiredStates() {
  const now = Date.now();
  const maxAge = 10 * 60 * 1000; // 10 minutes
  for (const [state, data] of oauthStateStore.entries()) {
    if (now - data.createdAt > maxAge) {
      oauthStateStore.delete(state);
    }
  }
}

// Helper to sanitize user data (matches existing pattern)
const sanitizeUser = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  status: user.status,
  emailVerified: user.emailVerified,
  dataSharingConsent: user.dataSharingConsent,
  hasSeenBetaWelcome: user.hasSeenBetaWelcome,
});

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
  
  // GitHub may not return email in user endpoint, need to fetch from emails endpoint
  let email = userData.email;
  let emailVerified = false;
  
  if (!email) {
    const emailResponse = await httpClient.get('https://api.github.com/user/emails', accessToken);
    if (emailResponse.ok) {
      const emails = await emailResponse.json() as Array<{ email: string; primary: boolean; verified: boolean }>;
      // Find primary verified email
      const primaryEmail = emails.find(e => e.primary && e.verified) || emails.find(e => e.verified) || emails[0];
      if (primaryEmail) {
        email = primaryEmail.email;
        emailVerified = primaryEmail.verified;
      }
    }
  } else {
    emailVerified = true; // If email is returned in user endpoint, consider it verified
  }
  
  if (!email) {
    throw new Error('No email available from GitHub account');
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

// Mark sanitizeUser as used (for future response needs)
void sanitizeUser;

// Helper for HTTP redirects (Fastify doesn't have built-in redirect)
function redirect(reply: FastifyReply, url: string) {
  return reply.header('Location', url).code(302).send();
}

export async function registerOAuthRoutes(fastify: FastifyInstance) {
  const httpClient = new HttpClient({ timeout: 10000, retries: 2 });
  const config = getEnv();
  
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
        error: 'Invalid OAuth provider',
        code: 'INVALID_PROVIDER',
      });
    }
    
    // Get provider config
    const providerConfig = getProviderConfig(provider);
    if (!providerConfig) {
      return reply.code(503).send({
        error: `${provider} OAuth is not configured`,
        code: 'OAUTH_NOT_CONFIGURED',
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
    
    console.log(`[OAuth] Flow initiated for provider: ${provider}, state: ${state.substring(0, 8)}...`);
    
    return redirect(reply, authUrl);
  });
  
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
    
    // Validate state
    if (!state || !oauthStateStore.has(state)) {
      console.warn(`[OAuth] Invalid or missing state for provider: ${provider}`);
      return redirect(reply, `${frontendUrl}/login?error=oauth_invalid_state`);
    }
    
    const stateData = oauthStateStore.get(state)!;
    oauthStateStore.delete(state); // One-time use
    
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
      
      // Find or create user
      let user = await db.query.users.findFirst({
        where: eq(users.email, profile.email),
      });
      
      let isNewUser = false;
      
      if (!user) {
        // Create new user from OAuth
        isNewUser = true;
        const [created] = await db
          .insert(users)
          .values({
            name: profile.name,
            email: profile.email,
            passwordHash: '', // OAuth users don't have a password
            status: 'active', // OAuth users are active immediately
            emailVerified: profile.emailVerified,
            dataSharingConsent: null, // Will need to go through onboarding
            hasSeenBetaWelcome: false,
          })
          .returning();
        user = created;
        
        console.log(`[OAuth] New user created via ${provider}: ${user.id}`);
      } else {
        // Check user status first (consistent with email/password flow in auth.multi-step.ts:289-309)
        if (user.status === 'disabled') {
          return redirect(reply, `${frontendUrl}/login?error=account_disabled`);
        }
        if (user.status === 'deleted') {
          return redirect(reply, `${frontendUrl}/login?error=account_not_found`);
        }
        
        // Handle pending_verification status
        // If OAuth provider confirms email, upgrade to active; otherwise reject
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
            // Provider did not verify email, reject login (consistent with email/password)
            console.warn(`[OAuth] User ${user.id} has pending_verification status and OAuth provider did not verify email`);
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
        
        console.log(`[OAuth] Existing user logged in via ${provider}: ${user.id}`);
      }
      
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
      return redirect(reply, `${frontendUrl}/login?error=oauth_failed`);
    }
  });
}
