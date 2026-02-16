import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeContractOutputForRetry,
  validateRuntimeAgentInput,
  validateRuntimeAgentOutput,
} from '../../src/core/contracts/AgentContract.js';

describe('Runtime agent contract validation', () => {
  it('accepts valid Scribe payload', () => {
    const result = validateRuntimeAgentInput('scribe', {
      owner: 'octocat',
      repo: 'hello-world',
      baseBranch: 'main',
      userId: '00000000-0000-0000-0000-000000000000',
    });
    assert.equal(result.valid, true);
  });

  it('rejects invalid Scribe payload with missing owner/repo/baseBranch', () => {
    const result = validateRuntimeAgentInput('scribe', { owner: '', repo: '', baseBranch: '' });
    assert.equal(result.valid, false);
    if (!result.valid) {
      assert.ok(result.issues.length >= 1);
    }
  });

  it('requires Proto requirements or goal', () => {
    const missing = validateRuntimeAgentInput('proto', {});
    assert.equal(missing.valid, false);

    const withGoal = validateRuntimeAgentInput('proto', { goal: 'Build a waitlist landing page' });
    assert.equal(withGoal.valid, true);
  });

  it('rejects empty output objects', () => {
    const invalid = validateRuntimeAgentOutput('trace', {});
    assert.equal(invalid.valid, false);

    const valid = validateRuntimeAgentOutput('trace', { plan: 'ok' });
    assert.equal(valid.valid, true);
  });

  it('passes through unknown agent types', () => {
    const result = validateRuntimeAgentInput('custom-agent', { hello: 'world' });
    assert.equal(result.valid, true);
  });

  it('normalizes empty output for retry policy', () => {
    const normalized = normalizeContractOutputForRetry({});
    assert.equal(typeof normalized, 'object');
    assert.ok(Object.keys(normalized).length > 0);
    const validated = validateRuntimeAgentOutput('scribe', normalized);
    assert.equal(validated.valid, true);
  });

  it('preserves non-empty objects during retry normalization', () => {
    const original = { artifact: 'README.md' };
    const normalized = normalizeContractOutputForRetry(original);
    assert.deepEqual(normalized, original);
  });
});
