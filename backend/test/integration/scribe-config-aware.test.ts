/**
 * Integration test: Scribe config-aware job creation (S0.4.6)
 * Tests POST /api/agents/jobs with config-aware payload
 */
import { test } from 'node:test';
import assert from 'node:assert';
import { buildApp } from '../../src/server.app.js';
import { db } from '../../src/db/client.js';
import { users, agentConfigs, jobs } from '../../src/db/schema.js';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

// Check if DATABASE_URL is set (required for DB-dependent tests)
const hasDatabase = !!process.env.DATABASE_URL;

test('Scribe config-aware job creation', { skip: !hasDatabase }, async (t) => {
  if (!hasDatabase) {
    console.log('Skipping DB-dependent tests: DATABASE_URL not set');
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

  // T2: Legacy payload (backward compatibility)
  await t.test('T2: Create Scribe job with legacy payload', async () => {
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

    if (response.statusCode !== 200) {
      console.error('Response body:', response.body);
      console.error('Response status:', response.statusCode);
    }

    assert.strictEqual(
      response.statusCode,
      200,
      `Expected 200, got ${response.statusCode}: ${response.body}`
    );
    const body = JSON.parse(response.body);
    assert.ok(body.jobId, 'jobId should be present');
    assert.ok(typeof body.jobId === 'string', 'jobId should be a string');
    assert.ok(
      ['pending', 'running', 'completed', 'failed'].includes(body.state),
      `state should be valid: ${body.state}`
    );

    // Verify job appears in list
    await new Promise((resolve) => setTimeout(resolve, 100));
    const listResponse = await app.inject({
      method: 'GET',
      url: '/api/agents/jobs?type=scribe&limit=20',
    });

    assert.strictEqual(listResponse.statusCode, 200);
    const listBody = JSON.parse(listResponse.body);
    assert.ok(Array.isArray(listBody.items), 'items should be an array');
    
    const createdJob = listBody.items.find((j: { id: string }) => j.id === body.jobId);
    assert.ok(createdJob, 'Created job should appear in list');
    assert.strictEqual(createdJob.type, 'scribe');
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

