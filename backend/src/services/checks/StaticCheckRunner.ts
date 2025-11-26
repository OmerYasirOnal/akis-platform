/**
 * StaticCheckRunner - Runs static analysis checks (lint, typecheck, test, build)
 * 
 * Designed for asynchronous job execution without blocking Fastify handlers.
 * Uses child_process.spawn for non-blocking command execution.
 * 
 * Phase 10: Tool-Augmented Reflection support
 */

import { spawn, type ChildProcess } from 'child_process';

// =============================================================================
// Types
// =============================================================================

export type CheckType = 'lint' | 'typecheck' | 'test' | 'build';

export interface CheckResult {
  checkType: CheckType;
  passed: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  command: string;
}

export interface CheckRunnerOptions {
  /** Working directory for commands (default: process.cwd()) */
  cwd?: string;
  /** Timeout in milliseconds (default: 120000 = 2 minutes) */
  timeout?: number;
  /** Max output buffer size in bytes (default: 1MB) */
  maxBuffer?: number;
}

export interface AllChecksResult {
  lint?: CheckResult;
  typecheck?: CheckResult;
  test?: CheckResult;
  build?: CheckResult;
  allPassed: boolean;
  totalDurationMs: number;
}

// =============================================================================
// Default Commands (pnpm-based, per project rules)
// =============================================================================

const DEFAULT_COMMANDS: Record<CheckType, string[]> = {
  lint: ['pnpm', 'lint'],
  typecheck: ['pnpm', 'typecheck'],
  test: ['pnpm', 'test'],
  build: ['pnpm', 'build'],
};

// =============================================================================
// StaticCheckRunner Class
// =============================================================================

export class StaticCheckRunner {
  private cwd: string;
  private timeout: number;
  private maxBuffer: number;

  constructor(options: CheckRunnerOptions = {}) {
    this.cwd = options.cwd || process.cwd();
    this.timeout = options.timeout || 120_000; // 2 minutes
    this.maxBuffer = options.maxBuffer || 1024 * 1024; // 1MB
  }

  /**
   * Run a single check
   */
  async runCheck(checkType: CheckType): Promise<CheckResult> {
    const [cmd, ...args] = DEFAULT_COMMANDS[checkType];
    const startTime = Date.now();

    return new Promise<CheckResult>((resolve) => {
      let stdout = '';
      let stderr = '';
      let finished = false;

      const child: ChildProcess = spawn(cmd, args, {
        cwd: this.cwd,
        shell: true,
        env: { ...process.env, FORCE_COLOR: '0' }, // Disable colors for clean output
      });

      // Timeout handler
      const timeoutId = setTimeout(() => {
        if (!finished) {
          finished = true;
          child.kill('SIGTERM');
          resolve({
            checkType,
            passed: false,
            exitCode: -1,
            stdout: stdout.slice(0, this.maxBuffer),
            stderr: `Command timed out after ${this.timeout}ms`,
            durationMs: Date.now() - startTime,
            command: `${cmd} ${args.join(' ')}`,
          });
        }
      }, this.timeout);

      child.stdout?.on('data', (data: Buffer) => {
        if (stdout.length < this.maxBuffer) {
          stdout += data.toString();
        }
      });

      child.stderr?.on('data', (data: Buffer) => {
        if (stderr.length < this.maxBuffer) {
          stderr += data.toString();
        }
      });

      child.on('close', (code: number | null) => {
        if (finished) return;
        finished = true;
        clearTimeout(timeoutId);

        const exitCode = code ?? 1;
        resolve({
          checkType,
          passed: exitCode === 0,
          exitCode,
          stdout: stdout.slice(0, this.maxBuffer),
          stderr: stderr.slice(0, this.maxBuffer),
          durationMs: Date.now() - startTime,
          command: `${cmd} ${args.join(' ')}`,
        });
      });

      child.on('error', (error: Error) => {
        if (finished) return;
        finished = true;
        clearTimeout(timeoutId);

        resolve({
          checkType,
          passed: false,
          exitCode: -1,
          stdout: stdout.slice(0, this.maxBuffer),
          stderr: `Process error: ${error.message}`,
          durationMs: Date.now() - startTime,
          command: `${cmd} ${args.join(' ')}`,
        });
      });
    });
  }

  /**
   * Run multiple checks sequentially
   */
  async runChecks(checkTypes: CheckType[]): Promise<AllChecksResult> {
    const startTime = Date.now();
    const results: AllChecksResult = {
      allPassed: true,
      totalDurationMs: 0,
    };

    for (const checkType of checkTypes) {
      const result = await this.runCheck(checkType);
      results[checkType] = result;
      if (!result.passed) {
        results.allPassed = false;
      }
    }

    results.totalDurationMs = Date.now() - startTime;
    return results;
  }

  /**
   * Run all checks (lint, typecheck, test, build)
   * Runs sequentially to avoid resource contention on OCI Free Tier
   */
  async runAllChecks(): Promise<AllChecksResult> {
    return this.runChecks(['lint', 'typecheck', 'test', 'build']);
  }

  /**
   * Run critical checks only (lint, typecheck)
   * Faster subset for quick validation
   */
  async runCriticalChecks(): Promise<AllChecksResult> {
    return this.runChecks(['lint', 'typecheck']);
  }

  /**
   * Get check summary as a formatted string (for LLM reflection prompts)
   */
  static formatCheckSummary(results: AllChecksResult): string {
    const lines: string[] = ['Static Check Results:'];
    
    for (const checkType of ['lint', 'typecheck', 'test', 'build'] as CheckType[]) {
      const result = results[checkType];
      if (result) {
        const status = result.passed ? 'PASSED ✓' : 'FAILED ✗';
        lines.push(`  - ${checkType}: ${status} (${result.durationMs}ms)`);
        if (!result.passed && result.stderr) {
          // Include first 500 chars of error for context
          const errorPreview = result.stderr.slice(0, 500).split('\n').slice(0, 5).join('\n');
          lines.push(`    Error: ${errorPreview}...`);
        }
      }
    }

    lines.push(`  Overall: ${results.allPassed ? 'ALL PASSED' : 'SOME FAILED'}`);
    lines.push(`  Total Duration: ${results.totalDurationMs}ms`);

    return lines.join('\n');
  }
}

// =============================================================================
// Factory function
// =============================================================================

let defaultRunner: StaticCheckRunner | null = null;

/**
 * Get or create the default StaticCheckRunner instance
 */
export function getStaticCheckRunner(options?: CheckRunnerOptions): StaticCheckRunner {
  if (!defaultRunner || options) {
    const cwd = options?.cwd || process.cwd();
    defaultRunner = new StaticCheckRunner({
      cwd,
      timeout: options?.timeout || 120_000,
      maxBuffer: options?.maxBuffer,
    });
  }
  return defaultRunner;
}

