/**
 * AKIS Scribe Agent API Route
 * POST /api/agent/scribe/run
 * 
 * Fallback API endpoint for running Scribe Agent workflow.
 * Use server actions (runScribeAction) when possible for better type safety.
 */

import { NextRequest, NextResponse } from 'next/server';
import { runScribeServer, ScribeRunnerInput } from '@/modules/agents/scribe/server/runner.server';
import { logger } from "@/shared/lib/utils/logger";

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

export async function POST(req: NextRequest) {
  const requestId = `scribe-api-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  
  try {
    const body: Partial<ScribeRunnerInput> = await req.json();
    
    logger.info('ScribeAPI', `[${requestId}] Request received`);

    // Validation
    if (!body.repoOwner || !body.repoName || !body.accessToken) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: repoOwner, repoName, accessToken',
          },
        },
        { status: 400 }
      );
    }

    const input: ScribeRunnerInput = {
      repoOwner: body.repoOwner,
      repoName: body.repoName,
      baseBranch: body.baseBranch || 'main',
      scope: body.scope || 'readme',
      accessToken: body.accessToken,
      options: body.options,
    };

    const result = await runScribeServer(input, requestId);

    logger.info('ScribeAPI', `[${requestId}] Workflow completed: ${result.success ? 'SUCCESS' : 'FAILED'}`);

    return NextResponse.json(
      { ok: true, data: result },
      { status: 200 }
    );
  } catch (error: any) {
    logger.error('ScribeAPI', `[${requestId}] Fatal error: ${error.message}`);
    
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'SCRIBE_FAIL',
          message: error.message || 'Internal server error',
        },
      },
      { status: 500 }
    );
  }
}

