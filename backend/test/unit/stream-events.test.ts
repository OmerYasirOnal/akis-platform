/**
 * Tests for stream-events utility functions
 * formatSSEMessage, redactSensitiveText, REDACTION_PATTERNS
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatSSEMessage,
  redactSensitiveText,
  REDACTION_PATTERNS,
  type StageEvent,
  type LogEvent,
  type ErrorEvent,
  type AiCallEvent,
} from '../../src/types/stream-events.js';

// ─── formatSSEMessage ─────────────────────────────────────────────

describe('formatSSEMessage', () => {
  const baseEvent: StageEvent = {
    eventId: 1,
    ts: '2025-01-15T10:00:00.000Z',
    jobId: 'job-123',
    type: 'stage',
    stage: 'planning',
    status: 'started',
  };

  it('includes id field from eventId', () => {
    const msg = formatSSEMessage(baseEvent);
    assert.ok(msg.includes('id: 1\n'));
  });

  it('includes event field from type', () => {
    const msg = formatSSEMessage(baseEvent);
    assert.ok(msg.includes('event: stage\n'));
  });

  it('includes data field as JSON', () => {
    const msg = formatSSEMessage(baseEvent);
    assert.ok(msg.includes('data: '));
    const dataLine = msg.split('\n').find(l => l.startsWith('data: '));
    assert.ok(dataLine);
    const parsed = JSON.parse(dataLine.replace('data: ', ''));
    assert.equal(parsed.type, 'stage');
    assert.equal(parsed.jobId, 'job-123');
  });

  it('ends with double newline (SSE terminator)', () => {
    const msg = formatSSEMessage(baseEvent);
    assert.ok(msg.endsWith('\n\n'));
  });

  it('formats log events', () => {
    const logEvent: LogEvent = {
      eventId: 2,
      ts: '2025-01-15T10:01:00.000Z',
      jobId: 'job-123',
      type: 'log',
      level: 'info',
      message: 'Started planning phase',
    };
    const msg = formatSSEMessage(logEvent);
    assert.ok(msg.includes('event: log'));
    assert.ok(msg.includes('Started planning phase'));
  });

  it('formats error events', () => {
    const errorEvent: ErrorEvent = {
      eventId: 3,
      ts: '2025-01-15T10:02:00.000Z',
      jobId: 'job-123',
      type: 'error',
      message: 'MCP gateway unreachable',
      scope: 'mcp',
      fatal: false,
    };
    const msg = formatSSEMessage(errorEvent);
    assert.ok(msg.includes('event: error'));
    assert.ok(msg.includes('mcp'));
  });

  it('formats ai_call events', () => {
    const aiEvent: AiCallEvent = {
      eventId: 4,
      ts: '2025-01-15T10:03:00.000Z',
      jobId: 'job-123',
      type: 'ai_call',
      purpose: 'plan',
      provider: 'openai',
      model: 'gpt-4o-mini',
      durationMs: 1200,
      tokens: { input: 500, output: 200, total: 700 },
      ok: true,
    };
    const msg = formatSSEMessage(aiEvent);
    assert.ok(msg.includes('event: ai_call'));
    const dataLine = msg.split('\n').find(l => l.startsWith('data: '))!;
    const parsed = JSON.parse(dataLine.replace('data: ', ''));
    assert.equal(parsed.model, 'gpt-4o-mini');
    assert.equal(parsed.tokens.total, 700);
  });
});

// ─── redactSensitiveText ──────────────────────────────────────────

describe('redactSensitiveText', () => {
  it('redacts GitHub PATs (ghp_)', () => {
    const text = 'token: ghp_abcDEF123456789012345678901234567890';
    const result = redactSensitiveText(text);
    assert.ok(!result.includes('ghp_'));
    assert.ok(result.includes('[REDACTED]'));
  });

  it('redacts GitHub OAuth tokens (gho_)', () => {
    const result = redactSensitiveText('auth: gho_abc123def456');
    assert.ok(!result.includes('gho_'));
  });

  it('redacts GitHub App tokens (ghs_)', () => {
    const result = redactSensitiveText('token ghs_installToken123');
    assert.ok(!result.includes('ghs_'));
  });

  it('redacts GitHub Refresh tokens (ghr_)', () => {
    const result = redactSensitiveText('refresh: ghr_refreshToken123');
    assert.ok(!result.includes('ghr_'));
  });

  it('redacts OpenAI keys (sk-)', () => {
    const result = redactSensitiveText('key: sk-proj-abc123def456');
    assert.ok(!result.includes('sk-proj'));
  });

  it('redacts Bearer tokens', () => {
    const result = redactSensitiveText('Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.payload.sig');
    assert.ok(!result.includes('eyJhbG'));
    assert.ok(result.includes('[REDACTED]'));
  });

  it('redacts password fields', () => {
    const result = redactSensitiveText('password="mySecretPass123"');
    assert.ok(!result.includes('mySecretPass123'));
  });

  it('redacts apikey fields', () => {
    const result = redactSensitiveText('apikey=sk_test_abc123');
    assert.ok(result.includes('[REDACTED]'));
  });

  it('redacts secret fields', () => {
    const result = redactSensitiveText('secret: "supersecretvalue"');
    assert.ok(!result.includes('supersecretvalue'));
  });

  it('preserves non-sensitive text', () => {
    const safe = 'Hello, this is a normal log message about file analysis.';
    assert.equal(redactSensitiveText(safe), safe);
  });

  it('handles multiple sensitive values in one string', () => {
    const text = 'Used ghp_token123 to authenticate, key is sk-proj-key456';
    const result = redactSensitiveText(text);
    assert.ok(!result.includes('ghp_'));
    assert.ok(!result.includes('sk-proj'));
  });

  it('handles empty string', () => {
    assert.equal(redactSensitiveText(''), '');
  });
});

// ─── REDACTION_PATTERNS ───────────────────────────────────────────

describe('REDACTION_PATTERNS', () => {
  it('has patterns for all major secret types', () => {
    assert.ok(REDACTION_PATTERNS.length >= 8, 'should cover at least 8 patterns');
  });

  it('patterns are RegExp instances with global flag', () => {
    for (const pattern of REDACTION_PATTERNS) {
      assert.ok(pattern instanceof RegExp);
      assert.ok(pattern.flags.includes('g'), `${pattern} should have global flag`);
    }
  });
});
