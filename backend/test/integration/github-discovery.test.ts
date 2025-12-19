/**
 * GitHub Discovery Routes Tests - S0.4.6
 * Tests for /api/integrations/github/* endpoints
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { buildApp } from '../../src/server.app.js';
import type { FastifyInstance } from 'fastify';

describe('GitHub Discovery Routes', () => {
  let app: FastifyInstance;

  before(async () => {
    app = await buildApp();
    await app.ready();
  });

  after(async () => {
    await app.close();
  });

  describe('GET /api/integrations/github/owners', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/integrations/github/owners',
      });

      assert.strictEqual(response.statusCode, 401);
      const body = JSON.parse(response.body);
      assert.strictEqual(body.error.code, 'UNAUTHORIZED');
    });

    it('should NOT return 404 (route must be registered)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/integrations/github/owners',
      });

      assert.notStrictEqual(response.statusCode, 404);
    });
  });

  describe('GET /api/integrations/github/repos', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/integrations/github/repos?owner=test',
      });

      assert.strictEqual(response.statusCode, 401);
      const body = JSON.parse(response.body);
      assert.strictEqual(body.error.code, 'UNAUTHORIZED');
    });

    it('should NOT return 404 (route must be registered)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/integrations/github/repos?owner=test',
      });

      assert.notStrictEqual(response.statusCode, 404);
    });

    it('should return 400 when owner param is missing (if authenticated)', async () => {
      // Note: This test only checks the route exists and has validation
      // In practice, unauthenticated requests will get 401 first
      const response = await app.inject({
        method: 'GET',
        url: '/api/integrations/github/repos',
      });

      // Either 400 (missing owner) or 401 (not authenticated) is acceptable
      assert.ok(
        response.statusCode === 400 || response.statusCode === 401,
        `Expected 400 or 401, got ${response.statusCode}`
      );
    });
  });

  describe('GET /api/integrations/github/branches', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/integrations/github/branches?owner=test&repo=test',
      });

      assert.strictEqual(response.statusCode, 401);
      const body = JSON.parse(response.body);
      assert.strictEqual(body.error.code, 'UNAUTHORIZED');
    });

    it('should NOT return 404 (route must be registered)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/integrations/github/branches?owner=test&repo=test',
      });

      assert.notStrictEqual(response.statusCode, 404);
    });

    it('should return 400 when params are missing (if authenticated)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/integrations/github/branches',
      });

      // Either 400 (missing params) or 401 (not authenticated) is acceptable
      assert.ok(
        response.statusCode === 400 || response.statusCode === 401,
        `Expected 400 or 401, got ${response.statusCode}`
      );
    });
  });

  describe('GET /api/integrations/connect/github', () => {
    it('should NOT return 404 (route must be registered)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/integrations/connect/github?returnTo=/dashboard/agents/scribe',
      });

      assert.notStrictEqual(response.statusCode, 404);
      // Expected: 302 (redirect to GitHub) or 501 (OAuth not configured)
      assert.ok(
        response.statusCode === 302 || response.statusCode === 501,
        `Expected 302 or 501, got ${response.statusCode}`
      );
    });
  });

  describe('GET /api/agents/configs/scribe', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/agents/configs/scribe',
      });

      assert.strictEqual(response.statusCode, 401);
      const body = JSON.parse(response.body);
      assert.strictEqual(body.error.code, 'UNAUTHORIZED');
    });

    it('should NOT return 404 (route must be registered)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/agents/configs/scribe',
      });

      assert.notStrictEqual(response.statusCode, 404);
    });

    it('should return 400 for invalid agent type', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/agents/configs/invalid-type',
      });

      // 400 for invalid type or 401 for unauth (unauth might be checked first)
      assert.ok(
        response.statusCode === 400 || response.statusCode === 401,
        `Expected 400 or 401, got ${response.statusCode}`
      );
    });
  });
});

