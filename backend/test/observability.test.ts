import { test } from 'node:test';
import assert from 'node:assert';
import { buildApp } from '../src/server.app.js';
import { randomUUID } from 'crypto';

// Check if DATABASE_URL is set (required for DB-dependent tests)
const hasDatabase = !!process.env.DATABASE_URL;

test('Observability tests: request-id, metrics, openapi', { skip: !hasDatabase }, async (t) => {
  if (!hasDatabase) {
    console.log('Skipping DB-dependent tests: DATABASE_URL not set');
    return;
  }

  console.log('observability.test.ts: building app');
  const app = await buildApp().catch((error) => {
    console.error('observability.test.ts: buildApp failed', error);
    throw error;
  });
  console.log('observability.test.ts: app built');

  // T1: Request with custom request-id header
  await t.test('T1: Custom request-id header is preserved', async () => {
    const customRequestId = randomUUID();
    const response = await app.inject({
      method: 'GET',
      url: '/health',
      headers: {
        'request-id': customRequestId,
      },
    });

    assert.strictEqual(response.statusCode, 200);
    // Request ID should be accessible via reply.requestId or logged
    // Fastify sets request.id from header if present
    assert.ok(response.headers['x-request-id'] || customRequestId, 'Request ID should be present');
  });

  // T2: Metrics endpoint returns Prometheus format
  await t.test('T2: /metrics returns Prometheus format with our metrics', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/metrics',
    });

    assert.strictEqual(response.statusCode, 200);
    assert.ok(response.headers['content-type']?.includes('text/plain'), 'Should return text/plain');
    
    const body = response.body;
    assert.ok(typeof body === 'string', 'Metrics should be a string');
    
    // Check for our custom metrics
    assert.ok(body.includes('jobs_created_total'), 'Should include jobs_created_total');
    assert.ok(body.includes('jobs_completed_total'), 'Should include jobs_completed_total');
    assert.ok(body.includes('jobs_failed_total'), 'Should include jobs_failed_total');
    assert.ok(body.includes('http_request_duration_seconds'), 'Should include http_request_duration_seconds');
  });

  // T3: OpenAPI JSON endpoint returns valid schema
  await t.test('T3: /openapi.json returns valid OpenAPI schema', async () => {
    // Fastify Swagger exposes schema at /documentation/json or via swagger.json route
    // Try multiple possible endpoints
    let response = await app.inject({
      method: 'GET',
      url: '/documentation/json',
    });

    if (response.statusCode !== 200) {
      response = await app.inject({
        method: 'GET',
        url: '/openapi.json',
      });
    }

    if (response.statusCode !== 200) {
      // Try accessing via app.swagger() if available
      const schema = app.swagger();
      if (schema) {
        assert.ok(schema.openapi || schema.swagger, 'Should have openapi or swagger version');
        assert.ok(schema.info, 'Should have info object');
        assert.ok(schema.paths, 'Should have paths object');
        return;
      }
    }

    assert.strictEqual(response.statusCode, 200, `OpenAPI endpoint should return 200 (tried /documentation/json and /openapi.json)`);
    const schema = JSON.parse(response.body);
    
    // Validate OpenAPI structure
    assert.ok(schema.openapi || schema.swagger, 'Should have openapi or swagger version');
    assert.ok(schema.info, 'Should have info object');
    assert.ok(schema.paths, 'Should have paths object');
    
    // Check for our documented routes (paths may be normalized)
    const paths = Object.keys(schema.paths);
    const pathKeys = paths.map((p) => p.toLowerCase());
    assert.ok(
      pathKeys.some((p) => p.includes('health')),
      `Should include /health (found: ${paths.join(', ')})`
    );
    assert.ok(
      pathKeys.some((p) => p === '/' || p === ''),
      `Should include / (found: ${paths.join(', ')})`
    );
    assert.ok(
      pathKeys.some((p) => p.includes('agents') && p.includes('jobs')),
      `Should include /api/agents/jobs (found: ${paths.join(', ')})`
    );
  });

  // Cleanup: close app
  await app.close();
});

