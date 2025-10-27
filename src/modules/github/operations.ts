import "server-only";

/**
 * GitHub API Operations
 * High-level operations for repositories, branches, files, and PRs
 * 
 * All operations use the central GitHubClient
 * NO hardcoded 'main' branch - always fetches default_branch
 */

import { createGitHubClient, GitHubClientOptions, GitHubResult } from './client';
import { getGitHubToken } from './token-provider';
import { logger } from '@/lib/utils/logger';

/**
 * Repository data structure
 */
export interface Repository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: {
    login: string;
    avatar_url?: string;
  };
  default_branch: string;
  description?: string;
  html_url: string;
  permissions?: {
    admin: boolean;
    push: boolean;
    pull: boolean;
  };
}

/**
 * Get repository default branch
 * CRITICAL: Use this instead of hardcoding 'main'
 */
export async function getDefaultBranch(
  owner: string,
  repo: string,
  options: GitHubClientOptions = {}
): Promise<GitHubResult<{ defaultBranch: string }>> {
  const client = createGitHubClient({
    ...options,
    repo: { owner, name: repo },
  });

  const result = await client.get<any>(`/repos/${owner}/${repo}`);
  
  if (!result.success) {
    return result;
  }

  const defaultBranch = result.data.default_branch || 'main'; // Fallback to 'main' only if API doesn't provide
  
  logger.info('GitHubOps', `Default branch for ${owner}/${repo}: ${defaultBranch}`);
  
  return {
    success: true,
    data: { defaultBranch },
  };
}

/**
 * Get repository information
 */
export async function getRepository(
  owner: string,
  repo: string,
  options: GitHubClientOptions = {}
): Promise<GitHubResult<any>> {
  const client = createGitHubClient({
    ...options,
    repo: { owner, name: repo },
  });

  return client.get(`/repos/${owner}/${repo}`);
}

/**
 * List repositories (App-aware)
 * 
 * Intelligently switches between:
 * - GitHub App: /installation/repositories (for installed repos)
 * - OAuth: /user/repos (for user-owned repos)
 * 
 * @returns Normalized repository list with source info
 */
export async function listRepos(
  options: GitHubClientOptions & {
    page?: number;
    perPage?: number;
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
  } = {}
): Promise<GitHubResult<{
  repositories: Repository[];
  source: 'github_app' | 'oauth' | 'none';
  totalCount?: number;
  hasNextPage?: boolean;
  nextPage?: number;
}>> {
  const { page = 1, perPage = 30, sort = 'updated', ...clientOptions } = options;
  const correlationId = clientOptions.correlationId || Math.random().toString(36).substring(7);

  // Determine token source
  const tokenResult = await getGitHubToken(clientOptions);

  if ('error' in tokenResult) {
    logger.error('GitHubOps', `[${correlationId}] ❌ listRepos: No token available`);
    return {
      success: false,
      error: tokenResult.error,
      details: tokenResult.actionable,
    };
  }

  const { token, source } = tokenResult;
  const client = createGitHubClient(clientOptions);

  let endpoint: string;
  let dataKey: 'repositories' | null = null;

  // Route based on token source
  if (source === 'github_app') {
    // GitHub App Installation Token → /installation/repositories
    endpoint = `/installation/repositories?per_page=${perPage}&page=${page}`;
    dataKey = 'repositories';
    logger.info('GitHubOps', `[${correlationId}] Using App endpoint: ${endpoint}`);
  } else if (source === 'oauth') {
    // OAuth User Token → /user/repos
    endpoint = `/user/repos?per_page=${perPage}&page=${page}&sort=${sort}&affiliation=owner,collaborator`;
    dataKey = null; // Direct array response
    logger.info('GitHubOps', `[${correlationId}] Using OAuth endpoint: ${endpoint}`);
  } else {
    logger.error('GitHubOps', `[${correlationId}] ❌ Unknown token source: ${source}`);
    return {
      success: false,
      error: `Unknown token source: ${source}`,
    };
  }

  // Make request
  const result = await client.get<any>(endpoint);

  if (!result.success) {
    // Enhanced error context for 403
    if ('status' in result && result.status === 403) {
      logger.error(
        'GitHubOps',
        `[${correlationId}] ❌ 403 Forbidden on ${endpoint}. Source: ${source}. ` +
        `App mode requires installation on repos with proper permissions.`
      );
      return {
        success: false,
        error: source === 'github_app' 
          ? 'GitHub App not installed on any repositories or lacks required permissions.'
          : 'Access forbidden. Check token scopes.',
        status: 403,
        details: {
          source,
          endpoint,
          actionable: source === 'github_app' 
            ? 'Install the GitHub App on your repositories with Contents and Metadata permissions.'
            : 'Ensure your PAT has repo scope.',
        },
      };
    }

    return result;
  }

  // Parse response
  const rawRepos = dataKey ? result.data[dataKey] : result.data;
  const totalCount = dataKey ? result.data.total_count : rawRepos.length;

  // Normalize repository structure
  const repositories: Repository[] = (Array.isArray(rawRepos) ? rawRepos : []).map((repo: any) => ({
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    private: repo.private || false,
    owner: {
      login: repo.owner?.login || '',
      avatar_url: repo.owner?.avatar_url,
    },
    default_branch: repo.default_branch || 'main',
    description: repo.description || undefined,
    html_url: repo.html_url,
    permissions: repo.permissions,
  }));

  // Pagination (check if there's a next page)
  const hasNextPage = repositories.length === perPage;
  const nextPage = hasNextPage ? page + 1 : undefined;

  logger.info(
    'GitHubOps',
    `[${correlationId}] ✅ Listed ${repositories.length} repos (source: ${source}, page: ${page})`
  );

  return {
    success: true,
    data: {
      repositories,
      source,
      totalCount,
      hasNextPage,
      nextPage,
    },
    rateLimit: result.rateLimit,
  };
}

