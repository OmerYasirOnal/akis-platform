import { BaseAgent } from '../../core/agents/BaseAgent.js';
import type { AgentDependencies } from '../../core/agents/AgentFactory.js';
import { GitHubMCPService } from '../../services/mcp/adapters/GitHubMCPService.js';
import type { AIService, Plan, Planner } from '../../services/ai/AIService.js';
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
  /** Config-aware mode flag (S0.4.6) */
  mode?: 'from_config' | 'test' | 'run' | string;
  /** If true, do NOT write to GitHub; only simulate */
  dryRun?: boolean;
  /** Optional branch pattern, e.g. 'docs/scribe-{timestamp}' */
  branchPattern?: string;
  /** Optional PR title/body templates from agent config */
  prTitleTemplate?: string;
  prBodyTemplate?: string | null;
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
    const dryRun = task.dryRun === true;

    if (!this.githubMCP) {
      throw new Error(
        'GitHubMCPService not injected into ScribeAgent. ' +
        'This usually means: 1) GitHub OAuth is not connected for this user, or ' +
        '2) GITHUB_MCP_BASE_URL is not configured. ' +
        'Please connect GitHub at /dashboard/agents/scribe or check your environment configuration.'
      );
    }
    if (!this.aiService) {
      throw new Error(
        'AIService not injected into ScribeAgent. ' +
        'This usually means AI provider is not configured. ' +
        'Please check AI_PROVIDER and related environment variables.'
      );
    }

    const results: Record<string, unknown> = { plan };

    // Step 1: Branch Management
    const baseBranch = task.baseBranch;
    let workingBranch =
      task.featureBranch && task.featureBranch.length > 0 ? task.featureBranch : baseBranch;

    // Config-driven branch creation when featureBranch is not explicitly provided
    if (!dryRun && (!task.featureBranch || task.featureBranch === baseBranch)) {
      const pattern = task.branchPattern || 'docs/scribe-{timestamp}';
      const ts = new Date()
        .toISOString()
        .replace(/[-:]/g, '')
        .replace(/\..+$/, '')
        .replace('T', '-'); // YYYYMMDD-HHMMSS
      workingBranch = pattern.includes('{timestamp}') ? pattern.replace('{timestamp}', ts) : pattern;
    }

    results.branch = workingBranch;

    // Create branch if needed (best-effort, idempotent)
    if (!dryRun && workingBranch !== baseBranch) {
      try {
        await this.githubMCP.createBranch(task.owner, task.repo, workingBranch, baseBranch);
        results.branchCreated = true;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        // GitHub returns a "reference already exists" error if branch exists; treat as OK.
        if (msg.toLowerCase().includes('already exists')) {
          results.branchCreated = false;
        } else {
          throw e;
        }
      }
    }

    // Step 2: Analyze & Generate
    // For MVP, we read target file and append/modify
    const filePath = task.targetPath || 'README.md';
    let currentContent = '';
    try {
      const fileData = await this.githubMCP.getFileContent(task.owner, task.repo, workingBranch, filePath);
      // Official GitHub MCP server returns decoded UTF-8 content
      currentContent = fileData.content;
    } catch (_e) {
      // File missing is acceptable; we'll create it on commit (unless dryRun)
      results.fileMissing = true;
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

    // Step 4: Commit (skip in dryRun)
    if (dryRun) {
      results.dryRun = true;
      results.preview = {
        branch: workingBranch,
        path: filePath,
        commitMessage: `docs: update ${filePath} via ScribeAgent`,
        contentLength: newContent.length,
      };
      return {
        ok: true,
        agent: 'scribe',
        ...results,
      };
    }

    const commitResult = await this.githubMCP.commitFile(
      task.owner,
      task.repo,
      workingBranch,
      filePath,
      newContent,
      `docs: update ${filePath} via ScribeAgent`
    );
    results.commit = commitResult;

    // Step 5: Create PR (only if workingBranch differs from baseBranch)
    if (workingBranch !== baseBranch) {
      const titleTemplate = task.prTitleTemplate || `docs: update ${filePath}`;
      const bodyTemplate = task.prBodyTemplate || `Automated docs update via ScribeAgent.\n\nPath: ${filePath}\nBranch: ${workingBranch}`;

      const prTitle = titleTemplate
        .replace('{timestamp}', new Date().toISOString())
        .replace('{branch}', workingBranch)
        .replace('{path}', filePath);

      const prBody = bodyTemplate
        .replace('{timestamp}', new Date().toISOString())
        .replace('{branch}', workingBranch)
        .replace('{path}', filePath);

      const pr = await this.githubMCP.createPRDraft(
        task.owner,
        task.repo,
        prTitle,
        prBody,
        workingBranch,
        baseBranch
      );

      results.pullRequest = pr;
    }

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
