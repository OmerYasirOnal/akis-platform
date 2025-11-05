/**
 * JiraMCPService - MCP client adapter for Jira (signature-only)
 * Phase 5.B: Method signatures only, no HTTP implementation
 * Provides high-level methods that internally use RESTful HTTP to Jira MCP endpoints
 */

export interface JiraMCPServiceOptions {
  baseUrl: string;
  token?: string;
}

/**
 * Jira MCP Service - signature-only adapter
 * Used by Trace agent
 */
export class JiraMCPService {
  constructor(opts: JiraMCPServiceOptions) {
    // Signature-only: no implementation
  }

  /**
   * Get a Jira issue by key
   * @param issueKey - Issue key (e.g., PROJ-123)
   */
  async getIssue(issueKey: string): Promise<{
    key: string;
    summary: string;
    description?: string;
    acceptanceCriteria?: string;
  }> {
    // Signature-only: no implementation
    throw new Error('Not implemented: signature-only MCP adapter');
  }

  /**
   * List issues for a project (for Trace agent)
   * @param projectKey - Project key
   * @param jql - Optional JQL query
   */
  async listIssues(
    projectKey: string,
    jql?: string
  ): Promise<Array<{ key: string; summary: string; acceptanceCriteria?: string }>> {
    // Signature-only: no implementation
    throw new Error('Not implemented: signature-only MCP adapter');
  }

  /**
   * Create a Jira issue
   * @param projectKey - Project key
   * @param fields - Issue fields
   */
  async createIssue(projectKey: string, fields: {
    summary: string;
    description?: string;
    issueType: string;
  }): Promise<{ key: string; id: string }> {
    // Signature-only: no implementation
    throw new Error('Not implemented: signature-only MCP adapter');
  }

  /**
   * Add a comment to a Jira issue
   * @param issueKey - Issue key
   * @param comment - Comment text
   */
  async addComment(issueKey: string, comment: string): Promise<{ commentId: string }> {
    // Signature-only: no implementation
    throw new Error('Not implemented: signature-only MCP adapter');
  }
}

