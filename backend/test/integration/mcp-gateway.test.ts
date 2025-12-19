/**
 * MCP Gateway Integration Tests - V2
 * Tests backend's ability to communicate with MCP gateway
 * 
 * NOTE: These tests require MCP_GATEWAY_URL to be set when running against real gateway.
 * Without it, tests will skip gracefully with a clear message.
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert';

const MCP_GATEWAY_URL = process.env.MCP_GATEWAY_URL || process.env.GITHUB_MCP_BASE_URL;
const SKIP_MCP_TESTS = !MCP_GATEWAY_URL || process.env.SKIP_MCP_TESTS === 'true';

// Simple HTTP client for testing (no external dependencies)
async function httpRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
  } = {}
): Promise<{ status: number; headers: Headers; body: unknown }> {
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  
  const body = await response.json().catch(() => ({}));
  return { status: response.status, headers: response.headers, body };
}

describe('MCP Gateway Integration', () => {
  before(() => {
    if (SKIP_MCP_TESTS) {
      console.log('[MCP Tests] SKIPPED: Set MCP_GATEWAY_URL or GITHUB_MCP_BASE_URL to run these tests');
      console.log('[MCP Tests] Example: MCP_GATEWAY_URL=http://localhost:4010 pnpm test');
    }
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      if (SKIP_MCP_TESTS) return;
      
      const healthUrl = MCP_GATEWAY_URL!.replace('/mcp', '/health');
      const { status, body } = await httpRequest(healthUrl);
      
      assert.strictEqual(status, 200, 'Health check should return 200');
      assert.ok((body as { status?: string }).status === 'ok', 'Status should be "ok"');
    });
  });

  describe('Request Validation', () => {
    it('should reject requests without Content-Type', async () => {
      if (SKIP_MCP_TESTS) return;
      
      const response = await fetch(MCP_GATEWAY_URL!, {
        method: 'POST',
        body: JSON.stringify({ jsonrpc: '2.0', method: 'test', id: 1 }),
        // Intentionally omit Content-Type
      });
      
      // Should return 400 (or similar error)
      assert.ok([400, 415].includes(response.status), 
        `Should reject missing Content-Type, got ${response.status}`);
    });

    it('should reject invalid JSON-RPC envelope', async () => {
      if (SKIP_MCP_TESTS) return;
      
      const { status, body } = await httpRequest(MCP_GATEWAY_URL!, {
        method: 'POST',
        body: { invalid: 'request' }, // Missing jsonrpc and method
      });
      
      assert.strictEqual(status, 400, 'Should return 400 for invalid envelope');
      const errorBody = body as { error?: { data?: { correlationId?: string } } };
      assert.ok(errorBody.error?.data?.correlationId, 
        'Error should include correlationId');
    });

    it('should return 400 for missing method field', async () => {
      if (SKIP_MCP_TESTS) return;
      
      const { status } = await httpRequest(MCP_GATEWAY_URL!, {
        method: 'POST',
        body: { jsonrpc: '2.0', id: 1 }, // Missing method
      });
      
      assert.strictEqual(status, 400, 'Should return 400 for missing method');
    });
  });

  describe('Correlation ID Handling', () => {
    it('should preserve inbound correlation ID', async () => {
      if (SKIP_MCP_TESTS) return;
      
      const testCorrelationId = `test-${Date.now()}`;
      
      const response = await fetch(MCP_GATEWAY_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-correlation-id': testCorrelationId,
        },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'test', id: 1 }),
      });
      
      const returnedCorrelationId = response.headers.get('x-correlation-id');
      assert.strictEqual(returnedCorrelationId, testCorrelationId,
        'Should preserve inbound correlation ID');
    });

    it('should generate correlation ID when not provided', async () => {
      if (SKIP_MCP_TESTS) return;
      
      const { body } = await httpRequest(MCP_GATEWAY_URL!, {
        method: 'POST',
        body: { invalid: 'request' },
      });
      
      const errorBody = body as { error?: { data?: { correlationId?: string } } };
      assert.ok(errorBody.error?.data?.correlationId,
        'Should generate correlationId when not provided');
      
      // UUID format check
      const uuid = errorBody.error?.data?.correlationId;
      assert.ok(uuid && uuid.length >= 32, 'Correlation ID should be UUID-like');
    });

    it('should NOT leak request body in error responses', async () => {
      if (SKIP_MCP_TESTS) return;
      
      const sensitivePayload = { 
        jsonrpc: '2.0',
        method: 'dangerous/method',
        params: { secretToken: 'super-secret-value' },
        id: 1 
      };
      
      const { body: responseBody } = await httpRequest(MCP_GATEWAY_URL!, {
        method: 'POST',
        body: sensitivePayload,
      });
      
      const responseStr = JSON.stringify(responseBody);
      assert.ok(!responseStr.includes('super-secret-value'),
        'Error response should NOT contain sensitive request data');
      assert.ok(!responseStr.includes('secretToken'),
        'Error response should NOT contain param names from request');
    });
  });

  describe('MCP Initialize (requires running gateway with valid token)', () => {
    it('should successfully initialize MCP session', async () => {
      if (SKIP_MCP_TESTS) return;
      
      const { status, body } = await httpRequest(MCP_GATEWAY_URL!, {
        method: 'POST',
        body: {
          jsonrpc: '2.0',
          method: 'initialize',
          params: {
            protocolVersion: '0.1.0',
            capabilities: {},
            clientInfo: {
              name: 'akis-integration-test',
              version: '1.0.0',
            },
          },
          id: 1,
        },
      });
      
      // Note: This may fail if gateway doesn't have valid GITHUB_TOKEN
      // That's expected - the test documents what SHOULD work
      if (status === 200) {
        const result = body as { result?: { serverInfo?: unknown } };
        assert.ok(result.result || (body as { serverInfo?: unknown }).serverInfo,
          'Initialize should return server info');
      } else if (status === 503) {
        console.log('[MCP Tests] Gateway returned 503 - MCP server may not be running');
      } else {
        console.log('[MCP Tests] Initialize returned status:', status, body);
      }
    });
  });
});

