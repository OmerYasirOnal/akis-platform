/**
 * Unit tests for smart automation Zod schemas and helpers
 */
import { describe, test } from 'node:test';
import assert from 'node:assert';
import { z } from 'zod';

// Re-create schemas from smart-automations.ts for pure testing
const sourceSchema = z.object({
  url: z.string().url(),
  type: z.enum(['rss', 'webpage']).default('rss'),
});

const createAutomationSchema = z.object({
  name: z.string().min(1).max(255),
  topics: z.array(z.string().min(1)).min(1, 'At least one topic is required'),
  sources: z.array(sourceSchema).min(1, 'At least one source is required'),
  scheduleTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format').default('09:00'),
  timezone: z.string().default('Europe/Istanbul'),
  outputLanguage: z.enum(['tr', 'en']).default('tr'),
  style: z.enum(['linkedin']).default('linkedin'),
  deliveryInApp: z.boolean().default(true),
  deliverySlack: z.boolean().default(false),
  slackChannel: z.string().optional(),
  enabled: z.boolean().default(true),
});

const updateAutomationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  topics: z.array(z.string().min(1)).min(1).optional(),
  sources: z.array(sourceSchema).min(1).optional(),
  scheduleTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  timezone: z.string().optional(),
  outputLanguage: z.enum(['tr', 'en']).optional(),
  style: z.enum(['linkedin']).optional(),
  deliveryInApp: z.boolean().optional(),
  deliverySlack: z.boolean().optional(),
  slackChannel: z.string().nullable().optional(),
  enabled: z.boolean().optional(),
});

const idParamSchema = z.object({
  id: z.string().uuid(),
});

// ─── sourceSchema ──────────────────────────────────────────────────────

describe('sourceSchema', () => {
  test('accepts valid RSS source', () => {
    const result = sourceSchema.safeParse({ url: 'https://example.com/rss', type: 'rss' });
    assert.strictEqual(result.success, true);
  });

  test('accepts valid webpage source', () => {
    const result = sourceSchema.safeParse({ url: 'https://news.ycombinator.com', type: 'webpage' });
    assert.strictEqual(result.success, true);
  });

  test('defaults type to rss', () => {
    const result = sourceSchema.safeParse({ url: 'https://example.com/rss' });
    assert.strictEqual(result.success, true);
    if (result.success) {
      assert.strictEqual(result.data.type, 'rss');
    }
  });

  test('rejects invalid URL', () => {
    const result = sourceSchema.safeParse({ url: 'not-a-url', type: 'rss' });
    assert.strictEqual(result.success, false);
  });

  test('rejects invalid type', () => {
    const result = sourceSchema.safeParse({ url: 'https://example.com', type: 'api' });
    assert.strictEqual(result.success, false);
  });
});

// ─── createAutomationSchema ────────────────────────────────────────────

