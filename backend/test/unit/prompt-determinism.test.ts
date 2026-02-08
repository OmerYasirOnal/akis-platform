/**
 * Unit tests for S0.5.1-AGT-2: Playbook determinism
 *
 * Validates:
 * - Prompt constants are non-empty and frozen
 * - Temperature presets are valid ranges
 * - Deterministic seed is defined
 * - Builder functions produce expected output
 */
import { describe, test } from 'node:test';
import assert from 'node:assert';

import {
  DETERMINISTIC_TEMPERATURES,
  CREATIVE_TEMPERATURES,
  DETERMINISTIC_SEED,
  PLAN_SYSTEM_PROMPT,
  buildPlanUserPrompt,
  GENERATE_SYSTEM_PROMPT,
  buildGenerateUserPrompt,
  REFLECT_SYSTEM_PROMPT,
  VALIDATE_SYSTEM_PROMPT,
  buildRepairPrompt,
} from '../../src/services/ai/prompt-constants.js';

describe('Prompt Constants (AGT-2)', () => {
  test('all system prompts are non-empty strings', () => {
    assert.ok(PLAN_SYSTEM_PROMPT.length > 50, 'Plan prompt too short');
    assert.ok(GENERATE_SYSTEM_PROMPT.length > 20, 'Generate prompt too short');
    assert.ok(REFLECT_SYSTEM_PROMPT.length > 50, 'Reflect prompt too short');
    assert.ok(VALIDATE_SYSTEM_PROMPT.length > 50, 'Validate prompt too short');
  });

  test('plan prompt contains JSON format instruction', () => {
    assert.ok(PLAN_SYSTEM_PROMPT.includes('ONLY valid JSON'));
    assert.ok(PLAN_SYSTEM_PROMPT.includes('"steps"'));
    assert.ok(PLAN_SYSTEM_PROMPT.includes('"rationale"'));
  });

  test('reflect prompt contains JSON format instruction', () => {
    assert.ok(REFLECT_SYSTEM_PROMPT.includes('ONLY valid JSON'));
    assert.ok(REFLECT_SYSTEM_PROMPT.includes('"issues"'));
    assert.ok(REFLECT_SYSTEM_PROMPT.includes('"severity"'));
  });

  test('validate prompt contains JSON format instruction', () => {
    assert.ok(VALIDATE_SYSTEM_PROMPT.includes('ONLY valid JSON'));
    assert.ok(VALIDATE_SYSTEM_PROMPT.includes('"passed"'));
    assert.ok(VALIDATE_SYSTEM_PROMPT.includes('"confidence"'));
  });
});

describe('Temperature Presets (AGT-2)', () => {
  test('deterministic temperatures are lower than creative', () => {
    assert.ok(DETERMINISTIC_TEMPERATURES.plan <= CREATIVE_TEMPERATURES.plan);
    assert.ok(DETERMINISTIC_TEMPERATURES.generate <= CREATIVE_TEMPERATURES.generate);
    assert.ok(DETERMINISTIC_TEMPERATURES.reflect <= CREATIVE_TEMPERATURES.reflect);
    assert.ok(DETERMINISTIC_TEMPERATURES.validate <= CREATIVE_TEMPERATURES.validate);
  });

  test('all temperatures are in valid range [0, 2]', () => {
    const allTemps = [
      ...Object.values(DETERMINISTIC_TEMPERATURES),
      ...Object.values(CREATIVE_TEMPERATURES),
    ];
    for (const t of allTemps) {
      assert.ok(t >= 0 && t <= 2, `Temperature ${t} out of range [0, 2]`);
    }
  });

  test('deterministic plan temperature is <= 0.3 for reproducibility', () => {
    assert.ok(
      DETERMINISTIC_TEMPERATURES.plan <= 0.3,
      `Plan temp ${DETERMINISTIC_TEMPERATURES.plan} too high for determinism`
    );
  });

  test('deterministic generate temperature is <= 0.5 for reproducibility', () => {
    assert.ok(
      DETERMINISTIC_TEMPERATURES.generate <= 0.5,
      `Generate temp ${DETERMINISTIC_TEMPERATURES.generate} too high for determinism`
    );
  });

  test('repair temperature is always 0 (maximum determinism)', () => {
    assert.strictEqual(DETERMINISTIC_TEMPERATURES.repair, 0);
    assert.strictEqual(CREATIVE_TEMPERATURES.repair, 0);
  });
});

describe('Deterministic Seed (AGT-2)', () => {
  test('seed is a positive integer', () => {
    assert.strictEqual(typeof DETERMINISTIC_SEED, 'number');
    assert.ok(DETERMINISTIC_SEED > 0);
    assert.strictEqual(DETERMINISTIC_SEED, Math.floor(DETERMINISTIC_SEED));
  });
});

describe('Prompt Builders (AGT-2)', () => {
  test('buildPlanUserPrompt includes agent and goal', () => {
    const prompt = buildPlanUserPrompt('scribe', 'Generate docs for auth module');
    assert.ok(prompt.includes('scribe'));
    assert.ok(prompt.includes('Generate docs for auth module'));
  });

  test('buildPlanUserPrompt includes context when provided', () => {
    const prompt = buildPlanUserPrompt('trace', 'Analyze repo', { repo: 'akis' });
    assert.ok(prompt.includes('akis'));
  });

  test('buildPlanUserPrompt omits context line when not provided', () => {
    const prompt = buildPlanUserPrompt('proto', 'Build prototype');
    assert.ok(!prompt.includes('Context:'));
  });

  test('buildGenerateUserPrompt includes task', () => {
    const prompt = buildGenerateUserPrompt('Write unit tests');
    assert.ok(prompt.includes('Write unit tests'));
  });

  test('buildGenerateUserPrompt includes previous steps', () => {
    const prompt = buildGenerateUserPrompt('Step 3', undefined, ['Step 1', 'Step 2']);
    assert.ok(prompt.includes('Step 1'));
    assert.ok(prompt.includes('Step 2'));
  });

  test('buildRepairPrompt includes schema and response', () => {
    const prompt = buildRepairPrompt('{"type":"object"}', '{"broken json');
    assert.ok(prompt.includes('"type":"object"'));
    assert.ok(prompt.includes('{"broken json'));
  });

  test('buildRepairPrompt truncates long responses', () => {
    const longResponse = 'x'.repeat(3000);
    const prompt = buildRepairPrompt('{}', longResponse);
    assert.ok(prompt.length < 3000, 'Prompt should truncate long responses');
  });
});
