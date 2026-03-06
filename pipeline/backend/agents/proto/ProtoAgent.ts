import type {
  StructuredSpec,
  ProtoInput,
  ProtoOutput,
} from '../../core/contracts/PipelineTypes.js';
import { ProtoOutputSchema } from '../../core/contracts/PipelineSchemas.js';
import {
  PipelineErrorCode,
  createPipelineError,
  RETRY_CONFIG,
} from '../../core/contracts/PipelineErrors.js';
import type { PipelineError } from '../../core/contracts/PipelineTypes.js';

// ─── Dependency Interfaces ────────────────────────

export interface ProtoAIDeps {
  generateText(systemPrompt: string, userPrompt: string): Promise<string>;
}

export interface ProtoGitHubDeps {
  createRepository(owner: string, name: string, isPrivate: boolean): Promise<{ url: string }>;
  createBranch(owner: string, repo: string, branch: string, fromBranch?: string): Promise<void>;
  commitFile(
    owner: string,
    repo: string,
    branch: string,
    filePath: string,
    content: string,
    message: string
  ): Promise<void>;
  createPR(
    owner: string,
    repo: string,
    title: string,
    body: string,
    head: string,
    base: string
  ): Promise<{ url: string }>;
}

export type ProtoResult =
  | { type: 'output'; data: ProtoOutput }
  | { type: 'error'; error: PipelineError };

// ─── Constants ────────────────────────────────────

const SCAFFOLD_SYSTEM_PROMPT = `You are Proto, an MVP scaffold builder for a software project pipeline.

Your task is to generate a complete, working MVP codebase from an approved software specification.

Instructions:
1. Read the spec's problem statement, user stories, and technical constraints.
2. Determine the appropriate tech stack (use spec's preference if stated).
3. Generate these files for EVERY project:
   - README.md (project description, setup, run commands — in Turkish)
   - package.json (dependencies with pinned versions)
   - .gitignore (standard ignores for the stack)
   - src/ directory (main application code)
   - Basic routing/page structure
   - .env.example (environment variable template)
4. Generate setup commands specific to this project.

Output Format — respond ONLY with valid JSON:
{
  "files": [
    {"filePath": "package.json", "content": "...", "linesOfCode": 25},
    {"filePath": "src/App.tsx", "content": "...", "linesOfCode": 45}
  ],
  "setupCommands": ["npm install", "npm run dev"],
  "metadata": {
    "filesCreated": 8,
    "totalLinesOfCode": 320,
    "stackUsed": "React + Vite + TypeScript"
  }
}

Rules:
- Generate MINIMAL but WORKING code
- Do NOT generate test files (Trace agent handles testing)
- Do NOT add CI/CD pipelines
- Do NOT add technologies the user didn't request
- All code must be syntactically valid
- Use modern best practices
- README in Turkish`;

// ─── ProtoAgent ───────────────────────────────────

export class ProtoAgent {
  private ai: ProtoAIDeps;
  private github: ProtoGitHubDeps;

  constructor(ai: ProtoAIDeps, github: ProtoGitHubDeps) {
    this.ai = ai;
    this.github = github;
  }

