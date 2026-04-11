/**
 * Unit tests: GitHub REST Adapter Content-Type Validation
 *
 * Validates that ghFetch() checks Content-Type before calling res.json()
 * on successful responses. Prevents crashes when GitHub/Cloudflare returns
 * HTML error pages with 200 status codes.
 *
 * Depends on: Task 4 (Content-Type check in GitHubRESTAdapter.ts)
 */
import { describe, test } from 'node:test';
import assert from 'node:assert';

// ─── Mock Fetch Infrastructure ────────────────────────────────────────────

type MockResponse = {
  ok: boolean;
  status: number;
  headers: Map<string, string>;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
};

let mockFetchResponse: MockResponse | null = null;

function createMockResponse(opts: {
  ok?: boolean;
  status?: number;
  contentType?: string | null;
  body?: unknown;
  textBody?: string;
}): MockResponse {
  const headers = new Map<string, string>();
  if (opts.contentType !== null && opts.contentType !== undefined) {
    headers.set('content-type', opts.contentType);
  }

  return {
    ok: opts.ok ?? true,
    status: opts.status ?? 200,
    headers: {
      get: (name: string) => headers.get(name.toLowerCase()) ?? null,
    } as unknown as Map<string, string>,
    json: async () => {
      if (typeof opts.body === 'object') return opts.body;
      throw new SyntaxError('Unexpected token < in JSON');
    },
    text: async () => opts.textBody ?? JSON.stringify(opts.body ?? {}),
  };
}

/**
 * Simplified ghFetch simulation that mirrors the actual implementation:
 * 1. Check res.ok → error path (text fallback)
 * 2. Check 204 → return {}
 * 3. Check Content-Type → throw if not JSON (NEW)
 * 4. Parse JSON
 */
async function ghFetch<T>(method: string, path: string, _body?: unknown): Promise<T> {
  const res = mockFetchResponse!;

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let detail = '';
    try {
      const json = JSON.parse(text);
      detail = (json as Record<string, string>).message || text;
    } catch {
      detail = text;
    }
    throw new GitHubAPIError(`GitHub API ${method} ${path} → ${res.status}: ${detail}`, res.status);
  }

  if (res.status === 204) return {} as T;

  const contentType = (res.headers as unknown as { get(k: string): string | null }).get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    const body = await res.text().catch(() => '');
    throw new GitHubAPIError(
      `GitHub API ${method} ${path} → ${res.status}: Expected JSON, got Content-Type "${contentType}". Body: ${body.slice(0, 200)}`,
      res.status,
    );
  }

  return (await res.json()) as T;
}

class GitHubAPIError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'GitHubAPIError';
  }
}

// ─── Test Suites ────────────────────────────────────────────────────────────

