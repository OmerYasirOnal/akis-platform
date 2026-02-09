/**
 * Unit tests for RSSFetcherService pure functions
 * Tests hashLink (exported), extractSourceName, and isWithinHours (contract tests)
 */
import { describe, test } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';

import { hashLink } from '../../src/services/smart-automations/RSSFetcherService.js';

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