  async execute(input: ProtoInput): Promise<ProtoResult> {
    // Step 1: Generate scaffold via AI
    const scaffoldResult = await this.generateScaffold(input.spec);
    if (scaffoldResult.type === 'error') return scaffoldResult;

    const { files, setupCommands, metadata } = scaffoldResult.data;

    if (input.dryRun) {
      return {
        type: 'output',
        data: {
          ok: true,
          branch: 'dry-run',
          repo: `${input.owner}/${input.repoName}`,
          repoUrl: `https://github.com/${input.owner}/${input.repoName}`,
          files,
          setupCommands: this.buildSetupCommands(input.owner, input.repoName, setupCommands),
          metadata: { ...metadata, committed: false },
        },
      };
    }

    // Step 2: Create GitHub repo
    const repoResult = await this.createRepo(input);
    if (repoResult.type === 'error') return repoResult;

    // Step 3: Create feature branch
    const branchName = `proto/scaffold-${Date.now()}`;
    try {
      await this.github.createBranch(input.owner, input.repoName, branchName);
    } catch (err) {
      return {
        type: 'error',
        error: createPipelineError(
          PipelineErrorCode.GITHUB_API_ERROR,
          `Branch creation failed: ${err instanceof Error ? err.message : String(err)}`
        ),
      };
    }

    // Step 4: Push files
    const pushResult = await this.pushFiles(input.owner, input.repoName, branchName, files);
    if (pushResult.type === 'error') return pushResult;

    // Step 5: Create PR
    let prUrl: string | undefined;
    try {
      const pr = await this.github.createPR(
        input.owner,
        input.repoName,
        `feat: initial scaffold — ${input.spec.title}`,
        this.buildPRBody(input.spec, metadata),
        branchName,
        input.baseBranch ?? 'main'
      );
      prUrl = pr.url;
    } catch (err) {
      // PR failure is non-fatal — code is already pushed
      console.warn(`[Proto] PR creation failed (non-fatal): ${err instanceof Error ? err.message : String(err)}`);
    }

    return {
      type: 'output',
      data: {
        ok: true,
        branch: branchName,
        repo: `${input.owner}/${input.repoName}`,
        repoUrl: `https://github.com/${input.owner}/${input.repoName}`,
        files,
        prUrl,
        setupCommands: this.buildSetupCommands(input.owner, input.repoName, setupCommands),
        metadata: { ...metadata, committed: true },
      },
    };
  }

  // ─── Scaffold Generation ────────────────────────

  private async generateScaffold(
    spec: StructuredSpec
  ): Promise<
    | { type: 'output'; data: { files: ProtoOutput['files']; setupCommands: string[]; metadata: Omit<ProtoOutput['metadata'], 'committed'> } }
    | { type: 'error'; error: PipelineError }
  > {
    const userPrompt = `Specification:\n${JSON.stringify(spec, null, 2)}`;

    for (let attempt = 0; attempt <= RETRY_CONFIG.specValidationMaxRetries; attempt++) {
      let responseText: string;
      try {
        responseText = await this.ai.generateText(SCAFFOLD_SYSTEM_PROMPT, userPrompt);
      } catch {
        if (attempt < RETRY_CONFIG.specValidationMaxRetries) continue;
        return {
          type: 'error',
          error: createPipelineError(
            PipelineErrorCode.PROTO_SCAFFOLD_GENERATION_FAILED,
            'AI call failed after retries'
          ),
        };
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(this.extractJson(responseText));
      } catch {
        if (attempt < RETRY_CONFIG.specValidationMaxRetries) continue;
        return {
          type: 'error',
          error: createPipelineError(
            PipelineErrorCode.PROTO_SCAFFOLD_GENERATION_FAILED,
            'Invalid JSON from scaffold generation'
          ),
        };
      }

      const obj = parsed as Record<string, unknown>;
      const files = obj.files as ProtoOutput['files'] | undefined;
      const setupCmds = obj.setupCommands as string[] | undefined;
      const meta = obj.metadata as Record<string, unknown> | undefined;

      if (!files || !Array.isArray(files) || files.length === 0) {
        if (attempt < RETRY_CONFIG.specValidationMaxRetries) continue;
        return {
          type: 'error',
          error: createPipelineError(
            PipelineErrorCode.PROTO_SCAFFOLD_GENERATION_FAILED,
            'No files generated'
          ),
        };
      }

      const normalizedFiles = files.map((f) => ({
        filePath: String(f.filePath),
        content: String(f.content),
        linesOfCode: typeof f.linesOfCode === 'number' ? f.linesOfCode : String(f.content).split('\n').length,
      }));

      const totalLines = normalizedFiles.reduce((sum, f) => sum + f.linesOfCode, 0);

      return {
        type: 'output',
        data: {
          files: normalizedFiles,
          setupCommands: Array.isArray(setupCmds) ? setupCmds : ['npm install', 'npm run dev'],
          metadata: {
            filesCreated: normalizedFiles.length,
            totalLinesOfCode: totalLines,
            stackUsed: typeof meta?.stackUsed === 'string' ? meta.stackUsed : 'Unknown',
          },
        },
      };
    }

    return {
      type: 'error',
      error: createPipelineError(PipelineErrorCode.PROTO_SCAFFOLD_GENERATION_FAILED, 'All retries exhausted'),
    };
  }

