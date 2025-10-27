/**
 * GitHub Repos API (App-Aware)
 * GET /api/github/repos - List repositories
 * 
 * Automatically routes to:
 * - GitHub App: /installation/repositories
 * - OAuth (dev): /user/repos
 * 
 * Returns normalized repo list + source info
 */

import { NextRequest, NextResponse } from 'next/server';
import { listRepos } from '@/modules/github/operations';
import { logger } from '@/lib/utils/logger';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    // Get query params
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const perPage = parseInt(req.nextUrl.searchParams.get('perPage') || '30');

    logger.info('ReposAPI', `[${requestId}] Listing repos (page: ${page}, perPage: ${perPage})`);

    // List repos (token provider handles App vs OAuth automatically)
    const result = await listRepos({
      page,
      perPage,
      correlationId: requestId,
    });

    if (!result.success) {
      // Return structured error with actionable info
      const status = 'status' in result ? result.status || 500 : 500;
      logger.error('ReposAPI', `[${requestId}] ❌ ${status}: ${result.error}`);
      
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
          details: 'details' in result ? result.details : undefined,
          requestId,
        },
        { status }
      );
    }

    // Success response with source info
    logger.info(
      'ReposAPI',
      `[${requestId}] ✅ ${result.data.repositories.length} repos (source: ${result.data.source})`
    );

    return NextResponse.json({
      ok: true,
      data: result.data.repositories,
      source: result.data.source,
      pagination: {
        page,
        perPage,
        totalCount: result.data.totalCount,
        hasNextPage: result.data.hasNextPage,
        nextPage: result.data.nextPage,
      },
      rateLimit: result.rateLimit,
      requestId,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    logger.error('ReposAPI', `[${requestId}] ❌ Exception: ${errorMessage}`);
    
    return NextResponse.json(
      { 
        ok: false, 
        error: errorMessage,
        requestId,
      },
      { status: 500 }
    );
  }
}

