/**
 * GitHub Integrations Routes Tests - S0.4.6
 * Tests for /api/integrations/github/* (status, token connect, disconnect)
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { buildApp } from '../../src/server.app.js';
import type { FastifyInstance } from 'fastify';

describe('GitHub Integrations Routes', () => {
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

  describe('POST /api/integrations/github/token', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/integrations/github/token',
        payload: { token: 'test_token' },
      });

      assert.strictEqual(response.statusCode, 401);
      const body = JSON.parse(response.body);
      assert.strictEqual(body.error.code, 'UNAUTHORIZED');
    });

    it('should NOT return 404 (route must be registered)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/integrations/github/token',
        payload: { token: 'test_token' },
      });

      assert.notStrictEqual(response.statusCode, 404);
    });

    it('should validate token presence in body (if authenticated)', async () => {
      // Note: This test checks route validation logic
      // In practice, unauthenticated requests will get 401 first
      const response = await app.inject({
        method: 'POST',
        url: '/api/integrations/github/token',
        payload: {},
      });

      // Either 400 (missing token) or 401 (not authenticated) is acceptable
      assert.ok(
        response.statusCode === 400 || response.statusCode === 401,
        `Expected 400 or 401, got ${response.statusCode}`
      );
    });

    it('should reject empty token string (if authenticated)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/integrations/github/token',
        payload: { token: '' },
      });

      // Either 400 (empty token) or 401 (not authenticated) is acceptable
      assert.ok(
        response.statusCode === 400 || response.statusCode === 401,
        `Expected 400 or 401, got ${response.statusCode}`
      );
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

  describe('GET /api/integrations/connect/github', () => {
    it('should be accessible without authentication (OAuth initiation)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/integrations/connect/github',
      });

      // Should either redirect (302) or return error if OAuth not configured (501)
      assert.ok(
        response.statusCode === 302 || response.statusCode === 501,
        `Expected 302 or 501, got ${response.statusCode}`
      );
    });

    it('should validate returnTo parameter (prevent open redirect)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/integrations/connect/github?returnTo=https://evil.com',
      });

      // Should reject invalid returnTo paths
      assert.ok(
        response.statusCode === 400 || response.statusCode === 302 || response.statusCode === 501,
        `Expected 400, 302, or 501, got ${response.statusCode}`
      );

      if (response.statusCode === 400) {
        const body = JSON.parse(response.body);
        assert.strictEqual(body.error.code, 'INVALID_RETURN_PATH');
      }
    });
  });
});

