/**
 * GitHubRESTAdapter — implements GitHubServiceLike using GitHub REST API v3 directly.
 * No MCP Gateway dependency. Uses GITHUB_TOKEN (Bearer) for authentication.
 *
 * Endpoints used:
 *   POST   /user/repos                                → createRepository
 *   GET    /repos/{owner}/{repo}/git/ref/heads/{base} → get SHA for createBranch
 *   POST   /repos/{owner}/{repo}/git/refs             → createBranch
 *   PUT    /repos/{owner}/{repo}/contents/{path}      → commitFile
 *   GET    /repos/{owner}/{repo}/git/trees/{sha}?recursive=1 → listFiles
 *   GET    /repos/{owner}/{repo}/contents/{path}?ref={branch} → getFileContent
 *   POST   /repos/{owner}/{repo}/pulls                → createPR
 */
import type { GitHubServiceLike } from '../core/pipeline-factory.js';

const GITHUB_API = 'https://api.github.com';

interface GitHubRESTAdapterOptions {
  token: string;
}

async function ghFetch<T>(
  token: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${GITHUB_API}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let detail = '';
    try {
      const json = JSON.parse(text);
      detail = json.message || text;
    } catch {
      detail = text;
    }
    throw new Error(`GitHub API ${method} ${path} → ${res.status}: ${detail}`);
  }

  if (res.status === 204) return {} as T;
  return (await res.json()) as T;
}

// ─── AKIS Platform Repo Guard ────────────────────
const BLOCKED_PLATFORM_REPOS = [
  'akis-platform',
  'akis-platform-development',
];

function validateTargetRepo(repoFullName: string): void {
  const repoName = repoFullName.split('/').pop()?.toLowerCase() || '';
  if (BLOCKED_PLATFORM_REPOS.some((pattern) => repoName.includes(pattern))) {
    throw new Error(
      `Target repository "${repoFullName}" is the AKIS platform repo. ` +
      `Pipeline outputs must be pushed to a separate repository. ` +
      `Please specify a different target repository.`,
    );
  }
}

