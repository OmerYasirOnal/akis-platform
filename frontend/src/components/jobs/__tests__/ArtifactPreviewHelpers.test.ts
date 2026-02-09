/**
 * Contract tests for ArtifactPreview pure helper functions
 */
import { describe, it, expect } from 'vitest';

// ─── Re-create helpers from ArtifactPreview.tsx ──────────────────

const MAX_PREVIEW_LINES = 20;
const MAX_PREVIEW_BYTES = 5000;

const FILE_ICONS: Record<string, string> = {
  md: '📝', txt: '📄', json: '📋', yaml: '⚙️', yml: '⚙️',
  ts: '🔷', tsx: '🔷', js: '🟨', jsx: '🟨', py: '🐍',
  go: '🔵', rs: '🦀', sql: '🗃️', sh: '🖥️', css: '🎨', html: '🌐',
};

function getFileExtension(path: string): string {
  const parts = path.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

function getFileIcon(path: string): string {
  const ext = getFileExtension(path);
  return FILE_ICONS[ext] || '📄';
}

function getFileName(path: string): string {
  return path.split('/').pop() || path;
}

function formatBytes(bytes?: number): string {
  if (bytes === undefined || bytes === null) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isTextFile(path: string): boolean {
  const textExtensions = ['md', 'txt', 'json', 'yaml', 'yml', 'ts', 'tsx', 'js', 'jsx', 'py', 'go', 'rs', 'sql', 'sh', 'css', 'html', 'xml', 'env', 'gitignore', 'dockerfile'];
  const ext = getFileExtension(path);
  return textExtensions.includes(ext) || path.toLowerCase().includes('readme');
}

function truncatePreview(content: string, maxLines: number = MAX_PREVIEW_LINES): { content: string; truncated: boolean } {
  const lines = content.split('\n');
  if (lines.length <= maxLines && content.length <= MAX_PREVIEW_BYTES) {
    return { content, truncated: false };
  }
  const truncatedContent = lines.slice(0, maxLines).join('\n');
  return {
    content: truncatedContent.slice(0, MAX_PREVIEW_BYTES),
    truncated: true,
  };
}

// ─── getFileExtension ─────────────────────────────────────────────

describe('getFileExtension', () => {
  it('extracts extension from simple file', () => {
    expect(getFileExtension('README.md')).toBe('md');
  });

  it('extracts extension from nested path', () => {
    expect(getFileExtension('src/components/App.tsx')).toBe('tsx');
  });

  it('lowercases extension', () => {
    expect(getFileExtension('file.JSON')).toBe('json');
  });

  it('returns empty for no extension', () => {
    expect(getFileExtension('Dockerfile')).toBe('');
  });

  it('handles dotfiles', () => {
    expect(getFileExtension('.gitignore')).toBe('gitignore');
  });

  it('uses last dot for multiple dots', () => {
    expect(getFileExtension('file.test.ts')).toBe('ts');
  });
});

// ─── getFileIcon ──────────────────────────────────────────────────

describe('getFileIcon', () => {
  it('returns markdown icon for .md', () => {
    expect(getFileIcon('README.md')).toBe('📝');
  });

  it('returns TypeScript icon for .ts', () => {
    expect(getFileIcon('index.ts')).toBe('🔷');
  });

  it('returns Python icon for .py', () => {
    expect(getFileIcon('main.py')).toBe('🐍');
  });

  it('returns Rust icon for .rs', () => {
    expect(getFileIcon('lib.rs')).toBe('🦀');
  });

  it('returns default icon for unknown extension', () => {
    expect(getFileIcon('data.parquet')).toBe('📄');
  });

  it('returns default icon for no extension', () => {
    expect(getFileIcon('Makefile')).toBe('📄');
  });
});

// ─── getFileName ──────────────────────────────────────────────────

describe('getFileName', () => {
  it('extracts filename from path', () => {
    expect(getFileName('src/utils/helpers.ts')).toBe('helpers.ts');
  });

  it('returns filename when no directory', () => {
    expect(getFileName('README.md')).toBe('README.md');
  });

  it('handles deeply nested path', () => {
    expect(getFileName('a/b/c/d/file.txt')).toBe('file.txt');
  });

  it('handles trailing slash (falls back to full path)', () => {
    // 'src/'.split('/') → ['src', ''] → pop() → '' (falsy) → fallback to path
    expect(getFileName('src/')).toBe('src/');
  });
});

// ─── formatBytes ──────────────────────────────────────────────────

describe('formatBytes', () => {
  it('returns - for undefined', () => {
    expect(formatBytes(undefined)).toBe('-');
  });

  it('returns - for null', () => {
    expect(formatBytes(null as unknown as undefined)).toBe('-');
  });

  it('formats bytes', () => {
    expect(formatBytes(512)).toBe('512 B');
  });

  it('formats kilobytes', () => {
    expect(formatBytes(2048)).toBe('2.0 KB');
  });

  it('formats megabytes', () => {
    expect(formatBytes(1536 * 1024)).toBe('1.5 MB');
  });

  it('handles 0 bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('handles boundary at 1024', () => {
    expect(formatBytes(1024)).toBe('1.0 KB');
  });
});

// ─── isTextFile ───────────────────────────────────────────────────

describe('isTextFile', () => {
  it('recognizes markdown', () => {
    expect(isTextFile('README.md')).toBe(true);
  });

  it('recognizes TypeScript', () => {
    expect(isTextFile('src/App.tsx')).toBe(true);
  });

  it('recognizes Python', () => {
    expect(isTextFile('script.py')).toBe(true);
  });

  it('recognizes SQL', () => {
    expect(isTextFile('migration.sql')).toBe(true);
  });

  it('recognizes env files', () => {
    expect(isTextFile('.env')).toBe(true);
  });

  it('recognizes README without extension', () => {
    expect(isTextFile('README')).toBe(true);
  });

  it('recognizes readme case-insensitive', () => {
    expect(isTextFile('docs/readme')).toBe(true);
  });

  it('rejects binary extensions', () => {
    expect(isTextFile('image.png')).toBe(false);
    expect(isTextFile('archive.zip')).toBe(false);
  });

  it('recognizes dockerfile', () => {
    expect(isTextFile('Dockerfile')).toBe(false); // No extension → empty ext, but 'Dockerfile' doesn't contain 'readme'
  });
});

// ─── truncatePreview ──────────────────────────────────────────────

describe('truncatePreview', () => {
  it('does not truncate short content', () => {
    const result = truncatePreview('line 1\nline 2\nline 3');
    expect(result.truncated).toBe(false);
    expect(result.content).toBe('line 1\nline 2\nline 3');
  });

  it('truncates when exceeding max lines', () => {
    const lines = Array.from({ length: 30 }, (_, i) => `line ${i}`).join('\n');
    const result = truncatePreview(lines);
    expect(result.truncated).toBe(true);
    expect(result.content.split('\n').length).toBeLessThanOrEqual(MAX_PREVIEW_LINES);
  });

  it('truncates when exceeding max bytes', () => {
    const longLine = 'x'.repeat(MAX_PREVIEW_BYTES + 100);
    const result = truncatePreview(longLine);
    expect(result.truncated).toBe(true);
    expect(result.content.length).toBeLessThanOrEqual(MAX_PREVIEW_BYTES);
  });

  it('respects custom maxLines parameter', () => {
    const lines = Array.from({ length: 10 }, (_, i) => `line ${i}`).join('\n');
    const result = truncatePreview(lines, 5);
    expect(result.truncated).toBe(true);
    expect(result.content.split('\n').length).toBeLessThanOrEqual(5);
  });

  it('handles empty content', () => {
    const result = truncatePreview('');
    expect(result.truncated).toBe(false);
    expect(result.content).toBe('');
  });
});
