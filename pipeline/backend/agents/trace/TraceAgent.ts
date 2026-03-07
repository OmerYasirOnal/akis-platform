import type {
  StructuredSpec,
  TraceInput,
  TraceOutput,
} from '../../core/contracts/PipelineTypes.js';
import type { PipelineError } from '../../core/contracts/PipelineTypes.js';
import {
  PipelineErrorCode,
  createPipelineError,
  RETRY_CONFIG,
} from '../../core/contracts/PipelineErrors.js';

// ─── Dependency Interfaces ────────────────────────

export interface TraceAIDeps {
  generateText(systemPrompt: string, userPrompt: string): Promise<string>;
}

export interface TraceGitHubDeps {
  listFiles(owner: string, repo: string, branch: string): Promise<string[]>;
  getFileContent(
    owner: string,
    repo: string,
    branch: string,
    filePath: string
  ): Promise<string>;
  commitFile(
    owner: string,
    repo: string,
    branch: string,
    filePath: string,
    content: string,
    message: string
  ): Promise<void>;
  createBranch(
    owner: string,
    repo: string,
    branch: string,
    fromBranch?: string
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

export type TraceResult =
  | { type: 'output'; data: TraceOutput }
  | { type: 'error'; error: PipelineError };

// ─── Constants ────────────────────────────────────

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte', '.css', '.html'];
const EXCLUDE_PATTERNS = ['node_modules/', '.git/', 'dist/', 'build/', '.next/'];

const TEST_GENERATION_PROMPT = `You are Trace, a code verifier and test writer for a software project pipeline.

Your task is to read a generated codebase and write comprehensive Playwright end-to-end tests.

Instructions:
1. Analyze the codebase:
   - Identify all routes/pages
   - Identify interactive components (forms, buttons, navigation)
   - Identify API endpoints (if any)
   - Note the tech stack and frameworks used

2. Map acceptance criteria to test scenarios:
   - Each acceptance criterion should have at least 1 test
   - Add tests for: page navigation, form validation, error states

3. Use Page Object Model pattern:
   - Create BasePage class with common utilities
   - Create page-specific classes extending BasePage
   - Tests should use page objects, not direct selectors

4. Generate coverage matrix:
   - Map each acceptance criteria ID to test file(s) that cover it

Output Format — respond ONLY with valid JSON:
{
  "testFiles": [
    {"filePath": "tests/e2e/auth.spec.ts", "content": "...", "testCount": 4},
    {"filePath": "tests/page-objects/BasePage.ts", "content": "...", "testCount": 0}
  ],
  "coverageMatrix": {
    "ac-1": ["tests/e2e/auth.spec.ts"],
    "ac-2": ["tests/e2e/crud.spec.ts"]
  },
  "testSummary": {
    "totalTests": 8,
    "coveragePercentage": 80,
    "coveredCriteria": ["ac-1", "ac-2"],
    "uncoveredCriteria": ["ac-5"]
  }
}

Also generate a playwright.config.ts file in the testFiles array.

Rules:
- Write ONLY end-to-end tests (no unit tests)
- Do NOT run the tests — only write them
- Do NOT modify existing source code
- Use TypeScript for all test files
- Use descriptive test names in English
- Use test.describe blocks to group related tests
- Include proper expect assertions
- temperature=0`;

// ─── TraceAgent ───────────────────────────────────

export class TraceAgent {
  private ai: TraceAIDeps;
  private github: TraceGitHubDeps;

  constructor(ai: TraceAIDeps, github: TraceGitHubDeps) {
    this.ai = ai;
    this.github = github;
  }

  async execute(input: TraceInput): Promise<TraceResult> {
    // Step 1: Read codebase from GitHub
    const codebaseResult = await this.readCodebase(input.repoOwner, input.repo, input.branch);
    if (codebaseResult.type === 'error') return codebaseResult;

    const files = codebaseResult.data;
    if (files.length === 0) {
      return {
        type: 'error',
        error: createPipelineError(
          PipelineErrorCode.TRACE_EMPTY_CODEBASE,
          'No source files found in repository'
        ),
      };
    }

    // Step 2: Generate tests via AI
    const testsResult = await this.generateTests(files, input.spec);
    if (testsResult.type === 'error') return testsResult;

    const { testFiles, coverageMatrix, testSummary } = testsResult.data;

    if (input.dryRun) {
      return {
        type: 'output',
        data: { ok: true, testFiles, coverageMatrix, testSummary },
      };
    }

    // Step 3: Create test branch
    const branchName = `trace/tests-${Date.now()}`;
    try {
      await this.github.createBranch(input.repoOwner, input.repo, branchName, input.branch);
    } catch (err) {
      return {
        type: 'error',
        error: createPipelineError(
          PipelineErrorCode.TRACE_TEST_GENERATION_FAILED,
          `Branch creation failed: ${err instanceof Error ? err.message : String(err)}`
        ),
      };
    }

    // Step 4: Push test files
    const pushResult = await this.pushTestFiles(
      input.repoOwner,
      input.repo,
      branchName,
      testFiles
    );
    if (pushResult.type === 'error') return pushResult;

    // Step 5: Create PR (non-fatal)
    let prUrl: string | undefined;
    try {
      const pr = await this.github.createPR(
        input.repoOwner,
        input.repo,
        'test: add Playwright e2e tests',
        this.buildPRBody(testSummary, coverageMatrix),
        branchName,
        input.branch
      );
      prUrl = pr.url;
    } catch {
      // PR failure is non-fatal — tests are already pushed
    }

    return {
      type: 'output',
      data: {
        ok: true,
        testFiles,
        coverageMatrix,
        testSummary,
        branch: branchName,
        prUrl,
      },
    };
  }

  // ─── Code Reading ──────────────────────────────

  private async readCodebase(
    owner: string,
    repo: string,
    branch: string
  ): Promise<
    | { type: 'output'; data: Array<{ filePath: string; content: string }> }
    | { type: 'error'; error: PipelineError }
  > {
    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      try {
        const allFiles = await this.github.listFiles(owner, repo, branch);
        const sourceFiles = allFiles.filter((f) => this.isSourceFile(f));

        const contents: Array<{ filePath: string; content: string }> = [];
        for (const filePath of sourceFiles) {
          const content = await this.github.getFileContent(owner, repo, branch, filePath);
          contents.push({ filePath, content });
        }

        return { type: 'output', data: contents };
      } catch (err) {
        if (attempt < RETRY_CONFIG.maxRetries) {
          await this.delay(RETRY_CONFIG.backoffDelays[attempt]);
          continue;
        }
        return {
          type: 'error',
          error: createPipelineError(
            PipelineErrorCode.TRACE_CODE_READ_FAILED,
            `Failed to read codebase: ${err instanceof Error ? err.message : String(err)}`
          ),
        };
      }
    }

    return {
      type: 'error',
      error: createPipelineError(PipelineErrorCode.TRACE_CODE_READ_FAILED, 'Unreachable'),
    };
  }

  private isSourceFile(filePath: string): boolean {
    if (EXCLUDE_PATTERNS.some((p) => filePath.includes(p))) return false;
    return SOURCE_EXTENSIONS.some((ext) => filePath.endsWith(ext));
  }

  // ─── Test Generation ───────────────────────────

  private async generateTests(
    files: Array<{ filePath: string; content: string }>,
    spec?: StructuredSpec
  ): Promise<
    | { type: 'output'; data: Pick<TraceOutput, 'testFiles' | 'coverageMatrix' | 'testSummary'> }
    | { type: 'error'; error: PipelineError }
  > {
    const codebaseContext = files
      .map((f) => `--- ${f.filePath} ---\n${f.content}`)
      .join('\n\n');
    const specContext = spec ? JSON.stringify(spec, null, 2) : 'No specification provided.';
    const userPrompt = `## Codebase\n\n${codebaseContext}\n\n## Specification\n\n${specContext}`;

    for (let attempt = 0; attempt <= RETRY_CONFIG.specValidationMaxRetries; attempt++) {
      let responseText: string;
      try {
        responseText = await this.ai.generateText(TEST_GENERATION_PROMPT, userPrompt);
      } catch {
        if (attempt < RETRY_CONFIG.specValidationMaxRetries) continue;
        return {
          type: 'error',
          error: createPipelineError(
            PipelineErrorCode.TRACE_TEST_GENERATION_FAILED,
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
            PipelineErrorCode.TRACE_TEST_GENERATION_FAILED,
            'Invalid JSON from test generation'
          ),
        };
      }

      const obj = parsed as Record<string, unknown>;
      const testFiles = obj.testFiles as TraceOutput['testFiles'] | undefined;
      const coverageMatrix = obj.coverageMatrix as Record<string, string[]> | undefined;
      const testSummary = obj.testSummary as TraceOutput['testSummary'] | undefined;

      if (!testFiles || !Array.isArray(testFiles) || testFiles.length === 0) {
        if (attempt < RETRY_CONFIG.specValidationMaxRetries) continue;
        return {
          type: 'error',
          error: createPipelineError(
            PipelineErrorCode.TRACE_TEST_GENERATION_FAILED,
            'No test files generated'
          ),
        };
      }

      const normalizedFiles = testFiles.map((f) => ({
        filePath: String(f.filePath),
        content: String(f.content),
        testCount: typeof f.testCount === 'number' ? f.testCount : 0,
      }));

      const totalTests = normalizedFiles.reduce((sum, f) => sum + f.testCount, 0);
      const specCriteria = spec?.acceptanceCriteria?.map((ac) => ac.id) ?? [];
      const coveredCriteria = coverageMatrix
        ? Object.keys(coverageMatrix).filter((k) => specCriteria.includes(k))
        : [];
      const uncoveredCriteria = specCriteria.filter((id) => !coveredCriteria.includes(id));

      return {
        type: 'output',
        data: {
          testFiles: normalizedFiles,
          coverageMatrix: coverageMatrix ?? {},
          testSummary: testSummary ?? {
            totalTests,
            coveragePercentage:
              specCriteria.length > 0
                ? Math.round((coveredCriteria.length / specCriteria.length) * 100)
                : 100,
            coveredCriteria,
            uncoveredCriteria,
          },
        },
      };
    }

    return {
      type: 'error',
      error: createPipelineError(
        PipelineErrorCode.TRACE_TEST_GENERATION_FAILED,
        'All retries exhausted'
      ),
    };
  }

  // ─── Push Test Files ───────────────────────────

  private async pushTestFiles(
    owner: string,
    repo: string,
    branch: string,
    files: TraceOutput['testFiles']
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
            `test: add ${file.filePath}`
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
            PipelineErrorCode.TRACE_TEST_GENERATION_FAILED,
            `Push failed after ${RETRY_CONFIG.maxRetries} retries: ${err instanceof Error ? err.message : String(err)}`
          ),
        };
      }
    }

    return {
      type: 'error',
      error: createPipelineError(
        PipelineErrorCode.TRACE_TEST_GENERATION_FAILED,
        'Unreachable'
      ),
    };
  }

  // ─── Helpers ────────────────────────────────────

  private buildPRBody(
    summary: TraceOutput['testSummary'],
    matrix: Record<string, string[]>
  ): string {
    const lines = [
      '## Playwright E2E Tests',
      '',
      `- ${summary.totalTests} test yazıldı`,
      `- ${summary.coveragePercentage}% acceptance criteria coverage`,
      '',
    ];

    if (Object.keys(matrix).length > 0) {
      lines.push('### Coverage Matrix');
      for (const [criteria, tests] of Object.entries(matrix)) {
        lines.push(`- **${criteria}**: ${tests.join(', ')}`);
      }
      lines.push('');
    }

    if (summary.uncoveredCriteria.length > 0) {
      lines.push('### Uncovered Criteria');
      lines.push(...summary.uncoveredCriteria.map((c) => `- ${c}`));
      lines.push('');
    }

    lines.push('> Bu testler AKIS Trace agent tarafından otomatik oluşturuldu.');
    return lines.join('\n');
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
