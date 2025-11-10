import { test } from 'node:test';
import assert from 'node:assert';
import { buildApp } from '../src/server.app.js';

// Check if DATABASE_URL is set (required for DB-dependent tests)
const hasDatabase = !!process.env.DATABASE_URL;

test('smoke tests for agent job flow', { skip: !hasDatabase }, async (t) => {
  if (!hasDatabase) {
    console.log('Skipping DB-dependent tests: DATABASE_URL not set');
    return;
  }

  const app = await buildApp();

  // Test 1: GET /health → 200 {status:"ok"}
  await t.test('GET /health returns ok', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    assert.strictEqual(response.statusCode, 200);
    const body = JSON.parse(response.body);
    assert.deepStrictEqual(body, { status: 'ok' });
  });

  // Test 2: GET / → 200 { name:"AKIS Backend", status:"ok" }
  await t.test('GET / returns app info', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/',
    });

    assert.strictEqual(response.statusCode, 200);
    const body = JSON.parse(response.body);
    assert.strictEqual(body.name, 'AKIS Backend');
    assert.strictEqual(body.status, 'ok');
  });

  // Test 3: POST /api/agents/jobs (scribe) → 200 with {jobId, state}
  await t.test('POST /api/agents/jobs creates and starts scribe job', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/agents/jobs',
      payload: {
        type: 'scribe',
        payload: { doc: 'hello' },
      },
    });

    if (response.statusCode !== 200) {
      console.error('Response body:', response.body);
      console.error('Response status:', response.statusCode);
    }
    assert.strictEqual(response.statusCode, 200, `Expected 200, got ${response.statusCode}: ${response.body}`);
    const body = JSON.parse(response.body);
    assert.ok(body.jobId, 'jobId should be present');
    assert.ok(typeof body.jobId === 'string', 'jobId should be a string');
    assert.ok(['pending', 'running', 'completed', 'failed'].includes(body.state), `state should be valid: ${body.state}`);
  });

  // Test 4: GET /api/agents/jobs/:id → 200 with persisted job
  await t.test('GET /api/agents/jobs/:id returns job details', async () => {
    // First create a job
    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/agents/jobs',
      payload: {
        type: 'trace',
        payload: { spec: 'Test spec: user logs in -> sees dashboard' },
      },
    });

    assert.strictEqual(createResponse.statusCode, 200);
    const createBody = JSON.parse(createResponse.body);
    const jobId = createBody.jobId;

    // Wait a bit for async execution to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Then fetch it
    const getResponse = await app.inject({
      method: 'GET',
      url: `/api/agents/jobs/${jobId}`,
    });

    assert.strictEqual(getResponse.statusCode, 200);
    const getBody = JSON.parse(getResponse.body);
    assert.strictEqual(getBody.id, jobId);
    assert.strictEqual(getBody.type, 'trace');
    assert.ok(['pending', 'running', 'completed', 'failed'].includes(getBody.state), `state should be valid: ${getBody.state}`);
    assert.ok(getBody.createdAt, 'createdAt should be present');
    assert.ok(getBody.updatedAt, 'updatedAt should be present');
  });

  // Cleanup: close app
  await app.close();
});

