/**
 * Unit tests for AI model pricing functions
 */
import { describe, test } from 'node:test';
import assert from 'node:assert';

// ─── Re-create from services/ai/pricing.ts ──────────────────────────

type ModelPricing = { inputUsdPer1M: number; outputUsdPer1M: number };

const PRICING_MAP: Record<string, ModelPricing> = {
  'gpt-4o-mini': { inputUsdPer1M: 0.15, outputUsdPer1M: 0.6 },
  'gpt-4o': { inputUsdPer1M: 5, outputUsdPer1M: 15 },
  'gpt-4.1-mini': { inputUsdPer1M: 0.3, outputUsdPer1M: 1.2 },
};

function getModelPricing(model: string): ModelPricing | null {
  return PRICING_MAP[model] || null;
}

function estimateCostUsd(model: string, inputTokens?: number, outputTokens?: number): number | null {
  const pricing = getModelPricing(model);
  if (!pricing) return null;
  const input = inputTokens ?? 0;
  const output = outputTokens ?? 0;
  const cost = (input / 1_000_000) * pricing.inputUsdPer1M + (output / 1_000_000) * pricing.outputUsdPer1M;
  return Number(cost.toFixed(6));
}

// ─── getModelPricing ────────────────────────────────────────────────

describe('getModelPricing', () => {
  test('returns pricing for gpt-4o-mini', () => {
    const p = getModelPricing('gpt-4o-mini');
    assert.ok(p);
    assert.strictEqual(p.inputUsdPer1M, 0.15);
    assert.strictEqual(p.outputUsdPer1M, 0.6);
  });

  test('returns pricing for gpt-4o', () => {
    const p = getModelPricing('gpt-4o');
    assert.ok(p);
    assert.strictEqual(p.inputUsdPer1M, 5);
    assert.strictEqual(p.outputUsdPer1M, 15);
  });

  test('returns pricing for gpt-4.1-mini', () => {
    const p = getModelPricing('gpt-4.1-mini');
    assert.ok(p);
    assert.strictEqual(p.inputUsdPer1M, 0.3);
    assert.strictEqual(p.outputUsdPer1M, 1.2);
  });

  test('returns null for unknown model', () => {
    assert.strictEqual(getModelPricing('unknown-model'), null);
    assert.strictEqual(getModelPricing(''), null);
    assert.strictEqual(getModelPricing('anthropic/claude-sonnet-4'), null);
  });
});

// ─── estimateCostUsd ────────────────────────────────────────────────

describe('estimateCostUsd', () => {
  test('returns null for unknown model', () => {
    assert.strictEqual(estimateCostUsd('unknown-model', 1000, 1000), null);
  });

  test('calculates cost for gpt-4o-mini', () => {
    // 1M input tokens * 0.15 + 1M output tokens * 0.6 = 0.75
    const cost = estimateCostUsd('gpt-4o-mini', 1_000_000, 1_000_000);
    assert.strictEqual(cost, 0.75);
  });

  test('calculates cost for gpt-4o', () => {
    // 1M input * 5 + 1M output * 15 = 20
    const cost = estimateCostUsd('gpt-4o', 1_000_000, 1_000_000);
    assert.strictEqual(cost, 20);
  });

  test('returns 0 for zero tokens', () => {
    assert.strictEqual(estimateCostUsd('gpt-4o-mini', 0, 0), 0);
  });

  test('handles undefined tokens as zero', () => {
    assert.strictEqual(estimateCostUsd('gpt-4o-mini'), 0);
    assert.strictEqual(estimateCostUsd('gpt-4o-mini', undefined, undefined), 0);
  });

  test('handles input-only', () => {
    // 500k tokens * 0.15/1M = 0.075
    assert.strictEqual(estimateCostUsd('gpt-4o-mini', 500_000, 0), 0.075);
  });

  test('handles output-only', () => {
    // 500k tokens * 0.6/1M = 0.3
    assert.strictEqual(estimateCostUsd('gpt-4o-mini', 0, 500_000), 0.3);
  });

  test('rounds to 6 decimal places', () => {
    // 1 token * 0.15/1M = 0.00000015 -> rounds to 0
    const cost = estimateCostUsd('gpt-4o-mini', 1, 0);
    assert.ok(cost !== null);
    const decimals = cost.toString().split('.')[1]?.length ?? 0;
    assert.ok(decimals <= 6);
  });

  test('small token count precision', () => {
    // 1000 input * 5/1M = 0.005
    assert.strictEqual(estimateCostUsd('gpt-4o', 1000, 0), 0.005);
  });
});
