import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TraceAgent } from '../../src/agents/trace/TraceAgent.js';

describe('TraceAgent determinism', () => {
  it('keeps scenario set and ordering stable for same spec', async () => {
    const agent = new TraceAgent();
    const payload = {
      spec: [
        'Scenario: Login flow',
        'Given user opens login page',
        'When user submits credentials',
        'Then dashboard appears',
        '',
        'Scenario: Permission denied flow',
        'Given user lacks role',
        'When user opens admin page',
        'Then access is denied',
      ].join('\n'),
    };

    const runA = await agent.execute(payload) as {
      files: Array<{ path: string; cases: Array<{ name: string }> }>;
      metadata: {
        scenarioCount: number;
        priorityBreakdown: Record<string, number>;
        layerBreakdown: Record<string, number>;
      };
    };
    const runB = await agent.execute(payload) as {
      files: Array<{ path: string; cases: Array<{ name: string }> }>;
      metadata: {
        scenarioCount: number;
        priorityBreakdown: Record<string, number>;
        layerBreakdown: Record<string, number>;
      };
    };

    const namesA = runA.files.map((f) => f.cases[0]?.name ?? f.path);
    const namesB = runB.files.map((f) => f.cases[0]?.name ?? f.path);

    assert.deepStrictEqual(namesA, namesB);
    assert.strictEqual(runA.metadata.scenarioCount, runB.metadata.scenarioCount);
    assert.deepStrictEqual(runA.metadata.priorityBreakdown, runB.metadata.priorityBreakdown);
    assert.deepStrictEqual(runA.metadata.layerBreakdown, runB.metadata.layerBreakdown);
  });
});

