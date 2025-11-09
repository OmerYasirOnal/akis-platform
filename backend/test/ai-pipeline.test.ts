import { test } from 'node:test';
import assert from 'node:assert';
import { buildApp } from '../src/server.app.js';
import { db } from '../src/db/client.js';
import { jobs, jobPlans, jobAudits } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';

// Check if DATABASE_URL is set (required for DB-dependent tests)
const hasDatabase = !!process.env.DATABASE_URL;

test('AI pipeline tests: Planner → Reflector → Execute', { skip: !hasDatabase }, async (t) => {
  if (!hasDatabase) {
    console.log('Skipping DB-dependent tests: DATABASE_URL not set');
    return;
  }

  console.log('ai-pipeline.test.ts: building app');
  const app = await buildApp().catch((error) => {
    console.error('ai-pipeline.test.ts: buildApp failed', error);
    throw error;
  });
  console.log('ai-pipeline.test.ts: app built');

  // T1: Creating a proto job triggers planning and yields a stored plan row
  await t.test('T1: proto job triggers planning and stores plan', async () => {
    console.log('ai-pipeline.test.ts: submitting proto job for plan');
    const response = await app.inject({
      method: 'POST',
      url: '/api/agents/jobs',
      payload: {
        type: 'proto',
        payload: { goal: 'scaffold a demo plan' },
      },
    });

    assert.strictEqual(response.statusCode, 200, `Expected 200, got ${response.statusCode}: ${response.body}`);
    const body = JSON.parse(response.body);
    const jobId = body.jobId;
    assert.ok(jobId, 'jobId should be present');

    // Wait for async execution to complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Verify plan was stored in DB
    const planRows = await db.select().from(jobPlans).where(eq(jobPlans.jobId, jobId));
    assert.ok(planRows.length > 0, 'Plan should be stored in job_plans table');
    assert.ok(planRows[0].steps, 'Plan should have steps');
    assert.ok(planRows[0].rationale !== null, 'Plan should have rationale');
    assert.ok(Array.isArray(planRows[0].steps), 'Plan steps should be an array');
  });

  // T2: Job completes with deterministic result and audit entry for reflect
  await t.test('T2: job completes with result and reflect audit', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/agents/jobs',
      payload: {
        type: 'proto',
        payload: { goal: 'test deterministic execution' },
      },
    });

    assert.strictEqual(response.statusCode, 200);
    const body = JSON.parse(response.body);
    const jobId = body.jobId;

    // Wait for async execution to complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Verify job completed
    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    assert.ok(job, 'Job should exist');
    assert.strictEqual(job.state, 'completed', 'Job should be completed');
    assert.ok(job.result, 'Job should have result');

    // Verify result structure (deterministic mock output)
    const result = job.result as Record<string, unknown>;
    assert.strictEqual(result.ok, true, 'Result should have ok: true');
    assert.strictEqual(result.agent, 'proto', 'Result should have agent: proto');
    assert.ok(result.result, 'Result should have nested result object');

    // Verify reflect audit entry exists
    const reflectAudits = await db
      .select()
      .from(jobAudits)
      .where(eq(jobAudits.jobId, jobId))
      .where(eq(jobAudits.phase, 'reflect'));
    assert.ok(reflectAudits.length > 0, 'Should have at least one reflect audit entry');
    assert.ok(reflectAudits[0].payload, 'Reflect audit should have payload');
  });

  // T3: GET /api/agents/jobs/:id?include=plan,audit returns plan & ≥1 audit items
  await t.test('T3: GET with include=plan,audit returns plan and audits', async () => {
    // First create a proto job
    console.log('ai-pipeline.test.ts: submitting proto job for include=plan,audit');
    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/agents/jobs',
      payload: {
        type: 'proto',
        payload: { goal: 'test include query' },
      },
    });

    assert.strictEqual(createResponse.statusCode, 200);
    const createBody = JSON.parse(createResponse.body);
    const jobId = createBody.jobId;

    // Wait for async execution to complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Then fetch with include=plan,audit
    const getResponse = await app.inject({
      method: 'GET',
      url: `/api/agents/jobs/${jobId}?include=plan,audit`,
    });

    assert.strictEqual(getResponse.statusCode, 200);
    const getBody = JSON.parse(getResponse.body) as Record<string, unknown>;

    // Verify plan is included
    assert.ok(getBody.plan, 'Response should include plan');
    const plan = getBody.plan as Record<string, unknown>;
    assert.ok(plan.steps, 'Plan should have steps');
    assert.ok(Array.isArray(plan.steps), 'Plan steps should be an array');
    assert.ok(plan.steps.length > 0, 'Plan should have at least one step');

    // Verify audit is included
    assert.ok(getBody.audit, 'Response should include audit');
    const audits = getBody.audit as Array<Record<string, unknown>>;
    assert.ok(Array.isArray(audits), 'Audit should be an array');
    assert.ok(audits.length >= 1, 'Should have at least 1 audit item');

    // Verify audit structure
    const audit = audits[0];
    assert.ok(audit.phase, 'Audit should have phase');
    assert.ok(['plan', 'execute', 'reflect'].includes(audit.phase as string), 'Audit phase should be valid');
    assert.ok(audit.payload, 'Audit should have payload');
    assert.ok(audit.createdAt, 'Audit should have createdAt');
  });

  // Cleanup: close app
  await app.close();
});

