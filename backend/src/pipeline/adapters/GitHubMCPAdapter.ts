/**
 * GitHubMCPAdapter — bridges GitHubMCPService to the pipeline's GitHubServiceLike interface.
 * This allows the pipeline (Proto, Trace) to use real GitHub operations via the MCP Gateway.
 */
import type { GitHubServiceLike } from '../core/pipeline-factory.js';

export interface GitHubMCPAdapterDeps {
  callToolRaw<T>(toolName: string, args: Record<string, unknown>): Promise<T>;
}

// ─── AKIS Platform Repo Guard ────────────────────
const BLOCKED_PLATFORM_REPOS = [
  'akis-platform-devolopment',
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

/**
 * Adapter that wraps a GitHubMCPService (or anything with callToolRaw) into
 * the GitHubServiceLike interface used by the pipeline factory.
 */
export function createGitHubMCPAdapter(mcp: GitHubMCPAdapterDeps): GitHubServiceLike {
  return {
    async createRepository(owner: string, name: string, isPrivate: boolean): Promise<{ url: string }> {
      validateTargetRepo(name);
      const result = await mcp.callToolRaw<{ html_url?: string; clone_url?: string }>('create_repository', {
        name,
        description: `AKIS Pipeline scaffold — ${name}`,
        private: isPrivate,
        auto_init: true,
      });
      const url = result.html_url || result.clone_url || `https://github.com/${owner}/${name}`;
      return { url };
    },

    async createBranch(owner: string, repo: string, branch: string, fromBranch?: string): Promise<void> {
      await mcp.callToolRaw('create_branch', {
        owner,
        repo,
        branch,
        ...(fromBranch ? { from_branch: fromBranch } : {}),
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
      await mcp.callToolRaw('create_or_update_file', {
        owner,
        repo,
        path: filePath,
        content,
        message,
        branch,
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
      const result = await mcp.callToolRaw<{ html_url?: string; number?: number }>('create_pull_request', {
        owner,
        repo,
        title,
        body,
        head,
        base,
        draft: true,
      });
      return { url: result.html_url || '' };
    },

    async listFiles(owner: string, repo: string, branch: string): Promise<string[]> {
      const files: string[] = [];

      async function listDir(dirPath: string): Promise<void> {
        const result = await mcp.callToolRaw<unknown>('get_file_contents', {
          owner,
          repo,
          path: dirPath || '',
          branch,
        });

        // GitHub returns array for directories
        if (Array.isArray(result)) {
          for (const entry of result) {
            if (!entry || typeof entry !== 'object') continue;
            const e = entry as Record<string, unknown>;
            const entryPath = typeof e.path === 'string' ? e.path : typeof e.name === 'string' ? e.name : '';
            const entryType = typeof e.type === 'string' ? e.type : '';

            if (!entryPath) continue;

            // Skip common non-source directories
            if (entryPath === 'node_modules' || entryPath === '.git' || entryPath === 'dist' || entryPath === 'build' || entryPath === '.next') {
              continue;
            }

            if (entryType === 'dir') {
              await listDir(entryPath);
            } else {
              files.push(entryPath);
            }
          }
        }
      }

      await listDir('');
      return files;
    },

    async getFileContent(owner: string, repo: string, branch: string, filePath: string): Promise<string> {
      const result = await mcp.callToolRaw<unknown>('get_file_contents', {
        owner,
        repo,
        path: filePath,
        branch,
      });

      if (!result || typeof result !== 'object' || Array.isArray(result)) {
        return '';
      }

      const record = result as Record<string, unknown>;
      return typeof record.content === 'string' ? record.content : '';
    },
  };
}
