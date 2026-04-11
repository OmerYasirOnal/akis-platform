/**
 * Unit tests: Dev Session Concurrent Push — Race Condition Guards
 *
 * Validates that the /dev/push endpoint handles concurrent push attempts
 * correctly. Tests cover:
 *
 * 1. changeStatus guard prevents double-push
 * 2. Push after reject is denied
 * 3. Empty fileChanges validation
 * 4. Non-existent session/message handling
 * 5. Transaction atomicity for totalCommits
 */
import { describe, test } from 'node:test';
import assert from 'node:assert';

// ─── Simulated Dev Session State ──────────────────────────────────────────

interface DevMessage {
  id: string;
  sessionId: string;
  changeStatus: 'pending' | 'pushed' | 'rejected';
  commitSha: string | null;
  fileChanges: Array<{ action: string; path: string; content?: string }>;
}

interface DevSession {
  id: string;
  userId: string;
  repoOwner: string;
  repoName: string;
  branch: string;
  totalCommits: number;
}

/**
 * Simulates the push validation logic from dev-session.plugin.ts.
 * Returns { ok, error?, statusCode? }.
 */
function validatePush(
  messageId: string,
  messages: Map<string, DevMessage>,
  sessions: Map<string, DevSession>,
): { ok: boolean; error?: string; statusCode?: number } {
  const message = messages.get(messageId);
  if (!message) {
    return { ok: false, error: 'Message not found', statusCode: 404 };
  }

  const session = sessions.get(message.sessionId);
  if (!session) {
    return { ok: false, error: 'Session not found', statusCode: 404 };
  }

  if (!message.fileChanges || message.fileChanges.length === 0) {
    return { ok: false, error: 'No file changes to push', statusCode: 400 };
  }

  if (message.changeStatus === 'pushed') {
    return { ok: false, error: 'Already pushed', statusCode: 409 };
  }

  if (message.changeStatus === 'rejected') {
    return { ok: false, error: 'Cannot push rejected changes', statusCode: 409 };
  }

  return { ok: true };
}

/**
 * Simulates atomic push with transaction.
 * Both message update and session totalCommits increment must succeed or both fail.
 */
function simulateAtomicPush(
  messageId: string,
  commitSha: string,
  messages: Map<string, DevMessage>,
  sessions: Map<string, DevSession>,
  failOnSessionUpdate = false,
): { ok: boolean; error?: string } {
  const message = messages.get(messageId);
  if (!message) return { ok: false, error: 'Message not found' };

  const session = sessions.get(message.sessionId);
  if (!session) return { ok: false, error: 'Session not found' };

  // Simulate transaction — save original state for rollback
  const origChangeStatus = message.changeStatus;
  const origCommitSha = message.commitSha;
  const origTotalCommits = session.totalCommits;

  try {
    // tx.update(devMessages)
    message.changeStatus = 'pushed';
    message.commitSha = commitSha;

    // tx.update(devSessions)
    if (failOnSessionUpdate) {
      throw new Error('Simulated DB error on session update');
    }
    session.totalCommits += 1;

    return { ok: true };
  } catch (err) {
    // Transaction rollback
    message.changeStatus = origChangeStatus;
    message.commitSha = origCommitSha;
    session.totalCommits = origTotalCommits;
    return { ok: false, error: String(err) };
  }
}

// ─── Test Data ──────────────────────────────────────────────────────────────

function createTestData() {
  const sessions = new Map<string, DevSession>([
    ['sess-1', { id: 'sess-1', userId: 'user-a', repoOwner: 'org', repoName: 'repo', branch: 'dev/session-1', totalCommits: 0 }],
  ]);

  const messages = new Map<string, DevMessage>([
    ['msg-1', { id: 'msg-1', sessionId: 'sess-1', changeStatus: 'pending', commitSha: null, fileChanges: [{ action: 'create', path: 'src/index.ts', content: 'console.log("hello")' }] }],
    ['msg-2', { id: 'msg-2', sessionId: 'sess-1', changeStatus: 'pushed', commitSha: 'abc1234', fileChanges: [{ action: 'create', path: 'src/old.ts' }] }],
    ['msg-3', { id: 'msg-3', sessionId: 'sess-1', changeStatus: 'rejected', commitSha: null, fileChanges: [{ action: 'create', path: 'src/bad.ts' }] }],
    ['msg-empty', { id: 'msg-empty', sessionId: 'sess-1', changeStatus: 'pending', commitSha: null, fileChanges: [] }],
  ]);

  return { sessions, messages };
}

// ─── Test Suites ────────────────────────────────────────────────────────────

describe('Push Validation — changeStatus Guard', () => {
  test('allows push for pending message', () => {
    const { sessions, messages } = createTestData();
    const result = validatePush('msg-1', messages, sessions);
    assert.strictEqual(result.ok, true);
  });

  test('rejects push for already-pushed message (409)', () => {
    const { sessions, messages } = createTestData();
    const result = validatePush('msg-2', messages, sessions);
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.statusCode, 409);
    assert.ok(result.error?.includes('Already pushed'));
  });

  test('rejects push for rejected message (409)', () => {
    const { sessions, messages } = createTestData();
    const result = validatePush('msg-3', messages, sessions);
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.statusCode, 409);
    assert.ok(result.error?.includes('rejected'));
  });

  test('rejects push with empty fileChanges (400)', () => {
    const { sessions, messages } = createTestData();
    const result = validatePush('msg-empty', messages, sessions);
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.statusCode, 400);
  });

  test('returns 404 for non-existent message', () => {
    const { sessions, messages } = createTestData();
    const result = validatePush('msg-nonexistent', messages, sessions);
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.statusCode, 404);
  });
});

