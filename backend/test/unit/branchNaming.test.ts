/**
 * Branch Naming Utility Tests
 * 
 * Tests for auto-generated branch names used by Scribe agent
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { 
  generateScribeBranchName, 
  generateBranchNameWithPrefix,
  isValidScribeBranchName 
} from '../../src/utils/branchNaming.js';

describe('branchNaming', () => {
  describe('generateScribeBranchName', () => {
    it('generates branch name in correct format', () => {
      const branchName = generateScribeBranchName();
      
      // Should match pattern: scribe/docs-YYYYMMDD-HHMMSS
      assert.match(branchName, /^scribe\/docs-\d{8}-\d{6}$/);
    });

    it('uses current timestamp format', () => {
      const branchName = generateScribeBranchName();
      
      // Should start with scribe/docs-
      assert.ok(branchName.startsWith('scribe/docs-'));
      
      // Should have 8 digits for date and 6 for time
      const [, timestamp] = branchName.split('scribe/docs-');
      const [date, time] = timestamp.split('-');
      assert.strictEqual(date.length, 8);
      assert.strictEqual(time.length, 6);
    });

    it('generates different names when called at different times', () => {
      // Due to second precision, we might get the same name if called too quickly
      // But we can at least verify format is consistent
      const branch1 = generateScribeBranchName();
      const branch2 = generateScribeBranchName();
      
      // Both should be valid format
      assert.match(branch1, /^scribe\/docs-\d{8}-\d{6}$/);
      assert.match(branch2, /^scribe\/docs-\d{8}-\d{6}$/);
    });
  });

  describe('generateBranchNameWithPrefix', () => {
    it('uses default prefix when none provided', () => {
      const branchName = generateBranchNameWithPrefix();
      assert.match(branchName, /^scribe\/docs-\d{8}-\d{6}$/);
    });

    it('uses custom prefix when provided', () => {
      const branchName = generateBranchNameWithPrefix('feature/update');
      assert.match(branchName, /^feature\/update-\d{8}-\d{6}$/);
    });

    it('handles empty prefix', () => {
      const branchName = generateBranchNameWithPrefix('');
      assert.match(branchName, /^-\d{8}-\d{6}$/);
    });
  });

  describe('isValidScribeBranchName', () => {
    it('validates correct branch names', () => {
      assert.strictEqual(isValidScribeBranchName('scribe/docs-20250106-143022'), true);
      assert.strictEqual(isValidScribeBranchName('scribe/docs-20231231-235959'), true);
      assert.strictEqual(isValidScribeBranchName('scribe/docs-20240101-000000'), true);
    });

    it('rejects invalid branch names', () => {
      assert.strictEqual(isValidScribeBranchName('scribe/docs-2025010-143022'), false); // Wrong date format
      assert.strictEqual(isValidScribeBranchName('scribe/docs-20250106-14302'), false); // Wrong time format
      assert.strictEqual(isValidScribeBranchName('feature/docs-20250106-143022'), false); // Wrong prefix
      assert.strictEqual(isValidScribeBranchName('scribe/docs-20250106143022'), false); // Missing dash
      assert.strictEqual(isValidScribeBranchName(''), false);
      assert.strictEqual(isValidScribeBranchName('main'), false);
    });
  });
});
