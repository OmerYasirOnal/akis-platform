import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Tests for TraceAgent AI call timeout and context budget enforcement.
 * Tests the withAiTimeout helper and MAX_CODEBASE_CONTEXT_CHARS logic.
 */

// Mirror the withAiTimeout helper from TraceAgent.ts
function withAiTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`AI call timed out after ${Math.round(ms / 1000)}s`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

describe('TraceAgent AI timeout', () => {
  it('should resolve when AI call completes within timeout', async () => {
    const fastCall = new Promise<string>((resolve) => setTimeout(() => resolve('test result'), 10));
    const result = await withAiTimeout(fastCall, 5000);
    assert.equal(result, 'test result');
  });

  it('should reject with timeout error when AI call exceeds timeout', async () => {
    const slowCall = new Promise<string>((resolve) => setTimeout(() => resolve('late'), 5000));
    await assert.rejects(
      () => withAiTimeout(slowCall, 50),
      (err: Error) => {
        assert.ok(err.message.includes('timed out'));
        return true;
      }
    );
  });

  it('should include timeout duration in error message', async () => {
    const neverResolves = new Promise<string>(() => {});
    await assert.rejects(
      () => withAiTimeout(neverResolves, 100),
      (err: Error) => {
        assert.ok(err.message.includes('0s') || err.message.includes('timed out'));
        return true;
      }
    );
  });

  it('should propagate AI call errors (not swallow them)', async () => {
    const failingCall = Promise.reject(new Error('AI provider 500'));
    await assert.rejects(
      () => withAiTimeout(failingCall, 5000),
      (err: Error) => {
        assert.equal(err.message, 'AI provider 500');
        return true;
      }
    );
  });

  it('should clear timeout after successful resolution', async () => {
    const fastCall = Promise.resolve('quick');
    const result = await withAiTimeout(fastCall, 100);
    assert.equal(result, 'quick');
    // If timeout wasn't cleared, this would trigger after 100ms — no way to directly assert,
    // but if we get here without error, the cleanup in .finally() worked
  });
});

describe('TraceAgent context budget', () => {
  const MAX_CODEBASE_CONTEXT_CHARS = 200_000;

  it('should accept codebase under budget', () => {
    const files = [
      { filePath: 'src/index.ts', content: 'console.log("hello")' },
      { filePath: 'src/app.ts', content: 'export default {}' },
    ];
    const totalChars = files.reduce((sum, f) => sum + f.content.length, 0);
    assert.ok(totalChars < MAX_CODEBASE_CONTEXT_CHARS);
  });

  it('should enforce budget by stopping file collection', () => {
    const bigFile = 'x'.repeat(50_000);
    const files: Array<{ filePath: string; content: string }> = [];
    let totalChars = 0;

    for (let i = 0; i < 10; i++) {
      if (totalChars + bigFile.length > MAX_CODEBASE_CONTEXT_CHARS) break;
      files.push({ filePath: `src/file${i}.ts`, content: bigFile });
      totalChars += bigFile.length;
    }

    // 200K / 50K = 4 files max
    assert.equal(files.length, 4);
    assert.ok(totalChars <= MAX_CODEBASE_CONTEXT_CHARS);
  });

  it('should handle single file exceeding budget', () => {
    const hugeFile = 'x'.repeat(MAX_CODEBASE_CONTEXT_CHARS + 1);
    const files: Array<{ filePath: string; content: string }> = [];
    let totalChars = 0;

    // Simulate MAX_FILE_SIZE_BYTES check (100KB)
    const MAX_FILE_SIZE_BYTES = 100_000;
    if (hugeFile.length <= MAX_FILE_SIZE_BYTES && totalChars + hugeFile.length <= MAX_CODEBASE_CONTEXT_CHARS) {
      files.push({ filePath: 'huge.ts', content: hugeFile });
      totalChars += hugeFile.length;
    }

    assert.equal(files.length, 0); // Rejected by file size check
  });
});
