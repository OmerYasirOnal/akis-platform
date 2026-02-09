/**
 * Tests for model-catalog and modelAllowlist pure functions
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  MODEL_CATALOG,
  DEFAULT_MODEL_ID,
  getModelById,
  getModelsByTier,
} from '../../src/config/model-catalog.js';

import {
  DEFAULT_OPENAI_MODELS,
  DEFAULT_OPENROUTER_MODELS,
  RECOMMENDED_MODELS,
  isModelAllowed,
  detectProviderFromModel,
  isModelCompatibleWithProvider,
} from '../../src/services/ai/modelAllowlist.js';

// ─── MODEL_CATALOG constants ──────────────────────────────────────

describe('MODEL_CATALOG', () => {
  it('has at least 3 models', () => {
    assert.ok(MODEL_CATALOG.length >= 3);
  });

  it('every model has required fields', () => {
    for (const m of MODEL_CATALOG) {
      assert.ok(m.id, `model should have id`);
      assert.ok(m.label, `model ${m.id} should have label`);
      assert.ok(['openai', 'openrouter'].includes(m.provider), `model ${m.id} has valid provider`);
      assert.ok(['budget', 'standard', 'premium'].includes(m.tier), `model ${m.id} has valid tier`);
      assert.ok(m.inputPricePer1M >= 0, `model ${m.id} input price >= 0`);
      assert.ok(m.outputPricePer1M >= 0, `model ${m.id} output price >= 0`);
    }
  });

  it('DEFAULT_MODEL_ID exists in catalog', () => {
    const found = MODEL_CATALOG.find(m => m.id === DEFAULT_MODEL_ID);
    assert.ok(found, `DEFAULT_MODEL_ID "${DEFAULT_MODEL_ID}" should be in catalog`);
  });

  it('model IDs are unique', () => {
    const ids = MODEL_CATALOG.map(m => m.id);
    assert.equal(new Set(ids).size, ids.length, 'no duplicate model IDs');
  });
});

// ─── getModelById ─────────────────────────────────────────────────

describe('getModelById', () => {
  it('returns model for valid ID', () => {
    const model = getModelById('gpt-4o-mini');
    assert.ok(model);
    assert.equal(model.id, 'gpt-4o-mini');
    assert.equal(model.tier, 'budget');
  });

  it('returns undefined for unknown ID', () => {
    assert.equal(getModelById('nonexistent-model'), undefined);
  });

  it('returns undefined for empty string', () => {
    assert.equal(getModelById(''), undefined);
  });
});

// ─── getModelsByTier ──────────────────────────────────────────────

describe('getModelsByTier', () => {
  it('returns budget models', () => {
    const budget = getModelsByTier('budget');
    assert.ok(budget.length > 0);
    assert.ok(budget.every(m => m.tier === 'budget'));
  });

  it('returns standard models', () => {
    const standard = getModelsByTier('standard');
    assert.ok(standard.length > 0);
    assert.ok(standard.every(m => m.tier === 'standard'));
  });

  it('returns premium models', () => {
    const premium = getModelsByTier('premium');
    assert.ok(premium.length > 0);
    assert.ok(premium.every(m => m.tier === 'premium'));
  });

  it('returns empty array for unknown tier', () => {
    // @ts-expect-error intentional invalid tier
    const result = getModelsByTier('ultra');
    assert.equal(result.length, 0);
  });
});

// ─── modelAllowlist constants ─────────────────────────────────────

describe('modelAllowlist constants', () => {
  it('DEFAULT_OPENAI_MODELS contains expected models', () => {
    assert.ok(DEFAULT_OPENAI_MODELS.includes('gpt-4o-mini'));
    assert.ok(DEFAULT_OPENAI_MODELS.includes('gpt-4o'));
  });

  it('DEFAULT_OPENROUTER_MODELS contains slash-formatted models', () => {
    assert.ok(DEFAULT_OPENROUTER_MODELS.every(m => m.includes('/')));
  });

  it('RECOMMENDED_MODELS has entries for both providers', () => {
    assert.ok(RECOMMENDED_MODELS.openai);
    assert.ok(RECOMMENDED_MODELS.openrouter);
  });
});

// ─── isModelAllowed ───────────────────────────────────────────────

describe('isModelAllowed', () => {
  it('returns true when model is in allowlist', () => {
    assert.equal(isModelAllowed('gpt-4o-mini', ['gpt-4o-mini', 'gpt-4o']), true);
  });

  it('returns false when model is not in allowlist', () => {
    assert.equal(isModelAllowed('gpt-5', ['gpt-4o-mini', 'gpt-4o']), false);
  });

  it('returns false for empty allowlist', () => {
    assert.equal(isModelAllowed('gpt-4o', []), false);
  });
});

// ─── detectProviderFromModel ──────────────────────────────────────

describe('detectProviderFromModel', () => {
  it('detects OpenAI for gpt- prefix', () => {
    assert.equal(detectProviderFromModel('gpt-4o-mini'), 'openai');
    assert.equal(detectProviderFromModel('gpt-5-mini'), 'openai');
  });

  it('detects OpenAI for o1 prefix', () => {
    assert.equal(detectProviderFromModel('o1-preview'), 'openai');
  });

  it('detects OpenAI for o3 prefix', () => {
    assert.equal(detectProviderFromModel('o3-mini'), 'openai');
  });

  it('detects OpenAI for text- prefix', () => {
    assert.equal(detectProviderFromModel('text-davinci-003'), 'openai');
  });

  it('detects OpenAI for davinci prefix', () => {
    assert.equal(detectProviderFromModel('davinci'), 'openai');
  });

  it('detects OpenRouter for org/model format', () => {
    assert.equal(detectProviderFromModel('anthropic/claude-sonnet-4'), 'openrouter');
  });

  it('detects OpenRouter for :free suffix', () => {
    assert.equal(detectProviderFromModel('meta-llama/llama-4:free'), 'openrouter');
  });

  it('detects OpenRouter for :nitro suffix', () => {
    assert.equal(detectProviderFromModel('anthropic/claude:nitro'), 'openrouter');
  });

  it('returns null for unknown format', () => {
    assert.equal(detectProviderFromModel('custom-model'), null);
  });
});

// ─── isModelCompatibleWithProvider ────────────────────────────────

describe('isModelCompatibleWithProvider', () => {
  it('OpenAI model is compatible with openai', () => {
    assert.equal(isModelCompatibleWithProvider('gpt-4o', 'openai'), true);
  });

  it('OpenRouter model is NOT compatible with openai', () => {
    assert.equal(isModelCompatibleWithProvider('anthropic/claude-sonnet-4', 'openai'), false);
  });

  it('OpenAI model IS compatible with openrouter (proxy)', () => {
    assert.equal(isModelCompatibleWithProvider('gpt-4o', 'openrouter'), true);
  });

  it('OpenRouter model is compatible with openrouter', () => {
    assert.equal(isModelCompatibleWithProvider('anthropic/claude-sonnet-4', 'openrouter'), true);
  });

  it('unknown model format is compatible with any provider', () => {
    assert.equal(isModelCompatibleWithProvider('custom-model', 'openai'), true);
    assert.equal(isModelCompatibleWithProvider('custom-model', 'openrouter'), true);
  });
});
