import type {
  StructuredSpec,
  ProtoInput,
  ProtoOutput,
} from '../../core/contracts/PipelineTypes.js';
import {
  PipelineErrorCode,
  createPipelineError,
  RETRY_CONFIG,
} from '../../core/contracts/PipelineErrors.js';
import type { PipelineError } from '../../core/contracts/PipelineTypes.js';
import { createActivityEmitter } from '../../core/activityEmitter.js';

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

const MIN_SCAFFOLD_FILES = 6;

const SCAFFOLD_SYSTEM_PROMPT = `You are Proto, an MVP scaffold builder.

Generate a WORKING codebase with proper file structure. Output ONLY valid JSON — no markdown, no explanations, no code fences.

FOLDER STRUCTURE (minimum required files):
  index.html          — Vite HTML entry (<div id="root">, <script type="module" src="/src/main.jsx">)
  package.json        — react, react-dom, vite, @vitejs/plugin-react as deps + "dev": "vite" script
  vite.config.js      — import react plugin, export default
  .gitignore          — node_modules, dist, .env
  README.md           — Turkish, proje açıklaması + kurulum adımları (npm install && npm run dev)
  src/main.jsx        — ONLY ReactDOM.createRoot + <App /> render, nothing else
  src/App.jsx         — Main layout, imports and renders all feature components
  src/App.css         — Basic styling (no inline styles!)
  src/components/     — ONE component file per user story from the spec

RULES:
- Create 8-12 files total. Each file UNDER 80 lines.
- src/main.jsx must ONLY do ReactDOM.createRoot(document.getElementById('root')).render(<App />)
- src/App.jsx imports and composes feature components
- Each user story from the spec gets its OWN component in src/components/
- Each acceptance criterion must have corresponding UI/logic in a component
- Use a SINGLE src/App.css for all styles — NO inline styles
- index.html must have <div id="root"></div> and module script tag
- package.json: "type": "module", react + react-dom + vite + @vitejs/plugin-react
- No comments in code. No test files. No CI/CD.
- README.md in Turkish with: project description, setup steps, features list.
- Code in English, UI text in Turkish.

BEFORE returning your output, perform VERIFICATION:

1. SPEC COMPLIANCE CHECK:
   For each User Story in the input StructuredSpec:
   - [ ] At least one generated file addresses this story
   - [ ] The file structure supports the Acceptance Criteria
   For each Acceptance Criterion:
   - [ ] The Given state is represented (data model, route, or component)
   - [ ] The When trigger has a corresponding handler or endpoint
   - [ ] The Then outcome has a corresponding response or UI element

2. SCAFFOLD INTEGRITY CHECK:
   - [ ] package.json includes all imported dependencies
   - [ ] No file imports from a path that doesn't exist in the scaffold
   - [ ] Entry point file exists and is valid
   - [ ] No TODO placeholders without implementation guidance comments

3. Include a "verificationReport" object in your JSON output:
   {
     "specCoverage": "X/Y criteria addressed",
     "integrityIssues": [],
     "confidenceScore": 0.0
   }
   confidenceScore range: 0.0 (no confidence) to 1.0 (fully verified)

JSON format (respond with ONLY this, nothing else):
{"files":[{"filePath":"index.html","content":"...","linesOfCode":12},{"filePath":"package.json","content":"...","linesOfCode":20},{"filePath":"vite.config.js","content":"...","linesOfCode":7},{"filePath":".gitignore","content":"node_modules\\ndist\\n.env","linesOfCode":3},{"filePath":"README.md","content":"...","linesOfCode":25},{"filePath":"src/main.jsx","content":"...","linesOfCode":8},{"filePath":"src/App.jsx","content":"...","linesOfCode":40},{"filePath":"src/App.css","content":"...","linesOfCode":60},{"filePath":"src/components/FeatureName.jsx","content":"...","linesOfCode":45}],"setupCommands":["npm install","npm run dev"],"metadata":{"filesCreated":9,"totalLinesOfCode":220,"stackUsed":"React + Vite"},"verificationReport":{"specCoverage":"5/5 criteria addressed","integrityIssues":[],"confidenceScore":0.9}}`;

