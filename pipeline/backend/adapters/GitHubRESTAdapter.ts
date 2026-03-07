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

export function createGitHubRESTAdapter(opts: GitHubRESTAdapterOptions): GitHubServiceLike {
  const { token } = opts;

  return {
    async createRepository(_owner: string, name: string, isPrivate: boolean): Promise<{ url: string }> {
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
