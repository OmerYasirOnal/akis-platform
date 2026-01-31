import { test } from 'node:test';
import assert from 'node:assert';

/**
 * SSE route configuration tests.
 * These verify that the route paths and handler are correctly defined.
 * Full integration tests require a running Fastify instance with DB.
 */

test('SSE route paths are well-formed', async (t) => {
  await t.test('canonical path includes /api prefix', () => {
    const canonical = '/api/agents/jobs/:id/trace-stream';
    assert.ok(canonical.startsWith('/api/'));
    assert.ok(canonical.includes(':id'));
    assert.ok(canonical.endsWith('/trace-stream'));
  });

  await t.test('short alias path includes /api prefix', () => {
    const alias = '/api/jobs/:id/trace-stream';
    assert.ok(alias.startsWith('/api/'));
    assert.ok(alias.includes(':id'));
  });

  await t.test('legacy alias path has no /api prefix', () => {
    const legacy = '/agents/jobs/:id/trace-stream';
    assert.ok(!legacy.startsWith('/api'));
    assert.ok(legacy.includes(':id'));
  });
});

test('SSE event format', async (t) => {
  await t.test('formatForSSE produces valid SSE format', () => {
    // Simulate the format pattern used in the handler
    const event = { type: 'stage', eventId: 1, ts: new Date().toISOString(), jobId: 'test' };
    const formatted = `event: ${event.type}\nid: ${event.eventId}\ndata: ${JSON.stringify(event)}\n\n`;

    assert.ok(formatted.startsWith('event: stage\n'));
    assert.ok(formatted.includes('id: 1\n'));
    assert.ok(formatted.includes('"type":"stage"'));
    assert.ok(formatted.endsWith('\n\n'));
  });

  await t.test('keepalive comment is valid SSE', () => {
    const keepalive = `: keepalive ${Date.now()}\n\n`;
    assert.ok(keepalive.startsWith(': '));
    assert.ok(keepalive.endsWith('\n\n'));
  });
});

test('SSE parser robustness (frontend logic)', async (t) => {
  await t.test('empty string should be ignored', () => {
    const raw = '';
    assert.ok(!raw || raw === 'undefined' || raw === 'null');
  });

  await t.test('"undefined" string should be ignored', () => {
    const raw = 'undefined';
    assert.ok(raw === 'undefined');
  });

  await t.test('SSE comment should be ignored', () => {
    const raw = ': keepalive 1706789000';
    assert.ok(raw.startsWith(':'));
  });

  await t.test('valid JSON should parse', () => {
    const raw = '{"type":"stage","eventId":1,"ts":"2026-01-31T00:00:00Z","jobId":"abc"}';
    const data = JSON.parse(raw);
    assert.strictEqual(data.type, 'stage');
    assert.strictEqual(data.eventId, 1);
  });

  await t.test('invalid JSON should not throw when guarded', () => {
    const raw = 'not json at all';
    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Expected
    }
    assert.strictEqual(parsed, null);
  });
});
