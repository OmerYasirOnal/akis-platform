/**
 * GitHub Integration Disconnect
 * POST /api/integrations/github/disconnect
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

    // Cookie'yi temizle
    const response = NextResponse.json({ success: true });
    response.cookies.delete('github_integration');

    return response;

  } catch (error) {
    console.error('GitHub disconnect error:', error);
    return NextResponse.json(
      { error: 'Bağlantı kaldırılamadı' },
      { status: 500 }
    );
  }
}

