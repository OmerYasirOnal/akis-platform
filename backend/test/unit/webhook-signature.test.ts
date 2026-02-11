import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

// Re-implement signature verification for isolated unit testing
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

// Trigger schemas (matching API contracts)
const createTriggerSchema = z.object({
  repoOwner: z.string().min(1),
  repoName: z.string().min(1),
  branch: z.string().min(1).default('main'),
  eventType: z.enum(['pr_merged', 'pr_opened', 'push']),
  agentType: z.enum(['scribe', 'trace', 'proto']),
  enabled: z.boolean().default(true),
});

describe('Webhook HMAC-SHA256 signature verification', () => {
  const SECRET = 'test-webhook-secret-key-2026';
  const PAYLOAD = '{"action":"opened","pull_request":{"number":42}}';

  it('verifies valid signature', () => {
    const sig = 'sha256=' + createHmac('sha256', SECRET).update(PAYLOAD).digest('hex');
    assert.equal(verifyGitHubSignature(PAYLOAD, sig, SECRET), true);
  });

  it('rejects invalid signature', () => {
    assert.equal(verifyGitHubSignature(PAYLOAD, 'sha256=invalid', SECRET), false);
  });

  it('rejects wrong secret', () => {
    const sig = 'sha256=' + createHmac('sha256', SECRET).update(PAYLOAD).digest('hex');
    assert.equal(verifyGitHubSignature(PAYLOAD, sig, 'wrong-secret'), false);
  });

  it('rejects tampered payload', () => {
    const sig = 'sha256=' + createHmac('sha256', SECRET).update(PAYLOAD).digest('hex');
    assert.equal(verifyGitHubSignature(PAYLOAD + 'x', sig, SECRET), false);
  });

  it('rejects missing sha256= prefix via length mismatch', () => {
    assert.equal(verifyGitHubSignature(PAYLOAD, 'invalid', SECRET), false);
  });

  it('rejects empty signature', () => {
    assert.equal(verifyGitHubSignature(PAYLOAD, '', SECRET), false);
  });
});

describe('GitHub event type resolution', () => {
  it('resolves pr_opened for pull_request opened', () => {
    assert.equal(resolveEventType('pull_request', 'opened'), 'pr_opened');
  });

  it('resolves pr_merged for pull_request closed', () => {
    assert.equal(resolveEventType('pull_request', 'closed'), 'pr_merged');
  });

  it('returns null for unknown pull_request action', () => {
    assert.equal(resolveEventType('pull_request', 'synchronize'), null);
  });

  it('resolves push event', () => {
    assert.equal(resolveEventType('push'), 'push');
  });

  it('returns null for unknown event', () => {
    assert.equal(resolveEventType('issues'), null);
    assert.equal(resolveEventType('star'), null);
  });
});

describe('Trigger schema contracts', () => {
  it('accepts valid trigger creation', () => {
    const result = createTriggerSchema.parse({
      repoOwner: 'OmerYasirOnal',
      repoName: 'akis-platform',
      eventType: 'pr_merged',
      agentType: 'scribe',
    });
    assert.equal(result.branch, 'main'); // default
    assert.equal(result.enabled, true); // default
  });

  it('rejects invalid event type', () => {
    assert.throws(() => createTriggerSchema.parse({
      repoOwner: 'x', repoName: 'y', eventType: 'star', agentType: 'scribe',
    }));
  });

  it('rejects invalid agent type', () => {
    assert.throws(() => createTriggerSchema.parse({
      repoOwner: 'x', repoName: 'y', eventType: 'push', agentType: 'invalid',
    }));
  });

  it('all 3 event types are valid', () => {
    for (const eventType of ['pr_merged', 'pr_opened', 'push']) {
      const result = createTriggerSchema.parse({
        repoOwner: 'x', repoName: 'y', eventType, agentType: 'trace',
      });
      assert.equal(result.eventType, eventType);
    }
  });

  it('all 3 agent types are valid', () => {
    for (const agentType of ['scribe', 'trace', 'proto']) {
      const result = createTriggerSchema.parse({
        repoOwner: 'x', repoName: 'y', eventType: 'push', agentType,
      });
      assert.equal(result.agentType, agentType);
    }
  });
});
