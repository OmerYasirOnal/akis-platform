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

  describe('evidence/attribution quality gate (S0.6)', () => {
    it('penalizes -15 points when context pack used but no citations', () => {
      const input: QualityInput = {
        ...baseInput,
        contextPackId: 'pack-react-v1',
        citationCount: 0,
        verifiedCitationCount: 0,
      };
      const result = computeQualityScore(input);
      const baseline = computeQualityScore(baseInput);

      assert.strictEqual(result.score, baseline.score - 15);
      const evidenceItem = result.breakdown.find(b => b.label === 'Evidence citations');
      assert.ok(evidenceItem, 'Should have evidence breakdown item');
      assert.strictEqual(evidenceItem!.points, -15);
    });

    it('awards bonus for verified citations', () => {
      const input: QualityInput = {
        ...baseInput,
        contextPackId: 'pack-react-v1',
        citationCount: 10,
        verifiedCitationCount: 8,
      };
      const result = computeQualityScore(input);
      const baseline = computeQualityScore(baseInput);

      assert.ok(result.score > baseline.score, 'Verified citations should add bonus');
      const evidenceItem = result.breakdown.find(b => b.label === 'Evidence citations');
      assert.ok(evidenceItem, 'Should have evidence breakdown item');
      assert.strictEqual(evidenceItem!.points, 8); // round(0.8 * 10) = 8
    });

    it('gives 0 points for unverified citations (present but not verified)', () => {
      const input: QualityInput = {
        ...baseInput,
        contextPackId: 'pack-react-v1',
        citationCount: 5,
        verifiedCitationCount: 0,
      };
      const result = computeQualityScore(input);
      const evidenceItem = result.breakdown.find(b => b.label === 'Evidence citations');
      assert.ok(evidenceItem);
      assert.strictEqual(evidenceItem!.points, 0);
    });

    it('does not apply evidence gate when no context pack is used', () => {
      const input: QualityInput = { ...baseInput, contextPackId: null };
      const result = computeQualityScore(input);
      const evidenceItem = result.breakdown.find(b => b.label === 'Evidence citations');
      assert.ok(!evidenceItem, 'No evidence item without context pack');
    });

    it('never produces negative total score', () => {
      const input: QualityInput = {
        ...baseInput,
        targetsConfigured: [],
        targetsProduced: [],
        documentsRead: 0,
        filesProduced: 0,
        docDepth: 'lite',
        multiPass: false,
        contextPackId: 'pack-test',
        citationCount: 0,
      };
      const result = computeQualityScore(input);
      assert.ok(result.score >= 0, `Score should never be negative, got ${result.score}`);
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

  describe('Trace agent quality metrics', () => {
    const traceBaseInput: QualityInput = {
      jobType: 'trace',
      state: 'completed',
      targetsConfigured: ['test-plan.md'],
      targetsProduced: ['test-plan.md'],
      documentsRead: 10,
      filesProduced: 3,
      docDepth: 'standard',
      multiPass: false,
    };

    it('awards bonus for comprehensive scenario count (10+)', () => {
      const input: QualityInput = {
        ...traceBaseInput,
        traceMetrics: {
          scenarioCount: 12,
          priorityBreakdown: { P0: 3, P1: 4, P2: 3, P3: 2 },
          layerBreakdown: { unit: 3, integration: 4, e2e: 5 },
          hasPlaywrightCode: true,
          hasRiskAssessment: true,
          repoScanned: true,
        },
      };
      const result = computeQualityScore(input);
      const scenarioItem = result.breakdown.find(b => b.label === 'Test scenarios');
      assert.ok(scenarioItem, 'Should have Test scenarios breakdown');
      assert.strictEqual(scenarioItem!.points, 5, 'Should get 5 points for 10+ scenarios');
    });

    it('awards bonus for moderate scenario count (5-9)', () => {
      const input: QualityInput = {
        ...traceBaseInput,
        traceMetrics: { scenarioCount: 7 },
      };
      const result = computeQualityScore(input);
      const scenarioItem = result.breakdown.find(b => b.label === 'Test scenarios');
      assert.strictEqual(scenarioItem!.points, 3);
    });

    it('awards no bonus for low scenario count (<5)', () => {
      const input: QualityInput = {
        ...traceBaseInput,
        traceMetrics: { scenarioCount: 2 },
      };
      const result = computeQualityScore(input);
      const scenarioItem = result.breakdown.find(b => b.label === 'Test scenarios');
      assert.strictEqual(scenarioItem!.points, 0);
    });

    it('awards full layer bonus for all 3 layers', () => {
      const input: QualityInput = {
        ...traceBaseInput,
        traceMetrics: {
          scenarioCount: 9,
          layerBreakdown: { unit: 3, integration: 3, e2e: 3 },
        },
      };
      const result = computeQualityScore(input);
      const layerItem = result.breakdown.find(b => b.label === 'Test layers');
      assert.ok(layerItem, 'Should have Test layers breakdown');
      assert.strictEqual(layerItem!.points, 5, 'Should get 5 points for all 3 layers');
    });

    it('awards partial layer bonus for 2 layers', () => {
      const input: QualityInput = {
        ...traceBaseInput,
        traceMetrics: {
          scenarioCount: 6,
          layerBreakdown: { unit: 0, integration: 3, e2e: 3 },
        },
      };
      const result = computeQualityScore(input);
      const layerItem = result.breakdown.find(b => b.label === 'Test layers');
      assert.strictEqual(layerItem!.points, 3, 'Should get 3 points for 2 layers');
    });

    it('awards P0 critical test bonus', () => {
      const input: QualityInput = {
        ...traceBaseInput,
        traceMetrics: {
          scenarioCount: 5,
          priorityBreakdown: { P0: 2, P1: 2, P2: 1, P3: 0 },
        },
      };
      const result = computeQualityScore(input);
      const p0Item = result.breakdown.find(b => b.label === 'Critical tests (P0)');
      assert.ok(p0Item, 'Should have P0 breakdown');
      assert.strictEqual(p0Item!.points, 3);
    });

    it('awards Playwright code generation bonus', () => {
      const input: QualityInput = {
        ...traceBaseInput,
        traceMetrics: {
          scenarioCount: 3,
          hasPlaywrightCode: true,
        },
      };
      const result = computeQualityScore(input);
      const pwItem = result.breakdown.find(b => b.label === 'Executable tests');
      assert.ok(pwItem, 'Should have executable tests breakdown');
      assert.strictEqual(pwItem!.points, 3);
    });

    it('awards risk assessment bonus', () => {
      const input: QualityInput = {
        ...traceBaseInput,
        traceMetrics: {
          scenarioCount: 3,
          hasRiskAssessment: true,
        },
      };
      const result = computeQualityScore(input);
      const riskItem = result.breakdown.find(b => b.label === 'Risk assessment');
      assert.ok(riskItem, 'Should have risk assessment breakdown');
      assert.strictEqual(riskItem!.points, 2);
    });

    it('awards repo scan bonus', () => {
      const input: QualityInput = {
        ...traceBaseInput,
        traceMetrics: {
          scenarioCount: 3,
          repoScanned: true,
        },
      };
      const result = computeQualityScore(input);
      const repoItem = result.breakdown.find(b => b.label === 'Repo analysis');
      assert.ok(repoItem, 'Should have repo analysis breakdown');
      assert.strictEqual(repoItem!.points, 2);
    });

    it('comprehensive trace run achieves high quality score', () => {
      const input: QualityInput = {
        ...traceBaseInput,
        documentsRead: 20,
        filesProduced: 4,
        docDepth: 'deep',
        multiPass: true,
        traceMetrics: {
          scenarioCount: 15,
          priorityBreakdown: { P0: 4, P1: 5, P2: 4, P3: 2 },
          layerBreakdown: { unit: 5, integration: 5, e2e: 5 },
          hasPlaywrightCode: true,
          hasRiskAssessment: true,
          hasCoverageMatrix: true,
          repoScanned: true,
          existingTestCount: 10,
        },
      };
      const result = computeQualityScore(input);
      assert.ok(result.score >= 80, `Comprehensive trace run should score 80+, got ${result.score}`);
    });

    it('suggests multi-layer when only e2e is present', () => {
      const input: QualityInput = {
        ...traceBaseInput,
        docDepth: 'deep',
        multiPass: true,
        targetsProduced: ['test-plan.md'],
        documentsRead: 10,
        traceMetrics: {
          scenarioCount: 5,
          layerBreakdown: { unit: 0, integration: 0, e2e: 5 },
          hasPlaywrightCode: true,
          hasRiskAssessment: true,
          repoScanned: true,
        },
      };
      const result = computeQualityScore(input);
      const suggestions = generateQualitySuggestions(result, input);
      assert.ok(suggestions.some(s => s.includes('layers')), 'Should suggest multi-layer coverage');
    });

    it('suggests P0 tests when none present', () => {
      const input: QualityInput = {
        ...traceBaseInput,
        docDepth: 'deep',
        multiPass: true,
        traceMetrics: {
          scenarioCount: 5,
          priorityBreakdown: { P0: 0, P1: 2, P2: 2, P3: 1 },
        },
      };
      const result = computeQualityScore(input);
      const suggestions = generateQualitySuggestions(result, input);
      assert.ok(suggestions.some(s => s.includes('P0')), 'Should suggest adding P0 tests');
    });
  });
});
