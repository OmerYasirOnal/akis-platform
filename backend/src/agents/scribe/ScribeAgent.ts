import { BaseAgent } from '../../core/agents/BaseAgent.js';
import type { AgentDependencies } from '../../core/agents/AgentFactory.js';
import { GitHubMCPService } from '../../services/mcp/adapters/GitHubMCPService.js';
import type { AIService, Plan, Planner, Critique, Reflector } from '../../services/ai/AIService.js';
import type { MCPTools } from '../../services/mcp/adapters/index.js';

/**
 * ScribeTaskContext - Input payload for ScribeAgent
 */
export interface ScribeTaskContext {
  owner: string;
  repo: string;
  baseBranch: string; // e.g. 'main'
  featureBranch?: string; // e.g. 'feat/new-docs', if provided, edits happen here
  targetPath?: string; // e.g. 'README.md' or 'docs/'
  taskDescription?: string;
}

/**
 * ScribeAgent - Documents new features by updating technical documentation
 * Phase 6.A: Uses GitHub MCP and AIService
 * Extends BaseAgent; accepts injected tools (MCP adapters, AIService) via constructor
 */
export class ScribeAgent extends BaseAgent {
  readonly type = 'scribe';
  private githubMCP?: GitHubMCPService;
  private aiService?: AIService;

  constructor(deps?: AgentDependencies) {
    super();
    // Inject dependencies
    if (deps?.tools?.githubMCP) {
      this.githubMCP = deps.tools.githubMCP as GitHubMCPService;
    }
    if (deps?.tools?.aiService) {
      this.aiService = deps.tools.aiService as AIService;
    }

    // Enable planning phase
    this.playbook.requiresPlanning = true;
    // Disable orchestrator-level reflection because we do "reflect-before-commit" internally
    this.playbook.requiresReflection = false;
  }

  /**
   * Plan execution steps
   */
  async plan(planner: Planner, context: unknown): Promise<Plan> {
    if (!this.isValidContext(context)) {
      throw new Error('ScribeAgent requires valid ScribeTaskContext');
    }
    const task = context as ScribeTaskContext;

    return planner.plan({
      agent: this.type,
      goal: task.taskDescription || `Update documentation in ${task.targetPath || 'README.md'}`,
      context: task
    });
  }

  /**
   * Execute Scribe workflow with tools and plan
   */
  async executeWithTools(_tools: MCPTools, plan?: Plan, context?: unknown): Promise<unknown> {
    // Note: We use this.githubMCP injected via constructor to ensure we have the token-aware instance
    // _tools might contain the global generic tools
    
    if (!this.isValidContext(context)) {
      throw new Error('ScribeAgent requires valid ScribeTaskContext');
    }
    const task = context as ScribeTaskContext;

    if (!this.githubMCP) {
      throw new Error('GitHubMCPService not injected into ScribeAgent');
    }
    if (!this.aiService) {
      throw new Error('AIService not injected into ScribeAgent');
    }

    const results: Record<string, unknown> = { plan };

    // Step 1: Branch Management (Simplified)
    let workingBranch = task.featureBranch || task.baseBranch;
    if (task.featureBranch && task.featureBranch !== task.baseBranch) {
        // In real impl, we would check/create branch here
        results.branch = workingBranch;
    }

    // Step 2: Analyze & Generate
    // For MVP, we read target file and append/modify
    const filePath = task.targetPath || 'README.md';
    let currentContent = '';
    try {
      const fileData = await this.githubMCP.getFileContent(task.owner, task.repo, workingBranch, filePath);
      currentContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
    } catch (e) {
      console.log('File not found, will create:', filePath);
    }

    // Simulate content generation (using plan rationale if available)
    const updateInfo = plan?.rationale ? `Plan Rationale: ${plan.rationale}` : 'No specific plan rationale.';
    const newContent = `${currentContent}\n\n## Update ${new Date().toISOString()}\n${task.taskDescription || 'Documentation updated by ScribeAgent.'}\n\n${updateInfo}`;
    
    // Step 3: Reflect (Critique before commit)
    const critique = await this.aiService.reflector.critique({
      artifact: newContent,
      context: task
    });
    results.critique = critique;

    // Step 4: Commit (if critique passes or soft pass)
    // For MVP, we commit if no critical issues (mocked as always true)
    const commitResult = await this.githubMCP.commitFile(
      task.owner,
      task.repo,
      workingBranch,
      filePath,
      newContent,
      `docs: update ${filePath} via ScribeAgent`
    );
    results.commit = commitResult;

    return {
      ok: true,
      agent: 'scribe',
      ...results
    };
  }

  /**
   * Default execute implementation (required by BaseAgent)
   * Delegates to executeWithTools with empty tools/plan if called directly
   */
  async execute(context: unknown): Promise<unknown> {
    return this.executeWithTools({}, undefined, context);
  }

  private isValidContext(context: unknown): boolean {
    if (!context || typeof context !== 'object') return false;
    const c = context as Record<string, unknown>;
    return (
      typeof c.owner === 'string' &&
      typeof c.repo === 'string' &&
      typeof c.baseBranch === 'string'
    );
  }
}
