import { test } from 'node:test';
import assert from 'node:assert';
import { z } from 'zod';

// Reproduce the scribe payload schema from agents.ts
const scribePayloadSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  baseBranch: z.string().optional(),
  targetPath: z.string().optional(),
  dryRun: z.boolean().optional(),
  doc: z.string().optional(),
  docPack: z.enum(['readme', 'standard', 'full']).optional(),
  docDepth: z.enum(['lite', 'standard', 'deep']).optional(),
  outputTargets: z.array(z.string()).optional(),
  analyzeLastNCommits: z.number().int().min(1).max(100).optional(),
  maxOutputTokens: z.number().int().min(1000).max(64000).optional(),
  passes: z.number().int().min(1).max(2).optional(),
});

test('scribe payload analyzeLastNCommits validation', async (t) => {
  await t.test('accepts valid analyzeLastNCommits', () => {
    const result = scribePayloadSchema.safeParse({
      owner: 'test-user',
      repo: 'test-repo',
      analyzeLastNCommits: 50,
    });
    assert.ok(result.success);
    assert.strictEqual(result.data?.analyzeLastNCommits, 50);
  });

  await t.test('accepts payload without analyzeLastNCommits', () => {
    const result = scribePayloadSchema.safeParse({
      owner: 'test-user',
      repo: 'test-repo',
    });
    assert.ok(result.success);
    assert.strictEqual(result.data?.analyzeLastNCommits, undefined);
  });

  await t.test('rejects analyzeLastNCommits below 1', () => {
    const result = scribePayloadSchema.safeParse({
      owner: 'test-user',
      repo: 'test-repo',
      analyzeLastNCommits: 0,
    });
    assert.ok(!result.success);
  });

  await t.test('rejects analyzeLastNCommits above 100', () => {
    const result = scribePayloadSchema.safeParse({
      owner: 'test-user',
      repo: 'test-repo',
      analyzeLastNCommits: 101,
    });
    assert.ok(!result.success);
  });

  await t.test('rejects non-integer analyzeLastNCommits', () => {
    const result = scribePayloadSchema.safeParse({
      owner: 'test-user',
      repo: 'test-repo',
      analyzeLastNCommits: 5.5,
    });
    assert.ok(!result.success);
  });

  await t.test('accepts all depth levels', () => {
    for (const depth of ['lite', 'standard', 'deep'] as const) {
      const result = scribePayloadSchema.safeParse({
        owner: 'test-user',
        repo: 'test-repo',
        docDepth: depth,
      });
      assert.ok(result.success, `Should accept docDepth=${depth}`);
    }
  });

  await t.test('accepts all doc pack levels', () => {
    for (const pack of ['readme', 'standard', 'full'] as const) {
      const result = scribePayloadSchema.safeParse({
        owner: 'test-user',
        repo: 'test-repo',
        docPack: pack,
      });
      assert.ok(result.success, `Should accept docPack=${pack}`);
    }
  });
});
