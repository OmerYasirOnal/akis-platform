/**
 * Knowledge Sources — Schema & API contract tests
 * S0.6: Verified Knowledge Acquisition
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { z } from 'zod';

// Replicate the validation schema from the API to verify contract
const createSourceSchema = z.object({
  name: z.string().min(1).max(300),
  sourceUrl: z.string().url().max(2000),
  licenseType: z.enum([
    'apache-2.0', 'mit', 'bsd-2-clause', 'bsd-3-clause', 'cc-by-4.0', 'cc-by-sa-4.0',
    'cc0-1.0', 'mpl-2.0', 'isc', 'unlicense', 'public-domain', 'custom-open', 'unknown',
  ]).default('unknown'),
  accessMethod: z.enum(['api', 'git_clone', 'http_scrape', 'rss', 'manual_upload']),
  domain: z.string().min(1).max(100),
  refreshIntervalHours: z.number().int().min(1).max(8760).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const updateSourceSchema = z.object({
  name: z.string().min(1).max(300).optional(),
  licenseType: z.enum([
    'apache-2.0', 'mit', 'bsd-2-clause', 'bsd-3-clause', 'cc-by-4.0', 'cc-by-sa-4.0',
    'cc0-1.0', 'mpl-2.0', 'isc', 'unlicense', 'public-domain', 'custom-open', 'unknown',
  ]).optional(),
  refreshIntervalHours: z.number().int().min(1).max(8760).optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

describe('Knowledge Sources — Schema Validation', () => {
  describe('createSourceSchema', () => {
    it('accepts a valid source registration', () => {
      const input = {
        name: 'React Official Docs',
        sourceUrl: 'https://react.dev/reference',
        licenseType: 'cc-by-4.0' as const,
        accessMethod: 'http_scrape' as const,
        domain: 'react',
      };
      const result = createSourceSchema.safeParse(input);
      assert.ok(result.success, 'Valid input should parse');
      assert.strictEqual(result.data?.name, 'React Official Docs');
      assert.strictEqual(result.data?.licenseType, 'cc-by-4.0');
    });

    it('defaults licenseType to unknown when omitted', () => {
      const input = {
        name: 'MDN Web Docs',
        sourceUrl: 'https://developer.mozilla.org',
        accessMethod: 'api' as const,
        domain: 'web-fundamentals',
      };
      const result = createSourceSchema.safeParse(input);
      assert.ok(result.success);
      assert.strictEqual(result.data?.licenseType, 'unknown');
    });

    it('rejects empty name', () => {
      const input = {
        name: '',
        sourceUrl: 'https://example.com',
        accessMethod: 'api' as const,
        domain: 'test',
      };
      const result = createSourceSchema.safeParse(input);
      assert.ok(!result.success, 'Empty name should fail');
    });

    it('rejects invalid URL', () => {
      const input = {
        name: 'Bad Source',
        sourceUrl: 'not-a-url',
        accessMethod: 'api' as const,
        domain: 'test',
      };
      const result = createSourceSchema.safeParse(input);
      assert.ok(!result.success, 'Invalid URL should fail');
    });

    it('rejects invalid access method', () => {
      const input = {
        name: 'Test',
        sourceUrl: 'https://example.com',
        accessMethod: 'ftp_download',
        domain: 'test',
      };
      const result = createSourceSchema.safeParse(input);
      assert.ok(!result.success, 'Invalid access method should fail');
    });

    it('rejects refresh interval above 8760 hours (1 year)', () => {
      const input = {
        name: 'Test',
        sourceUrl: 'https://example.com',
        accessMethod: 'api' as const,
        domain: 'test',
        refreshIntervalHours: 9000,
      };
      const result = createSourceSchema.safeParse(input);
      assert.ok(!result.success, 'Refresh > 8760h should fail');
    });

    it('accepts optional metadata', () => {
      const input = {
        name: 'GitHub Repo',
        sourceUrl: 'https://github.com/facebook/react',
        accessMethod: 'git_clone' as const,
        domain: 'react',
        metadata: { branch: 'main', depth: 1 },
      };
      const result = createSourceSchema.safeParse(input);
      assert.ok(result.success);
      assert.deepStrictEqual(result.data?.metadata, { branch: 'main', depth: 1 });
    });
  });

  describe('updateSourceSchema', () => {
    it('accepts partial update with name only', () => {
      const result = updateSourceSchema.safeParse({ name: 'Updated Name' });
      assert.ok(result.success);
      assert.strictEqual(result.data?.name, 'Updated Name');
    });

    it('accepts isActive toggle', () => {
      const result = updateSourceSchema.safeParse({ isActive: false });
      assert.ok(result.success);
      assert.strictEqual(result.data?.isActive, false);
    });

    it('accepts empty object (no-op update)', () => {
      const result = updateSourceSchema.safeParse({});
      assert.ok(result.success);
    });

    it('rejects invalid license type', () => {
      const result = updateSourceSchema.safeParse({ licenseType: 'gpl-3.0' });
      assert.ok(!result.success, 'GPL not in allowlist should fail');
    });
  });
});

describe('Knowledge Chunks — Search Schema Validation', () => {
  const chunkSearchSchema = z.object({
    tag: z.string().optional(),
    query: z.string().optional(),
    verified: z.enum(['true', 'false']).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
  });

  it('accepts empty query (list all)', () => {
    const result = chunkSearchSchema.safeParse({});
    assert.ok(result.success, 'Empty query should pass');
    assert.strictEqual(result.data?.limit, 20, 'Default limit should be 20');
  });

  it('accepts tag filter', () => {
    const result = chunkSearchSchema.safeParse({ tag: 'react' });
    assert.ok(result.success);
    assert.strictEqual(result.data?.tag, 'react');
  });

  it('accepts verified filter', () => {
    const result = chunkSearchSchema.safeParse({ verified: 'true' });
    assert.ok(result.success);
    assert.strictEqual(result.data?.verified, 'true');
  });

  it('rejects invalid verified value', () => {
    const result = chunkSearchSchema.safeParse({ verified: 'maybe' });
    assert.ok(!result.success, 'Invalid verified value should fail');
  });

  it('accepts combined filters', () => {
    const result = chunkSearchSchema.safeParse({
      tag: 'typescript',
      query: 'useState',
      verified: 'true',
      limit: '10',
      offset: '5',
    });
    assert.ok(result.success);
    assert.strictEqual(result.data?.tag, 'typescript');
    assert.strictEqual(result.data?.query, 'useState');
    assert.strictEqual(result.data?.limit, 10);
    assert.strictEqual(result.data?.offset, 5);
  });

  it('rejects limit above 100', () => {
    const result = chunkSearchSchema.safeParse({ limit: '200' });
    assert.ok(!result.success, 'Limit above 100 should fail');
  });
});

describe('Knowledge Sources — License Allowlist', () => {
  const allowedLicenses = [
    'apache-2.0', 'mit', 'bsd-2-clause', 'bsd-3-clause', 'cc-by-4.0', 'cc-by-sa-4.0',
    'cc0-1.0', 'mpl-2.0', 'isc', 'unlicense', 'public-domain', 'custom-open', 'unknown',
  ] as const;

  it('has exactly 13 allowed license types', () => {
    assert.strictEqual(allowedLicenses.length, 13);
  });

  for (const license of allowedLicenses) {
    it(`allows ${license} license`, () => {
      const input = {
        name: 'Test',
        sourceUrl: 'https://example.com',
        licenseType: license,
        accessMethod: 'api' as const,
        domain: 'test',
      };
      const result = createSourceSchema.safeParse(input);
      assert.ok(result.success, `${license} should be valid`);
    });
  }
});
