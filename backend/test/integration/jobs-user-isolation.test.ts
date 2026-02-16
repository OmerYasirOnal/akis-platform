/**
 * Integration test: Jobs user isolation (S0.5.3-AUTH-3)
 * Verifies that GET /api/agents/jobs, GET /api/agents/jobs/:id,
 * POST /api/agents/jobs/:id/cancel properly filter by authenticated user
 * and reject access to other users' jobs.
 */
import { test } from 'node:test';
import assert from 'node:assert';
import { buildApp } from '../../src/server.app.js';
import { db } from '../../src/db/client.js';
import { users, jobs } from '../../src/db/schema.js';
import { eq, or, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { hashPassword } from '../../src/services/auth/password.js';
import { sign } from '../../src/services/auth/jwt.js';
import { env as authEnv } from '../../src/lib/env.js';

const hasDatabase = !!process.env.DATABASE_URL;

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

test('Jobs user isolation', { skip: !hasDatabase }, async (t) => {
  if (!hasDatabase) {
    console.log('Skipping: DATABASE_URL not set');
    return;
  }

  let schemaReady = true;
  try {
    const hasCrewRunColumn = await hasColumn('jobs', 'crew_run_id');
    const hasRequiresApprovalColumn = await hasColumn('jobs', 'requires_approval');
    schemaReady = hasCrewRunColumn && hasRequiresApprovalColumn;
  } catch {
    schemaReady = false;
  }
  if (!schemaReady) {
    t.skip('Jobs isolation test skipped because jobs table schema is behind current Drizzle model');
    return;
  }

  const app = await buildApp();
  const userAId = randomUUID();
  const userBId = randomUUID();
  const userAEmail = `jobs-isolation-a-${Date.now()}@test.local`;
  const userBEmail = `jobs-isolation-b-${Date.now()}@test.local`;
  const password = 'test-password-123';
  let orphanJobId: string | null = null;

  const cleanup = async () => {
    try {
      await db.delete(jobs).where(
        or(
          sql`(${jobs.payload}->>'userId')::text = ${userAId}`,
          sql`(${jobs.payload}->>'userId')::text = ${userBId}`
        )
      );
      if (orphanJobId) {
        await db.delete(jobs).where(eq(jobs.id, orphanJobId));
      }
      await db.delete(users).where(eq(users.id, userAId));
      await db.delete(users).where(eq(users.id, userBId));
    } catch (err) {
      console.error('Cleanup error:', err);
    }
  };

  await t.test('Setup: Create users A and B', async () => {
    const hash = await hashPassword(password);
    await db.insert(users).values([
      { id: userAId, name: 'User A', email: userAEmail, passwordHash: hash, emailVerified: true, status: 'active' },
      { id: userBId, name: 'User B', email: userBEmail, passwordHash: hash, emailVerified: true, status: 'active' },
    ]);
  });

  await t.test('T1: GET /api/agents/jobs returns 401 without auth', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/agents/jobs',
    });
    assert.strictEqual(response.statusCode, 401);
    const body = JSON.parse(response.body);
    assert.strictEqual(body.error?.code, 'UNAUTHORIZED');
  });

  await t.test('T2: GET /api/agents/jobs returns only authenticated user jobs', async () => {
    const jwtA = await sign({ sub: userAId, email: userAEmail, name: 'User A' });
    const cookieA = `${authEnv.AUTH_COOKIE_NAME}=${(jwtA as unknown as string)}`;

    await db.insert(jobs).values([
      { id: randomUUID(), type: 'trace', state: 'completed', payload: { userId: userAId, spec: 'User A job' } },
      { id: randomUUID(), type: 'trace', state: 'completed', payload: { userId: userBId, spec: 'User B job' } },
    ]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/agents/jobs',
      headers: { cookie: cookieA },
    });
    assert.strictEqual(response.statusCode, 200);
    const body = JSON.parse(response.body);
    assert.ok(Array.isArray(body.items));
    for (const job of body.items) {
      const [row] = await db.select({ payload: jobs.payload }).from(jobs).where(eq(jobs.id, job.id)).limit(1);
      const jobUserId = (row?.payload as Record<string, unknown>)?.userId;
      assert.strictEqual(jobUserId, userAId, `Job ${job.id} should belong to user A, got ${jobUserId}`);
    }
    const userBJobs = [];
    for (const j of body.items) {
      const [r] = await db.select({ payload: jobs.payload }).from(jobs).where(eq(jobs.id, j.id)).limit(1);
      if ((r?.payload as Record<string, unknown>)?.userId === userBId) userBJobs.push(j);
    }
    assert.strictEqual(userBJobs.length, 0, 'User A should not see user B jobs');
  });

  await t.test('T3: GET /api/agents/jobs/:id returns 404 for another user job', async () => {
    const jobBList = await db
      .select({ id: jobs.id })
      .from(jobs)
      .where(sql`(${jobs.payload}->>'userId')::text = ${userBId}`)
      .limit(1);
    const jobBObj = jobBList[0];
    if (!jobBObj) {
      assert.fail('No job for user B found');
    }

    const jwtA = await sign({ sub: userAId, email: userAEmail, name: 'User A' });
    const cookieA = `${authEnv.AUTH_COOKIE_NAME}=${(jwtA as unknown as string)}`;

    const response = await app.inject({
      method: 'GET',
      url: `/api/agents/jobs/${jobBObj.id}`,
      headers: { cookie: cookieA },
    });
    assert.strictEqual(response.statusCode, 404);
    const body = JSON.parse(response.body);
    assert.strictEqual(body.error?.code, 'NOT_FOUND');
  });

  await t.test('T4: POST /api/agents/jobs/:id/cancel returns 404 for another user job', async () => {
    const jobBList = await db
      .select({ id: jobs.id })
      .from(jobs)
      .where(sql`(${jobs.payload}->>'userId')::text = ${userBId}`)
      .limit(1);
    const jobBObj = jobBList[0];
    if (!jobBObj) {
      assert.fail('No job for user B found');
    }

    await db
      .update(jobs)
      .set({ state: 'pending', updatedAt: new Date() })
      .where(eq(jobs.id, jobBObj.id));

    const jwtA = await sign({ sub: userAId, email: userAEmail, name: 'User A' });
    const cookieA = `${authEnv.AUTH_COOKIE_NAME}=${(jwtA as unknown as string)}`;

    const response = await app.inject({
      method: 'POST',
      url: `/api/agents/jobs/${jobBObj.id}/cancel`,
      headers: { cookie: cookieA },
    });
    assert.strictEqual(response.statusCode, 404);
    const body = JSON.parse(response.body);
    assert.strictEqual(body.error?.code, 'NOT_FOUND');

    const [after] = await db.select({ state: jobs.state }).from(jobs).where(eq(jobs.id, jobBObj.id)).limit(1);
    assert.strictEqual(after?.state, 'pending', 'Job should still be pending (cancel rejected)');
  });

  await t.test('T5: GET /api/agents/jobs/:id returns 404 when payload.userId is missing', async () => {
    orphanJobId = randomUUID();
    await db.insert(jobs).values({
      id: orphanJobId,
      type: 'trace',
      state: 'completed',
      payload: { spec: 'orphan-no-owner' },
    });

    const jwtA = await sign({ sub: userAId, email: userAEmail, name: 'User A' });
    const cookieA = `${authEnv.AUTH_COOKIE_NAME}=${(jwtA as unknown as string)}`;

    const response = await app.inject({
      method: 'GET',
      url: `/api/agents/jobs/${orphanJobId}`,
      headers: { cookie: cookieA },
    });

    assert.strictEqual(response.statusCode, 404);
    const body = JSON.parse(response.body);
    assert.strictEqual(body.error?.code, 'NOT_FOUND');
  });

  await t.test('T6: GET /api/agents/jobs/:id/comments returns 401 without auth', async () => {
    const jobAList = await db
      .select({ id: jobs.id })
      .from(jobs)
      .where(sql`(${jobs.payload}->>'userId')::text = ${userAId}`)
      .limit(1);
    const jobAObj = jobAList[0];
    if (!jobAObj) {
      assert.fail('No job for user A found');
    }

    const response = await app.inject({
      method: 'GET',
      url: `/api/agents/jobs/${jobAObj.id}/comments`,
    });
    assert.strictEqual(response.statusCode, 401);
    const body = JSON.parse(response.body);
    assert.strictEqual(body.error?.code, 'UNAUTHORIZED');
  });

  await t.test('T7: GET /api/agents/jobs/:id/comments returns 404 for another user job', async () => {
    const jobBList = await db
      .select({ id: jobs.id })
      .from(jobs)
      .where(sql`(${jobs.payload}->>'userId')::text = ${userBId}`)
      .limit(1);
    const jobBObj = jobBList[0];
    if (!jobBObj) {
      assert.fail('No job for user B found');
    }

    const jwtA = await sign({ sub: userAId, email: userAEmail, name: 'User A' });
    const cookieA = `${authEnv.AUTH_COOKIE_NAME}=${(jwtA as unknown as string)}`;

    const response = await app.inject({
      method: 'GET',
      url: `/api/agents/jobs/${jobBObj.id}/comments`,
      headers: { cookie: cookieA },
    });
    assert.strictEqual(response.statusCode, 404);
    const body = JSON.parse(response.body);
    assert.strictEqual(body.error?.code, 'NOT_FOUND');
  });

  await t.test('T8: GET /api/agents/jobs/:id/revisions returns 401 without auth', async () => {
    const jobAList = await db
      .select({ id: jobs.id })
      .from(jobs)
      .where(sql`(${jobs.payload}->>'userId')::text = ${userAId}`)
      .limit(1);
    const jobAObj = jobAList[0];
    if (!jobAObj) {
      assert.fail('No job for user A found');
    }

    const response = await app.inject({
      method: 'GET',
      url: `/api/agents/jobs/${jobAObj.id}/revisions`,
    });
    assert.strictEqual(response.statusCode, 401);
    const body = JSON.parse(response.body);
    assert.strictEqual(body.error?.code, 'UNAUTHORIZED');
  });

  await t.test('T9: POST /api/agents/jobs/:id/approve returns 404 for another user job', async () => {
    const jobBList = await db
      .select({ id: jobs.id })
      .from(jobs)
      .where(sql`(${jobs.payload}->>'userId')::text = ${userBId}`)
      .limit(1);
    const jobBObj = jobBList[0];
    if (!jobBObj) {
      assert.fail('No job for user B found');
    }

    await db
      .update(jobs)
      .set({ state: 'awaiting_approval', requiresApproval: true, updatedAt: new Date() })
      .where(eq(jobs.id, jobBObj.id));

    const jwtA = await sign({ sub: userAId, email: userAEmail, name: 'User A' });
    const cookieA = `${authEnv.AUTH_COOKIE_NAME}=${(jwtA as unknown as string)}`;

    const response = await app.inject({
      method: 'POST',
      url: `/api/agents/jobs/${jobBObj.id}/approve`,
      headers: { cookie: cookieA },
      payload: { comment: 'approve test' },
    });
    assert.strictEqual(response.statusCode, 404);
    const body = JSON.parse(response.body);
    assert.strictEqual(body.error?.code, 'NOT_FOUND');
  });

  await cleanup();
  await app.close();
});