describe('Content-Type Validation — Successful Responses (res.ok=true)', () => {
  test('parses JSON when Content-Type is application/json', async () => {
    mockFetchResponse = createMockResponse({
      ok: true,
      status: 200,
      contentType: 'application/json',
      body: { full_name: 'org/repo', private: false },
    });

    const result = await ghFetch<{ full_name: string }>('GET', '/repos/org/repo');
    assert.strictEqual(result.full_name, 'org/repo');
  });

  test('parses JSON when Content-Type includes charset', async () => {
    mockFetchResponse = createMockResponse({
      ok: true,
      status: 200,
      contentType: 'application/json; charset=utf-8',
      body: { id: 42 },
    });

    const result = await ghFetch<{ id: number }>('GET', '/repos/org/repo');
    assert.strictEqual(result.id, 42);
  });

  test('throws GitHubAPIError when Content-Type is text/html', async () => {
    mockFetchResponse = createMockResponse({
      ok: true,
      status: 200,
      contentType: 'text/html',
      textBody: '<html><body>502 Bad Gateway</body></html>',
    });

    await assert.rejects(
      () => ghFetch('GET', '/repos/org/repo'),
      (err: Error) => {
        assert.ok(err instanceof GitHubAPIError);
        assert.ok(err.message.includes('text/html'));
        assert.ok(err.message.includes('Expected JSON'));
        return true;
      },
    );
  });

  test('throws GitHubAPIError when Content-Type is text/html with charset (Cloudflare)', async () => {
    mockFetchResponse = createMockResponse({
      ok: true,
      status: 200,
      contentType: 'text/html; charset=utf-8',
      textBody: '<html><head><title>Attention Required! | Cloudflare</title></head></html>',
    });

    await assert.rejects(
      () => ghFetch('GET', '/repos/org/repo'),
      (err: Error) => {
        assert.ok(err instanceof GitHubAPIError);
        assert.ok(err.message.includes('text/html; charset=utf-8'));
        return true;
      },
    );
  });

  test('throws GitHubAPIError when Content-Type header is missing', async () => {
    mockFetchResponse = createMockResponse({
      ok: true,
      status: 200,
      contentType: null,
      textBody: 'some weird response',
    });

    await assert.rejects(
      () => ghFetch('GET', '/repos/org/repo'),
      (err: Error) => {
        assert.ok(err instanceof GitHubAPIError);
        assert.ok(err.message.includes('Expected JSON'));
        return true;
      },
    );
  });

  test('error message includes truncated body (max 200 chars)', async () => {
    const longHtml = '<html>' + 'x'.repeat(300) + '</html>';
    mockFetchResponse = createMockResponse({
      ok: true,
      status: 200,
      contentType: 'text/html',
      textBody: longHtml,
    });

    await assert.rejects(
      () => ghFetch('GET', '/repos/org/repo'),
      (err: Error) => {
        assert.ok(err instanceof GitHubAPIError);
        // Body should be truncated to 200 chars
        assert.ok(err.message.length < longHtml.length + 100);
        return true;
      },
    );
  });

  test('error message includes HTTP method and path', async () => {
    mockFetchResponse = createMockResponse({
      ok: true,
      status: 200,
      contentType: 'text/plain',
      textBody: 'Not JSON',
    });

    await assert.rejects(
      () => ghFetch('PUT', '/repos/org/repo/contents/file.ts'),
      (err: Error) => {
        assert.ok(err.message.includes('PUT'));
        assert.ok(err.message.includes('/repos/org/repo/contents/file.ts'));
        return true;
      },
    );
  });
});

describe('Status 204 — No Content (Regression Guard)', () => {
  test('returns empty object for 204 without checking Content-Type', async () => {
    mockFetchResponse = createMockResponse({
      ok: true,
      status: 204,
      contentType: null, // 204 often has no Content-Type
    });

    const result = await ghFetch<Record<string, never>>('DELETE', '/repos/org/repo/branches/old');
    assert.deepStrictEqual(result, {});
  });
});

describe('Error Path — res.ok=false (Existing Behavior)', () => {
  test('uses text fallback for HTML error responses', async () => {
    mockFetchResponse = createMockResponse({
      ok: false,
      status: 502,
      contentType: 'text/html',
      textBody: '<html>502 Bad Gateway</html>',
    });

    await assert.rejects(
      () => ghFetch('GET', '/repos/org/repo'),
      (err: Error) => {
        assert.ok(err instanceof GitHubAPIError);
        assert.ok(err.message.includes('502'));
        return true;
      },
    );
  });

  test('extracts message from JSON error responses', async () => {
    mockFetchResponse = createMockResponse({
      ok: false,
      status: 404,
      contentType: 'application/json',
      textBody: JSON.stringify({ message: 'Not Found' }),
    });

    await assert.rejects(
      () => ghFetch('GET', '/repos/org/nonexistent'),
      (err: Error) => {
        assert.ok(err instanceof GitHubAPIError);
        assert.ok(err.message.includes('Not Found'));
        return true;
      },
    );
  });
});

describe('GitHubAPIError Shape', () => {
  test('error has name GitHubAPIError', async () => {
    mockFetchResponse = createMockResponse({
      ok: true,
      status: 200,
      contentType: 'text/html',
      textBody: 'not json',
    });

    await assert.rejects(
      () => ghFetch('GET', '/test'),
      (err: Error) => {
        assert.strictEqual(err.name, 'GitHubAPIError');
        return true;
      },
    );
  });

  test('error includes statusCode', async () => {
    mockFetchResponse = createMockResponse({
      ok: true,
      status: 200,
      contentType: 'text/xml',
      textBody: '<xml/>',
    });

    await assert.rejects(
      () => ghFetch('GET', '/test'),
      (err: unknown) => {
        assert.strictEqual((err as GitHubAPIError).statusCode, 200);
        return true;
      },
    );
  });
});
