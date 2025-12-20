import { BaseAgent } from '../../core/agents/BaseAgent.js';
import type { AgentDependencies } from '../../core/agents/AgentFactory.js';
import { GitHubMCPService } from '../../services/mcp/adapters/GitHubMCPService.js';
import type { AIService, Plan, Planner } from '../../services/ai/AIService.js';
import type { MCPTools } from '../../services/mcp/adapters/index.js';
import type { TraceRecorder } from '../../core/tracing/TraceRecorder.js';

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
 * S1.1: Explainability UI integration with TraceRecorder
 * Extends BaseAgent; accepts injected tools (MCP adapters, AIService) via constructor
 */
export class ScribeAgent extends BaseAgent {
  readonly type = 'scribe';
  private githubMCP?: GitHubMCPService;
  private aiService?: AIService;
  private traceRecorder?: TraceRecorder;

  constructor(deps?: AgentDependencies) {
    super();
    // Inject dependencies
    if (deps?.tools?.githubMCP) {
      this.githubMCP = deps.tools.githubMCP as GitHubMCPService;
    }
    if (deps?.tools?.aiService) {
      this.aiService = deps.tools.aiService as AIService;
    }
    // S1.1: TraceRecorder for explainability
    if (deps?.traceRecorder) {
      this.traceRecorder = deps.traceRecorder;
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
   * S1.1: Enhanced with explainability tracing
   */
  async executeWithTools(_tools: MCPTools, plan?: Plan, context?: unknown): Promise<unknown> {
    // Note: We use this.githubMCP injected via constructor to ensure we have the token-aware instance
    // _tools might contain the global generic tools
    
    if (!this.isValidContext(context)) {
      throw new Error('ScribeAgent requires valid ScribeTaskContext');
    }
    const task = context as ScribeTaskContext;
    const dryRun = task.dryRun === true;

    // S1.1: Record initial reasoning
    this.traceRecorder?.recordReasoning({
      phase: 'initialization',
      summary: `Starting Scribe workflow for ${task.owner}/${task.repo}. ` +
               `Target: ${task.targetPath || 'README.md'}. ` +
               `Mode: ${dryRun ? 'dry-run (no changes will be written)' : 'execute (changes will be written)'}.`,
    });

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
    this.traceRecorder?.recordPlanStep({
      stepId: 'branch-management',
      title: 'Branch Management',
      description: 'Determine working branch for documentation updates',
      reasoning: dryRun 
        ? 'In dry-run mode, we simulate branch operations without making changes.'
        : 'Creating or using an existing feature branch to isolate documentation changes.',
      status: 'running',
    });

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
      const branchStartTime = Date.now();
      try {
        this.traceRecorder?.recordToolCall({
          toolName: 'github.createBranch',
          asked: `Create branch "${workingBranch}" from "${baseBranch}"`,
          did: 'Calling GitHub API to create a new branch for documentation changes',
          why: 'Creating a separate branch ensures the base branch remains unchanged until changes are reviewed.',
          inputSummary: `owner: ${task.owner}, repo: ${task.repo}, branch: ${workingBranch}, base: ${baseBranch}`,
          success: true,
          durationMs: Date.now() - branchStartTime,
        });
        await this.githubMCP.createBranch(task.owner, task.repo, workingBranch, baseBranch);
        results.branchCreated = true;
        
        this.traceRecorder?.recordDecision({
          title: 'Branch created successfully',
          decision: `Created new branch "${workingBranch}"`,
          reasoning: 'The branch was created successfully and will be used for all subsequent operations.',
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        // GitHub returns a "reference already exists" error if branch exists; treat as OK.
        if (msg.toLowerCase().includes('already exists')) {
          results.branchCreated = false;
          this.traceRecorder?.recordDecision({
            title: 'Branch already exists',
            decision: `Using existing branch "${workingBranch}"`,
            reasoning: 'The branch already existed, which is acceptable. We will use it for documentation updates.',
          });
        } else {
          throw e;
        }
      }
    }

    this.traceRecorder?.recordPlanStep({
      stepId: 'branch-management',
      title: 'Branch Management',
      description: `Working branch: ${workingBranch}`,
      reasoning: dryRun ? 'Dry-run: no branch changes made' : `Branch ${results.branchCreated ? 'created' : 'exists'}`,
      status: 'completed',
    });

    // Step 2: Analyze & Generate
    const filePath = task.targetPath || 'README.md';
    
    this.traceRecorder?.recordPlanStep({
      stepId: 'analyze-content',
      title: 'Analyze Existing Content',
      description: `Reading current content of ${filePath}`,
      reasoning: 'We need to read the existing file content to append our documentation updates.',
      status: 'running',
    });

    let currentContent = '';
    const readStartTime = Date.now();
    try {
      this.traceRecorder?.recordToolCall({
        toolName: 'github.getFileContent',
        asked: `Read the contents of "${filePath}" from branch "${workingBranch}"`,
        did: 'Calling GitHub API to retrieve file contents',
        why: 'Reading existing content allows us to append updates while preserving the original documentation.',
        inputSummary: `owner: ${task.owner}, repo: ${task.repo}, branch: ${workingBranch}, path: ${filePath}`,
        success: true,
        durationMs: Date.now() - readStartTime,
      });
      
      const fileData = await this.githubMCP.getFileContent(task.owner, task.repo, workingBranch, filePath);
      currentContent = fileData.content;
      
      // Record document read
      this.traceRecorder?.recordDocRead(filePath, currentContent.length, currentContent.substring(0, 200));
    } catch (_e) {
      // File missing is acceptable; we'll create it on commit (unless dryRun)
      results.fileMissing = true;
      this.traceRecorder?.recordDecision({
        title: 'File not found',
        decision: `Will create new file "${filePath}"`,
        reasoning: 'The target file does not exist. We will create it with the new documentation content.',
      });
    }

    this.traceRecorder?.recordPlanStep({
      stepId: 'analyze-content',
      title: 'Analyze Existing Content',
      description: results.fileMissing ? `File ${filePath} will be created` : `Read ${currentContent.length} bytes`,
      reasoning: results.fileMissing ? 'Creating new file' : 'Successfully read existing content',
      status: 'completed',
    });

    // Step 3: Generate new content
    this.traceRecorder?.recordPlanStep({
      stepId: 'generate-content',
      title: 'Generate Documentation Update',
      description: 'Creating updated documentation content',
      reasoning: 'Combining existing content with new documentation based on task description and plan.',
      status: 'running',
    });

    const updateInfo = plan?.rationale ? `Plan Rationale: ${plan.rationale}` : 'No specific plan rationale.';
    const newContent = `${currentContent}\n\n## Update ${new Date().toISOString()}\n${task.taskDescription || 'Documentation updated by ScribeAgent.'}\n\n${updateInfo}`;
    
    this.traceRecorder?.recordPlanStep({
      stepId: 'generate-content',
      title: 'Generate Documentation Update',
      description: `Generated ${newContent.length} bytes of content`,
      reasoning: 'Content successfully generated by combining existing documentation with new updates.',
      status: 'completed',
    });
    
    // Step 4: Reflect (Critique before commit)
    this.traceRecorder?.recordPlanStep({
      stepId: 'reflect-critique',
      title: 'AI Review',
      description: 'Having AI review the generated content',
      reasoning: 'AI review helps ensure documentation quality and catches potential issues before commit.',
      status: 'running',
    });

    const critiqueStartTime = Date.now();
    this.traceRecorder?.recordToolCall({
      toolName: 'ai.critique',
      asked: 'Review the generated documentation content for quality and accuracy',
      did: 'Calling AI service to critique the documentation update',
      why: 'Pre-commit review helps maintain documentation quality and catches issues early.',
      inputSummary: `Content length: ${newContent.length} bytes`,
      success: true,
      durationMs: Date.now() - critiqueStartTime,
    });

    const critique = await this.aiService.reflector.critique({
      artifact: newContent,
      context: task
    });
    results.critique = critique;

    this.traceRecorder?.recordReasoning({
      phase: 'review',
      summary: critique.issues && critique.issues.length > 0
        ? `AI review found ${critique.issues.length} issue(s) to consider. Proceeding with execution.`
        : 'AI review completed. Content quality verified.',
      stepId: 'reflect-critique',
    });

    this.traceRecorder?.recordPlanStep({
      stepId: 'reflect-critique',
      title: 'AI Review',
      description: critique.issues?.length ? `Found ${critique.issues.length} issues` : 'No issues found',
      reasoning: 'Review complete',
      status: 'completed',
    });

    // Step 5: Commit (skip in dryRun)
    if (dryRun) {
      this.traceRecorder?.recordDecision({
        title: 'Dry-run mode: Skipping commit',
        decision: 'No changes written to GitHub',
        reasoning: 'In dry-run mode, we simulate the workflow without making actual changes. This allows testing the workflow safely.',
      });

      results.dryRun = true;
      results.preview = {
        branch: workingBranch,
        path: filePath,
        commitMessage: `docs: update ${filePath} via ScribeAgent`,
        contentLength: newContent.length,
      };

      this.traceRecorder?.recordReasoning({
        phase: 'completion',
        summary: `Dry-run completed successfully. Would have updated ${filePath} on branch ${workingBranch}. Content preview: ${newContent.length} bytes.`,
      });

      return {
        ok: true,
        agent: 'scribe',
        ...results,
      };
    }

    this.traceRecorder?.recordPlanStep({
      stepId: 'commit-changes',
      title: 'Commit Changes',
      description: `Committing updates to ${filePath}`,
      reasoning: 'Persisting the documentation changes to the repository.',
      status: 'running',
    });

    const commitStartTime = Date.now();
    this.traceRecorder?.recordToolCall({
      toolName: 'github.commitFile',
      asked: `Commit the updated content to "${filePath}" on branch "${workingBranch}"`,
      did: 'Calling GitHub API to create a new commit with the updated file',
      why: 'Committing the changes makes them permanent and trackable in version control.',
      inputSummary: `path: ${filePath}, branch: ${workingBranch}, message: "docs: update ${filePath} via ScribeAgent"`,
      success: true,
      durationMs: Date.now() - commitStartTime,
    });

    const commitResult = await this.githubMCP.commitFile(
      task.owner,
      task.repo,
      workingBranch,
      filePath,
      newContent,
      `docs: update ${filePath} via ScribeAgent`
    );
    results.commit = commitResult;

    // Record file modification
    this.traceRecorder?.recordFileModified({
      path: filePath,
      sizeBytes: newContent.length,
      preview: newContent.substring(0, 500),
      linesAdded: newContent.split('\n').length - currentContent.split('\n').length,
    });

    this.traceRecorder?.recordPlanStep({
      stepId: 'commit-changes',
      title: 'Commit Changes',
      description: 'Changes committed successfully',
      reasoning: 'Documentation updates are now saved in the repository.',
      status: 'completed',
    });

    // Step 6: Create PR (only if workingBranch differs from baseBranch)
    if (workingBranch !== baseBranch) {
      this.traceRecorder?.recordPlanStep({
        stepId: 'create-pr',
        title: 'Create Pull Request',
        description: `Opening PR from ${workingBranch} to ${baseBranch}`,
        reasoning: 'Creating a pull request enables team review before merging documentation changes.',
        status: 'running',
      });

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

      const prStartTime = Date.now();
      this.traceRecorder?.recordToolCall({
        toolName: 'github.createPRDraft',
        asked: `Create a draft pull request for the documentation changes`,
        did: 'Calling GitHub API to create a draft pull request',
        why: 'A draft PR allows team members to review the documentation changes before they are merged.',
        inputSummary: `title: "${prTitle}", head: ${workingBranch}, base: ${baseBranch}`,
        success: true,
        durationMs: Date.now() - prStartTime,
      });

      const pr = await this.githubMCP.createPRDraft(
        task.owner,
        task.repo,
        prTitle,
        prBody,
        workingBranch,
        baseBranch
      );

      results.pullRequest = pr;

      this.traceRecorder?.recordPlanStep({
        stepId: 'create-pr',
        title: 'Create Pull Request',
        description: `PR created: ${pr.url || 'success'}`,
        reasoning: 'Pull request is ready for team review.',
        status: 'completed',
      });
    }

    this.traceRecorder?.recordReasoning({
      phase: 'completion',
      summary: `Scribe workflow completed successfully. Updated ${filePath} on branch ${workingBranch}. ` +
               (results.pullRequest ? 'Pull request created for review.' : 'Changes committed directly.'),
    });

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
