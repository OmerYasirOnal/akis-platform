import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';

export interface CodeSearchResult {
  file: string;
  line: number;
  column: number;
  text: string;
  matchLength: number;
}

export class CodeSearchService {
  private rgPath: string | undefined;

  constructor() {
    this.rgPath = this.findRipgrep();
  }

  private findRipgrep(): string | undefined {
    const candidates = ['rg', '/opt/homebrew/bin/rg', '/usr/local/bin/rg'];
    for (const candidate of candidates) {
      try {
        cp.execSync(`${candidate} --version`, { stdio: 'pipe' });
        return candidate;
      } catch {
        continue;
      }
    }

    // VS Code ships ripgrep; try to find it
    const vscodeRg = path.join(
      vscode.env.appRoot, 'node_modules', '@vscode', 'ripgrep', 'bin', 'rg',
    );
    try {
      cp.execSync(`"${vscodeRg}" --version`, { stdio: 'pipe' });
      return vscodeRg;
    } catch {
      return undefined;
    }
  }

  async search(
    query: string,
    rootPath: string,
    options: {
      maxResults?: number;
      caseSensitive?: boolean;
      regex?: boolean;
      fileGlob?: string;
    } = {},
  ): Promise<CodeSearchResult[]> {
    if (!this.rgPath) {
      return this.fallbackSearch(query, rootPath, options);
    }

    const { maxResults = 100, caseSensitive = false, regex = false, fileGlob } = options;

    const args = [
      '--json',
      '--max-count', String(maxResults),
      '--line-number',
      '--column',
    ];

    if (!caseSensitive) { args.push('--ignore-case'); }
    if (!regex) { args.push('--fixed-strings'); }
    if (fileGlob) { args.push('--glob', fileGlob); }

    args.push('--', query, rootPath);

    return new Promise((resolve) => {
      const results: CodeSearchResult[] = [];

      const proc = cp.spawn(this.rgPath!, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let buffer = '';

      proc.stdout.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) { continue; }
          try {
            const parsed = JSON.parse(line);
            if (parsed.type === 'match') {
              const data = parsed.data;
              results.push({
                file: data.path?.text || '',
                line: data.line_number || 0,
                column: data.submatches?.[0]?.start || 0,
                text: data.lines?.text?.trim() || '',
                matchLength: data.submatches?.[0]?.end - data.submatches?.[0]?.start || 0,
              });
            }
          } catch {
            // skip malformed
          }
        }
      });

      proc.on('close', () => {
        resolve(results.slice(0, maxResults));
      });

      proc.on('error', () => {
        resolve([]);
      });

      setTimeout(() => {
        proc.kill();
        resolve(results);
      }, 10000);
    });
  }

  private async fallbackSearch(
    query: string,
    rootPath: string,
    options: { maxResults?: number } = {},
  ): Promise<CodeSearchResult[]> {
    const { maxResults = 50 } = options;

    const uris = await vscode.workspace.findFiles(
      '**/*.{ts,tsx,js,jsx,py,go,rs,java}',
      '**/node_modules/**',
      maxResults * 2,
    );

    const results: CodeSearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    for (const uri of uris) {
      if (results.length >= maxResults) { break; }

      try {
        const doc = await vscode.workspace.openTextDocument(uri);
        const text = doc.getText();
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
          if (results.length >= maxResults) { break; }

          const col = lines[i].toLowerCase().indexOf(lowerQuery);
          if (col !== -1) {
            results.push({
              file: uri.fsPath,
              line: i + 1,
              column: col,
              text: lines[i].trim(),
              matchLength: query.length,
            });
          }
        }
      } catch {
        continue;
      }
    }

    return results;
  }

  get isAvailable(): boolean {
    return this.rgPath !== undefined;
  }
}
