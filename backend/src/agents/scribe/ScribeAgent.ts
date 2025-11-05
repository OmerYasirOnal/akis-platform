import { BaseAgent } from '../../core/agents/BaseAgent.js';
import type { AgentDependencies } from '../../core/agents/AgentFactory.js';

/**
 * ScribeAgent - Documents new features by updating technical documentation
 * Extends BaseAgent; accepts injected tools (MCP adapters, AIService) via constructor
 */
export class ScribeAgent extends BaseAgent {
  readonly type = 'scribe';
  private deps?: AgentDependencies;

  constructor(deps?: AgentDependencies) {
    super();
    this.deps = deps;
    // ScribeAgent does not require planning or reflection (simple agent)
    this.playbook.requiresPlanning = false;
    this.playbook.requiresReflection = false;
    // TODO: Extract tools from deps (githubMCP, confluenceMCP, etc.)
  }

  async execute(context: unknown): Promise<unknown> {
    // TODO: Implement ScribeAgent logic
    // - Analyze code changes
    // - Update Confluence documentation via ConfluenceMCPService (from this.deps)
    // - Commit documentation changes via GitHubMCPService (from this.deps)
    
    // Stub: return success for now
    return { ok: true, agent: 'scribe', message: 'Documentation update stub (not implemented)' };
  }
}

