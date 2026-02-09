/**
 * Unit tests for context pack mechanism — S0.5.2-RAG-2
 */
import { describe, test } from 'node:test';
import assert from 'node:assert';
import {
  getPackLimits,
  detectLanguage,
  validatePack,
  assembleContextPack,
} from '../../src/services/knowledge/contextPacks.js';

describe('getPackLimits', () => {
  test('returns scribe limits', () => {
    const limits = getPackLimits('scribe');
    assert.strictEqual(limits.maxFiles, 50);
    assert.strictEqual(limits.maxTotalBytes, 200_000);
  });

  test('returns trace limits', () => {
    const limits = getPackLimits('trace');
    assert.strictEqual(limits.maxFiles, 30);
    assert.strictEqual(limits.maxTotalBytes, 150_000);
  });

  test('returns proto limits', () => {
    const limits = getPackLimits('proto');
    assert.strictEqual(limits.maxFiles, 20);
    assert.strictEqual(limits.maxTotalBytes, 100_000);
  });

  test('returns default limits for unknown agent', () => {
    const limits = getPackLimits('unknown-agent');
    assert.strictEqual(limits.maxFiles, 30);
    assert.strictEqual(limits.maxTotalBytes, 150_000);
  });
});

describe('detectLanguage', () => {
  test('detects TypeScript', () => {
    assert.strictEqual(detectLanguage('src/index.ts'), 'typescript');
    assert.strictEqual(detectLanguage('App.tsx'), 'typescript');
  });

  test('detects JavaScript', () => {
    assert.strictEqual(detectLanguage('main.js'), 'javascript');
  });

  test('detects Python', () => {
    assert.strictEqual(detectLanguage('app.py'), 'python');
  });

  test('detects Dockerfile', () => {
    assert.strictEqual(detectLanguage('Dockerfile'), 'dockerfile');
  });

  test('defaults to text for unknown extensions', () => {
    assert.strictEqual(detectLanguage('file.xyz'), 'text');
  });
});

describe('validatePack', () => {
  test('accepts valid pack', () => {
    const pack = {
      files: [{ path: 'README.md', content: '# Hello', language: 'markdown' }],
      metadata: { repo: 'acme/repo', branch: 'main', totalFiles: 1, truncated: false, assembledAt: new Date().toISOString() },
    };
    const result = validatePack(pack, 'scribe');
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.errors.length, 0);
  });

  test('rejects null pack', () => {
    const result = validatePack(null, 'scribe');
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors[0].includes('object'));
  });

  test('rejects pack without files array', () => {
    const pack = { files: 'not-array', metadata: { repo: 'a/b', branch: 'main', totalFiles: 0, truncated: false, assembledAt: '' } };
    const result = validatePack(pack, 'scribe');
    assert.strictEqual(result.valid, false);
  });

  test('rejects pack exceeding file count limit', () => {
    const files = Array.from({ length: 25 }, (_, i) => ({ path: `f${i}.ts`, content: 'x', language: 'typescript' }));
    const pack = {
      files,
      metadata: { repo: 'a/b', branch: 'main', totalFiles: 25, truncated: false, assembledAt: '' },
    };
    const result = validatePack(pack, 'proto'); // proto limit = 20
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('20')));
  });

  test('rejects pack exceeding total bytes limit', () => {
    const bigContent = 'x'.repeat(110_000);
    const files = [{ path: 'big.ts', content: bigContent, language: 'typescript' }];
    const pack = {
      files,
      metadata: { repo: 'a/b', branch: 'main', totalFiles: 1, truncated: false, assembledAt: '' },
    };
    const result = validatePack(pack, 'proto'); // proto limit = 100_000
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('100000')));
  });

  test('rejects invalid repo format', () => {
    const pack = {
      files: [],
      metadata: { repo: 'noslash', branch: 'main', totalFiles: 0, truncated: false, assembledAt: '' },
    };
    const result = validatePack(pack, 'scribe');
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('owner/repo')));
  });
});

describe('assembleContextPack', () => {
  test('assembles pack with language detection', () => {
    const files = [
      { path: 'src/index.ts', content: 'console.log("hi")' },
      { path: 'README.md', content: '# Project' },
    ];
    const pack = assembleContextPack('scribe', 'acme/repo', 'main', files);

    assert.strictEqual(pack.files.length, 2);
    assert.strictEqual(pack.files[0].language, 'typescript');
    assert.strictEqual(pack.files[1].language, 'markdown');
    assert.strictEqual(pack.metadata.repo, 'acme/repo');
    assert.strictEqual(pack.metadata.branch, 'main');
    assert.strictEqual(pack.metadata.truncated, false);
  });

  test('truncates files exceeding maxFiles', () => {
    const files = Array.from({ length: 25 }, (_, i) => ({
      path: `file${i}.ts`,
      content: 'export const x = 1;',
    }));
    const pack = assembleContextPack('proto', 'a/b', 'dev', files); // limit = 20
    assert.strictEqual(pack.files.length, 20);
    assert.strictEqual(pack.metadata.truncated, true);
  });

  test('truncates content exceeding maxTotalBytes', () => {
    const files = [
      { path: 'huge.ts', content: 'x'.repeat(120_000) },
    ];
    const pack = assembleContextPack('proto', 'a/b', 'main', files); // limit = 100_000
    assert.strictEqual(pack.files[0].content.length, 100_000);
    assert.strictEqual(pack.metadata.truncated, true);
  });

  test('produces valid pack', () => {
    const files = [
      { path: 'src/index.ts', content: 'export {}' },
    ];
    const pack = assembleContextPack('trace', 'acme/repo', 'main', files);
    const result = validatePack(pack, 'trace');
    assert.strictEqual(result.valid, true);
  });
});
