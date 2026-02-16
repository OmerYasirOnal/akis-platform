import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { AgentPlaybook } from '../../src/core/contracts/AgentPlaybook.js';

describe('AgentPlaybook retry behavior', () => {
  it('retries retryable step once and succeeds', async () => {
    const playbook = new AgentPlaybook();
    let attempts = 0;

    playbook.addStep({
      name: 'retryable-step',
      retryable: true,
      action: async () => {
        attempts += 1;
        if (attempts === 1) {
          throw new Error('temporary');
        }
        return 'ok';
      },
    });

    const result = await playbook.execute();
    assert.deepEqual(result, ['ok']);
    assert.equal(attempts, 2);
  });

  it('fails fast for non-retryable step', async () => {
    const playbook = new AgentPlaybook();
    let attempts = 0;

    playbook.addStep({
      name: 'non-retryable-step',
      retryable: false,
      action: async () => {
        attempts += 1;
        throw new Error('fatal');
      },
    });

    await assert.rejects(async () => playbook.execute(), /fatal/);
    assert.equal(attempts, 1);
  });

  it('throws after retry budget is exhausted', async () => {
    const playbook = new AgentPlaybook();
    let attempts = 0;

    playbook.addStep({
      name: 'retryable-but-failing',
      retryable: true,
      action: async () => {
        attempts += 1;
        throw new Error('still failing');
      },
    });

    await assert.rejects(async () => playbook.execute(), /still failing/);
    assert.equal(attempts, 2);
  });

  it('preserves step order with retry attempts', async () => {
    const playbook = new AgentPlaybook();
    const order: string[] = [];
    let retryAttempts = 0;

    playbook.addStep({
      name: 'first',
      action: async () => {
        order.push('first');
        return 'first-result';
      },
    });

    playbook.addStep({
      name: 'second-retryable',
      retryable: true,
      action: async () => {
        retryAttempts += 1;
        order.push(`second-${retryAttempts}`);
        if (retryAttempts === 1) {
          throw new Error('retry needed');
        }
        return 'second-result';
      },
    });

    playbook.addStep({
      name: 'third',
      action: async () => {
        order.push('third');
        return 'third-result';
      },
    });

    const result = await playbook.execute();
    assert.deepEqual(result, ['first-result', 'second-result', 'third-result']);
    assert.deepEqual(order, ['first', 'second-1', 'second-2', 'third']);
  });
});
