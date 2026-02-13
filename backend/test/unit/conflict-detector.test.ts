/**
 * Unit tests for M2-KI-3: ConflictDetector
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  ConflictDetector,
  type ConflictSource,
} from '../../src/services/knowledge/verification/ConflictDetector.js';

describe('ConflictDetector', () => {
  const detector = new ConflictDetector();

  describe('direct contradiction detection', () => {
    it('detects negation-based contradictions', () => {
      const sources: ConflictSource[] = [
        {
          id: 'src-1',
          content: 'Feature X is supported in the latest version.',
          origin: 'docs',
        },
        {
          id: 'src-2',
          content: 'Feature X is not supported in the latest version.',
          origin: 'changelog',
        },
      ];

      const result = detector.detect(sources);
      assert.ok(result.conflicts.length > 0, 'Expected at least one conflict');
      assert.ok(result.conflicts.some(c => c.type === 'direct_contradiction'));
      assert.ok(result.hasCriticalConflicts);
    });

    it('detects enabled/disabled contradictions', () => {
      const sources: ConflictSource[] = [
        {
          id: 'src-1',
          content: 'The CORS module is enabled by default in production.',
          origin: 'config-docs',
        },
        {
          id: 'src-2',
          content: 'The CORS module is disabled by default in production.',
          origin: 'changelog',
        },
      ];

      const result = detector.detect(sources);
      assert.ok(result.conflicts.length > 0);
    });

    it('returns no conflict for agreeing sources', () => {
      const sources: ConflictSource[] = [
        {
          id: 'src-1',
          content: 'PostgreSQL is a relational database system.',
          origin: 'docs',
        },
        {
          id: 'src-2',
          content: 'PostgreSQL supports SQL queries and ACID transactions.',
          origin: 'wiki',
        },
      ];

      const result = detector.detect(sources);
      assert.strictEqual(result.conflicts.length, 0);
    });
  });

  describe('version conflict detection', () => {
    it('detects version mismatches for same context', () => {
      const sources: ConflictSource[] = [
        {
          id: 'src-1',
          content: 'The minimum required Node.js version is 18.0.0 for this project.',
          origin: 'readme',
        },
        {
          id: 'src-2',
          content: 'The minimum required Node.js version is 20.0.0 for this project.',
          origin: 'package.json',
        },
      ];

      const result = detector.detect(sources);
      const versionConflicts = result.conflicts.filter(c => c.type === 'version_conflict');
      assert.ok(versionConflicts.length > 0, 'Expected at least one version conflict');
    });
  });

  describe('temporal conflict detection', () => {
    it('detects temporal conflicts for old sources', () => {
      const now = new Date();
      const oldDate = new Date(now.getTime() - 200 * 24 * 60 * 60 * 1000); // 200 days ago

      const sources: ConflictSource[] = [
        {
          id: 'src-old',
          content: 'The authentication module uses JWT tokens for session management.',
          origin: 'old-docs',
          timestamp: oldDate,
        },
        {
          id: 'src-new',
          content: 'The authentication module uses HTTP-only cookies for session management.',
          origin: 'new-docs',
          timestamp: now,
        },
      ];

      const result = detector.detect(sources);
      const temporalConflicts = result.conflicts.filter(c => c.type === 'temporal_conflict');
      assert.ok(temporalConflicts.length > 0, 'Expected temporal conflict for old sources');
    });

    it('ignores temporal difference for recent sources', () => {
      const now = new Date();
      const recent = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

      const sources: ConflictSource[] = [
        {
          id: 'src-1',
          content: 'React uses virtual DOM.',
          origin: 'docs',
          timestamp: recent,
        },
        {
          id: 'src-2',
          content: 'React renders with virtual DOM.',
          origin: 'blog',
          timestamp: now,
        },
      ];

      const result = detector.detect(sources);
      const temporalConflicts = result.conflicts.filter(c => c.type === 'temporal_conflict');
      assert.strictEqual(temporalConflicts.length, 0);
    });
  });

  describe('checkAgainstSources', () => {
    it('checks new text against existing sources', () => {
      const existingSources: ConflictSource[] = [
        {
          id: 'existing-1',
          content: 'The API rate limit is enabled for all endpoints.',
          origin: 'api-docs',
        },
      ];

      const newText = 'The API rate limit is not enabled for public endpoints.';

      const conflicts = detector.checkAgainstSources(newText, existingSources);
      assert.ok(conflicts.length > 0, 'Expected conflict with existing source');
    });

    it('returns empty for non-conflicting text', () => {
      const existingSources: ConflictSource[] = [
        {
          id: 'existing-1',
          content: 'The database uses PostgreSQL.',
          origin: 'docs',
        },
      ];

      const newText = 'The frontend is built with React and TypeScript.';

      const conflicts = detector.checkAgainstSources(newText, existingSources);
      assert.strictEqual(conflicts.length, 0);
    });
  });

  describe('stats computation', () => {
    it('computes correct statistics', () => {
      const sources: ConflictSource[] = [
        {
          id: 'src-1',
          content: 'Feature X is supported in all browsers.',
          origin: 'docs',
        },
        {
          id: 'src-2',
          content: 'Feature X is not supported in IE.',
          origin: 'compat-table',
        },
      ];

      const result = detector.detect(sources);
      assert.ok(typeof result.stats.totalConflicts === 'number');
      assert.ok(typeof result.stats.critical === 'number');
      assert.ok(typeof result.stats.major === 'number');
      assert.ok(typeof result.stats.minor === 'number');
      assert.strictEqual(
        result.stats.critical + result.stats.major + result.stats.minor,
        result.stats.totalConflicts,
      );
    });
  });

  describe('empty/edge cases', () => {
    it('returns empty for no sources', () => {
      const result = detector.detect([]);
      assert.strictEqual(result.conflicts.length, 0);
      assert.strictEqual(result.meta.sourcesAnalyzed, 0);
    });

    it('returns empty for single source', () => {
      const result = detector.detect([{
        id: 'src-1',
        content: 'Some content.',
        origin: 'docs',
      }]);
      assert.strictEqual(result.conflicts.length, 0);
      assert.strictEqual(result.meta.pairsChecked, 0);
    });

    it('assigns unique conflict IDs', () => {
      const sources: ConflictSource[] = [
        { id: 'a', content: 'Module is enabled by default.', origin: 'docs' },
        { id: 'b', content: 'Module is disabled by default.', origin: 'readme' },
        { id: 'c', content: 'Module is not enabled.', origin: 'changelog' },
      ];

      const result = detector.detect(sources);
      const ids = result.conflicts.map(c => c.id);
      const uniqueIds = new Set(ids);
      assert.strictEqual(ids.length, uniqueIds.size, 'All conflict IDs should be unique');
    });

    it('prefers higher confidence source', () => {
      const sources: ConflictSource[] = [
        {
          id: 'src-low',
          content: 'Feature is supported in all cases.',
          origin: 'blog',
          confidence: 0.3,
        },
        {
          id: 'src-high',
          content: 'Feature is not supported in all cases.',
          origin: 'official-docs',
          confidence: 0.9,
        },
      ];

      const result = detector.detect(sources);
      if (result.conflicts.length > 0) {
        assert.strictEqual(result.conflicts[0].preferredSource, 'B');
      }
    });
  });
});
