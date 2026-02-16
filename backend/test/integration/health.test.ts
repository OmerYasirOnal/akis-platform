/**
 * Health Endpoints Integration Tests
 * Tests /health, /ready, /version endpoints using Fastify inject
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { buildApp } from '../../src/server.app.js';

// Note: DATABASE_URL check removed - tests handle both connected and disconnected states

describe('Health Endpoints', async () => {
  const EXPECTED_MCP_ENV_KEYS = ['GITHUB_MCP_BASE_URL', 'GITHUB_TOKEN'] as const;
  const app = await buildApp();

  // Cleanup after all tests
  test.after(async () => {
    await app.close();
  });

  describe('GET /health', () => {
    test('should return 200 with status ok', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      assert.strictEqual(response.statusCode, 200);
      const body = JSON.parse(response.body);
      assert.strictEqual(body.status, 'ok');
      assert.ok(body.timestamp, 'Should include timestamp');
      assert.ok(typeof body.timestamp === 'string', 'Timestamp should be a string');
    });

    test('should have correct content-type', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      assert.ok(response.headers['content-type']?.includes('application/json'));
    });
  });

  describe('GET /ready', () => {
    test('should return 200 or 503 depending on DB connection', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/ready',
      });

      // If DB is connected, should return 200
      // If DB is not connected, should return 503
      if (response.statusCode === 200) {
        const body = JSON.parse(response.body);
        assert.strictEqual(body.ready, true);
      } else {
        assert.strictEqual(response.statusCode, 503);
        const body = JSON.parse(response.body);
        assert.strictEqual(body.ready, false);
        // Error field exists but may be empty string
        assert.ok('error' in body, 'Should have error field');
      }
    });

    test('should always include mcp object with diagnostic fields', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/ready',
      });

      const body = JSON.parse(response.body);
      assert.ok(body.mcp, '/ready must always include mcp object');
      assert.strictEqual(typeof body.mcp.configured, 'boolean', 'mcp.configured must be boolean');
      assert.strictEqual(typeof body.mcp.gatewayReachable, 'boolean', 'mcp.gatewayReachable must be boolean');
      assert.ok(Array.isArray(body.mcp.missingEnv), 'mcp.missingEnv must be an array');
      assert.ok('baseUrl' in body.mcp, 'mcp.baseUrl must be present (string or null)');
      assert.ok('error' in body.mcp, 'mcp.error must be present (string or null)');
      assert.ok(
        body.mcp.baseUrl === null || typeof body.mcp.baseUrl === 'string',
        'mcp.baseUrl must be string or null'
      );
      assert.ok(
        body.mcp.error === null || typeof body.mcp.error === 'string',
        'mcp.error must be string or null'
      );

      const allKeysAreExpected = body.mcp.missingEnv.every((key: string) =>
        EXPECTED_MCP_ENV_KEYS.includes(key as (typeof EXPECTED_MCP_ENV_KEYS)[number])
      );
      assert.ok(allKeysAreExpected, 'mcp.missingEnv must only include expected env keys');

      if (body.mcp.configured) {
        assert.deepStrictEqual(
          body.mcp.missingEnv,
          [],
          'mcp.missingEnv must be empty when mcp.configured=true'
        );
      } else {
        assert.ok(
          body.mcp.missingEnv.length > 0,
          'mcp.missingEnv must contain at least one key when mcp.configured=false'
        );
      }
    });

    test('should include mcp diagnostics for both ready and degraded responses', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/ready',
      });

      assert.ok(
        response.statusCode === 200 || response.statusCode === 503,
        `Unexpected status from /ready: ${response.statusCode}`
      );
      const body = JSON.parse(response.body);

      assert.ok(body.mcp, 'response must include mcp object');
      assert.strictEqual(typeof body.mcp.configured, 'boolean', 'mcp.configured must be boolean');
      assert.strictEqual(typeof body.mcp.gatewayReachable, 'boolean', 'mcp.gatewayReachable must be boolean');
      assert.ok(Array.isArray(body.mcp.missingEnv), 'mcp.missingEnv must be an array');
      assert.ok(
        body.mcp.baseUrl === null || typeof body.mcp.baseUrl === 'string',
        'mcp.baseUrl must be string or null'
      );
      assert.ok(
        body.mcp.error === null || typeof body.mcp.error === 'string',
        'mcp.error must be string or null'
      );

      if (response.statusCode === 503) {
        assert.strictEqual(body.ready, false);
        assert.ok('error' in body, '503 body must include error field');
      } else {
        assert.strictEqual(body.ready, true);
      }
    });
  });

  describe('GET /version', () => {
    test('should return 200 with version string', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/version',
      });

      assert.strictEqual(response.statusCode, 200);
      const body = JSON.parse(response.body);
      assert.ok(body.version, 'Response should have version field');
      assert.strictEqual(typeof body.version, 'string');
    });

    test('should return semver-like version', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/version',
      });

      const body = JSON.parse(response.body);
      // Version should be semver-like (e.g., "0.1.0") or "unknown"/"error"
      const semverRegex = /^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/;
      const isValidVersion = semverRegex.test(body.version) || 
                             body.version === 'unknown' || 
                             body.version === 'error';
      assert.ok(isValidVersion, `Version "${body.version}" should be semver or known fallback`);
    });
  });

  describe('GET /', () => {
    test('should return 200 with app info', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/',
      });

      assert.strictEqual(response.statusCode, 200);
      const body = JSON.parse(response.body);
      assert.strictEqual(body.name, 'AKIS Backend');
      assert.strictEqual(body.status, 'ok');
    });
  });
});
