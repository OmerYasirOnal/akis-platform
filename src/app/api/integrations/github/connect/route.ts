/**
 * GitHub OAuth Init
 * POST /api/integrations/github/connect
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID gerekli' },
        { status: 400 }
      );
    }

    // GitHub OAuth URL oluştur
    const clientId = process.env.GITHUB_CLIENT_ID;
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'GitHub OAuth yapılandırılmamış' },
        { status: 500 }
      );
    }

    const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/integrations/github/callback`;
    const scope = 'repo,user,read:org';
    const state = Buffer.from(JSON.stringify({ userId })).toString('base64');

    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;

    return NextResponse.json({
      success: true,
      authUrl,
    });

  } catch (error) {
    console.error('GitHub OAuth init error:', error);
    return NextResponse.json(
      { error: 'OAuth başlatılamadı' },
      { status: 500 }
    );
  }
}

