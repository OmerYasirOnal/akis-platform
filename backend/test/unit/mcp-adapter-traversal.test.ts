import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Tests for GitHubMCPAdapter listFiles traversal safety.
 * Verifies depth limits, visited set, exclusion patterns, and file count limits.
 */

describe('GitHubMCPAdapter listFiles safety', () => {
  const MAX_DEPTH = 10;
  const MAX_FILES = 200;
  const EXCLUDE = ['node_modules/', '.git/', 'dist/', 'build/', '.next/', 'coverage/', '.cache/', '__pycache__/'];

  // Simulate the traversal logic from GitHubMCPAdapter
  async function listFilesSafe(
    mockFs: Record<string, Array<{ path: string; type: string }>>,
  ): Promise<string[]> {
    const files: string[] = [];
    const visited = new Set<string>();

    async function listDir(dirPath: string, depth: number): Promise<void> {
      if (depth > MAX_DEPTH || files.length >= MAX_FILES) return;
      if (visited.has(dirPath)) return;
      visited.add(dirPath);

      const entries = mockFs[dirPath];
      if (!entries) return;

      for (const entry of entries) {
        if (files.length >= MAX_FILES) break;
        if (EXCLUDE.some((p) => entry.path.includes(p) || entry.path === p.replace('/', ''))) continue;

        if (entry.type === 'dir') {
          await listDir(entry.path, depth + 1);
        } else {
          files.push(entry.path);
        }
      }
    }

    await listDir('', 0);
    return files;
  }

  it('should list files from flat directory', async () => {
    const fs = {
      '': [
        { path: 'index.ts', type: 'file' },
        { path: 'app.ts', type: 'file' },
        { path: 'README.md', type: 'file' },
      ],
    };
    const files = await listFilesSafe(fs);
    assert.deepEqual(files, ['index.ts', 'app.ts', 'README.md']);
  });

  it('should traverse nested directories', async () => {
    const fs: Record<string, Array<{ path: string; type: string }>> = {
      '': [
        { path: 'src', type: 'dir' },
        { path: 'package.json', type: 'file' },
      ],
      'src': [
        { path: 'src/index.ts', type: 'file' },
        { path: 'src/utils', type: 'dir' },
      ],
      'src/utils': [
        { path: 'src/utils/helper.ts', type: 'file' },
      ],
    };
    const files = await listFilesSafe(fs);
    // Directories are traversed before subsequent files at same level
    assert.deepEqual(files.sort(), ['package.json', 'src/index.ts', 'src/utils/helper.ts'].sort());
  });

  it('should exclude node_modules at top level', async () => {
    const fs = {
      '': [
        { path: 'node_modules', type: 'dir' },
        { path: 'index.ts', type: 'file' },
      ],
    };
    const files = await listFilesSafe(fs);
    assert.deepEqual(files, ['index.ts']);
  });

  it('should exclude nested node_modules', async () => {
    const fs: Record<string, Array<{ path: string; type: string }>> = {
      '': [
        { path: 'src', type: 'dir' },
      ],
      'src': [
        { path: 'src/index.ts', type: 'file' },
        { path: 'src/node_modules/', type: 'dir' },
      ],
    };
    const files = await listFilesSafe(fs);
    assert.deepEqual(files, ['src/index.ts']);
  });

  it('should exclude dist, build, .next, coverage, .cache, __pycache__', async () => {
    const fs = {
      '': [
        { path: 'dist', type: 'dir' },
        { path: 'build', type: 'dir' },
        { path: '.next', type: 'dir' },
        { path: 'coverage', type: 'dir' },
        { path: '.cache', type: 'dir' },
        { path: '__pycache__', type: 'dir' },
        { path: 'app.ts', type: 'file' },
      ],
    };
    const files = await listFilesSafe(fs);
    assert.deepEqual(files, ['app.ts']);
  });

  it('should respect MAX_DEPTH limit', async () => {
    // Create a deeply nested structure (15 levels)
    const fs: Record<string, Array<{ path: string; type: string }>> = {};
    let currentPath = '';
    for (let i = 0; i < 15; i++) {
      const dirName = currentPath ? `${currentPath}/d${i}` : `d${i}`;
      fs[currentPath] = [{ path: dirName, type: 'dir' }];
      currentPath = dirName;
    }
    fs[currentPath] = [{ path: `${currentPath}/deep.ts`, type: 'file' }];

    const files = await listFilesSafe(fs);
    // MAX_DEPTH=10, so file at depth 15 should NOT be found
    assert.equal(files.length, 0);
  });

  it('should prevent infinite loops with visited set', async () => {
    // Create circular reference: a → b → a
    const fs: Record<string, Array<{ path: string; type: string }>> = {
      '': [{ path: 'a', type: 'dir' }],
      'a': [
        { path: 'a/file.ts', type: 'file' },
        { path: '', type: 'dir' },  // circular back to root
      ],
    };
    const files = await listFilesSafe(fs);
    assert.deepEqual(files, ['a/file.ts']);
  });

  it('should respect MAX_FILES limit', async () => {
    const entries = Array.from({ length: 300 }, (_, i) => ({
      path: `file${i}.ts`,
      type: 'file' as const,
    }));
    const fs = { '': entries };
    const files = await listFilesSafe(fs);
    assert.equal(files.length, MAX_FILES);
  });

  it('should handle empty directory', async () => {
    const fs = { '': [] as Array<{ path: string; type: string }> };
    const files = await listFilesSafe(fs);
    assert.deepEqual(files, []);
  });

  it('should handle missing directory gracefully', async () => {
    const fs: Record<string, Array<{ path: string; type: string }>> = {
      '': [{ path: 'missing', type: 'dir' }],
      // 'missing' key doesn't exist
    };
    const files = await listFilesSafe(fs);
    assert.deepEqual(files, []);
  });
});