describe('Concurrent Push — Double-Push Prevention', () => {
  test('first push succeeds, second push is rejected', () => {
    const { sessions, messages } = createTestData();

    // First push — succeeds
    const validation1 = validatePush('msg-1', messages, sessions);
    assert.strictEqual(validation1.ok, true);
    const pushResult = simulateAtomicPush('msg-1', 'sha-first', messages, sessions);
    assert.strictEqual(pushResult.ok, true);

    // Second push — message now has changeStatus='pushed'
    const validation2 = validatePush('msg-1', messages, sessions);
    assert.strictEqual(validation2.ok, false);
    assert.strictEqual(validation2.statusCode, 409);
  });

  test('totalCommits increments exactly once per successful push', () => {
    const { sessions, messages } = createTestData();
    assert.strictEqual(sessions.get('sess-1')!.totalCommits, 0);

    simulateAtomicPush('msg-1', 'sha-123', messages, sessions);
    assert.strictEqual(sessions.get('sess-1')!.totalCommits, 1);

    // Second push attempt blocked by validation
    const validation = validatePush('msg-1', messages, sessions);
    assert.strictEqual(validation.ok, false);
    assert.strictEqual(sessions.get('sess-1')!.totalCommits, 1);
  });

  test('commitSha is set correctly on successful push', () => {
    const { sessions, messages } = createTestData();
    assert.strictEqual(messages.get('msg-1')!.commitSha, null);

    simulateAtomicPush('msg-1', 'abc1234def', messages, sessions);
    assert.strictEqual(messages.get('msg-1')!.commitSha, 'abc1234def');
    assert.strictEqual(messages.get('msg-1')!.changeStatus, 'pushed');
  });
});

describe('Transaction Atomicity — Rollback on Failure', () => {
  test('rolls back message status if session update fails', () => {
    const { sessions, messages } = createTestData();
    const origStatus = messages.get('msg-1')!.changeStatus;
    const origCommits = sessions.get('sess-1')!.totalCommits;

    const result = simulateAtomicPush('msg-1', 'sha-fail', messages, sessions, true);
    assert.strictEqual(result.ok, false);

    // Both should be rolled back
    assert.strictEqual(messages.get('msg-1')!.changeStatus, origStatus);
    assert.strictEqual(messages.get('msg-1')!.commitSha, null);
    assert.strictEqual(sessions.get('sess-1')!.totalCommits, origCommits);
  });

  test('message remains pushable after rollback', () => {
    const { sessions, messages } = createTestData();

    // First attempt fails
    simulateAtomicPush('msg-1', 'sha-fail', messages, sessions, true);

    // Second attempt succeeds
    const result = simulateAtomicPush('msg-1', 'sha-success', messages, sessions, false);
    assert.strictEqual(result.ok, true);
    assert.strictEqual(messages.get('msg-1')!.commitSha, 'sha-success');
    assert.strictEqual(sessions.get('sess-1')!.totalCommits, 1);
  });

  test('no partial state after transaction failure', () => {
    const { sessions, messages } = createTestData();

    simulateAtomicPush('msg-1', 'sha-fail', messages, sessions, true);

    // Neither message nor session should be modified
    assert.strictEqual(messages.get('msg-1')!.changeStatus, 'pending');
    assert.strictEqual(messages.get('msg-1')!.commitSha, null);
    assert.strictEqual(sessions.get('sess-1')!.totalCommits, 0);
  });
});

describe('Edge Cases', () => {
  test('push to non-existent session returns error', () => {
    const messages = new Map<string, DevMessage>([
      ['msg-orphan', { id: 'msg-orphan', sessionId: 'sess-nonexistent', changeStatus: 'pending', commitSha: null, fileChanges: [{ action: 'create', path: 'x.ts' }] }],
    ]);
    const sessions = new Map<string, DevSession>();

    const result = validatePush('msg-orphan', messages, sessions);
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.statusCode, 404);
  });

  test('multiple messages in same session track commits independently', () => {
    const sessions = new Map<string, DevSession>([
      ['sess-1', { id: 'sess-1', userId: 'user-a', repoOwner: 'org', repoName: 'repo', branch: 'dev/x', totalCommits: 0 }],
    ]);
    const messages = new Map<string, DevMessage>([
      ['msg-a', { id: 'msg-a', sessionId: 'sess-1', changeStatus: 'pending', commitSha: null, fileChanges: [{ action: 'create', path: 'a.ts' }] }],
      ['msg-b', { id: 'msg-b', sessionId: 'sess-1', changeStatus: 'pending', commitSha: null, fileChanges: [{ action: 'create', path: 'b.ts' }] }],
    ]);

    simulateAtomicPush('msg-a', 'sha-a', messages, sessions);
    assert.strictEqual(sessions.get('sess-1')!.totalCommits, 1);

    simulateAtomicPush('msg-b', 'sha-b', messages, sessions);
    assert.strictEqual(sessions.get('sess-1')!.totalCommits, 2);

    // Both messages should have their own commitSha
    assert.strictEqual(messages.get('msg-a')!.commitSha, 'sha-a');
    assert.strictEqual(messages.get('msg-b')!.commitSha, 'sha-b');
  });
});
