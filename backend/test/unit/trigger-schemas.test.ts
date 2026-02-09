/**
 * Unit tests for trigger Zod schemas: createTriggerSchema, updateTriggerSchema, triggerIdSchema
 */
import { describe, test } from 'node:test';
import assert from 'node:assert';
import { z } from 'zod';

// ─── Re-create schemas from triggers.ts ──────────────────────────────

const createTriggerSchema = z.object({
  repoOwner: z.string().min(1),
  repoName: z.string().min(1),
  branch: z.string().min(1).default('main'),
  eventType: z.enum(['pr_merged', 'pr_opened', 'push']),
  agentType: z.enum(['scribe', 'trace', 'proto']),
  enabled: z.boolean().default(true),
});

const updateTriggerSchema = z.object({
  enabled: z.boolean().optional(),
  branch: z.string().min(1).optional(),
  eventType: z.enum(['pr_merged', 'pr_opened', 'push']).optional(),
  agentType: z.enum(['scribe', 'trace', 'proto']).optional(),
});

const triggerIdSchema = z.object({
  id: z.string().uuid(),
});

// ─── createTriggerSchema ─────────────────────────────────────────────

describe('createTriggerSchema', () => {
  test('accepts valid minimal input with defaults', () => {
    const result = createTriggerSchema.parse({
      repoOwner: 'acme',
      repoName: 'my-repo',
      eventType: 'push',
      agentType: 'scribe',
    });

    assert.strictEqual(result.repoOwner, 'acme');
    assert.strictEqual(result.repoName, 'my-repo');
    assert.strictEqual(result.branch, 'main');
    assert.strictEqual(result.eventType, 'push');
    assert.strictEqual(result.agentType, 'scribe');
    assert.strictEqual(result.enabled, true);
  });

  test('accepts full valid input', () => {
    const result = createTriggerSchema.parse({
      repoOwner: 'acme',
      repoName: 'my-repo',
      branch: 'develop',
      eventType: 'pr_merged',
      agentType: 'trace',
      enabled: false,
    });

    assert.strictEqual(result.branch, 'develop');
    assert.strictEqual(result.eventType, 'pr_merged');
    assert.strictEqual(result.agentType, 'trace');
    assert.strictEqual(result.enabled, false);
  });

  test('accepts all eventType values', () => {
    for (const eventType of ['pr_merged', 'pr_opened', 'push'] as const) {
      const result = createTriggerSchema.parse({
        repoOwner: 'o',
        repoName: 'r',
        eventType,
        agentType: 'scribe',
      });
      assert.strictEqual(result.eventType, eventType);
    }
  });

  test('accepts all agentType values', () => {
    for (const agentType of ['scribe', 'trace', 'proto'] as const) {
      const result = createTriggerSchema.parse({
        repoOwner: 'o',
        repoName: 'r',
        eventType: 'push',
        agentType,
      });
      assert.strictEqual(result.agentType, agentType);
    }
  });

  test('rejects empty repoOwner', () => {
    assert.throws(() => {
      createTriggerSchema.parse({
        repoOwner: '',
        repoName: 'r',
        eventType: 'push',
        agentType: 'scribe',
      });
    }, /too_small/);
  });

  test('rejects empty repoName', () => {
    assert.throws(() => {
      createTriggerSchema.parse({
        repoOwner: 'o',
        repoName: '',
        eventType: 'push',
        agentType: 'scribe',
      });
    }, /too_small/);
  });

  test('rejects invalid eventType', () => {
    assert.throws(() => {
      createTriggerSchema.parse({
        repoOwner: 'o',
        repoName: 'r',
        eventType: 'issue_opened',
        agentType: 'scribe',
      });
    });
  });

  test('rejects invalid agentType', () => {
    assert.throws(() => {
      createTriggerSchema.parse({
        repoOwner: 'o',
        repoName: 'r',
        eventType: 'push',
        agentType: 'unknown',
      });
    });
  });

  test('rejects missing required fields', () => {
    assert.throws(() => {
      createTriggerSchema.parse({});
    });
  });
});

// ─── updateTriggerSchema ─────────────────────────────────────────────

describe('updateTriggerSchema', () => {
  test('accepts empty object (all optional)', () => {
    const result = updateTriggerSchema.parse({});
    assert.deepStrictEqual(result, {});
  });

  test('accepts partial updates', () => {
    const result = updateTriggerSchema.parse({ enabled: false });
    assert.strictEqual(result.enabled, false);
    assert.strictEqual(result.branch, undefined);
  });

  test('accepts all fields together', () => {
    const result = updateTriggerSchema.parse({
      enabled: true,
      branch: 'staging',
      eventType: 'pr_opened',
      agentType: 'proto',
    });

    assert.strictEqual(result.enabled, true);
    assert.strictEqual(result.branch, 'staging');
    assert.strictEqual(result.eventType, 'pr_opened');
    assert.strictEqual(result.agentType, 'proto');
  });

  test('rejects empty branch string', () => {
    assert.throws(() => {
      updateTriggerSchema.parse({ branch: '' });
    }, /too_small/);
  });

  test('rejects invalid eventType', () => {
    assert.throws(() => {
      updateTriggerSchema.parse({ eventType: 'invalid' });
    });
  });

  test('rejects invalid agentType', () => {
    assert.throws(() => {
      updateTriggerSchema.parse({ agentType: 'invalid' });
    });
  });
});

// ─── triggerIdSchema ─────────────────────────────────────────────────

describe('triggerIdSchema', () => {
  test('accepts valid UUID', () => {
    const result = triggerIdSchema.parse({ id: '550e8400-e29b-41d4-a716-446655440000' });
    assert.strictEqual(result.id, '550e8400-e29b-41d4-a716-446655440000');
  });

  test('rejects non-UUID string', () => {
    assert.throws(() => {
      triggerIdSchema.parse({ id: 'not-a-uuid' });
    });
  });

  test('rejects empty string', () => {
    assert.throws(() => {
      triggerIdSchema.parse({ id: '' });
    });
  });

  test('rejects missing id', () => {
    assert.throws(() => {
      triggerIdSchema.parse({});
    });
  });
});