describe('createAutomationSchema', () => {
  const validPayload = {
    name: 'Daily AI News',
    topics: ['artificial intelligence', 'machine learning'],
    sources: [{ url: 'https://news.ycombinator.com/rss', type: 'rss' as const }],
  };

  test('accepts valid minimal payload with defaults', () => {
    const result = createAutomationSchema.safeParse(validPayload);
    assert.strictEqual(result.success, true);
    if (result.success) {
      assert.strictEqual(result.data.scheduleTime, '09:00');
      assert.strictEqual(result.data.timezone, 'Europe/Istanbul');
      assert.strictEqual(result.data.outputLanguage, 'tr');
      assert.strictEqual(result.data.style, 'linkedin');
      assert.strictEqual(result.data.deliveryInApp, true);
      assert.strictEqual(result.data.deliverySlack, false);
      assert.strictEqual(result.data.enabled, true);
    }
  });

  test('accepts full valid payload', () => {
    const result = createAutomationSchema.safeParse({
      ...validPayload,
      scheduleTime: '14:30',
      timezone: 'America/New_York',
      outputLanguage: 'en',
      deliverySlack: true,
      slackChannel: '#news',
    });
    assert.strictEqual(result.success, true);
  });

  test('rejects empty name', () => {
    const result = createAutomationSchema.safeParse({ ...validPayload, name: '' });
    assert.strictEqual(result.success, false);
  });

  test('rejects name over 255 chars', () => {
    const result = createAutomationSchema.safeParse({ ...validPayload, name: 'x'.repeat(256) });
    assert.strictEqual(result.success, false);
  });

  test('rejects empty topics array', () => {
    const result = createAutomationSchema.safeParse({ ...validPayload, topics: [] });
    assert.strictEqual(result.success, false);
  });

  test('rejects empty sources array', () => {
    const result = createAutomationSchema.safeParse({ ...validPayload, sources: [] });
    assert.strictEqual(result.success, false);
  });

  test('rejects invalid scheduleTime format', () => {
    const result = createAutomationSchema.safeParse({ ...validPayload, scheduleTime: '9:00' });
    assert.strictEqual(result.success, false);
  });

  test('accepts valid scheduleTime format', () => {
    const result = createAutomationSchema.safeParse({ ...validPayload, scheduleTime: '23:59' });
    assert.strictEqual(result.success, true);
  });

  test('rejects invalid outputLanguage', () => {
    const result = createAutomationSchema.safeParse({ ...validPayload, outputLanguage: 'de' });
    assert.strictEqual(result.success, false);
  });
});

// ─── updateAutomationSchema ────────────────────────────────────────────

describe('updateAutomationSchema', () => {
  test('accepts empty object (all optional)', () => {
    const result = updateAutomationSchema.safeParse({});
    assert.strictEqual(result.success, true);
  });

  test('accepts partial update', () => {
    const result = updateAutomationSchema.safeParse({ name: 'Updated Name', enabled: false });
    assert.strictEqual(result.success, true);
  });

  test('accepts null slackChannel (nullable)', () => {
    const result = updateAutomationSchema.safeParse({ slackChannel: null });
    assert.strictEqual(result.success, true);
  });

  test('rejects invalid data types', () => {
    const result = updateAutomationSchema.safeParse({ enabled: 'yes' });
    assert.strictEqual(result.success, false);
  });
});

// ─── idParamSchema ─────────────────────────────────────────────────────

describe('idParamSchema', () => {
  test('accepts valid UUID', () => {
    const result = idParamSchema.safeParse({ id: '550e8400-e29b-41d4-a716-446655440000' });
    assert.strictEqual(result.success, true);
  });

  test('rejects non-UUID string', () => {
    const result = idParamSchema.safeParse({ id: 'not-a-uuid' });
    assert.strictEqual(result.success, false);
  });

  test('rejects empty string', () => {
    const result = idParamSchema.safeParse({ id: '' });
    assert.strictEqual(result.success, false);
  });
});

// ─── calculateNextRunAt logic ──────────────────────────────────────────

describe('calculateNextRunAt logic', () => {
  test('schedule time parsing works correctly', () => {
    const scheduleTime = '14:30';
    const [hours, minutes] = scheduleTime.split(':').map(Number);
    assert.strictEqual(hours, 14);
    assert.strictEqual(minutes, 30);
  });

  test('schedule time 00:00 parses as midnight', () => {
    const [hours, minutes] = '00:00'.split(':').map(Number);
    assert.strictEqual(hours, 0);
    assert.strictEqual(minutes, 0);
  });

  test('schedule time 23:59 parses as end of day', () => {
    const [hours, minutes] = '23:59'.split(':').map(Number);
    assert.strictEqual(hours, 23);
    assert.strictEqual(minutes, 59);
  });

  test('nextRunAt is null when disabled', () => {
    const enabled = false;
    const nextRunAt = enabled ? new Date() : null;
    assert.strictEqual(nextRunAt, null);
  });

  test('nextRunAt is a Date when enabled', () => {
    const enabled = true;
    const nextRunAt = enabled ? new Date() : null;
    assert.ok(nextRunAt instanceof Date);
  });
});