/**
 * Get user repositories (OAuth-only, deprecated)
 * @deprecated Use listRepos() instead for App-aware logic
 */
export async function getUserRepos(
  options: GitHubClientOptions & {
    page?: number;
    perPage?: number;
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
  } = {}
): Promise<GitHubResult<any[]>> {
  const { page = 1, perPage = 30, sort = 'updated', ...clientOptions } = options;
  const client = createGitHubClient(clientOptions);

  return client.get(`/user/repos?page=${page}&per_page=${perPage}&sort=${sort}&affiliation=owner,collaborator`);
}

/**
 * Get file content
 */
export async function getFileContent(
  owner: string,
  repo: string,
  path: string,
  options: GitHubClientOptions & { ref?: string } = {}
): Promise<GitHubResult<{
  path: string;
  content: string;
  sha: string;
  size: number;
}>> {
  const { ref, ...clientOptions } = options;
  const client = createGitHubClient({
    ...clientOptions,
    repo: { owner, name: repo },
  });

  // If no ref provided, get default branch
  let branch = ref;
  if (!branch) {
    const defaultResult = await getDefaultBranch(owner, repo, clientOptions);
    if (!defaultResult.success) {
      return defaultResult as any;
    }
    branch = defaultResult.data.defaultBranch;
  }

  const endpoint = `/repos/${owner}/${repo}/contents/${path}${branch ? `?ref=${branch}` : ''}`;
  const result = await client.get<any>(endpoint);

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    data: {
      path: result.data.path,
      content: result.data.content ? Buffer.from(result.data.content, 'base64').toString('utf-8') : '',
      sha: result.data.sha,
      size: result.data.size,
    },
  };
}

/**
 * Get repository tree (file list)
 */
export async function getRepoTree(
  owner: string,
  repo: string,
  options: GitHubClientOptions & { ref?: string; recursive?: boolean } = {}
): Promise<GitHubResult<Array<{
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
}>>> {
  const { ref, recursive = true, ...clientOptions } = options;
  const client = createGitHubClient({
    ...clientOptions,
    repo: { owner, name: repo },
  });

  // Get default branch if not provided
  let branch = ref;
  if (!branch) {
    const defaultResult = await getDefaultBranch(owner, repo, clientOptions);
    if (!defaultResult.success) {
      return defaultResult as any;
    }
    branch = defaultResult.data.defaultBranch;
  }

  // Get branch SHA
  const refResult = await client.get<any>(`/repos/${owner}/${repo}/git/ref/heads/${branch}`);
  if (!refResult.success) {
    return refResult;
  }

  const sha = refResult.data.object.sha;

  // Get tree
  const treeEndpoint = `/repos/${owner}/${repo}/git/trees/${sha}${recursive ? '?recursive=1' : ''}`;
  const treeResult = await client.get<any>(treeEndpoint);

  if (!treeResult.success) {
    return treeResult;
  }

  return {
    success: true,
    data: treeResult.data.tree || [],
  };
}

/**
 * Check if branch exists
 */
export async function checkBranchExists(
  owner: string,
  repo: string,
  branch: string,
  options: GitHubClientOptions = {}
): Promise<GitHubResult<{ exists: boolean; sha?: string }>> {
  const client = createGitHubClient({
    ...options,
    repo: { owner, name: repo },
  });

  const result = await client.get<any>(`/repos/${owner}/${repo}/branches/${branch}`);

  if (result.success) {
    return {
      success: true,
      data: {
        exists: true,
        sha: result.data.commit.sha,
      },
    };
  }

  // 404 means branch doesn't exist (not an error)
  if ('status' in result && result.status === 404) {
    return {
      success: true,
      data: {
        exists: false,
      },
    };
  }

  // Other errors
  return result as any;
}

/**
 * Create branch
 */
