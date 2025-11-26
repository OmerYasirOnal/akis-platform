/**
 * Health Endpoints Integration Tests
 * Tests /health, /ready, /version endpoints using Fastify inject
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { buildApp } from '../../src/server.app.js';

// Note: DATABASE_URL check removed - tests handle both connected and disconnected states

describe('Health Endpoints', async () => {
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
      assert.deepStrictEqual(body, { status: 'ok' });
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

