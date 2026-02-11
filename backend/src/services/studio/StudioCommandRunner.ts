/**
 * StudioCommandRunner — secure allowlist-based command execution for Studio.
 *
 * Only pre-approved commands can be executed. No arbitrary shell access.
 * Each command runs with shell:false for security.
 */

import { spawn } from 'node:child_process';

export interface CommandDefinition {
  key: string;
  label: string;
  command: string;
  args: string[];
  cwd?: string;
  timeoutMs?: number;
}

export interface CommandResult {
  key: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  truncated: boolean;
}

const MAX_OUTPUT_BYTES = 64 * 1024; // 64KB per stream
const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Default allowlist — safe read-only or build commands.
 * No destructive operations (rm, git push, etc.) allowed.
 */
export const DEFAULT_ALLOWLIST: CommandDefinition[] = [
  { key: 'git_status', label: 'git status', command: 'git', args: ['status', '--short'] },
  { key: 'git_diff', label: 'git diff', command: 'git', args: ['diff', '--stat'] },
  { key: 'lint', label: 'pnpm lint', command: 'pnpm', args: ['lint'] },
  { key: 'typecheck', label: 'pnpm typecheck', command: 'pnpm', args: ['typecheck'] },
  { key: 'test', label: 'pnpm test', command: 'pnpm', args: ['test'] },
  { key: 'build', label: 'pnpm build', command: 'pnpm', args: ['build'] },
];

/**
 * Validate a command key against the allowlist.
 */
export function isAllowedCommand(key: string, allowlist: CommandDefinition[] = DEFAULT_ALLOWLIST): boolean {
  return allowlist.some((cmd) => cmd.key === key);
}

/**
 * Resolve a command definition by key.
 */
export function resolveCommand(key: string, allowlist: CommandDefinition[] = DEFAULT_ALLOWLIST): CommandDefinition | null {
  return allowlist.find((cmd) => cmd.key === key) ?? null;
}

/**
 * Execute an allowlisted command. Returns structured result.
 * Throws if command key is not in allowlist.
 */
export async function executeCommand(
  key: string,
  options?: { cwd?: string; allowlist?: CommandDefinition[] },
): Promise<CommandResult> {
  const allowlist = options?.allowlist ?? DEFAULT_ALLOWLIST;
  const def = resolveCommand(key, allowlist);

  if (!def) {
    throw new Error(`Command '${key}' is not in the allowlist`);
  }

  const cwd = options?.cwd ?? def.cwd ?? process.cwd();
  const timeoutMs = def.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const start = Date.now();

  return new Promise<CommandResult>((resolve, reject) => {
    const proc = spawn(def.command, def.args, {
      cwd,
      shell: false,
      env: { ...process.env, FORCE_COLOR: '0' },
    });

    let stdout = '';
    let stderr = '';
    let stdoutTruncated = false;
    let stderrTruncated = false;

    proc.stdout?.on('data', (chunk: Buffer) => {
      if (stdout.length < MAX_OUTPUT_BYTES) {
        stdout += chunk.toString('utf-8');
        if (stdout.length > MAX_OUTPUT_BYTES) {
          stdout = stdout.slice(0, MAX_OUTPUT_BYTES);
          stdoutTruncated = true;
        }
      }
    });

    proc.stderr?.on('data', (chunk: Buffer) => {
      if (stderr.length < MAX_OUTPUT_BYTES) {
        stderr += chunk.toString('utf-8');
        if (stderr.length > MAX_OUTPUT_BYTES) {
          stderr = stderr.slice(0, MAX_OUTPUT_BYTES);
          stderrTruncated = true;
        }
      }
    });

    const timer = setTimeout(() => {
      proc.kill('SIGTERM');
      resolve({
        key,
        exitCode: 124,
        stdout: stdout + '\n[TIMEOUT]',
        stderr,
        durationMs: Date.now() - start,
        truncated: stdoutTruncated || stderrTruncated,
      });
    }, timeoutMs);

    proc.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        key,
        exitCode: code ?? 1,
        stdout,
        stderr,
        durationMs: Date.now() - start,
        truncated: stdoutTruncated || stderrTruncated,
      });
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(new Error(`Failed to execute '${def.label}': ${err.message}`));
    });
  });
}
