import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateGateRollout,
  type VerificationResult,
} from '../../src/services/knowledge/verification/VerificationGateEngine.js';

function blockedVerification(blocked: boolean): VerificationResult {
  return {
    overallStatus: blocked ? 'fail' : 'pass',
    blocked,
    summary: blocked ? 'blocked' : 'ok',
    failures: blocked
      ? [
          {
            name: 'groundedness',
            status: 'fail',
            score: 0.2,
            threshold: 0.8,
            message: 'fail',
          },
        ]
      : [],
    warnings: [],
    gates: [],
    meta: {
      riskProfile: 'strict',
      durationMs: 1,
      gatesEvaluated: 1,
    },
  };
}

describe('Verification gate rollout policy', () => {
  it('observe mode never enforces', () => {
    const decision = evaluateGateRollout('observe', 'scribe', blockedVerification(true));
    assert.equal(decision.shouldEnforce, false);
    assert.equal(decision.blockedByPolicy, false);
  });

  it('warn mode never enforces', () => {
    const decision = evaluateGateRollout('warn', 'scribe', blockedVerification(true));
    assert.equal(decision.shouldEnforce, false);
    assert.equal(decision.blockedByPolicy, false);
  });

  it('enforce_scribe enforces only Scribe', () => {
    const scribeDecision = evaluateGateRollout('enforce_scribe', 'scribe', blockedVerification(true));
    assert.equal(scribeDecision.shouldEnforce, true);
    assert.equal(scribeDecision.blockedByPolicy, true);

    const traceDecision = evaluateGateRollout('enforce_scribe', 'trace', blockedVerification(true));
    assert.equal(traceDecision.shouldEnforce, false);
    assert.equal(traceDecision.blockedByPolicy, false);
  });

  it('enforce_all enforces every agent when blocked', () => {
    const decision = evaluateGateRollout('enforce_all', 'trace', blockedVerification(true));
    assert.equal(decision.shouldEnforce, true);
    assert.equal(decision.blockedByPolicy, true);
  });

  it('never enforces when no blocking failure exists', () => {
    const decision = evaluateGateRollout('enforce_all', 'scribe', blockedVerification(false));
    assert.equal(decision.shouldEnforce, false);
    assert.equal(decision.blockedByPolicy, false);
  });

  it('returns to non-blocking behavior after rollback to observe', () => {
    const enforced = evaluateGateRollout('enforce_all', 'scribe', blockedVerification(true));
    assert.equal(enforced.shouldEnforce, true);
    assert.equal(enforced.blockedByPolicy, true);

    const rolledBack = evaluateGateRollout('observe', 'scribe', blockedVerification(true));
    assert.equal(rolledBack.shouldEnforce, false);
    assert.equal(rolledBack.blockedByPolicy, false);
  });
});
