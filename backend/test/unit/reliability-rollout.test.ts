import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { resolveReliabilityRollout } from '../../src/core/orchestrator/ReliabilityRollout.js';

describe('Reliability rollout canary policy', () => {
  it('uses configured modes when canary is disabled', () => {
    const decision = resolveReliabilityRollout(
      {
        contractMode: 'enforce',
        gateMode: 'enforce_all',
        canaryEnabled: false,
        canarySalt: 'test-salt',
        contractCanaryPercent: 10,
        gateCanaryPercent: 10,
      },
      'user-1'
    );

    assert.equal(decision.contract.effectiveMode, 'enforce');
    assert.equal(decision.gate.effectiveMode, 'enforce_all');
  });

  it('falls back to observe for 0% canary', () => {
    const decision = resolveReliabilityRollout(
      {
        contractMode: 'enforce',
        gateMode: 'enforce_scribe',
        canaryEnabled: true,
        canarySalt: 'test-salt',
        contractCanaryPercent: 0,
        gateCanaryPercent: 0,
      },
      'user-2'
    );

    assert.equal(decision.contract.effectiveMode, 'observe');
    assert.equal(decision.gate.effectiveMode, 'observe');
    assert.equal(decision.contract.inCanary, false);
    assert.equal(decision.gate.inCanary, false);
  });

  it('keeps configured modes for 100% canary', () => {
    const decision = resolveReliabilityRollout(
      {
        contractMode: 'enforce',
        gateMode: 'enforce_scribe',
        canaryEnabled: true,
        canarySalt: 'test-salt',
        contractCanaryPercent: 100,
        gateCanaryPercent: 100,
      },
      'user-3'
    );

    assert.equal(decision.contract.effectiveMode, 'enforce');
    assert.equal(decision.gate.effectiveMode, 'enforce_scribe');
    assert.equal(decision.contract.inCanary, true);
    assert.equal(decision.gate.inCanary, true);
  });

  it('supports mixed rollout percentages per feature', () => {
    const decision = resolveReliabilityRollout(
      {
        contractMode: 'enforce',
        gateMode: 'enforce_all',
        canaryEnabled: true,
        canarySalt: 'test-salt',
        contractCanaryPercent: 100,
        gateCanaryPercent: 0,
      },
      'user-4'
    );

    assert.equal(decision.contract.effectiveMode, 'enforce');
    assert.equal(decision.gate.effectiveMode, 'observe');
  });

  it('uses observe when canary enabled but user id is missing', () => {
    const decision = resolveReliabilityRollout(
      {
        contractMode: 'enforce',
        gateMode: 'enforce_all',
        canaryEnabled: true,
        canarySalt: 'test-salt',
        contractCanaryPercent: 100,
        gateCanaryPercent: 100,
      },
      undefined
    );

    assert.equal(decision.contract.effectiveMode, 'observe');
    assert.equal(decision.gate.effectiveMode, 'observe');
    assert.equal(decision.contract.bucket, null);
    assert.equal(decision.gate.bucket, null);
  });
});
