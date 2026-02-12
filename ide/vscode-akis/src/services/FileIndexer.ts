import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface IndexEntry {
  file: string;
  symbol: string;
  type: 'function' | 'class' | 'import' | 'variable' | 'interface' | 'type';
  line: number;
}

export interface IndexStats {
  totalFiles: number;
  functions: number;
  classes: number;
  imports: number;
  durationMs: number;
}

export interface SearchResult extends IndexEntry {}

const IGNORE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'out', 'build', '.next',
  '__pycache__', 'venv', '.venv', '.cache', 'coverage',
]);

const CODE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs',
  '.java', '.c', '.cpp', '.h', '.hpp', '.cs', '.rb',
  '.swift', '.kt', '.scala', '.vue', '.svelte',
]);

const PATTERNS: Array<{ regex: RegExp; type: IndexEntry['type'] }> = [
  { regex: /^(?:export\s+)?(?:async\s+)?function\s+(\w+)/gm, type: 'function' },
  { regex: /^(?:export\s+)?class\s+(\w+)/gm, type: 'class' },
  { regex: /^(?:export\s+)?interface\s+(\w+)/gm, type: 'interface' },
  { regex: /^(?:export\s+)?type\s+(\w+)/gm, type: 'type' },
  { regex: /^(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=/gm, type: 'variable' },
  { regex: /^import\s+.*from\s+['"](.*)['"]/gm, type: 'import' },
  { regex: /^def\s+(\w+)\s*\(/gm, type: 'function' },
  { regex: /^class\s+(\w+)[\s:(]/gm, type: 'class' },
  { regex: /^from\s+\S+\s+import\s+(\w+)/gm, type: 'import' },
  { regex: /^func\s+(\w+)\s*\(/gm, type: 'function' },
];

export class FileIndexer {
  private index: IndexEntry[] = [];
  private lastIndexTime = 0;

  async indexDirectory(
    rootPath: string,
    onProgress?: (file: string, total: number) => void,
  ): Promise<IndexStats> {
    const start = Date.now();
    this.index = [];
    let totalFiles = 0;

    const walk = (dir: string) => {
      let entries: fs.Dirent[];
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        return;
      }

      for (const entry of entries) {
        if (entry.name.startsWith('.') && entry.isDirectory()) { continue; }
        if (IGNORE_DIRS.has(entry.name) && entry.isDirectory()) { continue; }

        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.isFile() && CODE_EXTENSIONS.has(path.extname(entry.name))) {
          this.indexFile(fullPath);
          totalFiles++;
          onProgress?.(entry.name, totalFiles);
        }
      }
    };

    walk(rootPath);
    this.lastIndexTime = Date.now();

    const stats: IndexStats = {
      totalFiles,
      functions: this.index.filter(e => e.type === 'function').length,
      classes: this.index.filter(e => e.type === 'class').length,
      imports: this.index.filter(e => e.type === 'import').length,
      durationMs: Date.now() - start,
    };

    return stats;
  }

  private indexFile(filePath: string): void {
    let content: string;
    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch {
      return;
    }

    const lines = content.split('\n');

    for (const { regex, type } of PATTERNS) {
      regex.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = regex.exec(content)) !== null) {
        const symbol = match[1];
        const lineNumber = content.substring(0, match.index).split('\n').length;

        this.index.push({
          file: filePath,
          symbol,
          type,
          line: lineNumber,
        });
      }
    }
  }

  search(query: string, limit = 50): SearchResult[] {
    const lower = query.toLowerCase();
    const results: SearchResult[] = [];

    for (const entry of this.index) {
      if (results.length >= limit) { break; }

      if (
        entry.symbol.toLowerCase().includes(lower) ||
        path.basename(entry.file).toLowerCase().includes(lower)
      ) {
        results.push(entry);
      }
    }

    return results.sort((a, b) => {
      const aExact = a.symbol.toLowerCase() === lower ? 0 : 1;
      const bExact = b.symbol.toLowerCase() === lower ? 0 : 1;
      return aExact - bExact;
    });
  }

  get entryCount(): number {
    return this.index.length;
  }

  get isIndexed(): boolean {
    return this.lastIndexTime > 0;
  }
}
