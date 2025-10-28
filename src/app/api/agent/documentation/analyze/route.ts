/**
 * Documentation Agent - Analyze Endpoint
 * POST /api/agent/documentation/analyze
 * 
 * FIXED: Auth guard with actionable CTAs
 */

import { NextRequest, NextResponse } from 'next/server';
import { documentationAgent } from "@/modules/documentation/agent/documentation-agent";
import type { DocumentationAgentInput } from "@/modules/documentation/agent/types";
import { getGitHubToken } from '@/modules/github/token-provider';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    if (!body.repoUrl) {
      return NextResponse.json(
        { success: false, error: 'repoUrl is required' },
        { status: 400 }
      );
    }

    // GitHub token from header (client-side passes it)
    const authHeader = req.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    // Auth Guard: Check if we have valid credentials
    const correlationId = Math.random().toString(36).substring(7);
    const tokenResult = await getGitHubToken({
      userToken: accessToken,
      correlationId,
    });

    // If no token available, return actionable response
    if ('error' in tokenResult) {
      return NextResponse.json(
        {
          success: false,
          error: tokenResult.error,
          actionable: tokenResult.actionable,
          requiresAuth: true,
        },
        { status: 401 }
      );
    }

    const input: DocumentationAgentInput = {
      action: body.action || 'full_workflow',
      repoUrl: body.repoUrl,
      branch: body.branch,
      scope: body.scope,
      accessToken: tokenResult.token, // Use validated token
      options: body.options,
    };

    // Execute agent
    const result = await documentationAgent.execute(input);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error('Documentation Agent error:', error);
    
    // Check if it's an auth error
    if (error.message?.includes('auth') || error.message?.includes('token')) {
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Authentication failed',
          actionable: {
            type: 'connect_oauth',
            message: 'GitHub authentication required. Please connect your GitHub account.',
            ctaText: 'Connect GitHub',
          },
          requiresAuth: true,
        },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// GET method for checking status
export async function GET(req: NextRequest) {
  return NextResponse.json({
    agent: 'Documentation Agent',
    version: '1.0.0',
    status: 'active',
    capabilities: [
      'repo_summary',
      'doc_gap_analysis',
      'generate_proposal',
      'validate_docs',
      'create_branch_pr',
      'full_workflow',
    ],
  });
}

