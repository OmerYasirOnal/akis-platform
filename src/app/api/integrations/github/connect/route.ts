/**
 * GitHub OAuth Init with PKCE (S256)
 * POST /api/integrations/github/connect
 * 
 * Part of Phase 2: Security Hardening (Gate-B requirement)
 */

import { NextRequest, NextResponse } from 'next/server';
import { generatePKCEPair, storeOAuthState, generateOAuthState } from '@/server/security/pkce';
import { validateCSRF } from '@/server/middleware/csrf';
import { createSecureLogger } from '@/server/security/redact';

export const runtime = 'nodejs';

const logger = createSecureLogger('oauth-connect');

export async function POST(req: NextRequest) {
  try {
    // Validate CSRF token
    const csrfError = await validateCSRF(req);
    if (csrfError) {
      return csrfError;
    }

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    // Check GitHub OAuth config
    const clientId = process.env.GITHUB_APP_CLIENT_ID || process.env.GITHUB_CLIENT_ID;
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'GitHub OAuth not configured' },
        { status: 500 }
      );
    }

    // Generate PKCE pair (S256)
    const { codeVerifier, codeChallenge, codeChallengeMethod } = generatePKCEPair();
    
    // Generate OAuth state
    const state = generateOAuthState();
    
    // Store state + PKCE verifier (10 min TTL)
    storeOAuthState(state, codeVerifier, codeChallenge);
    
    logger.info('OAuth flow initiated', {
      userId,
      state: `${state.slice(0, 8)}...`,
      hasPKCE: true,
    });

    // Build OAuth URL with PKCE
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/integrations/github/callback`;
    const scope = 'repo,user:email,read:org';

    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', codeChallengeMethod);

    return NextResponse.json({
      success: true,
      authUrl: authUrl.toString(),
      state, // Return state for client-side verification (optional)
    });

  } catch (error) {
    logger.error('OAuth init error', { error });
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
}
