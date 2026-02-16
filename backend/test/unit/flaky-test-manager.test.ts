import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FlakyTestManager } from '../../src/services/trace/FlakyTestManager.js';

describe('FlakyTestManager', () => {
  it('retries once for non-fast strictness and detects flaky-pass', async () => {
    const manager = new FlakyTestManager();
    let callCount = 0;

    const result = await manager.evaluate(
      async () => {
        callCount += 1;
        if (callCount === 1) {
          return {
            runner: 'playwright' as const,
            mode: 'real' as const,
            totalFeatures: 1,
            passedFeatures: 0,
            failedFeatures: 1,
            totalScenarios: 1,
            passedScenarios: 0,
            failedScenarios: 1,
            passRate: 0,
            durationMs: 10,
            failures: [{ feature: 'auth', scenario: 'Login scenario', reason: 'timeout' }],
            generatedTestPath: '/tmp/spec.ts',
          };
        }
        return {
          runner: 'playwright' as const,
          mode: 'real' as const,
          totalFeatures: 1,
          passedFeatures: 1,
          failedFeatures: 0,
          totalScenarios: 1,
          passedScenarios: 1,
          failedScenarios: 0,
          passRate: 100,
          durationMs: 10,
          failures: [],
          generatedTestPath: '/tmp/spec.ts',
        };
      },
      [{ name: 'Login scenario', priority: 'P2', flakinessRisk: 'high' }],
      { strictness: 'balanced' }
    );

    assert.strictEqual(callCount, 2);
    assert.strictEqual(result.flaky.retryCount, 1);
    assert.deepStrictEqual(result.flaky.flakyPassedScenarios, ['Login scenario']);
    assert.ok(result.flaky.pfsLite > 0);
  });

  it('does not retry in fast mode', async () => {
    const manager = new FlakyTestManager();
    let callCount = 0;

    await manager.evaluate(
      async () => {
        callCount += 1;
        return {
          runner: 'playwright' as const,
          mode: 'real' as const,
          totalFeatures: 1,
          passedFeatures: 0,
          failedFeatures: 1,
          totalScenarios: 1,
          passedScenarios: 0,
          failedScenarios: 1,
          passRate: 0,
          durationMs: 10,
          failures: [{ feature: 'auth', scenario: 'Auth scenario', reason: 'failed' }],
          generatedTestPath: '/tmp/spec.ts',
        };
      },
      [{ name: 'Auth scenario', priority: 'P0', flakinessRisk: 'medium' }],
      { strictness: 'fast' }
    );

    assert.strictEqual(callCount, 1);
  });
});

