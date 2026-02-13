/**
 * Unit tests for M2 Verification system:
 * - ClaimDecomposer (heuristic mode)
 * - GroundednessScorer
 * - VerificationGateEngine
 * - Agent Risk Profiles
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { ClaimDecomposer } from '../../src/services/knowledge/verification/ClaimDecomposer.js';
import {
  GroundednessScorer,
  type EvidenceSource,
  type EvidenceMatch,
} from '../../src/services/knowledge/verification/GroundednessScorer.js';
import {
  VerificationGateEngine,
  type GateInput,
} from '../../src/services/knowledge/verification/VerificationGateEngine.js';
import {
  getAgentRiskConfig,
  getAllAgentRiskConfigs,
  createAgentVerificationEngine,
} from '../../src/config/agentRiskProfiles.js';

// =============================================================================
// ClaimDecomposer Tests
// =============================================================================

describe('ClaimDecomposer', () => {
  let decomposer: ClaimDecomposer;

  beforeEach(() => {
    decomposer = new ClaimDecomposer(); // no AI → heuristic mode
  });

  it('extracts claims from technical text', async () => {
    const text = `
      React uses a virtual DOM for efficient rendering.
      The useState hook returns an array with two elements.
      Node.js v20 supports ES modules natively.
      PostgreSQL 14 introduced the MERGE statement.
    `;

    const result = await decomposer.decompose(text);

    assert.ok(result.claims.length >= 3, `Expected ≥3 claims, got ${result.claims.length}`);
    assert.ok(result.stats.totalClaims >= 3);
    assert.ok(result.stats.avgFactuality > 0);
    assert.ok(result.meta.inputLength > 0);
    assert.ok(result.meta.durationMs >= 0);
  });

  it('skips subjective/non-factual sentences', async () => {
    const text = `
      You should consider using TypeScript.
      It is recommended to always validate input.
      We can probably improve this later.
      Note: this is just a placeholder.
    `;

    const result = await decomposer.decompose(text);
    assert.ok(result.claims.length === 0, `Expected 0 claims for subjective text, got ${result.claims.length}`);
  });

  it('categorizes claims correctly', async () => {
    const text = `
      GET /api/users returns a 200 status code with a JSON array.
      The function fetchData accepts a string parameter and returns a Promise.
      Requires PostgreSQL 14 or higher as a dependency.
    `;

    const result = await decomposer.decompose(text);

    const categories = result.claims.map(c => c.category);
    assert.ok(
      categories.includes('api_behavior') || categories.includes('code_assertion') || categories.includes('dependency'),
      `Expected specific categories, got: ${categories.join(', ')}`,
    );
  });

  it('respects maxClaims option', async () => {
    const text = `
      React uses JSX syntax.
      Vue uses template syntax.
      Angular uses decorators.
      Svelte compiles to vanilla JS.
      Node.js runs on V8 engine.
    `;

    const result = await decomposer.decompose(text, { maxClaims: 2 });
    assert.ok(result.claims.length <= 2);
  });

  it('respects minFactuality filter', async () => {
    const text = `
      The library might improve performance.
      PostgreSQL 14 introduced MERGE statement.
    `;

    const highThreshold = await decomposer.decompose(text, { minFactuality: 0.8 });
    const lowThreshold = await decomposer.decompose(text, { minFactuality: 0.1 });

    assert.ok(lowThreshold.claims.length >= highThreshold.claims.length);
  });

  it('extracts citations from text with URLs', async () => {
    const text = `
      According to https://nodejs.org/docs, Node.js uses an event-driven architecture.
      The official docs at [React docs](https://reactjs.org) explain the component lifecycle.
    `;

    const result = await decomposer.decompose(text);
    const withCitations = result.claims.filter(c => c.citations && c.citations.length > 0);
    assert.ok(withCitations.length > 0, 'Expected at least one claim with citations');
  });

  it('assigns unique IDs to all claims', async () => {
    const text = `
      TypeScript supports generics.
      JavaScript has prototype-based inheritance.
      Python uses indentation for blocks.
    `;

    const result = await decomposer.decompose(text);
    const ids = result.claims.map(c => c.id);
    const uniqueIds = new Set(ids);
    assert.strictEqual(ids.length, uniqueIds.size, 'All claim IDs should be unique');
  });

  it('returns empty result for empty text', async () => {
    const result = await decomposer.decompose('');
    assert.strictEqual(result.claims.length, 0);
    assert.strictEqual(result.stats.totalClaims, 0);
  });
});

// =============================================================================
// GroundednessScorer Tests
// =============================================================================

describe('GroundednessScorer', () => {
  it('returns 1.0 for empty text (no claims)', async () => {
    const scorer = new GroundednessScorer();
    const result = await scorer.score('');
    assert.strictEqual(result.overallScore, 1.0);
    assert.ok(result.passed);
  });

  it('produces scores for text with claims', async () => {
    const scorer = new GroundednessScorer();
    const result = await scorer.score(`
      React uses a virtual DOM.
      Node.js v20 supports ES modules.
      PostgreSQL is a relational database.
    `);

    assert.ok(result.overallScore >= 0 && result.overallScore <= 1);
    assert.ok(result.claimScores.length >= 1);
    assert.ok(result.meta.durationMs >= 0);
  });

  it('marks unsupported claims when no evidence sources', async () => {
    const scorer = new GroundednessScorer();
    const result = await scorer.score('PostgreSQL 14 introduced the MERGE statement.');

    const unsupported = result.claimScores.filter(cs => cs.verdict === 'unsupported');
    assert.ok(unsupported.length > 0 || result.claimScores.length === 0);
  });

  it('uses evidence sources when provided', async () => {
    const mockSource: EvidenceSource = {
      type: 'knowledge_base',
      name: 'test-source',
      search: async (query: string): Promise<EvidenceMatch[]> => {
        if (query.toLowerCase().includes('react')) {
          return [{
            source: 'react-docs',
            content: 'React uses a virtual DOM to minimize direct DOM manipulation.',
            relevance: 0.9,
            type: 'knowledge_base',
          }];
        }
        return [];
      },
    };

    const scorer = new GroundednessScorer(undefined, [mockSource]);
    const result = await scorer.score('React uses a virtual DOM for efficient rendering.');

    assert.ok(result.overallScore > 0);
    assert.ok(result.meta.evidenceSourcesSearched === 1);
  });

  it('quickScore returns a number between 0 and 1', () => {
    const scorer = new GroundednessScorer();
    const score = scorer.quickScore('TypeScript supports static typing and generics.');
    assert.ok(score >= 0 && score <= 1, `Score ${score} out of range`);
  });

  it('quickScore returns 1.0 for empty text', () => {
    const scorer = new GroundednessScorer();
    assert.strictEqual(scorer.quickScore(''), 1.0);
  });

  it('computes stats correctly', async () => {
    const scorer = new GroundednessScorer();
    const result = await scorer.score(`
      Node.js is a JavaScript runtime.
      Express is a web framework for Node.js.
    `);

    assert.ok(typeof result.stats.totalClaims === 'number');
    assert.ok(typeof result.stats.supported === 'number');
    assert.ok(typeof result.stats.unsupported === 'number');
    assert.ok(typeof result.stats.contradicted === 'number');
    assert.strictEqual(
      result.stats.supported + result.stats.partiallySupported + result.stats.unsupported + result.stats.contradicted,
      result.stats.totalClaims,
    );
  });
});

// =============================================================================
// VerificationGateEngine Tests
// =============================================================================

describe('VerificationGateEngine', () => {
  let engine: VerificationGateEngine;

  beforeEach(() => {
    engine = new VerificationGateEngine('standard');
  });

  it('passes all gates when scores are high', () => {
    const input: GateInput = {
      groundednessScore: 0.9,
      weightedGroundednessScore: 0.9,
      citationRate: 0.8,
      freshnessScore: 0.85,
      hallucinationRate: 0.02,
      topicCoverage: 0.9,
    };

    const result = engine.evaluate(input);
    assert.strictEqual(result.overallStatus, 'pass');
    assert.strictEqual(result.blocked, false);
    assert.strictEqual(result.failures.length, 0);
  });

  it('fails when blocking gate fails', () => {
    const input: GateInput = {
      groundednessScore: 0.3, // below standard threshold (0.7)
      hallucinationRate: 0.5, // way above threshold (0.1)
    };

    const result = engine.evaluate(input);
    assert.strictEqual(result.overallStatus, 'fail');
    assert.strictEqual(result.blocked, true);
    assert.ok(result.failures.length > 0);
  });

  it('warns when non-blocking gate fails', () => {
    const input: GateInput = {
      groundednessScore: 0.8,
      hallucinationRate: 0.05,
      freshnessScore: 0.2, // below threshold but non-blocking
    };

    const result = engine.evaluate(input);
    // Freshness failure should not block
    const freshnessGate = result.gates.find(g => g.name === 'freshness');
    if (freshnessGate) {
      assert.strictEqual(freshnessGate.status, 'fail');
    }
    assert.strictEqual(result.blocked, false);
  });

  it('respects strict profile thresholds', () => {
    const strictEngine = new VerificationGateEngine('strict');
    const input: GateInput = {
      groundednessScore: 0.65, // below strict warn threshold (0.7) → fail
      hallucinationRate: 0.03,
    };

    const result = strictEngine.evaluate(input);
    const groundednessGate = result.gates.find(g => g.name === 'groundedness');
    assert.ok(groundednessGate);
    assert.strictEqual(groundednessGate!.status, 'fail');
  });

  it('respects relaxed profile thresholds', () => {
    const relaxedEngine = new VerificationGateEngine('relaxed');
    const input: GateInput = {
      groundednessScore: 0.55, // fails standard (0.7) but passes relaxed (0.5)
      hallucinationRate: 0.15, // fails standard (0.1) but passes relaxed (0.2)
    };

    const result = relaxedEngine.evaluate(input);
    assert.strictEqual(result.blocked, false);
  });

  it('skips disabled gates', () => {
    const relaxedEngine = new VerificationGateEngine('relaxed');
    const input: GateInput = {
      freshnessScore: 0.1, // would fail but freshness is disabled in relaxed
    };

    const result = relaxedEngine.evaluate(input);
    const freshnessGate = result.gates.find(g => g.name === 'freshness');
    assert.strictEqual(freshnessGate, undefined, 'Disabled gate should not appear in results');
  });

  it('skips gates when input metrics are missing', () => {
    const result = engine.evaluate({}); // empty input
    assert.strictEqual(result.gates.length, 0);
    assert.strictEqual(result.overallStatus, 'pass'); // no gates = pass
  });

  it('returns correct summary text', () => {
    const allPass: GateInput = {
      groundednessScore: 0.9,
      hallucinationRate: 0.01,
    };

    const result = engine.evaluate(allPass);
    assert.ok(result.summary.includes('passed'));
  });

  it('setProfile changes the engine profile', () => {
    engine.setProfile('strict');
    const config = engine.getProfileConfig();
    assert.strictEqual(config.riskProfile, 'strict');
  });

  it('overrideGate modifies specific gate thresholds', () => {
    const overrideEngine = new VerificationGateEngine('standard');
    overrideEngine.overrideGate('groundedness', { passThreshold: 0.99, warnThreshold: 0.98 });

    const input: GateInput = { groundednessScore: 0.95 };
    const result = overrideEngine.evaluate(input);
    const gate = result.gates.find(g => g.name === 'groundedness');
    assert.ok(gate);
    assert.strictEqual(gate!.status, 'fail'); // 0.95 < 0.98 (warn) < 0.99 (pass)
  });

  it('getAvailableProfiles returns all three profiles', () => {
    const profiles = VerificationGateEngine.getAvailableProfiles();
    assert.deepStrictEqual(profiles, ['strict', 'standard', 'relaxed']);
  });
});

// =============================================================================
// Agent Risk Profiles Tests
// =============================================================================

describe('Agent Risk Profiles', () => {
  it('returns strict profile for scribe', () => {
    const config = getAgentRiskConfig('scribe');
    assert.strictEqual(config.riskProfile, 'strict');
    assert.strictEqual(config.agentType, 'scribe');
    assert.ok(config.rationale.length > 0);
  });

  it('returns standard profile for trace', () => {
    const config = getAgentRiskConfig('trace');
    assert.strictEqual(config.riskProfile, 'standard');
  });

  it('returns relaxed profile for proto', () => {
    const config = getAgentRiskConfig('proto');
    assert.strictEqual(config.riskProfile, 'relaxed');
  });

  it('returns strict profile for piri', () => {
    const config = getAgentRiskConfig('piri');
    assert.strictEqual(config.riskProfile, 'strict');
    assert.ok(config.gateOverrides?.groundedness?.passThreshold === 0.85);
  });

  it('returns default standard for unknown agent', () => {
    const config = getAgentRiskConfig('unknown-agent');
    assert.strictEqual(config.riskProfile, 'standard');
  });

  it('getAllAgentRiskConfigs returns 4 configs', () => {
    const configs = getAllAgentRiskConfigs();
    assert.strictEqual(configs.length, 4);
    const types = configs.map(c => c.agentType);
    assert.ok(types.includes('scribe'));
    assert.ok(types.includes('trace'));
    assert.ok(types.includes('proto'));
    assert.ok(types.includes('piri'));
  });

  it('createAgentVerificationEngine returns profile + overrides', () => {
    const { riskProfile, overrides } = createAgentVerificationEngine('scribe');
    assert.strictEqual(riskProfile, 'strict');
    assert.ok(overrides.citation);
    assert.ok(overrides.hallucination);
  });

  it('piri has strictest hallucination threshold', () => {
    const piri = getAgentRiskConfig('piri');
    const scribe = getAgentRiskConfig('scribe');
    const trace = getAgentRiskConfig('trace');

    const piriThreshold = piri.gateOverrides?.hallucination?.passThreshold ?? 1;
    const scribeThreshold = scribe.gateOverrides?.hallucination?.passThreshold ?? 1;
    const traceThreshold = trace.gateOverrides?.hallucination?.passThreshold ?? 1;

    assert.ok(piriThreshold <= scribeThreshold, 'Piri should have stricter hallucination threshold than Scribe');
    assert.ok(piriThreshold <= traceThreshold, 'Piri should have stricter hallucination threshold than Trace');
  });
});