// ─── ProtoAgent ───────────────────────────────────

export class ProtoAgent {
  private ai: ProtoAIDeps;
  private github: ProtoGitHubDeps;

  constructor(ai: ProtoAIDeps, github: ProtoGitHubDeps) {
    this.ai = ai;
    this.github = github;
  }

  async execute(input: ProtoInput): Promise<ProtoResult> {
    const emit = input.pipelineId
      ? createActivityEmitter(input.pipelineId, 'proto')
      : undefined;

    // Step 1: Generate scaffold via AI
    emit?.('ai_call', 'Claude AI ile MVP scaffold oluşturuluyor...', 20);
    const scaffoldResult = await this.generateScaffold(input.spec);
    if (scaffoldResult.type === 'error') {
      emit?.('error', 'Scaffold üretimi başarısız oldu', 0);
      return scaffoldResult;
    }

    const { files, setupCommands, metadata } = scaffoldResult.data;
    emit?.('parsing', `AI yanıtından dosya yapısı çıkarıldı: ${files.length} dosya`, 55);

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
    if (repoResult.type === 'error') {
      emit?.('error', 'GitHub repo oluşturulamadı', 0);
      return repoResult;
    }

    // Step 3: Create feature branch
    const branchName = `proto/scaffold-${Date.now()}`;
    try {
      await this.github.createBranch(input.owner, input.repoName, branchName);
    } catch (err) {
      emit?.('error', 'Branch oluşturulamadı', 0);
      return {
        type: 'error',
        error: createPipelineError(
          PipelineErrorCode.GITHUB_API_ERROR,
          `Branch creation failed: ${err instanceof Error ? err.message : String(err)}`
        ),
      };
    }

    // Step 4: Push files
    emit?.('github_push', `${files.length} dosya GitHub'a push ediliyor...`, 75);
    const pushResult = await this.pushFiles(input.owner, input.repoName, branchName, files);
    if (pushResult.type === 'error') {
      emit?.('error', 'Dosyalar push edilemedi', 0);
      return pushResult;
    }

    // Step 5: Create PR
    emit?.('verification', 'Scaffold bütünlüğü doğrulanıyor...', 90);
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

    emit?.('complete', `Scaffold hazır: ${files.length} dosya push edildi`, 100);
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
    const condensedSpec = {
      title: spec.title,
      problem: spec.problemStatement,
      userStories: spec.userStories.slice(0, 6).map((s) => ({
        persona: s.persona,
        action: s.action,
        benefit: s.benefit,
      })),
      acceptanceCriteria: spec.acceptanceCriteria.slice(0, 8).map((ac) => ({
        id: ac.id,
        when: ac.when,
        then: ac.then,
      })),
      stack: spec.technicalConstraints?.stack ?? 'React + Vite + TypeScript',
    };
    const userPrompt = JSON.stringify(condensedSpec);

    for (let attempt = 0; attempt <= RETRY_CONFIG.specValidationMaxRetries; attempt++) {
      let responseText: string;
      try {
        responseText = await this.ai.generateText(SCAFFOLD_SYSTEM_PROMPT, userPrompt);
      } catch (err) {
        console.error(`[Proto] Attempt ${attempt + 1}: AI call error:`, err instanceof Error ? err.message : String(err));
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
      let wasRepaired = false;
      try {
        const jsonStr = this.extractJson(responseText);
        // First try raw parse, then try with control char sanitization
        try {
          parsed = JSON.parse(jsonStr);
        } catch {
          const sanitized = this.sanitizeJsonControlChars(jsonStr);
          parsed = JSON.parse(sanitized);
          console.warn(`[Proto] Parsed after sanitizing control chars`);
        }
      } catch (parseErr) {
        console.warn(`[Proto] JSON parse failed (attempt ${attempt + 1}, len=${responseText.length}): ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`);
        // Try to repair truncated JSON
        const repaired = this.repairTruncatedJson(responseText);
        if (repaired) {
          try {
            parsed = JSON.parse(repaired);
            wasRepaired = true;
          } catch {
            // Also try sanitized repair
            try {
              parsed = JSON.parse(this.sanitizeJsonControlChars(repaired));
              wasRepaired = true;
            } catch {
              // repair also failed
            }
          }
        }
        if (!parsed) {
          if (attempt < RETRY_CONFIG.specValidationMaxRetries) continue;
          return {
            type: 'error',
            error: createPipelineError(
              PipelineErrorCode.PROTO_SCAFFOLD_GENERATION_FAILED,
              `Invalid JSON from scaffold generation (response length: ${responseText.length})`
            ),
          };
        }
      }

      const obj = parsed as Record<string, unknown>;
      const files = obj.files as ProtoOutput['files'] | undefined;
      const setupCmds = obj.setupCommands as string[] | undefined;
      const meta = obj.metadata as Record<string, unknown> | undefined;

      const fileCount = Array.isArray(files) ? files.length : 0;

      // If repaired result has too few files, it's likely truncated — retry
      if (wasRepaired && fileCount < MIN_SCAFFOLD_FILES) {
        console.warn(`[Proto] Repaired JSON only has ${fileCount} files (min: ${MIN_SCAFFOLD_FILES}), retrying...`);
        if (attempt < RETRY_CONFIG.specValidationMaxRetries) continue;
      }

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

  /**
   * Escape raw control characters inside JSON string values.
   * AI often outputs actual newlines/tabs instead of \n \t escape sequences.
   */
  private sanitizeJsonControlChars(json: string): string {
    let result = '';
    let inString = false;
    for (let i = 0; i < json.length; i++) {
      const c = json[i];
      const code = c.charCodeAt(0);

      if (c === '"' && (i === 0 || json[i - 1] !== '\\')) {
        inString = !inString;
        result += c;
      } else if (inString && code < 32) {
        if (code === 10) result += '\\n';
        else if (code === 13) result += '\\r';
        else if (code === 9) result += '\\t';
        else result += `\\u${code.toString(16).padStart(4, '0')}`;
      } else {
        result += c;
      }
    }
    return result;
  }

  private extractJson(text: string): string {
    // If response starts with { it's already pure JSON — don't try fenced extraction
    // (fenced regex can match backticks INSIDE JSON string values like README content)
    const trimmed = text.trim();
    if (trimmed.startsWith('{')) {
      const braceEnd = trimmed.lastIndexOf('}');
      if (braceEnd > 0) return trimmed.slice(0, braceEnd + 1);
      return trimmed;
    }

    // Try fenced code block only when response is NOT pure JSON
    const fenced = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (fenced) return fenced[1].trim();

    const braceStart = text.indexOf('{');
    const braceEnd = text.lastIndexOf('}');
    if (braceStart !== -1 && braceEnd > braceStart) {
      return text.slice(braceStart, braceEnd + 1);
    }

    return trimmed;
  }

  /**
   * Attempt to repair truncated JSON (e.g. from max_tokens cutoff).
   * Tries to close open strings, arrays, and objects.
   */
  private repairTruncatedJson(text: string): string | null {
    // Extract the JSON portion
    let json = this.extractJson(text);
    if (!json.startsWith('{')) return null;

    // If it already parses, return it
    try { JSON.parse(json); return json; } catch { /* continue */ }

    // Try progressively closing brackets
    // First, close any open string
    const quoteCount = (json.match(/(?<!\\)"/g) || []).length;
    if (quoteCount % 2 !== 0) {
      json += '"';
    }

    // Close arrays and objects
    const opens: string[] = [];
    let inString = false;
    for (let i = 0; i < json.length; i++) {
      const c = json[i];
      if (c === '"' && (i === 0 || json[i - 1] !== '\\')) {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (c === '{' || c === '[') opens.push(c);
      if (c === '}' || c === ']') opens.pop();
    }

    // Close in reverse
    while (opens.length > 0) {
      const open = opens.pop();
      json += open === '{' ? '}' : ']';
    }

    try {
      JSON.parse(json);
      console.warn(`[Proto] Repaired truncated JSON (added ${json.length - this.extractJson(text).length} closing chars)`);
      return json;
    } catch {
      return null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
