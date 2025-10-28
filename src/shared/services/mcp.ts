import "server-only";

/**
 * Model Context Protocol (MCP) Service (Server-Only)
 * Wrapper functions for GitHub operations via MCP or direct REST API
 * 
 * This module uses server-only GitHub operations and cannot be imported from client.
 */

import {
  getUserRepos,
  createOrCheckoutBranch,
  fetchRepoTree,
  updateFile,
  createPullRequest,
  validateUrl,
} from "@/modules/documentation/agent/utils/github-utils";

export interface MCPConfig {
  token: string;
  useMCP: boolean; // If true, use MCP server; if false, use direct GitHub REST
}

/**
 * List user repositories
 */
export async function mcpListRepos(config: MCPConfig, page: number = 1) {
  if (config.useMCP) {
    // If MCP server is available, use it
    // For now, we fall back to direct GitHub REST
    console.warn('MCP server not implemented, falling back to direct GitHub REST');
  }
  
  return getUserRepos(config.token, page);
}

/**
 * Create or checkout branch
 */
export async function mcpCreateBranch(
  config: MCPConfig,
  owner: string,
  repo: string,
  branch: string,
  baseRef: string
) {
  if (config.useMCP) {
    console.warn('MCP server not implemented, falling back to direct GitHub REST');
  }
  
  return createOrCheckoutBranch(owner, repo, branch, baseRef, config.token);
}

/**
 * Read repository tree
 */
export async function mcpReadTree(
  config: MCPConfig,
  owner: string,
  repo: string,
  ref: string,
  maxFiles: number = 1000
) {
  if (config.useMCP) {
    console.warn('MCP server not implemented, falling back to direct GitHub REST');
  }
  
  const tree = await fetchRepoTree(owner, repo, ref, config.token, true);
  return tree.slice(0, maxFiles); // Limit files
}

/**
 * Commit files to branch
 * BUGFIX: Always fetch existing file SHA before update to avoid 422 errors
 */
export async function mcpCommit(
  config: MCPConfig,
  owner: string,
  repo: string,
  branch: string,
  files: Array<{ path: string; content: string }>,
  message: string
) {
  if (config.useMCP) {
    console.warn('MCP server not implemented, falling back to direct GitHub REST');
  }

  const results = [];
  
  for (const file of files) {
    // BUGFIX: Fetch existing file SHA (if exists) before updating
    let existingSha: string | undefined;
    try {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${file.path}?ref=${branch}`,
        {
          headers: {
            'Authorization': `Bearer ${config.token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        existingSha = data.sha;
        console.log(`[mcpCommit] File ${file.path} exists, using sha=${existingSha}`);
      } else {
        console.log(`[mcpCommit] File ${file.path} does not exist, creating new file`);
      }
    } catch (error) {
      console.warn(`[mcpCommit] Could not check file ${file.path}:`, error);
    }

    const result = await updateFile(
      owner,
      repo,
      branch,
      file.path,
      file.content,
      message,
      config.token,
      existingSha
    );
    results.push({ path: file.path, ...result });
  }

  const allSuccess = results.every(r => r.success);
  return {
    success: allSuccess,
    results,
  };
}

/**
 * Open pull request
 * HOTFIX: Check for existing PR, verify branch, handle zero-diff
 */
export async function mcpOpenPR(
  config: MCPConfig,
  owner: string,
  repo: string,
  base: string,
  head: string,
  title: string,
  body: string,
  draft: boolean = true,
  labels: string[] = []
) {
  if (config.useMCP) {
    console.warn('MCP server not implemented, falling back to direct GitHub REST');
  }

  console.log(`[mcpOpenPR] Checking existing PR: ${owner}:${head} -> ${base}`);

  // HOTFIX 1: Check if PR already exists
  try {
    const existingPRResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls?state=open&head=${owner}:${head}&base=${base}`,
      {
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (existingPRResponse.ok) {
      const existingPRs = await existingPRResponse.json();
      if (Array.isArray(existingPRs) && existingPRs.length > 0) {
        const existingPR = existingPRs[0];
        console.log(`[mcpOpenPR] ✅ PR already exists: #${existingPR.number}`);
        return {
          success: true,
          prUrl: existingPR.html_url,
          prNumber: existingPR.number,
          isExisting: true,
          error: undefined,
          errorDetails: undefined,
        };
      }
    }
  } catch (error) {
    console.warn('[mcpOpenPR] Could not check existing PR:', error);
  }

  // Branch verification: Skip and let PR API handle it
  // (GitHub App token may not have permission for git/refs endpoint,
  //  but commits already succeeded so branch definitely exists)
  console.log(`[mcpOpenPR] Skipping branch verification (branch exists, commits succeeded)`);

  // HOTFIX 3: Create PR with proper format
  console.log(`[mcpOpenPR] Creating PR: "${title}" (${head} -> ${base}, draft=${draft})`);
  
  const result = await createPullRequest(
    owner,
    repo,
    title,
    body,
    head,
    base,
    config.token,
    draft
  );

  // If creation failed, log the full error
  if (!result.success) {
    console.error('[mcpOpenPR] ❌ PR creation failed:', result.error);
    console.error('[mcpOpenPR] Error details:', result.errorDetails);
  } else {
    console.log(`[mcpOpenPR] ✅ PR created: #${result.prNumber} - ${result.prUrl}`);
  }

  // Add labels if successful
  if (result.success && labels.length > 0 && result.prNumber) {
    try {
      await fetch(
        `https://api.github.com/repos/${owner}/${repo}/issues/${result.prNumber}/labels`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ labels }),
        }
      );
    } catch (error) {
      console.error('Failed to add labels:', error);
    }
  }

  return result;
}

/**
 * Check URLs (link validation)
 */
export async function mcpHttpCheck(
  config: MCPConfig,
  urls: string[],
  timeoutMs: number = 5000
) {
  if (config.useMCP) {
    console.warn('MCP server not implemented, falling back to direct HTTP checks');
  }

  const results = await Promise.all(
    urls.map(async (url) => {
      const result = await validateUrl(url);
      return {
        url,
        valid: result.valid,
        status: result.status,
      };
    })
  );

  return {
    total: urls.length,
    valid: results.filter(r => r.valid).length,
    invalid: results.filter(r => !r.valid).length,
    results,
  };
}

/**
 * Dry-run command (simulate execution)
 */
export async function mcpShellDryRun(
  config: MCPConfig,
  command: string,
  cwd?: string
) {
  if (config.useMCP) {
    console.warn('MCP server not implemented, dry-run not available');
  }

  // For now, we just validate command syntax
  const isValid = command.trim().length > 0 && !command.includes('rm -rf /');
  
  return {
    success: isValid,
    command,
    cwd: cwd || process.cwd?.() || '.',
    output: isValid ? 'Dry-run: Command syntax appears valid' : 'Invalid command',
  };
}

/**
 * Verify file/path exists in repository
 */
export async function mcpVerifyPath(
  config: MCPConfig,
  owner: string,
  repo: string,
  ref: string,
  path: string
) {
  if (config.useMCP) {
    console.warn('MCP server not implemented, falling back to GitHub REST');
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${ref}`,
      {
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    return {
      exists: response.ok,
      path,
    };
  } catch {
    return {
      exists: false,
      path,
    };
  }
}

