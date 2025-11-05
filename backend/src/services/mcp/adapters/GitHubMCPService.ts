/**
 * GitHubMCPService - MCP client adapter for GitHub (signature-only)
 * Phase 5.B: Method signatures only, no HTTP implementation
 * Provides high-level methods that internally use JSON-RPC 2.0 to GitHub MCP endpoint
 * FORBIDDEN: Direct REST SDK usage (e.g., Octokit) from business code
 */

export interface GitHubMCPServiceOptions {
  baseUrl: string;
  token?: string;
}

/**
 * GitHub MCP Service - signature-only adapter
 * Used by Scribe, Trace, Proto agents
 */
export class GitHubMCPService {
  constructor(opts: GitHubMCPServiceOptions) {
    // Signature-only: no implementation
  }

  /**
   * Create a branch in GitHub repository
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param branchName - New branch name
   * @param baseSha - Base commit SHA
   */
  async createBranch(
    owner: string,
    repo: string,
    branchName: string,
    baseSha: string
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
    owner: string,
    repo: string,
    branch: string,
    filePath: string,
    content: string,
    commitMessage: string
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
    owner: string,
    repo: string,
    state?: 'open' | 'closed' | 'all'
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
    owner: string,
    repo: string,
    title: string,
    body: string,
    head: string,
    base: string
  ): Promise<{ prNumber: number; url: string }> {
    // Signature-only: no implementation
    throw new Error('Not implemented: signature-only MCP adapter');
  }
}

