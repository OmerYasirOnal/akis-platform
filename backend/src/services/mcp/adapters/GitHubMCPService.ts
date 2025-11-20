import { HttpClient } from '../../http/HttpClient.js';

/**
 * GitHubMCPService - MCP client adapter for GitHub
 * Phase 5.B: Implements MCP JSON-RPC 2.0 calls
 * Provides high-level methods that internally use JSON-RPC 2.0 to GitHub MCP endpoint
 */

export interface GitHubMCPServiceOptions {
  baseUrl: string;
  token?: string;
  httpClient?: HttpClient;
}

interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params: unknown;
  id: string | number;
}

interface JsonRpcResponse<T> {
  jsonrpc: '2.0';
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
  id: string | number;
}

/**
 * GitHub MCP Service - adapter for GitHub MCP server
 * Used by Scribe, Trace, Proto agents
 */
export class GitHubMCPService {
  private baseUrl: string;
  private token?: string;
  private httpClient: HttpClient;
  private requestId: number = 1;

  constructor(opts: GitHubMCPServiceOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.token = opts.token;
    this.httpClient = opts.httpClient || new HttpClient();
  }

  private async callMcp<T>(method: string, params: unknown): Promise<T> {
    const payload: JsonRpcRequest = {
      jsonrpc: '2.0',
      method: `github/${method}`, // Namespaced method
      params,
      id: this.requestId++,
    };

    const response = await this.httpClient.post(this.baseUrl, payload, this.token);

    if (!response.ok) {
      throw new Error(`MCP Request failed: ${response.status} ${response.statusText}`);
    }

    const json = (await response.json()) as JsonRpcResponse<T>;

    if (json.error) {
      throw new Error(`MCP Error [${json.error.code}]: ${json.error.message}`);
    }

    return json.result as T;
  }

  /**
   * Create a branch in GitHub repository
   */
  async createBranch(
    owner: string,
    repo: string,
    branchName: string,
    baseSha: string
  ): Promise<{ branch: string; sha: string }> {
    return this.callMcp<{ branch: string; sha: string }>('createBranch', {
      owner,
      repo,
      branchName,
      baseSha,
    });
  }

  /**
   * Commit a file to GitHub repository
   */
  async commitFile(
    owner: string,
    repo: string,
    branch: string,
    filePath: string,
    content: string,
    commitMessage: string
  ): Promise<{ commitSha: string; filePath: string }> {
    return this.callMcp<{ commitSha: string; filePath: string }>('commitFile', {
      owner,
      repo,
      branch,
      filePath,
      content,
      commitMessage,
    });
  }

  /**
   * Get content of a file
   */
  async getFileContent(
    owner: string,
    repo: string,
    branch: string,
    filePath: string
  ): Promise<{ content: string; encoding: string; sha: string }> {
    return this.callMcp<{ content: string; encoding: string; sha: string }>('getFile', {
      owner,
      repo,
      ref: branch,
      path: filePath,
    });
  }

  /**
   * Get changed files between two refs (or for a PR)
   * Used by Scribe to analyze changes
   */
  async getChangedFiles(
    owner: string,
    repo: string,
    base: string,
    head: string
  ): Promise<Array<{ filename: string; status: string; patch?: string }>> {
    // This might map to a 'compareCommits' or similar MCP method
    // Assuming 'compare' method exists in the MCP server
    return this.callMcp<Array<{ filename: string; status: string; patch?: string }>>('compareCommits', {
      owner,
      repo,
      base,
      head,
    });
  }

  /**
   * List repository issues (for Trace agent)
   */
  async listIssues(
    owner: string,
    repo: string,
    state: 'open' | 'closed' | 'all' = 'open'
  ): Promise<Array<{ number: number; title: string; body?: string }>> {
    return this.callMcp<Array<{ number: number; title: string; body?: string }>>('listIssues', {
      owner,
      repo,
      state,
    });
  }

  /**
   * Create a PR draft (for Proto agent)
   */
  async createPRDraft(
    owner: string,
    repo: string,
    title: string,
    body: string,
    head: string,
    base: string
  ): Promise<{ prNumber: number; url: string }> {
    return this.callMcp<{ prNumber: number; url: string }>('createPullRequest', {
      owner,
      repo,
      title,
      body,
      head,
      base,
      draft: true,
    });
  }
}
