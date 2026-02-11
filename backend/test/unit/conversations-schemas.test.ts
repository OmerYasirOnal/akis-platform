import { describe, test } from 'node:test';
import assert from 'node:assert';
import { z } from 'zod';

const createThreadSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(255).optional(),
  agentType: z.enum(['scribe', 'trace', 'proto', 'smart-automations']).optional(),
});

const createMessageSchema = z.object({
  role: z.enum(['system', 'user', 'agent']),
  content: z.string().trim().min(1),
  agentType: z.enum(['scribe', 'trace', 'proto', 'smart-automations']).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const generatePlansSchema = z.object({
  prompt: z.string().trim().min(1),
  count: z.coerce.number().int().min(1).max(3).optional(),
  sourceMessageId: z.string().uuid().optional(),
});

const buildPlanSchema = z.object({
  planId: z.string().uuid(),
  jobId: z.string().uuid().optional(),
});

const streamQuerySchema = z.object({
  cursor: z.coerce.number().int().positive().optional(),
  includeHistory: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((value) => {
      if (typeof value === 'boolean') return value;
      if (value === undefined) return true;
      return value !== 'false';
    }),
});

const trustSnapshotSchema = z.object({
  jobId: z.string().uuid().optional(),
  reliability: z.number().int().min(0).max(100),
  hallucinationRisk: z.number().int().min(0).max(100),
  taskSuccess: z.number().int().min(0).max(100),
  toolHealth: z.number().int().min(0).max(100),
  metadata: z.record(z.unknown()).optional(),
});

describe('conversations schema validation', () => {
  test('createThread supports agentType and title', () => {
    const result = createThreadSchema.safeParse({
      title: 'Trace thread',
      agentType: 'trace',
    });
    assert.strictEqual(result.success, true);
  });

  test('createMessage rejects empty content', () => {
    const result = createMessageSchema.safeParse({
      role: 'user',
      content: '   ',
    });
    assert.strictEqual(result.success, false);
  });

  test('generatePlans enforces count upper bound', () => {
    const valid = generatePlansSchema.safeParse({ prompt: 'run e2e', count: 3 });
    assert.strictEqual(valid.success, true);

    const invalid = generatePlansSchema.safeParse({ prompt: 'run e2e', count: 4 });
    assert.strictEqual(invalid.success, false);
  });

  test('buildPlan requires uuid planId', () => {
    const valid = buildPlanSchema.safeParse({
      planId: '6bf42b31-fd00-42fd-bac2-543af687f5e3',
    });
    assert.strictEqual(valid.success, true);

    const invalid = buildPlanSchema.safeParse({ planId: 'not-a-uuid' });
    assert.strictEqual(invalid.success, false);
  });

  test('stream query parses includeHistory flags', () => {
    const enabled = streamQuerySchema.parse({ includeHistory: 'true' });
    assert.strictEqual(enabled.includeHistory, true);

    const disabled = streamQuerySchema.parse({ includeHistory: 'false' });
    assert.strictEqual(disabled.includeHistory, false);
  });

  test('trust snapshot metrics must stay within 0-100', () => {
    const valid = trustSnapshotSchema.safeParse({
      reliability: 90,
      hallucinationRisk: 10,
      taskSuccess: 85,
      toolHealth: 95,
    });
    assert.strictEqual(valid.success, true);

    const invalid = trustSnapshotSchema.safeParse({
      reliability: 101,
      hallucinationRisk: 0,
      taskSuccess: 50,
      toolHealth: 50,
    });
    assert.strictEqual(invalid.success, false);
  });
});
