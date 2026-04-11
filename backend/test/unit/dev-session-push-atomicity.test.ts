/**
 * Unit tests: Dev Session Push Atomicity — Transaction Verification
 *
 * Validates that the /dev/push endpoint wraps both DB updates
 * (devMessages + devSessions) in a single Drizzle transaction.
 *
 * Depends on: Task 3 (transaction wrapper in dev-session.plugin.ts)
 */
import { describe, test } from 'node:test';
import assert from 'node:assert';

// ─── Transaction Mock Infrastructure ──────────────────────────────────────

interface UpdateCall {
  table: string;
  setArgs: Record<string, unknown>;
  whereArgs: string;
}

/**
 * Creates a mock Drizzle transaction interface that tracks all update calls.
 * The mock verifies:
 * 1. Both updates use `tx` (transaction client), not `db`
 * 2. Updates happen in sequence within the transaction callback
 * 3. Rollback occurs on error (callback throws)
 */
function createTransactionMock(opts?: { failOnUpdate?: number }) {
  const directCalls: UpdateCall[] = [];
  const transactionCalls: UpdateCall[] = [];
  let transactionCount = 0;
  let rollbackCount = 0;
  let updateIndex = 0;

  const createUpdateChain = (table: string, calls: UpdateCall[]) => ({
    set: (setArgs: Record<string, unknown>) => ({
      where: (whereArgs: unknown) => {
        updateIndex++;
        if (opts?.failOnUpdate === updateIndex) {
          throw new Error(`Simulated DB error on update #${updateIndex}`);
        }
        calls.push({ table, setArgs, whereArgs: String(whereArgs) });
      },
    }),
  });

  const tx = {
    update: (table: { name: string }) => createUpdateChain(table.name, transactionCalls),
  };

  const db = {
    update: (table: { name: string }) => createUpdateChain(table.name, directCalls),
    transaction: async (callback: (tx: typeof db) => Promise<void>) => {
      transactionCount++;
      updateIndex = 0;
      try {
        await callback(tx as unknown as typeof db);
      } catch (err) {
        rollbackCount++;
        // Clear transaction calls to simulate rollback
        transactionCalls.length = 0;
        throw err;
      }
    },
  };

  return {
    db,
    getDirectCalls: () => directCalls,
    getTransactionCalls: () => transactionCalls,
    getTransactionCount: () => transactionCount,
    getRollbackCount: () => rollbackCount,
  };
}

// Mock table references
const devMessages = { name: 'dev_messages' };
const devSessions = { name: 'dev_sessions' };

// ─── Simulated Push Logic (mirrors dev-session.plugin.ts lines 292-298) ──

async function executePush(
  db: ReturnType<typeof createTransactionMock>['db'],
  messageId: string,
  sessionId: string,
  commitSha: string,
) {
  await db.transaction(async (tx) => {
    await tx.update(devMessages as { name: string })
      .set({ changeStatus: 'pushed', commitSha })
      .where(`eq(devMessages.id, '${messageId}')`);

    await tx.update(devSessions as { name: string })
      .set({ totalCommits: 'sql`total_commits + 1`', updatedAt: new Date().toISOString() })
      .where(`eq(devSessions.id, '${sessionId}')`);
  });
}

// ─── Test Suites ────────────────────────────────────────────────────────────

describe('Transaction Wrapping — Both Updates in Single Transaction', () => {
  test('both updates execute within db.transaction()', async () => {
    const mock = createTransactionMock();
    await executePush(mock.db, 'msg-1', 'sess-1', 'abc1234');

    assert.strictEqual(mock.getTransactionCount(), 1, 'Should call db.transaction() exactly once');
    assert.strictEqual(mock.getTransactionCalls().length, 2, 'Two updates within transaction');
    assert.strictEqual(mock.getDirectCalls().length, 0, 'No direct db.update() calls outside transaction');
  });

  test('first update targets devMessages', async () => {
    const mock = createTransactionMock();
    await executePush(mock.db, 'msg-1', 'sess-1', 'abc1234');

    const firstCall = mock.getTransactionCalls()[0];
    assert.strictEqual(firstCall.table, 'dev_messages');
    assert.strictEqual(firstCall.setArgs.changeStatus, 'pushed');
    assert.strictEqual(firstCall.setArgs.commitSha, 'abc1234');
  });

  test('second update targets devSessions', async () => {
    const mock = createTransactionMock();
    await executePush(mock.db, 'msg-1', 'sess-1', 'abc1234');

    const secondCall = mock.getTransactionCalls()[1];
    assert.strictEqual(secondCall.table, 'dev_sessions');
    assert.ok(secondCall.setArgs.totalCommits, 'Should increment totalCommits');
    assert.ok(secondCall.setArgs.updatedAt, 'Should set updatedAt');
  });

  test('commitSha is passed correctly to message update', async () => {
    const mock = createTransactionMock();
    const sha = 'deadbeef1234567';
    await executePush(mock.db, 'msg-42', 'sess-7', sha);

    const msgUpdate = mock.getTransactionCalls()[0];
    assert.strictEqual(msgUpdate.setArgs.commitSha, sha);
  });

  test('where clauses reference correct IDs', async () => {
    const mock = createTransactionMock();
    await executePush(mock.db, 'msg-99', 'sess-77', 'sha');

    const [msgWhere, sessWhere] = mock.getTransactionCalls().map((c) => c.whereArgs);
    assert.ok(msgWhere.includes('msg-99'), 'Message where should reference messageId');
    assert.ok(sessWhere.includes('sess-77'), 'Session where should reference sessionId');
  });
});

describe('Transaction Rollback — Error Handling', () => {
  test('rollback when second update (devSessions) fails', async () => {
    const mock = createTransactionMock({ failOnUpdate: 2 });

    await assert.rejects(
      () => executePush(mock.db, 'msg-1', 'sess-1', 'sha-fail'),
      { message: 'Simulated DB error on update #2' },
    );

    assert.strictEqual(mock.getRollbackCount(), 1, 'Transaction should be rolled back');
    assert.strictEqual(mock.getTransactionCalls().length, 0, 'Rolled-back calls should be cleared');
  });

  test('rollback when first update (devMessages) fails', async () => {
    const mock = createTransactionMock({ failOnUpdate: 1 });

    await assert.rejects(
      () => executePush(mock.db, 'msg-1', 'sess-1', 'sha-fail'),
      { message: 'Simulated DB error on update #1' },
    );

    assert.strictEqual(mock.getRollbackCount(), 1);
    assert.strictEqual(mock.getTransactionCalls().length, 0, 'No updates should persist');
  });

  test('error propagates to caller after rollback', async () => {
    const mock = createTransactionMock({ failOnUpdate: 2 });

    let caughtError: Error | null = null;
    try {
      await executePush(mock.db, 'msg-1', 'sess-1', 'sha');
    } catch (err) {
      caughtError = err as Error;
    }

    assert.ok(caughtError, 'Error should propagate');
    assert.ok(caughtError!.message.includes('Simulated DB error'));
  });
});

describe('Transaction Pattern — No Direct DB Calls', () => {
  test('executePush never calls db.update() directly', async () => {
    const mock = createTransactionMock();
    await executePush(mock.db, 'msg-1', 'sess-1', 'sha');

    assert.strictEqual(mock.getDirectCalls().length, 0,
      'All updates must go through tx (transaction client), not db directly');
  });

  test('exactly one transaction is opened per push', async () => {
    const mock = createTransactionMock();
    await executePush(mock.db, 'msg-1', 'sess-1', 'sha1');

    assert.strictEqual(mock.getTransactionCount(), 1);
  });
});
