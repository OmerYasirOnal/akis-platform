/**
 * Documentation Agent - Info Endpoint
 * GET /api/agent/documentation/info
 */

import { NextRequest, NextResponse } from 'next/server';
import { documentationAgent } from '@/lib/agents/documentation-agent';

export async function GET(req: NextRequest) {
  try {
    const info = documentationAgent.getInfo();

    return NextResponse.json({
      success: true,
      agent: info,
      playbook: {
        mission: documentationAgent['playbook'].mission,
        examples: documentationAgent['playbook'].examples,
        constraints: documentationAgent['playbook'].constraints,
      },
    });
  } catch (error: any) {
    console.error('Documentation Agent info error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

