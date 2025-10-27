/**
 * GitHub OAuth Callback Handler (DEPRECATED)
 * Yeni callback: /api/integrations/github/callback
 * GET /api/github/connect
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  // Redirect to new endpoint
  return NextResponse.redirect(new URL('/api/integrations/github/callback', req.url));
}

// Eski kod - deprecated
export async function GET_OLD(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect('/dashboard?error=github_auth_failed');
  }

  try {
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

    // TODO: Veritabanına kaydet
    // Şimdilik session/cookie'ye kaydet
    const response = NextResponse.redirect(new URL('/dashboard', req.url));
    
    // Cookie'ye GitHub token'ı kaydet (production'da daha güvenli yöntem kullanın)
    response.cookies.set('github_token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    response.cookies.set('github_user', JSON.stringify({
      id: userData.id,
      login: userData.login,
      name: userData.name,
      avatar_url: userData.avatar_url,
    }), {
      httpOnly: false, // Client'da okumak için
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;

  } catch (error) {
    console.error('GitHub OAuth error:', error);
    return NextResponse.redirect(
      new URL('/dashboard?error=github_connection_failed', req.url)
    );
  }
}

