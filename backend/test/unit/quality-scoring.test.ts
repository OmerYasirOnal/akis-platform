/**
 * Quality Scoring Unit Tests
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { 
  computeQualityScore, 
  generateQualitySuggestions, 
  QUALITY_VERSION,
  type QualityInput 
} from '../../src/services/quality/index.js';

const baseInput: QualityInput = {
  jobType: 'scribe',
  state: 'completed',
  targetsConfigured: ['readme', 'api'],
  targetsProduced: ['readme', 'api'],
  documentsRead: 5,
  filesProduced: 2,
  docDepth: 'standard',
  multiPass: false,
};

describe('QualityScoring', () => {
  describe('computeQualityScore', () => {
    it('calculates score for successful job with full coverage', () => {
      const result = computeQualityScore(baseInput);
      
      assert.ok(result.score > 0, 'Score should be greater than 0');
      assert.ok(result.score <= 100, 'Score should not exceed 100');
      assert.strictEqual(result.version, QUALITY_VERSION);
      assert.ok(result.breakdown.length > 0, 'Should have breakdown items');
    });

    it('returns 0 score for failed job', () => {
      const input: QualityInput = {
        ...baseInput,
        state: 'failed',
        errorCode: 'AI_PROVIDER_ERROR',
      };
      
      const result = computeQualityScore(input);
      
      assert.strictEqual(result.score, 0);
      assert.strictEqual(result.breakdown[0].label, 'Job status');
      assert.ok(result.breakdown[0].value.includes('Failed'));
    });

    it('awards higher score for deep analysis mode', () => {
      const standardResult = computeQualityScore({ ...baseInput, docDepth: 'standard' });
      const deepResult = computeQualityScore({ ...baseInput, docDepth: 'deep' });
      
      assert.ok(deepResult.score > standardResult.score, 'Deep mode should have higher score');
    });

    it('awards multi-pass bonus', () => {
      const singleResult = computeQualityScore({ ...baseInput, multiPass: false });
      const multiResult = computeQualityScore({ ...baseInput, multiPass: true });
      
      assert.strictEqual(multiResult.score, singleResult.score + 15);
    });

    it('normalizes configured and produced target identifiers before matching', () => {
      const result = computeQualityScore({
        ...baseInput,
        targetsConfigured: ['docs/README.md', 'docs/API.md'],
        targetsProduced: ['README', 'API'],
      });

      const coverage = result.breakdown.find((item) => item.label === 'Target coverage');
      assert.strictEqual(coverage?.points, 30);
      assert.ok(result.score >= 60);
    });

    it('handles scoped runs with inferred targets when outputTargets is empty', () => {
      const result = computeQualityScore({
        ...baseInput,
        targetsConfigured: [],
        targetsProduced: [],
        documentsRead: 4,
        filesProduced: 1,
      });

      assert.ok(result.score >= 70, `expected scoped run score >= 70, got ${result.score}`);
    });

    it('keeps score low when there is no produced output', () => {
      const result = computeQualityScore({
        ...baseInput,
        targetsConfigured: [],
        targetsProduced: [],
        documentsRead: 0,
        filesProduced: 0,
        docDepth: 'standard',
      });

      assert.ok(result.score < 60, `expected failing score < 60, got ${result.score}`);
    });
  });

  describe('generateQualitySuggestions', () => {
    it('suggests provider check for AI_PROVIDER_ERROR', () => {
      const input: QualityInput = {
        ...baseInput,
        state: 'failed',
        errorCode: 'AI_PROVIDER_ERROR',
      };
      const result = computeQualityScore(input);
      const suggestions = generateQualitySuggestions(result, input);
      
      assert.ok(suggestions.some(s => s.includes('AI provider')), 'Should suggest AI provider check');
    });

    it('suggests deep mode when using standard', () => {
      const result = computeQualityScore(baseInput);
      const suggestions = generateQualitySuggestions(result, baseInput);
      
      assert.ok(suggestions.some(s => s.includes('deep')), 'Should suggest deep mode');
    });

    it('returns max 2 suggestions', () => {
      const input: QualityInput = {
        ...baseInput,
        targetsProduced: [],
        documentsRead: 1,
        filesProduced: 0,
        docDepth: 'lite',
        multiPass: false,
      };
      const result = computeQualityScore(input);
      const suggestions = generateQualitySuggestions(result, input);
      
      assert.ok(suggestions.length <= 2, 'Should return max 2 suggestions');
    });
  });
});
