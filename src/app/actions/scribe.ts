"use server";

import "server-only";

/**
 * AKIS Scribe Agent - Server Actions
 * 
 * These server actions provide a type-safe, secure way for client components
 * to trigger Scribe Agent workflows without importing server-only modules.
 * 
 * Usage in client components:
 * ```tsx
 * import { runScribeAction } from '@/app/actions/scribe';
 * 
 * const result = await runScribeAction({
 *   repo: 'owner/repo',
 *   branch: 'main',
 *   accessToken: token
 * });
 * ```
 */

import { runScribeServer, ScribeRunnerInput, ScribeRunnerOutput } from '@/modules/agents/scribe/server/runner.server';
import { logger } from "@/shared/lib/utils/logger";
import { resolveActorOrFallback } from "@/shared/lib/auth/actor";

export interface RunScribeActionInput {
  repo: string; // Format: "owner/repo"
  branch?: string; // Base branch (e.g., "main")
  workingBranch?: string; // Working branch for commits (e.g., "docs/my-branch")
  scope?: 'readme' | 'getting-started' | 'api' | 'changelog' | 'all';
  accessToken?: string; // Optional - GitHub App token will be used if not provided
  dryRun?: boolean;
  options?: {
    skipValidation?: boolean;
    autoMergeDAS?: number;
    allowLowDAS?: boolean;
    forceCommit?: boolean;
  };
}

/**
 * Run AKIS Scribe Agent workflow
 * Server Action - can be called from client components
 */
export async function runScribeAction(input: RunScribeActionInput): Promise<ScribeRunnerOutput> {
  // Generate correlation ID for request tracking
  const requestId = `scribe-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  
  logger.info('ScribeAction', `[${requestId}] Starting Scribe workflow for ${input.repo}`);

  // Parse owner/repo
  const [owner, repo] = input.repo.split('/');
  if (!owner || !repo) {
    logger.error('ScribeAction', `[${requestId}] Invalid repo format: ${input.repo}`);
    return {
      success: false,
      repoUrl: input.repo,
      branchName: '',
      artifacts: {},
      logs: [],
      errors: ['Invalid repository format. Expected "owner/repo"'],
    };
  }

  try {
    // Resolve Actor (with app_bot fallback)
    let actor;
    try {
      actor = resolveActorOrFallback({
        correlationId: requestId,
        installationId: parseInt(process.env.GITHUB_APP_INSTALLATION_ID || '0', 10) || undefined,
      });
    } catch (actorError: any) {
      logger.error('ScribeAction', `[${requestId}] Actor resolution failed: ${actorError.message}`);
      return {
        success: false,
        repoUrl: `https://github.com/${owner}/${repo}`,
        branchName: '',
        artifacts: {},
        logs: [],
        errors: [`Authentication required: ${actorError.message}`],
      };
    }

    const runnerInput: ScribeRunnerInput = {
      repoOwner: owner,
      repoName: repo,
      baseBranch: input.branch || 'main',
      workingBranch: input.workingBranch, // Pass through the selected working branch
      scope: input.scope || 'readme',
      accessToken: input.accessToken || '', // Use OAuth token if provided, otherwise empty (GitHub App token will be used)
      actor,
      options: {
        ...input.options,
        // Dry run: skip PR creation
        skipValidation: input.dryRun || input.options?.skipValidation,
      },
    };

    const result = await runScribeServer(runnerInput, requestId);
    
    logger.info('ScribeAction', `[${requestId}] Workflow completed: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    
    return result;
  } catch (error: any) {
    logger.error('ScribeAction', `[${requestId}] Fatal error: ${error.message}`);
    
    return {
      success: false,
      repoUrl: `https://github.com/${owner}/${repo}`,
      branchName: '',
      artifacts: {},
      logs: [],
      errors: [error.message || 'Unknown server error'],
    };
  }
}

