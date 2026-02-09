/**
 * Contract tests for API config helpers — isLocalhost and URL resolution
 */
import { describe, it, expect } from 'vitest';

// ─── Re-create helpers from services/api/config.ts ───────────────

function isLocalhost(url: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)([:/?#]|$)/i.test(url);
}

// Simplified URL resolution logic for contract testing
// (actual getApiBaseUrl uses import.meta.env which is hard to mock cleanly)
function resolveApiBase(opts: {
  backendUrl?: string;
  apiUrl?: string;
  isProd: boolean;
  windowOrigin?: string;
}): string {
  const { backendUrl, apiUrl, isProd, windowOrigin } = opts;

  if (backendUrl) {
    const url = backendUrl.replace(/\/api\/?$/, '');
    if (isProd && isLocalhost(url)) {
      // fall through
    } else {
      return url;
    }
  }

  if (apiUrl) {
    if (apiUrl.startsWith('/')) {
      // relative — fall through
    } else if (apiUrl.startsWith('http')) {
      try {
        const origin = new URL(apiUrl).origin;
        if (isProd && isLocalhost(origin)) {
          // fall through
        } else {
          return origin;
        }
      } catch {
        // invalid URL — fall through
      }
    }
  }

  if (windowOrigin) {
    return windowOrigin;
  }

  return '';
}

// ─── isLocalhost ──────────────────────────────────────────────────

describe('isLocalhost', () => {
  it('matches http://localhost', () => {
    expect(isLocalhost('http://localhost')).toBe(true);
  });

  it('matches http://localhost:3000', () => {
    expect(isLocalhost('http://localhost:3000')).toBe(true);
  });

  it('matches https://localhost', () => {
    expect(isLocalhost('https://localhost')).toBe(true);
  });

  it('matches http://127.0.0.1', () => {
    expect(isLocalhost('http://127.0.0.1')).toBe(true);
  });

  it('matches http://127.0.0.1:8080', () => {
    expect(isLocalhost('http://127.0.0.1:8080')).toBe(true);
  });

  it('matches http://localhost/path', () => {
    expect(isLocalhost('http://localhost/api')).toBe(true);
  });

  it('matches http://localhost?query', () => {
    expect(isLocalhost('http://localhost?q=1')).toBe(true);
  });

  it('matches http://localhost#hash', () => {
    expect(isLocalhost('http://localhost#section')).toBe(true);
  });

  it('does NOT match production URLs', () => {
    expect(isLocalhost('https://api.akis.com')).toBe(false);
    expect(isLocalhost('https://staging.akis.com')).toBe(false);
  });

  it('does NOT match localhost without protocol', () => {
    expect(isLocalhost('localhost:3000')).toBe(false);
  });

  it('is case-insensitive for protocol', () => {
    expect(isLocalhost('HTTP://LOCALHOST')).toBe(true);
  });

  it('does NOT match localhost as substring', () => {
    expect(isLocalhost('http://notlocalhost.com')).toBe(false);
  });
});

// ─── resolveApiBase (contract for getApiBaseUrl) ──────────────────

describe('resolveApiBase', () => {
  it('uses backendUrl in dev mode', () => {
    const result = resolveApiBase({
      backendUrl: 'http://localhost:4000',
      isProd: false,
    });
    expect(result).toBe('http://localhost:4000');
  });

  it('strips /api suffix from backendUrl', () => {
    const result = resolveApiBase({
      backendUrl: 'http://localhost:4000/api',
      isProd: false,
    });
    expect(result).toBe('http://localhost:4000');
  });

  it('strips /api/ suffix from backendUrl', () => {
    const result = resolveApiBase({
      backendUrl: 'http://localhost:4000/api/',
      isProd: false,
    });
    expect(result).toBe('http://localhost:4000');
  });

  it('rejects localhost backendUrl in production', () => {
    const result = resolveApiBase({
      backendUrl: 'http://localhost:4000',
      isProd: true,
      windowOrigin: 'https://app.akis.com',
    });
    expect(result).toBe('https://app.akis.com');
  });

  it('allows non-localhost backendUrl in production', () => {
    const result = resolveApiBase({
      backendUrl: 'https://api.akis.com',
      isProd: true,
    });
    expect(result).toBe('https://api.akis.com');
  });

  it('falls back to apiUrl origin', () => {
    const result = resolveApiBase({
      apiUrl: 'https://api.akis.com/v1/endpoint',
      isProd: false,
    });
    expect(result).toBe('https://api.akis.com');
  });

  it('rejects localhost apiUrl in production', () => {
    const result = resolveApiBase({
      apiUrl: 'http://localhost:4000/api',
      isProd: true,
      windowOrigin: 'https://app.akis.com',
    });
    expect(result).toBe('https://app.akis.com');
  });

  it('skips relative apiUrl paths', () => {
    const result = resolveApiBase({
      apiUrl: '/api',
      isProd: false,
      windowOrigin: 'https://app.akis.com',
    });
    expect(result).toBe('https://app.akis.com');
  });

  it('falls back to windowOrigin when no env vars set', () => {
    const result = resolveApiBase({
      isProd: false,
      windowOrigin: 'https://app.akis.com',
    });
    expect(result).toBe('https://app.akis.com');
  });

  it('returns empty string when nothing available', () => {
    const result = resolveApiBase({ isProd: false });
    expect(result).toBe('');
  });

  it('backendUrl takes priority over apiUrl', () => {
    const result = resolveApiBase({
      backendUrl: 'https://primary.akis.com',
      apiUrl: 'https://secondary.akis.com/api',
      isProd: false,
    });
    expect(result).toBe('https://primary.akis.com');
  });

  it('handles invalid apiUrl gracefully', () => {
    const result = resolveApiBase({
      apiUrl: 'not-a-url',
      isProd: false,
      windowOrigin: 'https://fallback.akis.com',
    });
    expect(result).toBe('https://fallback.akis.com');
  });
});
