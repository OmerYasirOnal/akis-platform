/**
 * GitHub OAuth Callback
 * GET /api/integrations/github/callback
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuthStorage } from '@/lib/auth/storage';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/profile?error=github_auth_failed', req.url)
    );
  }

  try {
    // State'den userId'yi al
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    const userId = stateData.userId;

    // GitHub OAuth token exchange
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      throw new Error(tokenData.error_description || 'GitHub auth failed');
    }

    // Kullanıcı bilgilerini al
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();

    // Integration'ı kaydet (localStorage'a - production'da database olacak)
    if (typeof window !== 'undefined') {
      // Bu kod server-side çalışır, client-side'a yönlendireceğiz
      // Token'ı cookie'ye kaydet
      const response = NextResponse.redirect(
        new URL('/profile?github_connected=success', req.url)
      );

      // GitHub integration bilgilerini cookie'ye kaydet (geçici)
      response.cookies.set('github_integration', JSON.stringify({
        userId,
        provider: 'github',
        connected: true,
        accessToken: tokenData.access_token,
        metadata: {
          id: userData.id,
          login: userData.login,
          name: userData.name,
          avatar_url: userData.avatar_url,
          email: userData.email,
        },
        connectedAt: new Date().toISOString(),
      }), {
        httpOnly: false, // Client tarafında okuyabilmek için
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });

      return response;
    }

    return NextResponse.redirect(
      new URL('/profile?github_connected=success', req.url)
    );

  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/profile?error=github_connection_failed', req.url)
    );
  }
}