export function createGitHubRESTAdapter(opts: GitHubRESTAdapterOptions): GitHubServiceLike {
  const { token } = opts;

  return {
    async createRepository(_owner: string, name: string, isPrivate: boolean): Promise<{ url: string }> {
      validateTargetRepo(name);
      const result = await ghFetch<{ html_url: string }>(token, 'POST', '/user/repos', {
        name,
        description: `AKIS Pipeline scaffold — ${name}`,
        private: isPrivate,
        auto_init: true,
      });
      return { url: result.html_url };
    },

    async createBranch(owner: string, repo: string, branch: string, fromBranch?: string): Promise<void> {
      const base = fromBranch || 'main';
      // Get the SHA of the base branch
      const ref = await ghFetch<{ object: { sha: string } }>(
        token,
        'GET',
        `/repos/${owner}/${repo}/git/ref/heads/${base}`,
      );
      // Create the new branch
      await ghFetch(token, 'POST', `/repos/${owner}/${repo}/git/refs`, {
        ref: `refs/heads/${branch}`,
        sha: ref.object.sha,
      });
    },

    async commitFile(
      owner: string,
      repo: string,
      branch: string,
      filePath: string,
      content: string,
      message: string,
    ): Promise<void> {
      // Check if file exists to get its SHA (needed for updates)
      let existingSha: string | undefined;
      try {
        const existing = await ghFetch<{ sha: string }>(
          token,
          'GET',
          `/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
        );
        existingSha = existing.sha;
      } catch {
        // File doesn't exist — that's fine, we're creating it
      }

      await ghFetch(token, 'PUT', `/repos/${owner}/${repo}/contents/${filePath}`, {
        message,
        content: Buffer.from(content, 'utf-8').toString('base64'),
        branch,
        ...(existingSha ? { sha: existingSha } : {}),
      });
    },

    async createPR(
      owner: string,
      repo: string,
      title: string,
      body: string,
      head: string,
      base: string,
    ): Promise<{ url: string }> {
      const result = await ghFetch<{ html_url: string }>(
        token,
        'POST',
        `/repos/${owner}/${repo}/pulls`,
        { title, body, head, base, draft: true },
      );
      return { url: result.html_url };
    },

    async listFiles(owner: string, repo: string, branch: string): Promise<string[]> {
      // Get the tree recursively
      const tree = await ghFetch<{
        tree: Array<{ path: string; type: string }>;
        truncated: boolean;
      }>(token, 'GET', `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);

      return tree.tree
        .filter((item) => item.type === 'blob')
        .map((item) => item.path)
        .filter((p) => !p.includes('node_modules/') && !p.includes('.git/') && !p.includes('dist/') && !p.includes('build/'));
    },

    async getFileContent(owner: string, repo: string, branch: string, filePath: string): Promise<string> {
      const result = await ghFetch<{ content?: string; encoding?: string }>(
        token,
        'GET',
        `/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
      );

      if (result.content && result.encoding === 'base64') {
        return Buffer.from(result.content, 'base64').toString('utf-8');
      }

      return result.content || '';
    },
  };
}

/**
 * Get the authenticated user's GitHub login name.
 */
export async function getGitHubOwnerViaREST(token: string): Promise<string> {
  const user = await ghFetch<{ login: string }>(token, 'GET', '/user');
  return user.login;
}

// ─── Dev Mode Extensions ──────────────────────────

import type { FileChange, FileTreeNode } from '../../types/dev-session.js';

/**
 * Fetch full file tree as structured FileTreeNode[] (for DevAgent context).
 */
export async function getFileTreeViaREST(
  token: string,
  owner: string,
  repo: string,
  branch: string,
): Promise<FileTreeNode[]> {
  const tree = await ghFetch<{
    tree: Array<{ path: string; type: string; size?: number }>;
    truncated: boolean;
  }>(token, 'GET', `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);

  const flatFiles: Array<{ path: string; size?: number }> = tree.tree
    .filter((item) => item.type === 'blob')
    .filter((item) => !item.path.includes('node_modules/') && !item.path.includes('.git/') && !item.path.includes('dist/'))
    .map((item) => ({ path: item.path, size: item.size }));

  return buildTreeStructure(flatFiles);
}

function buildTreeStructure(flatFiles: Array<{ path: string; size?: number }>): FileTreeNode[] {
  const root: FileTreeNode[] = [];
  const dirs = new Map<string, FileTreeNode>();

  for (const file of flatFiles) {
    const parts = file.path.split('/');

    if (parts.length === 1) {
      root.push({ path: file.path, type: 'file', size: file.size });
    } else {
      let currentPath = '';
      let currentLevel = root;

      for (let i = 0; i < parts.length - 1; i++) {
        currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];

        if (!dirs.has(currentPath)) {
          const dir: FileTreeNode = { path: parts[i], type: 'dir', children: [] };
          dirs.set(currentPath, dir);
          currentLevel.push(dir);
        }

        currentLevel = dirs.get(currentPath)!.children!;
      }

      currentLevel.push({ path: parts[parts.length - 1], type: 'file', size: file.size });
    }
  }

  return root;
}

/**
 * Push multiple file changes as a single commit (tree API).
 * Used by DevAgent push flow.
 */
export async function pushChangesViaREST(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  changes: FileChange[],
  commitMessage: string,
): Promise<string> {
  validateTargetRepo(`${owner}/${repo}`);

  // 1. Get latest commit SHA on branch
  const refData = await ghFetch<{ object: { sha: string } }>(
    token, 'GET', `/repos/${owner}/${repo}/git/ref/heads/${branch}`,
  );
  const latestCommitSha = refData.object.sha;

  // 2. Get the tree SHA from that commit
  const commitData = await ghFetch<{ tree: { sha: string } }>(
    token, 'GET', `/repos/${owner}/${repo}/git/commits/${latestCommitSha}`,
  );
  const baseTreeSha = commitData.tree.sha;

  // 3. Create blobs for create/modify, collect tree items
  const treeItems: Array<{ path: string; mode: string; type: string; sha: string | null }> = [];

  for (const change of changes) {
    if (change.action === 'delete') {
      treeItems.push({ path: change.path, mode: '100644', type: 'blob', sha: null });
    } else {
      const blob = await ghFetch<{ sha: string }>(
        token, 'POST', `/repos/${owner}/${repo}/git/blobs`,
        { content: change.content || '', encoding: 'utf-8' },
      );
      treeItems.push({ path: change.path, mode: '100644', type: 'blob', sha: blob.sha });
    }
  }

  // 4. Create new tree
  const newTree = await ghFetch<{ sha: string }>(
    token, 'POST', `/repos/${owner}/${repo}/git/trees`,
    { base_tree: baseTreeSha, tree: treeItems },
  );

  // 5. Create commit
  const newCommit = await ghFetch<{ sha: string }>(
    token, 'POST', `/repos/${owner}/${repo}/git/commits`,
    { message: commitMessage, tree: newTree.sha, parents: [latestCommitSha] },
  );

  // 6. Update branch ref
  await ghFetch(
    token, 'PATCH', `/repos/${owner}/${repo}/git/refs/heads/${branch}`,
    { sha: newCommit.sha },
  );

  return newCommit.sha;
}
