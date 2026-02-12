import { BaseAgent } from '../../core/agents/BaseAgent.js';
import type { AgentDependencies } from '../../core/agents/AgentFactory.js';
import type { Plan, Critique, AIService } from '../../services/ai/AIService.js';
import type { MCPTools } from '../../services/mcp/adapters/index.js';
import type { TraceRecorder } from '../../core/tracing/TraceRecorder.js';
import { PROTO_GENERATE_SYSTEM_PROMPT } from '../../services/ai/prompt-constants.js';

interface ProtoPayload {
  requirements: string;
  goal?: string;
  owner?: string;
  repo?: string;
  baseBranch?: string;
  branchStrategy?: 'auto' | 'manual';
  dryRun?: boolean;
  stack?: string;
  maxTokens?: number;
}

export class ProtoAgent extends BaseAgent {
  readonly type = 'proto';
  private aiService?: AIService;
  private traceRecorder?: TraceRecorder;

  constructor(deps?: AgentDependencies) {
    super();
    if (deps?.tools?.aiService) {
      this.aiService = deps.tools.aiService as AIService;
    }
    if (deps?.traceRecorder) {
      this.traceRecorder = deps.traceRecorder;
    }
    this.playbook.requiresPlanning = true;
    this.playbook.requiresReflection = true;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private emitLog(message: string, data?: Record<string, unknown>) {
    if (this.traceRecorder) {
      this.traceRecorder.recordInfo(message, data);
    }
  }

  // ── Planning ─────────────────────────────────────────────────────────────

  async plan(
    planner: { plan(input: { agent: string; goal: string; context?: unknown }): Promise<Plan> },
    context: unknown
  ): Promise<Plan> {
    const payload = context as ProtoPayload;
    const goal = payload?.requirements || payload?.goal || 'scaffold a demo project';
    this.emitLog('Planning scaffold strategy', { requirementsLength: goal.length, stack: payload?.stack });
    return planner.plan({
      agent: this.type,
      goal: `Generate an MVP scaffold from these requirements:\n\n${goal}`,
      context: { stack: payload?.stack },
    });
  }

  // ── Reflection ───────────────────────────────────────────────────────────

  async reflect(
    reflector: { critique(input: { artifact: unknown; context?: unknown }): Promise<Critique> },
    artifact: unknown
  ): Promise<Critique> {
    this.emitLog('Reflecting on scaffold quality');
    return reflector.critique({
      artifact,
      context: { agent: this.type },
    });
  }

  // ── Full execute with tools ──────────────────────────────────────────────

  async executeWithTools(tools: MCPTools, plan?: Plan, context?: unknown): Promise<unknown> {
    const payload = context as ProtoPayload;
    const requirements = payload?.requirements || payload?.goal;
    if (!requirements) {
      throw new Error('ProtoAgent requires payload with "requirements" or "goal" field');
    }

    const startedAt = Date.now();
    const artifacts: Array<{ filePath: string; content: string }> = [];

    // ── Phase 1: AI scaffold generation ──────────────────────────────────
    if (this.aiService) {
      this.emitLog('Generating AI-powered scaffold', {
        requirementsLength: requirements.length,
        stack: payload?.stack,
        hasPlannedSteps: plan?.steps?.length ?? 0,
      });

      const tokenBudget = payload?.maxTokens ?? 16000;

      const scaffoldResult = await this.aiService.generateWorkArtifact({
        task: [
          'Generate a complete, working MVP project scaffold.',
          '',
          '## Requirements',
          requirements,
          payload?.stack ? `\n## Preferred Stack: ${payload.stack}` : '',
          plan?.steps?.length ? `\n## Planned Steps\n${plan.steps.map(s => `- ${s.title}`).join('\n')}` : '',
          '',
          '## CRITICAL OUTPUT FORMAT',
          'You MUST output each file in this exact format:',
          '',
          '### path: <relative-file-path>',
          '```<extension>',
          '<file content>',
          '```',
          '',
          'Example:',
          '### path: src/index.ts',
          '```typescript',
          'console.log("hello");',
          '```',
          '',
          'Generate all necessary files: README.md, config files, source code, and test stubs.',
        ].join('\n'),
        context: { plan: plan?.steps.map(s => s.title), stack: payload?.stack },
        maxTokens: tokenBudget,
        systemPrompt: PROTO_GENERATE_SYSTEM_PROMPT,
      });

      this.emitLog('AI scaffold generated', { contentLength: scaffoldResult.content.length });

      const parsed = this.parseScaffoldOutput(scaffoldResult.content);
      artifacts.push(...parsed);
      this.emitLog('Scaffold parsed into files', { fileCount: parsed.length, files: parsed.map(a => a.filePath) });
    } else {
      this.emitLog('No AI service available, using template scaffold');
      artifacts.push(
        { filePath: 'README.md', content: `# MVP Scaffold\n\nGenerated from: ${requirements.substring(0, 200)}\n\n## Getting Started\n\n\`\`\`bash\nnpm install\nnpm start\n\`\`\`\n` },
        { filePath: 'package.json', content: JSON.stringify({ name: 'mvp-scaffold', version: '0.1.0', scripts: { start: 'node index.js', test: 'echo "tests"', dev: 'node --watch index.js' }, dependencies: {}, devDependencies: {} }, null, 2) },
        { filePath: 'index.js', content: `// MVP Entry Point\n// Requirements: ${requirements.substring(0, 100)}\nconsole.log('Hello from Proto scaffold');\n` },
        { filePath: '.gitignore', content: 'node_modules/\ndist/\n.env\n' },
      );
    }

    // Record artifacts to DB for quality scoring + frontend Outputs tab
    for (const artifact of artifacts) {
      this.traceRecorder?.recordFileCreated(
        artifact.filePath,
        artifact.content.length,
        artifact.content.substring(0, 500),
      );
    }

    // ── Phase 2: Commit to GitHub (if not dry run) ─────────────────────────
    if (!payload?.dryRun && payload?.owner && payload?.repo && tools.githubMCP) {
      const github = tools.githubMCP;
      const branchName = payload.branchStrategy === 'manual'
        ? payload.baseBranch || 'main'
        : `proto/scaffold-${Date.now()}`;

      try {
        this.emitLog('Committing scaffold to GitHub', { branch: branchName, fileCount: artifacts.length });

        if (payload.branchStrategy !== 'manual') {
          await github.createBranch(payload.owner, payload.repo, branchName, payload.baseBranch || 'main');
          this.emitLog('Branch created', { branch: branchName });
        }

        for (const artifact of artifacts) {
          await github.commitFile(
            payload.owner, payload.repo, branchName,
            artifact.filePath, artifact.content,
            `proto: scaffold ${artifact.filePath}`
          );
          this.emitLog('File committed', { file: artifact.filePath });
        }

        let prUrl: string | undefined;
        try {
          const prResult = await github.createPRDraft(
            payload.owner, payload.repo,
            `[Proto] MVP scaffold`,
            `Auto-generated by AKIS Proto agent.\n\n## Requirements\n${requirements.substring(0, 300)}\n\n## Files (${artifacts.length})\n${artifacts.map(a => `- \`${a.filePath}\``).join('\n')}`,
            branchName, payload.baseBranch || 'main',
          );
          prUrl = (prResult as { url?: string })?.url;
          this.emitLog('Pull request created', { url: prUrl });
        } catch {
          // PR creation is optional
        }

        return {
          ok: true, agent: 'proto',
          artifacts: artifacts.map(a => ({ filePath: a.filePath })),
          branch: branchName, prUrl,
          metadata: {
            filesCreated: artifacts.length,
            committed: true,
            durationMs: Date.now() - startedAt,
            stack: payload?.stack ?? 'auto-detected',
          },
        };
      } catch (githubError) {
        this.emitLog('GitHub commit failed, returning artifacts inline', {
          error: githubError instanceof Error ? githubError.message : String(githubError),
        });
        return {
          ok: true, agent: 'proto',
          artifacts: artifacts.map(a => ({ filePath: a.filePath, content: a.content })),
          metadata: {
            filesCreated: artifacts.length, committed: false,
            durationMs: Date.now() - startedAt,
            githubError: githubError instanceof Error ? githubError.message : String(githubError),
          },
        };
      }
    }

    return {
      ok: true, agent: 'proto',
      artifacts: artifacts.map(a => ({ filePath: a.filePath, content: a.content })),
      metadata: {
        filesCreated: artifacts.length, committed: false,
        durationMs: Date.now() - startedAt,
        stack: payload?.stack ?? 'auto-detected',
      },
    };
  }

  // ── Simple execute (no tools) ────────────────────────────────────────────

  async execute(context: unknown): Promise<unknown> {
    const payload = context as ProtoPayload;
    const requirements = payload?.requirements || payload?.goal;
    if (!requirements) {
      throw new Error('ProtoAgent requires payload with "requirements" or "goal" field');
    }
    return {
      ok: true, agent: 'proto',
      message: 'Proto scaffold generated (no tools - use executeWithTools for full flow)',
      artifacts: [
        { filePath: 'README.md', content: `# MVP\n\n${requirements}` },
      ],
      metadata: { filesCreated: 1, committed: false },
    };
  }

  // ── Scaffold output parser (improved) ────────────────────────────────────

  private parseScaffoldOutput(content: string): Array<{ filePath: string; content: string }> {
    const artifacts: Array<{ filePath: string; content: string }> = [];

    // Strategy 1: Parse "### path: <filepath>" followed by code block
    const pathBlockPattern = /###?\s*(?:path|file):\s*`?([^\s`\n]+)`?\s*\n```(?:\w+)?\n([\s\S]*?)```/gi;
    let match;
    while ((match = pathBlockPattern.exec(content)) !== null) {
      const filePath = match[1].trim();
      const fileContent = match[2].trim();
      if (filePath && fileContent) {
        artifacts.push({ filePath, content: fileContent });
      }
    }

    if (artifacts.length > 0) return artifacts;

    // Strategy 2: Parse "**filepath**" or "`filepath`" followed by code block
    const altPattern = /(?:\*\*|`)([^\s*`\n]+\.(?:ts|js|tsx|jsx|json|md|yml|yaml|toml|css|html|py|go|rs|rb|php|sh|env|gitignore)[^\s*`]*)(?:\*\*|`)\s*\n```(?:\w+)?\n([\s\S]*?)```/gi;
    while ((match = altPattern.exec(content)) !== null) {
      const filePath = match[1].trim();
      const fileContent = match[2].trim();
      if (filePath && fileContent) {
        artifacts.push({ filePath, content: fileContent });
      }
    }

    if (artifacts.length > 0) return artifacts;

    // Strategy 3: Parse numbered code blocks with path-like headers
    const numberedPattern = /\d+\.\s*(?:\*\*)?([^\s*\n]+\.\w+)(?:\*\*)?\s*\n```(?:\w+)?\n([\s\S]*?)```/gi;
    while ((match = numberedPattern.exec(content)) !== null) {
      const filePath = match[1].trim();
      const fileContent = match[2].trim();
      if (filePath && fileContent) {
        artifacts.push({ filePath, content: fileContent });
      }
    }

    if (artifacts.length > 0) return artifacts;

    // Fallback: entire content as scaffold output
    this.emitLog('Could not parse scaffold into files, using raw output', { contentLength: content.length });
    artifacts.push({ filePath: 'scaffold-output.md', content });
    return artifacts;
  }
}
