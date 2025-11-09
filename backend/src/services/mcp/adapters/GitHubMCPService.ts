/**
 * GitHubMCPService - MCP client adapter for GitHub (signature-only)
 * Phase 5.B: Method signatures only, no HTTP implementation
 * Provides high-level methods that internally use JSON-RPC 2.0 to GitHub MCP endpoint
 * FORBIDDEN: Direct REST SDK usage (e.g., Octokit) from business code
 */

export interface GitHubMCPServiceOptions {
  baseUrl?: string;
  token?: string;
  installationId?: string;
}

/**
 * GitHub MCP Service - signature-only adapter
 * Used by Scribe, Trace, Proto agents
 */
export class GitHubMCPService {
  constructor(_opts: GitHubMCPServiceOptions) {
    // Signature-only: no implementation
  }

  /**
   * List repositories visible to the installation
   */
  async listRepositories(): Promise<
    Array<{
      id: number;
      name: string;
      fullName: string;
      private: boolean;
      defaultBranch: string;
    }>
  > {
    // Signature-only: no implementation
    throw new Error('Not implemented: signature-only MCP adapter');
  }

  /**
   * List branches for a repository
   */
  async listBranches(
    _owner: string,
    _repo: string
  ): Promise<Array<{ name: string; commitSha: string; protected: boolean }>> {
    // Signature-only: no implementation
    throw new Error('Not implemented: signature-only MCP adapter');
  }

  /**
   * Create a branch in GitHub repository
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param branchName - New branch name
   * @param baseSha - Base commit SHA
   */
  async createBranch(
    _owner: string,
    _repo: string,
    _branchName: string,
    _baseSha: string
  ): Promise<{ branch: string; sha: string }> {
    // Signature-only: no implementation
    throw new Error('Not implemented: signature-only MCP adapter');
  }

  /**
   * Commit a file to GitHub repository
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param branch - Branch name
   * @param filePath - File path
   * @param content - File content
   * @param commitMessage - Commit message
   */
  async commitFile(
    _owner: string,
    _repo: string,
    _branch: string,
    _filePath: string,
    _content: string,
    _commitMessage: string
  ): Promise<{ commitSha: string; filePath: string }> {
    // Signature-only: no implementation
    throw new Error('Not implemented: signature-only MCP adapter');
  }

  /**
   * List repository issues (for Trace agent)
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param state - Issue state ('open' | 'closed' | 'all')
   */
  async listIssues(
    _owner: string,
    _repo: string,
    _state?: 'open' | 'closed' | 'all'
  ): Promise<Array<{ number: number; title: string; body?: string }>> {
    // Signature-only: no implementation
    throw new Error('Not implemented: signature-only MCP adapter');
  }

  /**
   * Create a PR draft (for Proto agent)
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param title - PR title
   * @param body - PR body
   * @param head - Head branch
   * @param base - Base branch
   */
  async createPRDraft(
    _owner: string,
    _repo: string,
    _title: string,
    _body: string,
    _head: string,
    _base: string
  ): Promise<{ prNumber: number; url: string }> {
    // Signature-only: no implementation
    throw new Error('Not implemented: signature-only MCP adapter');
  }
}

