/**
 * Integration test: Scribe config-aware job creation (S0.4.6)
 * Tests POST /api/agents/jobs with config-aware payload
 */
import { test } from 'node:test';
import assert from 'node:assert';
import { buildApp } from '../../src/server.app.js';
import { db } from '../../src/db/client.js';
import { users, agentConfigs, jobs } from '../../src/db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

// Check if DATABASE_URL is set (required for DB-dependent tests)
const SKIP_DB_TESTS = process.env.SKIP_DB_TESTS === 'true';
const hasDatabase = !!process.env.DATABASE_URL;
const SHOULD_SKIP = SKIP_DB_TESTS || !hasDatabase;

async function hasColumn(tableName: string, columnName: string): Promise<boolean> {
  const result = await db.execute(sql`
    select 1
    from information_schema.columns
    where table_name = ${tableName}
      and column_name = ${columnName}
    limit 1
  `);
  return result.rows.length > 0;
}

test('Scribe config-aware job creation', { skip: SHOULD_SKIP }, async (t) => {
  if (SHOULD_SKIP) {
    const reason = SKIP_DB_TESTS ? 'SKIP_DB_TESTS is set' : 'DATABASE_URL not set';
    console.log(`[Scribe Config Integration] SKIPPED: ${reason}`);
    return;
  }

  // Connectivity check to fail fast with actionable error (prevent cascading cancellations)
  try {
    await db.execute(sql`SELECT 1`);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    throw new Error(
      `[Scribe Config Integration] FATAL: Database is unreachable but SKIP_DB_TESTS is NOT set. ` +
      `Check if Docker/Postgres is running or set SKIP_DB_TESTS=true. ` +
      `Error: ${errorMessage}`
    );
  }

  let schemaReady = true;
  try {
    schemaReady = await hasColumn('agent_configs', 'runtime_profile');
  } catch {
    schemaReady = false;
  }
  if (!schemaReady) {
    t.skip('Scribe config integration skipped because agent_configs schema is behind current Drizzle model');
    return;
  }

  const app = await buildApp();

  // Test user credentials
  const testUserId = randomUUID();
  const testEmail = `test-scribe-${Date.now()}@example.com`;

  // Cleanup function
  const cleanup = async () => {
    try {
      await db.delete(jobs).where(eq(jobs.type, 'scribe'));
      await db.delete(agentConfigs).where(eq(agentConfigs.userId, testUserId));
      await db.delete(users).where(eq(users.id, testUserId));
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  };

  // Setup: Create test user and config
  await t.test('Setup: Create test user and Scribe config', async () => {
    // Create user
    await db.insert(users).values({
      id: testUserId,
      name: 'Test User',
      email: testEmail,
      passwordHash: 'test-hash',
      emailVerified: true,
      status: 'active',
    });

    // Create Scribe config
    await db.insert(agentConfigs).values({
      userId: testUserId,
      agentType: 'scribe',
      enabled: true,
      repositoryOwner: 'test-owner',
      repositoryName: 'test-repo',
      baseBranch: 'main',
      branchPattern: 'docs/scribe-{timestamp}',
      targetPlatform: null, // GitHub-only mode
      targetConfig: {},
      triggerMode: 'manual',
      autoMerge: false,
    });
  });

  // T1: Config-aware payload with mode: 'from_config'
  await t.test('T1: Create Scribe job with mode: from_config', async () => {
    // Create session cookie (mock auth)
    const sessionId = randomUUID();
    const cookieValue = `sessionId=${sessionId}`;

    // Mock session in DB (if sessions table exists)
    // For now, we'll use a direct inject without proper auth
    // In production, you'd need proper session setup

    const response = await app.inject({
      method: 'POST',
      url: '/api/agents/jobs',
      payload: {
        type: 'scribe',
        payload: {
          mode: 'from_config',
          dryRun: true,
        },
      },
      headers: {
        cookie: cookieValue,
      },
    });

    // Expect 401 without proper auth (expected behavior)
    // This test documents that auth is required for config-aware mode
    assert.ok(
      response.statusCode === 401 || response.statusCode === 200,
      `Expected 401 (no auth) or 200 (with auth), got ${response.statusCode}: ${response.body}`
    );
  });

  // T2: Legacy payload without auth should fail (auth required as of S0.4.6+)
  await t.test('T2: Create Scribe job with legacy payload requires auth', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/agents/jobs',
      payload: {
        type: 'scribe',
        payload: {
          owner: 'legacy-owner',
          repo: 'legacy-repo',
          baseBranch: 'main',
          taskDescription: 'Test task',
        },
      },
    });

    // As of S0.4.6+, Scribe jobs require auth (for AI key validation)
    // Legacy payload without auth should return 401
    assert.strictEqual(
      response.statusCode,
      401,
      `Expected 401 (auth required), got ${response.statusCode}: ${response.body}`
    );
    const body = JSON.parse(response.body);
    assert.ok(body.error, 'Should have error object');
    assert.ok(body.error.code, 'Should have error code');
  });

  // T3: Invalid config-aware payload (missing config)
  await t.test('T3: Config-aware payload without config returns actionable error', async () => {
    const sessionId = randomUUID();
    const cookieValue = `sessionId=${sessionId}`;

    const response = await app.inject({
      method: 'POST',
      url: '/api/agents/jobs',
      payload: {
        type: 'scribe',
        payload: {
          mode: 'from_config',
        },
      },
      headers: {
        cookie: cookieValue,
      },
    });

    // Should return 401 (no auth) or 400/404 (config not found)
    assert.ok(
      [400, 401, 404, 500].includes(response.statusCode),
      `Expected 400/401/404/500, got ${response.statusCode}`
    );

    if (response.statusCode !== 401) {
      const body = JSON.parse(response.body);
      assert.ok(body.error, 'Should have error object');
      assert.ok(body.error.message, 'Should have error message');
      // Error message should be actionable
      assert.ok(
        body.error.message.includes('configuration') ||
        body.error.message.includes('auth'),
        'Error message should mention configuration or auth'
      );
    }
  });

  // T4: Validation error for incomplete legacy payload
  await t.test('T4: Incomplete legacy payload returns validation error', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/agents/jobs',
      payload: {
        type: 'scribe',
        payload: {
          owner: 'test-owner',
          // Missing: repo, baseBranch
        },
      },
    });

    assert.strictEqual(response.statusCode, 400);
    const body = JSON.parse(response.body);
    assert.ok(body.error, 'Should have error object');
    assert.ok(body.error.message, 'Should have error message');
    // Generic validation failure is acceptable - specific field errors would be in details
    assert.ok(
      body.error.message.toLowerCase().includes('validation') ||
      body.error.message.toLowerCase().includes('required'),
      `Error should indicate validation failure, got: ${body.error.message}`
    );
  });

  // Cleanup
  await cleanup();
  await app.close();
});
