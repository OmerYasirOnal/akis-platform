/**
 * Agent Info API
 * GET /api/agent/info?agentId=document-agent-001
 * Agent'ın contract ve playbook bilgilerini döner
 */

import { NextRequest, NextResponse } from 'next/server';
import { documentAgentV2 } from "@/modules/documentation/agent/document-agent-v2";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const agentId = searchParams.get('agentId');

    // Şu an sadece document agent var
    if (!agentId || agentId === 'document-agent-001') {
      const info = documentAgentV2.getInfo();
      
      return NextResponse.json({
        success: true,
        agent: info,
      });
    }

    return NextResponse.json(
      { error: 'Agent bulunamadı' },
      { status: 404 }
    );

  } catch (error) {
    console.error('Agent info error:', error);
    return NextResponse.json(
      { error: 'Bilgi alınamadı' },
      { status: 500 }
    );
  }
}

