/**
 * GitHub MCP Protocol Tests
 * Ensures we use MCP-standard JSON-RPC methods (initialize/tools/list/tools/call)
 * and never regress back to legacy method names like `github/getFile`.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { GitHubMCPService, McpError } from '../../src/services/mcp/adapters/GitHubMCPService.js';
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


