/**
 * MCP Adapters - Barrel export
 * Phase 5.B: Export all MCP adapters and MCPTools bag
 */

import type { GitHubMCPService } from './GitHubMCPService.js';
import type { JiraMCPService } from './JiraMCPService.js';
import type { ConfluenceMCPService } from './ConfluenceMCPService.js';

export { GitHubMCPService } from './GitHubMCPService.js';
export { JiraMCPService } from './JiraMCPService.js';
export { ConfluenceMCPService } from './ConfluenceMCPService.js';

export type { GitHubMCPServiceOptions } from './GitHubMCPService.js';
export type { JiraMCPServiceOptions } from './JiraMCPService.js';
export type { ConfluenceMCPServiceOptions } from './ConfluenceMCPService.js';

/**
 * MCPTools - Typed bag of MCP adapters for injection into agents
 * Orchestrator provides this to agents at runtime
 */
export interface MCPTools {
  githubMCP?: GitHubMCPService;
  jiraMCP?: JiraMCPService;
  confluenceMCP?: ConfluenceMCPService;
}

