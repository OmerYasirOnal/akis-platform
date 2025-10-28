/**
 * GitHub Branch API
 * POST /api/github/branch - Create or checkout branch
 * 
 * Supports both OAuth (user token) and GitHub App modes
 */

import { NextRequest, NextResponse } from 'next/server';
import { CreateBranchRequestSchema, type CreateBranchResponse, type ValidationErrorResponse } from '@/shared/types/contracts/github-branch';
import { createBranch, checkBranchExists } from '@/modules/github/operations';
import { logger } from "@/shared/lib/utils/logger";

export const runtime = 'nodejs';

export async function POST(req: NextRequest): Promise<NextResponse<CreateBranchResponse | ValidationErrorResponse>> {
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    // Parse and validate request body
    const body = await req.json();
    
    logger.info('BranchAPI', `[${requestId}] Received request with keys: ${Object.keys(body).join(', ')}`);
    
    const validation = CreateBranchRequestSchema.safeParse(body);
    
    if (!validation.success) {
      const issues = validation.error.issues.map(issue => ({
        path: issue.path.map(String),
        message: issue.message,
      }));
      
      logger.error('BranchAPI', `[${requestId}] Validation failed:`, issues);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed: ' + issues.map(i => i.message).join(', '),
          issues,
        },
        { status: 400 }
      );
    }

    const { owner, repo, branchName, baseBranch, accessToken } = validation.data;

    logger.info('BranchAPI', `[${requestId}] Creating/checking branch "${branchName}" for ${owner}/${repo} (base: ${baseBranch || 'default'})`);

    // Check if branch exists
    const existsResult = await checkBranchExists(owner, repo, branchName, {
      userToken: accessToken,
      repo: { owner, name: repo },
      correlationId: requestId,
    });

    if (existsResult.success && existsResult.data.exists) {
      logger.info('BranchAPI', `[${requestId}] ✅ Branch already exists (idempotent): ${branchName}`);
      
      return NextResponse.json({
        success: true,
        action: 'exists',
        sha: existsResult.data.sha,
        message: `Branch "${branchName}" already exists`,
      });
    }

    // Create new branch
    logger.info('BranchAPI', `[${requestId}] Creating new branch...`);
    
    const createResult = await createBranch(owner, repo, branchName, {
      userToken: accessToken,
      repo: { owner, name: repo },
      baseBranch,
      correlationId: requestId,
    });

    if (!createResult.success) {
      const errorMsg = 'error' in createResult ? createResult.error : 'Unknown error';
      logger.error('BranchAPI', `[${requestId}] ❌ Failed to create branch: ${errorMsg}`);
      
      return NextResponse.json(
        {
          success: false,
          action: 'error',
          error: errorMsg,
        },
        { status: 500 }
      );
    }

    // Get the new branch SHA
    const newCheckResult = await checkBranchExists(owner, repo, branchName, {
      userToken: accessToken,
      repo: { owner, name: repo },
      correlationId: requestId,
    });

    const sha = newCheckResult.success ? newCheckResult.data.sha : undefined;

    logger.info('BranchAPI', `[${requestId}] ✅ Branch created successfully: ${branchName}`);

    return NextResponse.json({
      success: true,
      action: 'created',
      sha,
      message: `Branch "${branchName}" created successfully`,
    });
  } catch (error: any) {
    logger.error('BranchAPI', `[${requestId}] ❌ Exception: ${error.message}`);
    
    return NextResponse.json(
      {
        success: false,
        action: 'error',
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

