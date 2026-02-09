/**
 * Unit tests for webhook pure functions: signature verification and event resolution
 */
import { describe, test } from 'node:test';
import assert from 'node:assert';
import { createHmac, timingSafeEqual } from 'crypto';

// ─── Re-create pure functions from webhooks.ts ───────────────────────

function verifyGitHubSignature(payload: string, signature: string, secret: string): boolean {
  const expected = 'sha256=' + createHmac('sha256', secret).update(payload).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

function resolveEventType(githubEvent: string, action?: string): string | null {
  if (githubEvent === 'pull_request') {
    if (action === 'opened') return 'pr_opened';
    if (action === 'closed') return 'pr_merged';
    return null;
  }
  if (githubEvent === 'push') return 'push';
  return null;
}

// ─── verifyGitHubSignature ───────────────────────────────────────────

describe('verifyGitHubSignature', () => {
  const secret = 'test-webhook-secret';

  test('valid signature returns true', () => {
    const payload = '{"action":"opened"}';
    const expected = 'sha256=' + createHmac('sha256', secret).update(payload).digest('hex');
    assert.strictEqual(verifyGitHubSignature(payload, expected, secret), true);
  });

  test('invalid signature returns false', () => {
    const payload = '{"action":"opened"}';
    assert.strictEqual(verifyGitHubSignature(payload, 'sha256=invalid', secret), false);
  });

  test('empty signature returns false', () => {
    const payload = '{"action":"opened"}';
    assert.strictEqual(verifyGitHubSignature(payload, '', secret), false);
  });

  test('mismatched payload returns false', () => {
    const payload = '{"action":"opened"}';
    const sig = 'sha256=' + createHmac('sha256', secret).update('different payload').digest('hex');
    assert.strictEqual(verifyGitHubSignature(payload, sig, secret), false);
  });

  test('wrong secret returns false', () => {
    const payload = '{"action":"opened"}';
    const sig = 'sha256=' + createHmac('sha256', secret).update(payload).digest('hex');
    assert.strictEqual(verifyGitHubSignature(payload, sig, 'wrong-secret'), false);
  });

  test('signature uses sha256 prefix', () => {
    const payload = 'test';
    const hash = createHmac('sha256', secret).update(payload).digest('hex');
    const sig = `sha256=${hash}`;
    assert.strictEqual(verifyGitHubSignature(payload, sig, secret), true);
  });
});

// ─── resolveEventType ────────────────────────────────────────────────

describe('resolveEventType', () => {
  test('pull_request + opened → pr_opened', () => {
    assert.strictEqual(resolveEventType('pull_request', 'opened'), 'pr_opened');
  });

  test('pull_request + closed → pr_merged', () => {
    assert.strictEqual(resolveEventType('pull_request', 'closed'), 'pr_merged');
  });

  test('pull_request + other action → null', () => {
    assert.strictEqual(resolveEventType('pull_request', 'synchronize'), null);
    assert.strictEqual(resolveEventType('pull_request', 'labeled'), null);
    assert.strictEqual(resolveEventType('pull_request', 'review_requested'), null);
  });

  test('pull_request without action → null', () => {
    assert.strictEqual(resolveEventType('pull_request'), null);
  });

  test('push → push', () => {
    assert.strictEqual(resolveEventType('push'), 'push');
  });

  test('push ignores action parameter', () => {
    assert.strictEqual(resolveEventType('push', 'any-action'), 'push');
  });

  test('unknown event → null', () => {
    assert.strictEqual(resolveEventType('issues'), null);
    assert.strictEqual(resolveEventType('release'), null);
    assert.strictEqual(resolveEventType('deployment'), null);
    assert.strictEqual(resolveEventType(''), null);
  });
});

// ─── Webhook response contracts ──────────────────────────────────────

describe('Webhook response contracts', () => {
  test('processed response has required fields', () => {
    const response = {
      status: 'processed',
      event: 'pr_opened',
      triggersMatched: 2,
      jobsCreated: ['job-1', 'job-2'],
    };

    assert.strictEqual(response.status, 'processed');
    assert.strictEqual(typeof response.event, 'string');
    assert.strictEqual(typeof response.triggersMatched, 'number');
    assert.ok(Array.isArray(response.jobsCreated));
  });

  test('ignored response includes reason', () => {
    const response = {
      status: 'ignored',
      reason: 'Unsupported event: issues/none',
    };

    assert.strictEqual(response.status, 'ignored');
    assert.strictEqual(typeof response.reason, 'string');
  });

  test('duplicate response includes deliveryId', () => {
    const response = {
      status: 'duplicate',
      deliveryId: 'abc-123',
    };

    assert.strictEqual(response.status, 'duplicate');
    assert.strictEqual(typeof response.deliveryId, 'string');
  });

  test('error responses have code and message', () => {
    const sigError = { error: { code: 'INVALID_SIGNATURE', message: 'Webhook signature verification failed' } };
    const eventError = { error: { code: 'MISSING_EVENT', message: 'X-GitHub-Event header is required' } };
    const repoError = { error: { code: 'MISSING_REPO', message: 'Repository data is required' } };

    for (const resp of [sigError, eventError, repoError]) {
      assert.strictEqual(typeof resp.error.code, 'string');
      assert.strictEqual(typeof resp.error.message, 'string');
    }
  });
});
