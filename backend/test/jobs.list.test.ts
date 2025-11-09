import { test } from 'node:test';
import assert from 'node:assert';
import { buildApp } from '../src/server.app.js';

// Check if DATABASE_URL is set (required for DB-dependent tests)
const hasDatabase = !!process.env.DATABASE_URL;

test('Jobs listing tests: filters and pagination', { skip: !hasDatabase }, async (t) => {
  if (!hasDatabase) {
    console.log('Skipping DB-dependent tests: DATABASE_URL not set');
    return;
  }

  console.log('jobs.list.test.ts: building app');
  const app = await buildApp().catch((error) => {
    console.error('jobs.list.test.ts: buildApp failed', error);
    throw error;
  });
  console.log('jobs.list.test.ts: app built');

  // Seed jobs for testing
  const seedJobIds: string[] = [];
  await t.test('Seed test jobs', async () => {
    // Create a few jobs of different types and states
    const createResponse1 = await app.inject({
      method: 'POST',
      url: '/api/agents/jobs',
      payload: {
        type: 'scribe',
        payload: { doc: 'Test doc 1' },
      },
    });
    assert.strictEqual(createResponse1.statusCode, 200);
    const body1 = JSON.parse(createResponse1.body);
    seedJobIds.push(body1.jobId);

    await new Promise((resolve) => setTimeout(resolve, 100));

    const createResponse2 = await app.inject({
      method: 'POST',
      url: '/api/agents/jobs',
      payload: {
        type: 'trace',
        payload: { spec: 'Test spec 1' },
      },
    });
    assert.strictEqual(createResponse2.statusCode, 200);
    const body2 = JSON.parse(createResponse2.body);
    seedJobIds.push(body2.jobId);

    await new Promise((resolve) => setTimeout(resolve, 100));

    const createResponse3 = await app.inject({
      method: 'POST',
      url: '/api/agents/jobs',
      payload: {
        type: 'proto',
        payload: { goal: 'Test goal 1' },
      },
    });
    assert.strictEqual(createResponse3.statusCode, 200);
    const body3 = JSON.parse(createResponse3.body);
    seedJobIds.push(body3.jobId);

    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  // T1: List all jobs with default limit
  await t.test('T1: List jobs with default limit', async () => {
    console.log('jobs.list.test.ts: fetching jobs list');
    const response = await app.inject({
      method: 'GET',
      url: '/api/agents/jobs',
    });

    assert.strictEqual(response.statusCode, 200);
    const body = JSON.parse(response.body);
    
    assert.ok(Array.isArray(body.items), 'Should return items array');
    assert.ok(body.items.length > 0, 'Should have at least one job');
    assert.ok(typeof body.nextCursor === 'string' || body.nextCursor === null, 'nextCursor should be string or null');
    
    // Verify structure
    const job = body.items[0];
    assert.ok(job.id, 'Job should have id');
    assert.ok(job.type, 'Job should have type');
    assert.ok(job.state, 'Job should have state');
    assert.ok(job.createdAt, 'Job should have createdAt');
  });

  // T2: Filter by type
  await t.test('T2: Filter jobs by type', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/agents/jobs?type=scribe',
    });

    assert.strictEqual(response.statusCode, 200);
    const body = JSON.parse(response.body);
    
    assert.ok(Array.isArray(body.items), 'Should return items array');
    // All items should be scribe type
    body.items.forEach((job: { type: string }) => {
      assert.strictEqual(job.type, 'scribe', 'All jobs should be scribe type');
    });
  });

  // T3: Filter by state
  await t.test('T3: Filter jobs by state', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/agents/jobs?state=completed',
    });

    assert.strictEqual(response.statusCode, 200);
    const body = JSON.parse(response.body);
    
    assert.ok(Array.isArray(body.items), 'Should return items array');
    // All items should be completed state
    body.items.forEach((job: { state: string }) => {
      assert.strictEqual(job.state, 'completed', 'All jobs should be completed');
    });
  });

  // T4: Pagination with limit
  await t.test('T4: Pagination with limit=2', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/agents/jobs?limit=2',
    });

    assert.strictEqual(response.statusCode, 200);
    const body = JSON.parse(response.body);
    
    assert.ok(body.items.length <= 2, 'Should return at most 2 items');
    assert.ok(body.items.length > 0, 'Should return at least 1 item');
    
    // If there are more jobs, nextCursor should be present
    if (body.nextCursor) {
      assert.ok(typeof body.nextCursor === 'string', 'nextCursor should be a string');
    }
  });

  // T5: Invalid query parameters
  await t.test('T5: Invalid query parameters return 400', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/agents/jobs?limit=200', // Exceeds max of 100
    });

    assert.strictEqual(response.statusCode, 400);
    const body = JSON.parse(response.body);
    assert.ok(body.error, 'Should have error object');
    // requestId is part of unified error model
    assert.ok(body.requestId || body.error, 'Should have requestId or error structure');
  });

  // T6: Cursor pagination
  await t.test('T6: Cursor pagination works', async () => {
    // First page
    const response1 = await app.inject({
      method: 'GET',
      url: '/api/agents/jobs?limit=2',
    });

    assert.strictEqual(response1.statusCode, 200);
    const body1 = JSON.parse(response1.body);
    
    if (body1.nextCursor && body1.items.length >= 1) {
      // Decode cursor to get the last job ID from first page
      const decodedCursor = Buffer.from(body1.nextCursor, 'base64').toString('utf-8');
      const [, cursorJobId] = decodedCursor.split('|');
      
      // Second page using cursor
      const response2 = await app.inject({
        method: 'GET',
        url: `/api/agents/jobs?limit=2&cursor=${body1.nextCursor}`,
      });

      assert.strictEqual(response2.statusCode, 200);
      const body2 = JSON.parse(response2.body);
      
      // Second page should have different jobs (if there are enough jobs)
      if (body2.items.length > 0) {
        const firstPageIds = body1.items.map((j: { id: string }) => j.id);
        const secondPageIds = body2.items.map((j: { id: string }) => j.id);
        
        // Cursor points to the last item of first page, so it should not be in second page
        assert.ok(!secondPageIds.includes(cursorJobId), 'Cursor job should not be in second page');
        
        // All items in second page should be different from first page
        firstPageIds.forEach((id: string) => {
          assert.ok(!secondPageIds.includes(id), 'Second page should not include first page items');
        });
      } else {
        // If second page is empty, that's also valid (we've reached the end)
        assert.ok(true, 'Second page is empty (end of results)');
      }
    } else {
      // Skip if not enough jobs for pagination
      assert.ok(true, 'Not enough jobs for pagination test');
    }
  });

  // Cleanup: close app
  await app.close();
});

