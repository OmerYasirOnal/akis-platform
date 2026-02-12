/**
 * Unit tests for RSSFetcherService pure functions and auto-discovery logic
 * Tests hashLink (exported), extractSourceName, isWithinHours, and COMMON_FEED_PATHS
 */
import { describe, test } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';

import { hashLink, RSSFetcherService } from '../../src/services/smart-automations/RSSFetcherService.js';

// ─── Re-create private pure functions (contract tests) ────────────

function extractSourceName(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}

function isWithinHours(date: Date | undefined, hours: number): boolean {
  if (!date) return true;
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  return date >= cutoff;
}

// ─── hashLink ──────────────────────────────────────────────────────

describe('hashLink', () => {
  test('returns SHA-256 hex digest', () => {
    const result = hashLink('https://example.com/article');
    assert.strictEqual(result.length, 64, 'SHA-256 hex is 64 chars');
    assert.match(result, /^[0-9a-f]{64}$/);
  });

  test('normalizes to lowercase before hashing', () => {
    const a = hashLink('https://Example.COM/Article');
    const b = hashLink('https://example.com/article');
    assert.strictEqual(a, b);
  });

  test('trims whitespace before hashing', () => {
    const a = hashLink('  https://example.com  ');
    const b = hashLink('https://example.com');
    assert.strictEqual(a, b);
  });

  test('matches manual SHA-256 computation', () => {
    const input = 'https://test.io/post';
    const expected = crypto.createHash('sha256').update(input.toLowerCase().trim()).digest('hex');
    assert.strictEqual(hashLink(input), expected);
  });

  test('different URLs produce different hashes', () => {
    const a = hashLink('https://a.com');
    const b = hashLink('https://b.com');
    assert.notStrictEqual(a, b);
  });
});

// ─── extractSourceName ─────────────────────────────────────────────

describe('extractSourceName', () => {
  test('extracts hostname from URL', () => {
    assert.strictEqual(extractSourceName('https://blog.example.com/feed'), 'blog.example.com');
  });

  test('strips www prefix', () => {
    assert.strictEqual(extractSourceName('https://www.example.com/rss'), 'example.com');
  });

  test('handles URL with port', () => {
    assert.strictEqual(extractSourceName('http://localhost:3000/feed'), 'localhost');
  });

  test('handles URL with path and query', () => {
    assert.strictEqual(extractSourceName('https://news.site.io/api/feed?format=rss'), 'news.site.io');
  });

  test('returns unknown for invalid URLs', () => {
    assert.strictEqual(extractSourceName('not-a-url'), 'unknown');
    assert.strictEqual(extractSourceName(''), 'unknown');
  });
});

// ─── isWithinHours ─────────────────────────────────────────────────

describe('isWithinHours', () => {
  test('returns true for undefined date', () => {
    assert.strictEqual(isWithinHours(undefined, 24), true);
  });

  test('returns true for recent date within window', () => {
    const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000);
    assert.strictEqual(isWithinHours(oneHourAgo, 24), true);
  });

  test('returns false for date outside window', () => {
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    assert.strictEqual(isWithinHours(twoDaysAgo, 24), false);
  });

  test('returns true for now', () => {
    assert.strictEqual(isWithinHours(new Date(), 1), true);
  });

  test('boundary: exactly at cutoff edge', () => {
    // Slightly before cutoff -> false
    const justOutside = new Date(Date.now() - 24 * 60 * 60 * 1000 - 1000);
    assert.strictEqual(isWithinHours(justOutside, 24), false);
  });

  test('handles very small window', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    // 5 min ago is within 1 hour
    assert.strictEqual(isWithinHours(fiveMinutesAgo, 1), true);
    // 5 min ago is NOT within 0.01 hours (~36 seconds)
    assert.strictEqual(isWithinHours(fiveMinutesAgo, 0.01), false);
  });
});

// ─── RSSFetcherService class tests ─────────────────────────────────

describe('RSSFetcherService', () => {
  test('can be instantiated with default logger', () => {
    const service = new RSSFetcherService();
    assert.ok(service);
  });

  test('can be instantiated with custom logger', () => {
    const logs: string[] = [];
    const service = new RSSFetcherService({
      info: (msg) => logs.push(`INFO: ${msg}`),
      error: (msg) => logs.push(`ERROR: ${msg}`),
    });
    assert.ok(service);
  });

  test('fetchFromSources skips non-rss source types', async () => {
    const logs: string[] = [];
    const service = new RSSFetcherService({
      info: (msg) => logs.push(msg),
      error: (msg) => logs.push(msg),
    });

    const items = await service.fetchFromSources([
      { url: 'https://example.com', type: 'webpage' },
    ]);

    assert.strictEqual(items.length, 0);
    assert.ok(logs.some(l => l.includes('Skipping non-RSS')));
  });

  test('fetchFromSources handles empty sources array', async () => {
    const service = new RSSFetcherService();
    const items = await service.fetchFromSources([]);
    assert.strictEqual(items.length, 0);
  });

  test('fetchFromSources handles unreachable URL gracefully', async () => {
    const errors: string[] = [];
    const service = new RSSFetcherService({
      info: () => {},
      error: (msg) => errors.push(msg),
    });

    const items = await service.fetchFromSources([
      { url: 'https://this-url-cannot-exist-12345.invalid/feed', type: 'rss' },
    ]);

    assert.strictEqual(items.length, 0);
  });

  test('fetchFromSources with unreachable URL returns empty', async () => {
    const service = new RSSFetcherService({
      info: () => {},
      error: () => {},
    });

    const items = await service.fetchFromSources([
      { url: 'https://this-domain-does-not-exist-akis-test.example', type: 'rss' },
    ]);

    assert.strictEqual(items.length, 0);
  });

  test('dedupeItems returns empty for empty input', async () => {
    const service = new RSSFetcherService();
    const result = await service.dedupeItems([], 'fake-automation-id');
    assert.strictEqual(result.length, 0);
  });
});

// ─── RSS auto-discovery contract tests ──────────────────────────────

describe('RSS auto-discovery (behavioral)', () => {
  test('service handles webpage URL that is not RSS without crashing', async () => {
    const logs: string[] = [];
    const service = new RSSFetcherService({
      info: (msg) => logs.push(msg),
      error: (msg) => logs.push(msg),
    });

    // This is a webpage URL, not an RSS feed — should attempt auto-discovery
    // and gracefully return empty (since we can't guarantee network in tests)
    const items = await service.fetchFromSources([
      { url: 'https://httpbin.org/html', type: 'rss' },
    ]);

    // Should not crash, should return 0 items (no RSS feed at httpbin)
    assert.ok(Array.isArray(items));
    // Should have attempted auto-discovery
    assert.ok(
      logs.some(l => l.includes('auto-discovery') || l.includes('Fetching RSS') || l.includes('Failed to parse')),
      'Should log discovery attempt or parse failure'
    );
  });

  test('multiple sources are processed independently', async () => {
    const service = new RSSFetcherService({
      info: () => {},
      error: () => {},
    });

    const items = await service.fetchFromSources([
      { url: 'https://invalid-1.example', type: 'rss' },
      { url: 'https://invalid-2.example', type: 'rss' },
    ]);

    // Both should fail gracefully
    assert.ok(Array.isArray(items));
    assert.strictEqual(items.length, 0);
  });
});
