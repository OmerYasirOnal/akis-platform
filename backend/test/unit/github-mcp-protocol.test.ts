/**
 * GitHub MCP Protocol Tests
 * Ensures we use MCP-standard JSON-RPC methods (initialize/tools/list/tools/call)
 * and never regress back to legacy method names like `github/getFile`.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  GitHubMCPService,
  McpError,
  McpConnectionError,
  McpErrorCode,
} from '../../src/services/mcp/adapters/GitHubMCPService.js';
import { HttpClient } from '../../src/services/http/HttpClient.js';

type Call = {
  url: string;
  body: unknown;
  token?: string;
  extraHeaders?: Record<string, string>;
};

function getMethod(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const method = (body as Record<string, unknown>).method;
  return typeof method === 'string' ? method : undefined;
}

function getParams(body: unknown): Record<string, unknown> | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const params = (body as Record<string, unknown>).params;
  return params && typeof params === 'object' ? (params as Record<string, unknown>) : undefined;
}

class FakeHttpClient extends HttpClient {
  calls: Call[] = [];
  private correlationId: string;

  constructor(correlationId: string) {
    super();
    this.correlationId = correlationId;
  }

  async post(url: string, body?: unknown, token?: string, extraHeaders?: Record<string, string>): Promise<Response> {
    this.calls.push({ url, body, token, extraHeaders });

    const req = (body && typeof body === 'object' ? (body as Record<string, unknown>) : {}) as Record<string, unknown>;
    const method = typeof req.method === 'string' ? req.method : '';
    const id = req.id ?? 1;
    const params = (req.params && typeof req.params === 'object' ? (req.params as Record<string, unknown>) : undefined) as
      | Record<string, unknown>
      | undefined;

    // Always return the gateway correlation id header
    const headers = new Headers({ 'x-correlation-id': this.correlationId, 'content-type': 'application/json' });

    if (method === 'initialize') {
      return new Response(
        JSON.stringify({ jsonrpc: '2.0', result: { protocolVersion: '0.1.0' }, id }),
        { status: 200, headers }
      );
    }

    if (method === 'tools/list') {
      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          result: {
            tools: [
              { name: 'get_file_contents' },
              { name: 'create_or_update_file' },
              { name: 'create_pull_request' },
              { name: 'create_branch' },
              { name: 'list_issues' },
            ],
          },
          id,
        }),
        { status: 200, headers }
      );
    }

    if (method === 'tools/call') {
      const toolName = typeof params?.name === 'string' ? params.name : undefined;
      if (toolName === 'get_file_contents') {
        return new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            result: {
              content: [{ type: 'text', text: JSON.stringify({ sha: 'sha-123', content: 'hello' }) }],
            },
            id,
          }),
          { status: 200, headers }
        );
      }
    }

    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32601, message: `Unhandled method in fake: ${method}` },
        id: id ?? null,
      }),
      { status: 200, headers }
    );
  }
}

describe('GitHubMCPService (protocol)', () => {
  it('uses MCP-standard methods (initialize/tools/list/tools/call) for getFileContent', async () => {
    const fake = new FakeHttpClient('corr-test-123');
    const svc = new GitHubMCPService({
      baseUrl: 'http://localhost:4010/mcp',
      token: 'mock-token',
      correlationId: 'job-abc-123',
      httpClient: fake,
    });

    const out = await svc.getFileContent('acme', 'repo', 'main', 'README.md');
    assert.strictEqual(out.content, 'hello');
    assert.strictEqual(out.sha, 'sha-123');

    assert.strictEqual(fake.calls.length, 3);
    const [c1, c2, c3] = fake.calls;

    assert.strictEqual(getMethod(c1.body), 'initialize');
    assert.strictEqual(getMethod(c2.body), 'tools/list');
    assert.strictEqual(getMethod(c3.body), 'tools/call');

    // Ensure we never use legacy namespaced methods
    const methods = fake.calls.map((c) => getMethod(c.body)).filter(Boolean).join(',');
    assert.ok(!methods.includes('github/'), `Expected no legacy github/* methods, got: ${methods}`);

    // Ensure correlation header is set (inbound) and not leaked elsewhere
    for (const call of fake.calls) {
      assert.strictEqual(call.extraHeaders?.['x-correlation-id'], 'job-abc-123');
    }

    const params = getParams(c3.body);
    assert.strictEqual(params?.name, 'get_file_contents');
    assert.deepStrictEqual(params?.arguments, {
      owner: 'acme',
      repo: 'repo',
      path: 'README.md',
      branch: 'main',
    });
  });

  it('propagates gateway correlationId on JSON-RPC errors', async () => {
    class ErrorHttpClient extends FakeHttpClient {
      async post(url: string, body?: unknown, token?: string, extraHeaders?: Record<string, string>): Promise<Response> {
        const req = (body && typeof body === 'object' ? (body as Record<string, unknown>) : {}) as Record<string, unknown>;
        const method = typeof req.method === 'string' ? req.method : '';
        const id = req.id ?? null;
        const headers = new Headers({ 'x-correlation-id': 'corr-from-gateway', 'content-type': 'application/json' });
        this.calls.push({ url, body, token, extraHeaders });

        if (method === 'initialize') {
          return new Response(JSON.stringify({ jsonrpc: '2.0', result: {}, id }), { status: 200, headers });
        }
        if (method === 'tools/list') {
          return new Response(
            JSON.stringify({ jsonrpc: '2.0', result: { tools: [{ name: 'get_file_contents' }] }, id }),
            { status: 200, headers }
          );
        }
        if (method === 'tools/call') {
          return new Response(
            JSON.stringify({ jsonrpc: '2.0', error: { code: -32601, message: 'Method not found' }, id }),
            { status: 200, headers }
          );
        }
        return new Response(JSON.stringify({ jsonrpc: '2.0', result: {}, id }), { status: 200, headers });
      }
    }

    const fake = new ErrorHttpClient('unused');
    const svc = new GitHubMCPService({
      baseUrl: 'http://localhost:4010/mcp',
      correlationId: 'job-xyz',
      httpClient: fake,
    });

    await assert.rejects(
      () => svc.getFileContent('acme', 'repo', 'main', 'README.md'),
      (err) => {
        assert.ok(err instanceof McpError);
        assert.strictEqual(err.mcpCode, -32601);
        assert.strictEqual(err.correlationId, 'corr-from-gateway');
        return true;
      }
    );
  });
});

/**
 * MCP Connection Error Tests
 * Ensures network failures and HTTP errors are mapped to structured McpConnectionError
 * with actionable hints (not generic "fetch failed").
 */
