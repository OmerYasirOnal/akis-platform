/**
 * GitHub File Upsert Helper
 * 
 * Provides idempotent file create/update operations with proper SHA detection,
 * retry logic, and detailed logging.
 * 
 * Fixes the 422 "sha wasn't supplied" error by:
 * 1. Checking if file exists on the target branch
 * 2. Including SHA when updating existing files
 * 3. Omitting SHA when creating new files
 * 4. Retrying on transient errors (404, 409, 422, 502, 503)
 */

import { createGitHubClient, GitHubClientOptions } from './client';
import { logger } from "@/shared/lib/utils/logger";

export interface UpsertFileOptions {
  // GitHub authentication (via GitHubClientOptions fields)
  userToken?: string;
  correlationId?: string;
  
  // Repository info
  owner: string;
  repo: string;
  
  // File operation params
  branch: string; // REQUIRED – target branch for commit
  path: string; // e.g., "README.md" or "docs/GUIDE.md"
  content: string; // Plain text content (will be base64-encoded)
  message: string; // Commit message
  author?: { name: string; email: string };
  committer?: { name: string; email: string };
  retries?: number; // Max retry attempts (default: 3)
}

export interface UpsertFileResult {
  success: boolean;
  mode: 'create' | 'update';
  sha: string;
  path: string;
  branch: string;
  error?: string;
}

/**
 * Wait for a newly created branch ref to become visible
 * (GitHub's eventual consistency may cause 404s immediately after branch creation)
 */
async function waitForRefVisible(
  client: ReturnType<typeof createGitHubClient>,
  owner: string,
  repo: string,
  branch: string,
  maxAttempts: number = 3
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const result = await client.get(`/repos/${owner}/${repo}/git/ref/heads/${branch}`);
      if (result.success) {
        logger.info('Upsert', `✅ Ref heads/${branch} is visible`);
        return;
      }
    } catch (e) {
      // Ignore errors, will retry
    }
    
    if (i < maxAttempts - 1) {
      const delay = 250 * (i + 1); // 250ms, 500ms, 750ms
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  logger.warn('Upsert', `⚠️ Ref heads/${branch} may not be visible yet (continuing anyway)`);
}

/**
 * Idempotent file create/update operation
 * 
 * @param options - Upsert configuration
 * @returns Result with mode (create/update), sha, and any errors
 */
export async function upsertRepoContent(options: UpsertFileOptions): Promise<UpsertFileResult> {
  const {
    owner,
    repo,
    branch,
    path,
    content,
    message,
    author,
    committer,
    retries = 3,
    correlationId,
    userToken,
  } = options;

  const client = createGitHubClient({
    userToken,
    repo: { owner, name: repo },
  });

  const logPrefix = correlationId ? `[${correlationId}]` : '';
  
  logger.info('Upsert', `${logPrefix} Starting upsert: ${owner}/${repo}/${path} on ${branch}`);

  // Ensure branch ref is visible (wait after recent branch creation)
  await waitForRefVisible(client, owner, repo, branch);

  let attempt = 0;

  while (attempt <= retries) {
    try {
      // Step 1: Check if file exists on target branch
      let existingSha: string | undefined;
      let mode: 'create' | 'update' = 'create';

      try {
        logger.info('Upsert', `${logPrefix} Checking for existing file: ${path}?ref=${branch}`);
        const getResult = await client.get<any>(`/repos/${owner}/${repo}/contents/${path}?ref=${branch}`);
        
        if (getResult.success && !Array.isArray(getResult.data) && 'sha' in getResult.data) {
          existingSha = getResult.data.sha;
          mode = 'update';
          logger.info('Upsert', `${logPrefix} ✅ File exists, mode=update, sha=${existingSha?.substring(0, 7)}`);
        }
      } catch (e: any) {
        if (e?.status === 404 || (e?.response?.status === 404)) {
          logger.info('Upsert', `${logPrefix} File not found on branch ${branch}, mode=create`);
        } else {
          logger.warn('Upsert', `${logPrefix} Could not check existing file: ${e?.message || e}`);
        }
      }

      // Step 2: PUT with explicit branch and conditional sha
      const contentBase64 = Buffer.from(content).toString('base64');
      const body: any = {
        message,
        content: contentBase64,
        branch, // CRITICAL: Always specify target branch
        ...(existingSha ? { sha: existingSha } : {}),
        ...(author ? { author } : {}),
        ...(committer ? { committer } : {}),
      };

      logger.info('Upsert', `${logPrefix} PUT ${path} (mode=${mode}, branch=${branch}, sha=${existingSha ? 'included' : 'none'})`);
      
      const putResult = await client.put<any>(`/repos/${owner}/${repo}/contents/${path}`, body);

      if (!putResult.success) {
        throw new Error(putResult.error || `PUT failed with status ${(putResult as any).status}`);
      }

      const newSha = putResult.data?.content?.sha || putResult.data?.sha || 'unknown';
      logger.info('Upsert', `${logPrefix} ✅ ${mode.toUpperCase()} successful: ${path} (sha=${newSha.substring(0, 7)})`);

      return {
        success: true,
        mode,
        sha: newSha,
        path,
        branch,
      };

    } catch (err: any) {
      const status = err?.status ?? err?.response?.status ?? 0;
      const errorMsg = err?.message || err?.response?.statusText || JSON.stringify(err);
      
      logger.error('Upsert', `${logPrefix} ❌ Attempt ${attempt + 1}/${retries + 1} failed: ${status} ${errorMsg}`);

      // Decide if error is retriable
      const retriable = [404, 409, 422, 502, 503].includes(status);
      
      if (retriable && attempt < retries) {
        const delay = 300 * Math.pow(2, attempt); // 300ms, 600ms, 1200ms
        logger.warn('Upsert', `${logPrefix} ⏳ Retrying in ${delay}ms (status=${status})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
        continue; // Retry loop
      }

      // Non-retriable or out of retries
      logger.error('Upsert', `${logPrefix} ❌ Upsert failed permanently: ${path}`);
      return {
        success: false,
        mode: 'create', // Default
        sha: '',
        path,
        branch,
        error: `${status}: ${errorMsg}`,
      };
    }
  }

  // Should never reach here, but TypeScript needs it
  return {
    success: false,
    mode: 'create',
    sha: '',
    path,
    branch,
    error: 'Max retries exceeded',
  };
}

/**
 * Batch upsert multiple files
 * 
 * @param files - Array of file configurations (each with path, content, message)
 * @param commonOptions - Shared options (owner, repo, branch, auth, etc.)
 * @returns Array of results for each file
 */
export async function upsertMultipleFiles(
  files: Array<{ path: string; content: string; message?: string }>,
  commonOptions: Omit<UpsertFileOptions, 'path' | 'content'>
): Promise<UpsertFileResult[]> {
  const results: UpsertFileResult[] = [];
  
  for (const file of files) {
    const result = await upsertRepoContent({
      ...commonOptions,
      path: file.path,
      content: file.content,
      message: file.message || commonOptions.message,
    });
    
    results.push(result);
  }
  
  return results;
}

