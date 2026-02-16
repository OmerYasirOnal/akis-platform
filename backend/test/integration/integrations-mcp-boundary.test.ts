import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { McpGateway, McpGatewayError } from '../../src/services/mcp/McpGateway.js';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('Integrations MCP boundary', () => {
  it('retries transient server errors and preserves correlation id header', async () => {
    let callCount = 0;
    const seenCorrelationIds: string[] = [];

    globalThis.fetch = (async (_url: string, init?: RequestInit) => {
      callCount += 1;
      const headers = init?.headers as Record<string, string> | undefined;
      if (headers?.['x-correlation-id']) {
        seenCorrelationIds.push(headers['x-correlation-id']);
      }

      if (callCount === 1) {
        return new Response(JSON.stringify({ message: 'temporary failure' }), {
          status: 500,
          headers: { 'content-type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ login: 'octocat' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as typeof fetch;

    const gateway = new McpGateway({ retryCount: 1, timeoutMs: 1000 });
    const result = await gateway.fetchGitHubJson<{ login: string }>(
      '/user',
      'gho_test_token',
      'corr-123'
    );

    assert.equal(result.login, 'octocat');
    assert.equal(callCount, 2);
    assert.deepEqual(seenCorrelationIds, ['corr-123', 'corr-123']);
  });

  it('normalizes vendor failures without leaking token in error payload', async () => {
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ message: 'Bad credentials' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      })) as typeof fetch;

    const gateway = new McpGateway({ retryCount: 0, timeoutMs: 1000 });

    await assert.rejects(
      gateway.fetchGitHubJson('/user', 'gho_super_secret_token', 'corr-401'),
      (error: unknown) => {
        assert.ok(error instanceof McpGatewayError);
        assert.equal(error.code, 'VENDOR_REQUEST_FAILED');
        assert.equal(error.status, 401);
        assert.equal(error.correlationId, 'corr-401');
        assert.match(error.message, /Bad credentials/i);
        assert.ok(!error.message.includes('gho_super_secret_token'));
        return true;
      }
    );
  });

  it('maps Atlassian auth failures to actionable message', async () => {
    globalThis.fetch = (async () =>
      new Response('Unauthorized', {
        status: 401,
        headers: { 'content-type': 'text/plain' },
      })) as typeof fetch;

    const gateway = new McpGateway({ retryCount: 0, timeoutMs: 1000 });
    const result = await gateway.testAtlassianConnection(
      'https://example.atlassian.net',
      'user@example.com',
      'token',
      'jira',
      'corr-atl-1'
    );

    assert.equal(result.success, false);
    assert.match(result.error || '', /Invalid credentials/i);
  });
});

