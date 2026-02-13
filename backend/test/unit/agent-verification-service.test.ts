/**
 * Unit tests for AgentVerificationService
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { evaluateAgentResult } from '../../src/services/knowledge/verification/AgentVerificationService.js';

// =============================================================================
// Profile selection tests
// =============================================================================

describe('AgentVerificationService - profile selection', () => {
  it('Scribe result gets strict profile', () => {
    const result = evaluateAgentResult('scribe', {
      metadata: { citationRate: 0.9, hallucinationRate: 0.02, freshnessScore: 0.85 },
    });
    assert.strictEqual(result.meta.riskProfile, 'strict');
  });

  it('Trace result gets standard profile', () => {
    const result = evaluateAgentResult('trace', {
      metadata: { scenarioCount: 8, expectedScenarios: 10 },
    });
    assert.strictEqual(result.meta.riskProfile, 'standard');
  });

  it('Proto result gets relaxed profile', () => {
    const result = evaluateAgentResult('proto', { metadata: { filesCreated: 3 } });
    assert.strictEqual(result.meta.riskProfile, 'relaxed');
  });
});

// =============================================================================
// Scribe-specific tests
// =============================================================================

describe('AgentVerificationService - Scribe', () => {
  it('high-quality Scribe result passes', () => {
    const result = evaluateAgentResult('scribe', {
      metadata: {
        citationCount: 16,
        totalClaims: 20,
        hallucinationRate: 0.02,
        freshnessScore: 0.85,
        groundednessScore: 0.9,
      },
    });
    assert.strictEqual(result.overallStatus, 'pass');
    assert.strictEqual(result.blocked, false);
  });

  it('low-citation Scribe result fails or warns', () => {
    const result = evaluateAgentResult('scribe', {
      metadata: {
        citationCount: 2,
        totalClaims: 20,
        hallucinationRate: 0.03,
        freshnessScore: 0.6,
        groundednessScore: 0.75,
      },
    });
    const citationRate = 2 / 20;
    assert.ok(citationRate < 0.8, 'citation rate should be below strict threshold');
    assert.ok(
      result.overallStatus === 'fail' || result.overallStatus === 'warn' || result.failures.length > 0 || result.warnings.length > 0,
      'Low citation should produce fail or warn'
    );
  });
});

// =============================================================================
// Trace-specific tests
// =============================================================================

describe('AgentVerificationService - Trace', () => {
  it('Trace with good coverage passes', () => {
    const result = evaluateAgentResult('trace', {
      metadata: {
        scenarioCount: 12,
        expectedScenarios: 10,
        groundednessScore: 0.8,
        hallucinationRate: 0.05,
      },
    });
    assert.strictEqual(result.overallStatus, 'pass');
    assert.strictEqual(result.blocked, false);
  });
});

// =============================================================================
// Proto-specific tests
// =============================================================================

describe('AgentVerificationService - Proto', () => {
  it('Proto with any build status passes (relaxed)', () => {
    const resultSuccess = evaluateAgentResult('proto', {
      metadata: { buildSuccess: true, filesCreated: 2 },
    });
    assert.strictEqual(resultSuccess.overallStatus, 'pass');
    assert.strictEqual(resultSuccess.blocked, false);

    const resultFail = evaluateAgentResult('proto', {
      metadata: { buildSuccess: false, filesCreated: 2 },
    });
    assert.strictEqual(resultFail.overallStatus, 'pass');
    assert.strictEqual(resultFail.blocked, false);
  });
});

// =============================================================================
// Edge cases
// =============================================================================

describe('AgentVerificationService - edge cases', () => {
  it('empty or missing result gracefully handled', () => {
    const resultEmpty = evaluateAgentResult('scribe', {});
    assert.ok(resultEmpty.overallStatus === 'pass' || resultEmpty.overallStatus === 'warn');
    assert.ok(typeof resultEmpty.gates === 'object');
    assert.ok(Array.isArray(resultEmpty.failures));
    assert.ok(Array.isArray(resultEmpty.warnings));

    const resultNull = evaluateAgentResult('trace', null);
    assert.ok(resultNull.overallStatus === 'pass' || resultNull.overallStatus === 'warn');

    const resultUndefined = evaluateAgentResult('proto', undefined);
    assert.ok(resultUndefined.overallStatus === 'pass' || resultUndefined.overallStatus === 'warn');
  });
});
