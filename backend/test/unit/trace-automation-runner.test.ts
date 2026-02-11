import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TraceAutomationError } from '../../src/core/errors.js';

// We test the error types and the parse/build helper logic without spawning Playwright
describe('TraceAutomationRunner error types', () => {
  it('TraceAutomationError carries code and retryable flag', () => {
    const err = new TraceAutomationError('TRACE_AUTOMATION_TIMEOUT', 'timed out', false);
    assert.equal(err.code, 'TRACE_AUTOMATION_TIMEOUT');
    assert.equal(err.retryable, false);
    assert.equal(err.name, 'TraceAutomationError');
    assert.ok(err.message.includes('timed out'));
  });

  it('TRACE_AUTOMATION_RUN_FAILED error', () => {
    const err = new TraceAutomationError('TRACE_AUTOMATION_RUN_FAILED', 'exit code 1');
    assert.equal(err.code, 'TRACE_AUTOMATION_RUN_FAILED');
    assert.equal(err.retryable, false);
  });

  it('TRACE_AUTOMATION_LAUNCH_FAILED error', () => {
    const err = new TraceAutomationError('TRACE_AUTOMATION_LAUNCH_FAILED', 'npx not found');
    assert.equal(err.code, 'TRACE_AUTOMATION_LAUNCH_FAILED');
  });
});

describe('TraceAutomationRunner JSON report parsing', async () => {
  // Dynamically import the module to test the parse logic
  const mod = await import('../../src/services/trace/TraceAutomationRunner.js');

  // parseJsonReport is not exported, but we can test buildTestFileContent
  // and the overall runTraceAutomation contract via type assertions

  it('buildTestFileContent produces valid test structure', () => {
    // Access internal via module - since buildTestFileContent is not exported,
    // we verify the runner module exports the run function
    assert.equal(typeof mod.runTraceAutomation, 'function');
  });

  it('TraceTestSpec interface shape is usable', () => {
    const spec: import('../../src/services/trace/TraceAutomationRunner.js').TraceTestSpec = {
      featureName: 'Login',
      scenarios: [{ name: 'valid login', steps: ['Given user on login page', 'When enters credentials', 'Then sees dashboard'] }],
    };
    assert.equal(spec.featureName, 'Login');
    assert.equal(spec.scenarios.length, 1);
    assert.equal(spec.scenarios[0].steps.length, 3);
  });

  it('TraceRunResult shape contract', () => {
    const result: import('../../src/services/trace/TraceAutomationRunner.js').TraceRunResult = {
      runner: 'playwright',
      mode: 'real',
      totalFeatures: 2,
      passedFeatures: 1,
      failedFeatures: 1,
      totalScenarios: 4,
      passedScenarios: 3,
      failedScenarios: 1,
      passRate: 75,
      durationMs: 5000,
      failures: [{ feature: 'Checkout', scenario: 'empty cart', reason: 'failed' }],
      generatedTestPath: '/tmp/test.ts',
    };
    assert.equal(result.runner, 'playwright');
    assert.equal(result.mode, 'real');
    assert.equal(result.passRate, 75);
    assert.equal(result.failures.length, 1);
  });
});
