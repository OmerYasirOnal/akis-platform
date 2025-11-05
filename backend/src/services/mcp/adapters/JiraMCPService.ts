import { HttpClient } from '../../http/HttpClient.js';

/**
 * JiraMCPService - MCP client adapter for Jira via Atlassian Rovo MCP
 * Provides high-level methods that internally use RESTful HTTP to Jira MCP endpoints
 */
export class JiraMCPService {
  private httpClient: HttpClient;
  private token: string;
  private baseUrl = 'https://api.atlassian.com/mcp/v1/jira/';

  constructor(token: string) {
    this.token = token;
    this.httpClient = new HttpClient();
  }

  /**
   * Get a Jira issue by key
   * @param issueKey - Issue key (e.g., PROJ-123)
   */
  async getIssue(issueKey: string): Promise<unknown> {
    // TODO: Implement HTTP GET to Jira MCP endpoint
    // GET /mcp/v1/jira/issue/{key}
    throw new Error('Not implemented');
  }

  /**
   * Create a Jira issue
   * @param projectKey - Project key
   * @param fields - Issue fields
   */
  async createIssue(projectKey: string, fields: unknown): Promise<unknown> {
    // TODO: Implement HTTP POST to Jira MCP endpoint
    // POST /mcp/v1/jira/issue
    throw new Error('Not implemented');
  }

  /**
   * Add a comment to a Jira issue
   * @param issueKey - Issue key
   * @param comment - Comment text
   */
  async addComment(issueKey: string, comment: string): Promise<unknown> {
    // TODO: Implement HTTP POST to Jira MCP endpoint
    // POST /mcp/v1/jira/issue/{key}/comment
    throw new Error('Not implemented');
  }
}