export async function createBranch(
  owner: string,
  repo: string,
  newBranch: string,
  options: GitHubClientOptions & { baseBranch?: string } = {}
): Promise<GitHubResult<{ sha: string }>> {
  const { baseBranch, ...clientOptions } = options;
  const client = createGitHubClient({
    ...clientOptions,
    repo: { owner, name: repo },
  });

  // Get base branch (default branch if not provided)
  let base = baseBranch;
  if (!base) {
    const defaultResult = await getDefaultBranch(owner, repo, clientOptions);
    if (!defaultResult.success) {
      return defaultResult as any;
    }
    base = defaultResult.data.defaultBranch;
  }

  // Get base branch SHA
  const refResult = await client.get<any>(`/repos/${owner}/${repo}/git/ref/heads/${base}`);
  if (!refResult.success) {
    return refResult;
  }

  const sha = refResult.data.object.sha;

  // Create new branch
  const createResult = await client.post<any>(`/repos/${owner}/${repo}/git/refs`, {
    ref: `refs/heads/${newBranch}`,
    sha,
  });

  if (!createResult.success) {
    return createResult;
  }

  logger.info('GitHubOps', `✅ Branch created: ${newBranch} from ${base}`);

  return {
    success: true,
    data: { sha },
  };
}

/**
 * Update file (create or modify)
 */
export async function updateFile(
  owner: string,
  repo: string,
  branch: string,
  path: string,
  content: string,
  message: string,
  options: GitHubClientOptions & { sha?: string } = {}
): Promise<GitHubResult<{ sha: string; commit: any }>> {
  const { sha, ...clientOptions } = options;
  const client = createGitHubClient({
    ...clientOptions,
    repo: { owner, name: repo },
  });

  const body: any = {
    message,
    content: Buffer.from(content).toString('base64'),
    branch,
  };

  if (sha) {
    body.sha = sha;
  }

  const result = await client.put<any>(`/repos/${owner}/${repo}/contents/${path}`, body);

  if (!result.success) {
    return result;
  }

  logger.info('GitHubOps', `✅ File updated: ${path} on ${branch}`);

  return {
    success: true,
    data: {
      sha: result.data.content.sha,
      commit: result.data.commit,
    },
  };
}

/**
 * Create pull request
 */
export async function createPullRequest(
  owner: string,
  repo: string,
  title: string,
  body: string,
  head: string,
  options: GitHubClientOptions & {
    base?: string;
    draft?: boolean;
    maintainer_can_modify?: boolean;
  } = {}
): Promise<GitHubResult<{
  number: number;
  html_url: string;
  state: string;
}>> {
  const { base: baseBranch, draft = true, maintainer_can_modify = true, ...clientOptions } = options;
  const client = createGitHubClient({
    ...clientOptions,
    repo: { owner, name: repo },
  });

  // Get base branch if not provided
  let base = baseBranch;
  if (!base) {
    const defaultResult = await getDefaultBranch(owner, repo, clientOptions);
    if (!defaultResult.success) {
      return defaultResult as any;
    }
    base = defaultResult.data.defaultBranch;
  }

  const result = await client.post<any>(`/repos/${owner}/${repo}/pulls`, {
    title,
    body,
    head,
    base,
    draft,
    maintainer_can_modify,
  });

  if (!result.success) {
    return result;
  }

  logger.info('GitHubOps', `✅ PR created: #${result.data.number} - ${result.data.html_url}`);

  return {
    success: true,
    data: {
      number: result.data.number,
      html_url: result.data.html_url,
      state: result.data.state,
    },
  };
}

/**
 * Add labels to PR
 */
export async function addLabelsToPR(
  owner: string,
  repo: string,
  prNumber: number,
  labels: string[],
  options: GitHubClientOptions = {}
): Promise<GitHubResult<any>> {
  const client = createGitHubClient({
    ...options,
    repo: { owner, name: repo },
  });

  return client.post(`/repos/${owner}/${repo}/issues/${prNumber}/labels`, {
    labels,
  });
}

/**
 * Get repository details with package manager detection
 */
export async function detectPackageManager(
  owner: string,
  repo: string,
  options: GitHubClientOptions & { ref?: string } = {}
): Promise<GitHubResult<{
  type: 'npm' | 'yarn' | 'pnpm' | 'pip' | 'maven' | 'gradle' | 'go' | 'cargo' | 'swift' | null;
  file: string | null;
  content: any;
}>> {
  const packageFiles = [
    { type: 'swift' as const, file: 'Package.swift' },
    { type: 'npm' as const, file: 'package.json' },
    { type: 'pip' as const, file: 'requirements.txt' },
    { type: 'pip' as const, file: 'pyproject.toml' },
    { type: 'maven' as const, file: 'pom.xml' },
    { type: 'gradle' as const, file: 'build.gradle' },
    { type: 'go' as const, file: 'go.mod' },
    { type: 'cargo' as const, file: 'Cargo.toml' },
  ];

  for (const { type, file } of packageFiles) {
    const result = await getFileContent(owner, repo, file, options);
    if (result.success) {
      logger.info('GitHubOps', `✅ Package manager detected: ${type} (${file})`);
      
      try {
        const parsed = file.endsWith('.json') ? JSON.parse(result.data.content) : result.data.content;
        return {
          success: true,
          data: { type, file, content: parsed },
        };
      } catch {
        return {
          success: true,
          data: { type, file, content: result.data.content },
        };
      }
    }
  }

  logger.info('GitHubOps', '⚠️ No package manager detected');
  
  return {
    success: true,
    data: { type: null, file: null, content: null },
  };
}

