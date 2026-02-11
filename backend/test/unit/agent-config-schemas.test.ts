/**
 * Unit tests for agent config Zod schemas — pure validation tests
 * Tests the agentType enum and scribeConfig schema from agent-configs.ts
 */
import { describe, test } from 'node:test';
import assert from 'node:assert';
import { z } from 'zod';

// Re-create the schemas from agent-configs.ts for pure testing
// (the module registers Fastify routes so we test schemas directly)
const agentTypeSchema = z.enum(['scribe', 'trace', 'proto']);

const scribeConfigSchema = z.object({
  enabled: z.boolean().optional(),
  repositoryOwner: z.string().min(1).optional(),
  repositoryName: z.string().min(1).optional(),
  baseBranch: z.string().optional(),
  branchPattern: z.string().optional(),
  targetPlatform: z.enum(['confluence', 'notion', 'github_wiki', 'github_repo']).optional(),
  targetConfig: z.record(z.unknown()).optional(),
  triggerMode: z.enum(['on_pr_merge', 'scheduled', 'manual']).optional(),
  scheduleCron: z.string().optional().nullable(),
  prTitleTemplate: z.string().optional(),
  prBodyTemplate: z.string().optional().nullable(),
  autoMerge: z.boolean().optional(),
  includeGlobs: z.array(z.string()).optional().nullable(),
  excludeGlobs: z.array(z.string()).optional().nullable(),
  jobTimeoutSeconds: z.number().int().min(10).max(600).optional(),
  maxRetries: z.number().int().min(0).max(5).optional(),
  llmModelOverride: z.string().optional().nullable(),
  runtimeProfile: z.enum(['deterministic', 'balanced', 'creative', 'custom']).optional(),
  temperatureValue: z.number().min(0).max(1).optional().nullable(),
  commandLevel: z.number().int().min(1).max(5).optional(),
}).superRefine((data, ctx) => {
  if (data.runtimeProfile === 'custom' && (data.temperatureValue === null || data.temperatureValue === undefined)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'temperatureValue is required when runtimeProfile is custom',
      path: ['temperatureValue'],
    });
  }
});

// ─── agentTypeSchema ───────────────────────────────────────────────────

describe('agentTypeSchema', () => {
  test('accepts valid agent types', () => {
    for (const type of ['scribe', 'trace', 'proto']) {
      const result = agentTypeSchema.safeParse(type);
      assert.strictEqual(result.success, true, `${type} should be valid`);
    }
  });

  test('rejects invalid agent types', () => {
    for (const type of ['invalid', 'SCRIBE', 'Trace', '', 'analyzer', 123]) {
      const result = agentTypeSchema.safeParse(type);
      assert.strictEqual(result.success, false, `${type} should be invalid`);
    }
  });
});

// ─── scribeConfigSchema ────────────────────────────────────────────────

describe('scribeConfigSchema', () => {
  test('accepts empty config (all fields optional)', () => {
    const result = scribeConfigSchema.safeParse({});
    assert.strictEqual(result.success, true);
  });

  test('accepts full valid config', () => {
    const result = scribeConfigSchema.safeParse({
      enabled: true,
      repositoryOwner: 'acme',
      repositoryName: 'docs',
      baseBranch: 'main',
      branchPattern: 'scribe/docs-*',
      targetPlatform: 'github_repo',
      targetConfig: { path: '/docs' },
      triggerMode: 'on_pr_merge',
      scheduleCron: '0 9 * * 1',
      prTitleTemplate: 'docs: update API reference',
      prBodyTemplate: 'Automated doc update',
      autoMerge: false,
      includeGlobs: ['src/**/*.ts'],
      excludeGlobs: ['**/*.test.ts'],
      jobTimeoutSeconds: 300,
      maxRetries: 3,
      llmModelOverride: 'gpt-4o-mini',
      runtimeProfile: 'balanced',
      commandLevel: 3,
    });
    assert.strictEqual(result.success, true);
  });

  test('accepts custom runtime profile with temperature value', () => {
    const result = scribeConfigSchema.safeParse({
      runtimeProfile: 'custom',
      temperatureValue: 0.45,
      commandLevel: 4,
    });
    assert.strictEqual(result.success, true);
  });

  test('rejects custom runtime profile without temperature value', () => {
    const result = scribeConfigSchema.safeParse({
      runtimeProfile: 'custom',
      commandLevel: 4,
    });
    assert.strictEqual(result.success, false);
  });

  test('rejects commandLevel outside 1-5', () => {
    assert.strictEqual(scribeConfigSchema.safeParse({ commandLevel: 0 }).success, false);
    assert.strictEqual(scribeConfigSchema.safeParse({ commandLevel: 6 }).success, false);
  });

  test('accepts null for nullable fields', () => {
    const result = scribeConfigSchema.safeParse({
      scheduleCron: null,
      prBodyTemplate: null,
      includeGlobs: null,
      excludeGlobs: null,
      llmModelOverride: null,
    });
    assert.strictEqual(result.success, true);
  });

  test('validates targetPlatform enum', () => {
    const valid = scribeConfigSchema.safeParse({ targetPlatform: 'confluence' });
    assert.strictEqual(valid.success, true);

    const invalid = scribeConfigSchema.safeParse({ targetPlatform: 'slack' });
    assert.strictEqual(invalid.success, false);
  });

  test('validates triggerMode enum', () => {
    for (const mode of ['on_pr_merge', 'scheduled', 'manual']) {
      const result = scribeConfigSchema.safeParse({ triggerMode: mode });
      assert.strictEqual(result.success, true, `${mode} should be valid`);
    }

    const invalid = scribeConfigSchema.safeParse({ triggerMode: 'webhook' });
    assert.strictEqual(invalid.success, false);
  });

  test('validates jobTimeoutSeconds range (10-600)', () => {
    assert.strictEqual(scribeConfigSchema.safeParse({ jobTimeoutSeconds: 10 }).success, true);
    assert.strictEqual(scribeConfigSchema.safeParse({ jobTimeoutSeconds: 600 }).success, true);
    assert.strictEqual(scribeConfigSchema.safeParse({ jobTimeoutSeconds: 9 }).success, false);
    assert.strictEqual(scribeConfigSchema.safeParse({ jobTimeoutSeconds: 601 }).success, false);
    assert.strictEqual(scribeConfigSchema.safeParse({ jobTimeoutSeconds: 10.5 }).success, false);
  });

  test('validates maxRetries range (0-5)', () => {
    assert.strictEqual(scribeConfigSchema.safeParse({ maxRetries: 0 }).success, true);
    assert.strictEqual(scribeConfigSchema.safeParse({ maxRetries: 5 }).success, true);
    assert.strictEqual(scribeConfigSchema.safeParse({ maxRetries: -1 }).success, false);
    assert.strictEqual(scribeConfigSchema.safeParse({ maxRetries: 6 }).success, false);
  });

  test('rejects empty repositoryOwner', () => {
    const result = scribeConfigSchema.safeParse({ repositoryOwner: '' });
    assert.strictEqual(result.success, false);
  });

  test('rejects empty repositoryName', () => {
    const result = scribeConfigSchema.safeParse({ repositoryName: '' });
    assert.strictEqual(result.success, false);
  });

  test('rejects wrong type for enabled', () => {
    const result = scribeConfigSchema.safeParse({ enabled: 'yes' });
    assert.strictEqual(result.success, false);
  });

  test('rejects wrong type for autoMerge', () => {
    const result = scribeConfigSchema.safeParse({ autoMerge: 1 });
    assert.strictEqual(result.success, false);
  });
});
