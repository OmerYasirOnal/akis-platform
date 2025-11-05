/**
 * ConfluenceMCPService - MCP client adapter for Confluence (signature-only)
 * Phase 5.B: Method signatures only, no HTTP implementation
 * Provides high-level methods that internally use RESTful HTTP to Confluence MCP endpoints
 */

export interface ConfluenceMCPServiceOptions {
  baseUrl: string;
  token?: string;
}

/**
 * Confluence MCP Service - signature-only adapter
 * Used by Scribe agent
 */
export class ConfluenceMCPService {
  constructor(_opts: ConfluenceMCPServiceOptions) {
    // Signature-only: no implementation
  }

  /**
   * Get a Confluence page by ID
   * @param pageId - Page ID
   */
  async getPage(_pageId: string): Promise<{
    id: string;
    title: string;
    content: string;
    spaceKey: string;
  }> {
    // Signature-only: no implementation
    throw new Error('Not implemented: signature-only MCP adapter');
  }

  /**
   * Fetch a Confluence page by title/space (for Scribe agent)
   * @param spaceKey - Space key
   * @param title - Page title
   */
  async fetchConfluencePage(_spaceKey: string, _title: string): Promise<{
    id: string;
    title: string;
    content: string;
  }> {
    // Signature-only: no implementation
    throw new Error('Not implemented: signature-only MCP adapter');
  }

  /**
   * Create a Confluence page
   * @param spaceKey - Space key
   * @param title - Page title
   * @param content - Page content (markdown/HTML)
   */
  async createPage(_spaceKey: string, _title: string, _content: string): Promise<{
    id: string;
    url: string;
  }> {
    // Signature-only: no implementation
    throw new Error('Not implemented: signature-only MCP adapter');
  }

  /**
   * Update a Confluence page
   * @param pageId - Page ID
   * @param content - Updated content
   */
  async updatePage(_pageId: string, _content: string): Promise<{
    id: string;
    version: number;
  }> {
    // Signature-only: no implementation
    throw new Error('Not implemented: signature-only MCP adapter');
  }
}

