/**
 * Tests for HttpClient — retry logic, timeout, headers
 */
import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { HttpClient } from '../../src/services/http/HttpClient.js';

// ─── Helpers ──────────────────────────────────────────────────────

function createMockResponse(status = 200, body = '{}'): Response {
  return new Response(body, { status, headers: { 'Content-Type': 'application/json' } });
}

let originalFetch: typeof globalThis.fetch;

describe('HttpClient', () => {
  let fetchMock: ReturnType<typeof mock.fn>;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    fetchMock = mock.fn(async () => createMockResponse());
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  // ─── Constructor defaults ────────────────────────────────────

  it('uses default options when none provided', () => {
    const client = new HttpClient();
    // Verify it creates without error
    assert.ok(client);
  });

  it('accepts custom options', () => {
    const client = new HttpClient({ timeout: 5000, retries: 1, retryDelay: 500 });
    assert.ok(client);
  });

  // ─── HTTP methods ────────────────────────────────────────────

  it('sends GET request', async () => {
    const client = new HttpClient({ retries: 0 });
    await client.get('https://api.example.com/data');
    assert.equal(fetchMock.mock.calls.length, 1);
    const [url, init] = fetchMock.mock.calls[0].arguments;
    assert.equal(url, 'https://api.example.com/data');
    assert.equal(init.method, 'GET');
  });

  it('sends POST request with body', async () => {
    const client = new HttpClient({ retries: 0 });
    await client.post('https://api.example.com/data', { name: 'test' });
    const [, init] = fetchMock.mock.calls[0].arguments;
    assert.equal(init.method, 'POST');
    assert.equal(init.body, JSON.stringify({ name: 'test' }));
  });

  it('sends POST without Content-Type when no body', async () => {
    const client = new HttpClient({ retries: 0 });
    await client.post('https://api.example.com/webhook');
    const [, init] = fetchMock.mock.calls[0].arguments;
    assert.equal(init.method, 'POST');
    assert.equal(init.body, undefined);
  });

  it('sends PUT request with body', async () => {
    const client = new HttpClient({ retries: 0 });
    await client.put('https://api.example.com/data/1', { name: 'updated' });
    const [, init] = fetchMock.mock.calls[0].arguments;
    assert.equal(init.method, 'PUT');
    assert.ok(init.body);
  });

  it('sends PUT without body', async () => {
    const client = new HttpClient({ retries: 0 });
    await client.put('https://api.example.com/data/1');
    const [, init] = fetchMock.mock.calls[0].arguments;
    assert.equal(init.body, undefined);
  });

  it('sends DELETE request', async () => {
    const client = new HttpClient({ retries: 0 });
    await client.delete('https://api.example.com/data/1');
    const [, init] = fetchMock.mock.calls[0].arguments;
    assert.equal(init.method, 'DELETE');
  });

  // ─── Headers ─────────────────────────────────────────────────

  it('adds Authorization header when token provided', async () => {
    const client = new HttpClient({ retries: 0 });
    await client.get('https://api.example.com', 'my-token');
    const [, init] = fetchMock.mock.calls[0].arguments;
    const headers = new Headers(init.headers);
    assert.equal(headers.get('Authorization'), 'Bearer my-token');
  });

  it('does not add Authorization when token is undefined', async () => {
    const client = new HttpClient({ retries: 0 });
    await client.get('https://api.example.com');
    const [, init] = fetchMock.mock.calls[0].arguments;
    const headers = new Headers(init.headers);
    assert.equal(headers.get('Authorization'), null);
  });

  it('merges extra headers', async () => {
    const client = new HttpClient({ retries: 0 });
    await client.get('https://api.example.com', undefined, { 'X-Custom': 'value' });
    const [, init] = fetchMock.mock.calls[0].arguments;
    const headers = new Headers(init.headers);
    assert.equal(headers.get('X-Custom'), 'value');
  });

  // ─── Retry behavior ─────────────────────────────────────────

  it('retries on fetch failure', async () => {
    let callCount = 0;
    globalThis.fetch = (async () => {
      callCount++;
      if (callCount < 3) throw new Error('Network error');
      return createMockResponse();
    }) as typeof fetch;

    const client = new HttpClient({ retries: 3, retryDelay: 1 });
    const response = await client.get('https://api.example.com');
    assert.equal(response.status, 200);
    assert.equal(callCount, 3);
  });

  it('throws after exhausting retries', async () => {
    globalThis.fetch = (async () => {
      throw new Error('Persistent failure');
    }) as typeof fetch;

    const client = new HttpClient({ retries: 1, retryDelay: 1 });
    await assert.rejects(
      () => client.get('https://api.example.com'),
      { message: 'Persistent failure' },
    );
  });

  it('retries: 0 falls back to default 3 retries (0 is falsy)', async () => {
    // Note: `options.retries || 3` treats 0 as falsy → defaults to 3
    let callCount = 0;
    globalThis.fetch = (async () => {
      callCount++;
      throw new Error('Fail');
    }) as typeof fetch;

    const client = new HttpClient({ retries: 0, retryDelay: 1 });
    await assert.rejects(() => client.get('https://api.example.com'));
    assert.equal(callCount, 4); // 1 initial + 3 retries
  });

  it('retries exactly once when retries is 1', async () => {
    let callCount = 0;
    globalThis.fetch = (async () => {
      callCount++;
      throw new Error('Fail');
    }) as typeof fetch;

    const client = new HttpClient({ retries: 1, retryDelay: 1 });
    await assert.rejects(() => client.get('https://api.example.com'));
    assert.equal(callCount, 2); // 1 initial + 1 retry
  });

  // ─── Response passthrough ───────────────────────────────────

  it('returns the Response object directly', async () => {
    globalThis.fetch = (async () => createMockResponse(201, '{"id":1}')) as typeof fetch;
    const client = new HttpClient({ retries: 0 });
    const response = await client.post('https://api.example.com', { data: 1 });
    assert.equal(response.status, 201);
    const body = await response.json();
    assert.deepStrictEqual(body, { id: 1 });
  });

  it('returns non-2xx responses without retrying', async () => {
    globalThis.fetch = (async () => createMockResponse(404, '{"error":"not found"}')) as typeof fetch;
    const client = new HttpClient({ retries: 2, retryDelay: 1 });
    const response = await client.get('https://api.example.com/missing');
    assert.equal(response.status, 404);
  });
});