  // ─── GitHub Operations ──────────────────────────

  private async createRepo(
    input: ProtoInput
  ): Promise<{ type: 'output' } | { type: 'error'; error: PipelineError }> {
    try {
      await this.github.createRepository(
        input.owner,
        input.repoName,
        input.repoVisibility === 'private'
      );
      return { type: 'output' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);

      if (msg.includes('already exists') || msg.includes('name already exists')) {
        return {
          type: 'error',
          error: createPipelineError(PipelineErrorCode.GITHUB_REPO_EXISTS, msg),
        };
      }
      if (msg.includes('permission') || msg.includes('forbidden') || msg.includes('403')) {
        return {
          type: 'error',
          error: createPipelineError(PipelineErrorCode.GITHUB_PERMISSION_DENIED, msg),
        };
      }
      if (msg.includes('not connected') || msg.includes('unauthorized') || msg.includes('401')) {
        return {
          type: 'error',
          error: createPipelineError(PipelineErrorCode.GITHUB_NOT_CONNECTED, msg),
        };
      }

      return {
        type: 'error',
        error: createPipelineError(PipelineErrorCode.GITHUB_API_ERROR, msg),
      };
    }
  }

  private async pushFiles(
    owner: string,
    repo: string,
    branch: string,
    files: ProtoOutput['files']
  ): Promise<{ type: 'output' } | { type: 'error'; error: PipelineError }> {
    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      try {
        for (const file of files) {
          await this.github.commitFile(
            owner,
            repo,
            branch,
            file.filePath,
            file.content,
            `feat: add ${file.filePath}`
          );
        }
        return { type: 'output' };
      } catch (err) {
        if (attempt < RETRY_CONFIG.maxRetries) {
          await this.delay(RETRY_CONFIG.backoffDelays[attempt]);
          continue;
        }
        return {
          type: 'error',
          error: createPipelineError(
            PipelineErrorCode.PROTO_PUSH_FAILED,
            `Push failed after ${RETRY_CONFIG.maxRetries} retries: ${err instanceof Error ? err.message : String(err)}`
          ),
        };
      }
    }

    return {
      type: 'error',
      error: createPipelineError(PipelineErrorCode.PROTO_PUSH_FAILED, 'Unreachable'),
    };
  }

  // ─── Helpers ────────────────────────────────────

  private buildSetupCommands(owner: string, repoName: string, aiCommands: string[]): string[] {
    return [
      `git clone https://github.com/${owner}/${repoName}.git`,
      `cd ${repoName}`,
      ...aiCommands,
    ];
  }

  private buildPRBody(spec: StructuredSpec, metadata: { filesCreated: number; totalLinesOfCode: number; stackUsed: string }): string {
    return [
      `## ${spec.title}`,
      '',
      spec.problemStatement,
      '',
      `### Stack: ${metadata.stackUsed}`,
      `- ${metadata.filesCreated} dosya oluşturuldu`,
      `- ${metadata.totalLinesOfCode} satır kod`,
      '',
      '### User Stories',
      ...spec.userStories.map((s) => `- ${s.persona} olarak ${s.action} istiyorum, ${s.benefit}`),
      '',
      '> Bu scaffold AKIS Proto agent tarafından otomatik oluşturuldu.',
    ].join('\n');
  }

  private extractJson(text: string): string {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) return fenced[1].trim();

    const braceStart = text.indexOf('{');
    const braceEnd = text.lastIndexOf('}');
    if (braceStart !== -1 && braceEnd > braceStart) {
      return text.slice(braceStart, braceEnd + 1);
    }

    return text.trim();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
