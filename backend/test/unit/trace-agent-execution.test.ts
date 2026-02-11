import assert from 'node:assert';
import { test } from 'node:test';
import { TraceAgent } from '../../src/agents/trace/TraceAgent.js';

test('TraceAgent reports automation execution summary for strong scenarios', async () => {
  const agent = new TraceAgent();
  const result = await agent.execute({
    spec: [
      'Scenario: User logs in',
      'Given user has a valid account',
      'When user submits credentials',
      'Then dashboard should load',
    ].join('\n'),
  }) as {
    ok: boolean;
    testPlan: string;
    metadata: {
      automationExecution: {
        runner: string;
        targetBaseUrl: string;
        featurePassRate: number;
        executedScenarios: number;
        passedScenarios: number;
        failedScenarios: number;
        passRate: number;
        featureCoverageRate: number;
      };
      automationSummary: {
        generatedTestPath: string;
      };
    };
  };

  assert.strictEqual(result.ok, true);
  assert.ok(result.testPlan.includes('## Automation Execution Summary'));
  assert.strictEqual(result.metadata.automationExecution.runner, 'playwright');
  assert.strictEqual(result.metadata.automationExecution.targetBaseUrl, 'https://staging.akisflow.com');
  assert.strictEqual(result.metadata.automationExecution.featurePassRate, 100);
  assert.strictEqual(result.metadata.automationExecution.executedScenarios, 1);
  assert.strictEqual(result.metadata.automationExecution.passedScenarios, 1);
  assert.strictEqual(result.metadata.automationExecution.failedScenarios, 0);
  assert.strictEqual(result.metadata.automationExecution.passRate, 100);
  assert.ok(result.metadata.automationExecution.featureCoverageRate >= 0);
  assert.strictEqual(result.metadata.automationSummary.generatedTestPath, 'tests/generated/trace-tests.test.ts');
});

test('TraceAgent reports failed scenario ratio for weak specifications', async () => {
  const agent = new TraceAgent();
  const result = await agent.execute({ spec: 'Smoke check' }) as {
    metadata: {
      automationExecution: {
        executedScenarios: number;
        passedScenarios: number;
        failedScenarios: number;
        passRate: number;
      };
    };
  };

  assert.ok(result.metadata.automationExecution.executedScenarios >= 1);
  assert.strictEqual(result.metadata.automationExecution.passedScenarios, 0);
  assert.ok(result.metadata.automationExecution.failedScenarios >= 1);
  assert.strictEqual(result.metadata.automationExecution.passRate, 0);
});
