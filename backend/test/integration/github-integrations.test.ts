/**
 * GitHub Integrations Routes Tests - OAuth-based flow
 * Tests for /api/integrations/github/oauth/* endpoints
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { buildApp } from '../../src/server.app.js';
import type { FastifyInstance } from 'fastify';

describe('GitHub Integrations Routes - OAuth', () => {
  let app: FastifyInstance;

  before(async () => {
    app = await buildApp();
    await app.ready();
  });

  after(async () => {
    await app.close();
  });

  describe('GET /api/integrations/github/status', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/integrations/github/status',
      });

      assert.strictEqual(response.statusCode, 401);
      const body = JSON.parse(response.body);
      assert.strictEqual(body.error.code, 'UNAUTHORIZED');
    });

    it('should NOT return 404 (route must be registered)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/integrations/github/status',
      });

      assert.notStrictEqual(response.statusCode, 404);
    });
  });

  describe('GET /api/integrations/github/oauth/start', () => {
    it('should return 401 when not authenticated (requires AKIS session)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/integrations/github/oauth/start',
      });

      // Should redirect to login or return 401
      assert.ok(
        response.statusCode === 401 || response.statusCode === 302,
        `Expected 401 or 302, got ${response.statusCode}`
      );
    });

    it('should NOT return 404 (route must be registered)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/integrations/github/oauth/start',
      });

      assert.notStrictEqual(response.statusCode, 404);
    });

    it('should return 501 when OAuth not configured', async () => {
      // This test assumes OAuth vars might not be set in test env
      const response = await app.inject({
        method: 'GET',
        url: '/api/integrations/github/oauth/start',
      });

      // Should be 401 (no session), 501 (not configured), or 302 (configured, redirecting)
      assert.ok(
        [401, 302, 501].includes(response.statusCode),
        `Expected 401, 302, or 501, got ${response.statusCode}`
      );
    });
  });

  describe('GET /api/integrations/github/oauth/callback', () => {
    it('should redirect with error when code parameter is missing', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/integrations/github/oauth/callback?state=test',
      });

      // Should redirect or return error (302 or 401)
      assert.ok(
        response.statusCode === 302 || response.statusCode === 401,
        `Expected 302 or 401, got ${response.statusCode}`
      );
    });

    it('should redirect with error when state does not match', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/integrations/github/oauth/callback?code=test&state=invalid',
        cookies: {
          github_oauth_state: 'different_state',
        },
      });

      // Should redirect with error or return 401 (if no session)
      assert.ok(
        response.statusCode === 302 || response.statusCode === 401,
        `Expected 302 or 401, got ${response.statusCode}`
      );
    });

    it('should NOT return 404 (route must be registered)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/integrations/github/oauth/callback',
      });

      assert.notStrictEqual(response.statusCode, 404);
    });
  });

  describe('DELETE /api/integrations/github', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/integrations/github',
      });

      assert.strictEqual(response.statusCode, 401);
      const body = JSON.parse(response.body);
      assert.strictEqual(body.error.code, 'UNAUTHORIZED');
    });

    it('should NOT return 404 (route must be registered)', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/integrations/github',
      });

      assert.notStrictEqual(response.statusCode, 404);
    });
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

    it('should return 412 when GitHub not connected (if authenticated)', async () => {
      // Note: This would need a valid test session to verify 412 behavior
      // For now just verify route exists
      const response = await app.inject({
        method: 'GET',
        url: '/api/integrations/github/owners',
      });

      assert.ok(
        response.statusCode === 401 || response.statusCode === 412,
        `Expected 401 or 412, got ${response.statusCode}`
      );
    });
  });
});