describe('GitHubMCPService (connection errors)', () => {
  it('maps ECONNREFUSED to MCP_UNREACHABLE with actionable hint', async () => {
    class ConnectionRefusedHttpClient extends HttpClient {
      async post(): Promise<Response> {
        const error = new Error('fetch failed');
        (error as Error & { cause?: { code: string } }).cause = { code: 'ECONNREFUSED' };
        throw error;
      }
    }

    const svc = new GitHubMCPService({
      baseUrl: 'http://localhost:4010/mcp',
      correlationId: 'job-conn-test',
      httpClient: new ConnectionRefusedHttpClient(),
    });

    await assert.rejects(
      () => svc.getFileContent('acme', 'repo', 'main', 'README.md'),
      (err) => {
        assert.ok(err instanceof McpConnectionError, 'Expected McpConnectionError');
        assert.strictEqual(err.code, McpErrorCode.MCP_UNREACHABLE);
        assert.strictEqual(err.correlationId, 'job-conn-test');
        assert.ok(err.hint, 'Expected hint to be set');
        assert.ok(
          err.hint!.includes('mcp-up.sh') || err.hint!.includes('mcp-doctor'),
          `Hint should mention mcp-up.sh or mcp-doctor, got: ${err.hint}`
        );
        // Ensure gateway URL is redacted (no path)
        assert.strictEqual(err.gatewayUrl, 'http://localhost:4010');
        return true;
      }
    );
  });

  it('maps "fetch failed" to MCP_UNREACHABLE with hint', async () => {
    class FetchFailedHttpClient extends HttpClient {
      async post(): Promise<Response> {
        throw new Error('fetch failed');
      }
    }

    const svc = new GitHubMCPService({
      baseUrl: 'http://localhost:4010/mcp',
      correlationId: 'job-fetch-fail',
      httpClient: new FetchFailedHttpClient(),
    });

    await assert.rejects(
      () => svc.getFileContent('acme', 'repo', 'main', 'README.md'),
      (err) => {
        assert.ok(err instanceof McpConnectionError);
        assert.strictEqual(err.code, McpErrorCode.MCP_UNREACHABLE);
        assert.ok(err.hint!.includes('mcp-doctor'));
        return true;
      }
    );
  });

  it('maps HTTP 401 to MCP_UNAUTHORIZED with token hint', async () => {
    class UnauthorizedHttpClient extends HttpClient {
      async post(): Promise<Response> {
        return new Response('Unauthorized', {
          status: 401,
          statusText: 'Unauthorized',
          headers: { 'x-correlation-id': 'corr-401' },
        });
      }
    }

    const svc = new GitHubMCPService({
      baseUrl: 'http://localhost:4010/mcp',
      correlationId: 'job-401',
      httpClient: new UnauthorizedHttpClient(),
    });

    await assert.rejects(
      () => svc.getFileContent('acme', 'repo', 'main', 'README.md'),
      (err) => {
        assert.ok(err instanceof McpConnectionError);
        assert.strictEqual(err.code, McpErrorCode.MCP_UNAUTHORIZED);
        assert.ok(err.hint!.includes('token') || err.hint!.includes('GITHUB_TOKEN'));
        return true;
      }
    );
  });

  it('maps HTTP 403 to MCP_FORBIDDEN with scopes hint', async () => {
    class ForbiddenHttpClient extends HttpClient {
      async post(): Promise<Response> {
        return new Response('Forbidden', {
          status: 403,
          statusText: 'Forbidden',
          headers: { 'x-correlation-id': 'corr-403' },
        });
      }
    }

    const svc = new GitHubMCPService({
      baseUrl: 'http://localhost:4010/mcp',
      correlationId: 'job-403',
      httpClient: new ForbiddenHttpClient(),
    });

    await assert.rejects(
      () => svc.getFileContent('acme', 'repo', 'main', 'README.md'),
      (err) => {
        assert.ok(err instanceof McpConnectionError);
        assert.strictEqual(err.code, McpErrorCode.MCP_FORBIDDEN);
        assert.ok(err.hint!.includes('scope') || err.hint!.includes('repo'));
        return true;
      }
    );
  });

  it('maps HTTP 429 to MCP_RATE_LIMITED', async () => {
    class RateLimitedHttpClient extends HttpClient {
      async post(): Promise<Response> {
        return new Response('Rate Limit Exceeded', {
          status: 429,
          statusText: 'Too Many Requests',
          headers: { 'x-correlation-id': 'corr-429' },
        });
      }
    }

    const svc = new GitHubMCPService({
      baseUrl: 'http://localhost:4010/mcp',
      correlationId: 'job-429',
      httpClient: new RateLimitedHttpClient(),
    });

    await assert.rejects(
      () => svc.getFileContent('acme', 'repo', 'main', 'README.md'),
      (err) => {
        assert.ok(err instanceof McpConnectionError);
        assert.strictEqual(err.code, McpErrorCode.MCP_RATE_LIMITED);
        assert.ok(err.hint!.includes('rate limit') || err.hint!.includes('wait'));
        return true;
      }
    );
  });

  it('maps HTTP 500+ to MCP_SERVER_ERROR', async () => {
    class ServerErrorHttpClient extends HttpClient {
      async post(): Promise<Response> {
        return new Response('Internal Server Error', {
          status: 500,
          statusText: 'Internal Server Error',
          headers: { 'x-correlation-id': 'corr-500' },
        });
      }
    }

    const svc = new GitHubMCPService({
      baseUrl: 'http://localhost:4010/mcp',
      correlationId: 'job-500',
      httpClient: new ServerErrorHttpClient(),
    });

    await assert.rejects(
      () => svc.getFileContent('acme', 'repo', 'main', 'README.md'),
      (err) => {
        assert.ok(err instanceof McpConnectionError);
        assert.strictEqual(err.code, McpErrorCode.MCP_SERVER_ERROR);
        assert.ok(err.hint!.includes('logs') || err.hint!.includes('gateway'));
        return true;
      }
    );
  });

  it('preserves correlationId through connection errors', async () => {
    class TimeoutHttpClient extends HttpClient {
      async post(): Promise<Response> {
        throw new Error('Request timeout: AbortError');
      }
    }

    const svc = new GitHubMCPService({
      baseUrl: 'http://localhost:4010/mcp',
      correlationId: 'job-timeout-test',
      httpClient: new TimeoutHttpClient(),
    });

    await assert.rejects(
      () => svc.getFileContent('acme', 'repo', 'main', 'README.md'),
      (err) => {
        assert.ok(err instanceof McpConnectionError);
        assert.strictEqual(err.correlationId, 'job-timeout-test');
        return true;
      }
    );
  });
});
