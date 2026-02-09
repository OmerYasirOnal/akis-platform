/**
 * Unit tests for usage route calculation logic: free tier, remaining, on-demand, percent
 */
import { describe, test } from 'node:test';
import assert from 'node:assert';

// ─── Re-create calculation logic from usage.ts ──────────────────────

const FREE_TIER = {
  tokens: 100_000,
  costUsd: 0.50,
};

interface UsageStats {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: string;
  jobCount: number;
}

function calculateUsageResponse(stats: UsageStats) {
  const usedCostUsd = parseFloat(stats.estimatedCostUsd) || 0;
  const usedTokens = stats.totalTokens || 0;

  const remainingTokens = Math.max(0, FREE_TIER.tokens - usedTokens);
  const remainingCostUsd = Math.max(0, FREE_TIER.costUsd - usedCostUsd);

  const isOverFreeTokens = usedTokens > FREE_TIER.tokens;
  const isOverFreeCost = usedCostUsd > FREE_TIER.costUsd;
  const onDemandTokens = isOverFreeTokens ? usedTokens - FREE_TIER.tokens : 0;
  const onDemandCostUsd = isOverFreeCost ? usedCostUsd - FREE_TIER.costUsd : 0;

  return {
    freeQuota: {
      tokens: FREE_TIER.tokens,
      costUsd: FREE_TIER.costUsd,
    },
    used: {
      tokens: usedTokens,
      costUsd: parseFloat(usedCostUsd.toFixed(6)),
    },
    remaining: {
      tokens: remainingTokens,
      costUsd: parseFloat(remainingCostUsd.toFixed(6)),
    },
    onDemand: {
      tokens: onDemandTokens,
      costUsd: parseFloat(onDemandCostUsd.toFixed(6)),
    },
    percentUsed: {
      tokens: Math.min(100, (usedTokens / FREE_TIER.tokens) * 100),
      cost: Math.min(100, (usedCostUsd / FREE_TIER.costUsd) * 100),
    },
  };
}

// ─── FREE_TIER config ────────────────────────────────────────────────

describe('FREE_TIER configuration', () => {
  test('token limit is 100_000', () => {
    assert.strictEqual(FREE_TIER.tokens, 100_000);
  });

  test('cost limit is $0.50', () => {
    assert.strictEqual(FREE_TIER.costUsd, 0.5);
  });
});

// ─── Usage calculations: zero usage ─────────────────────────────────

describe('Usage calculations — zero usage', () => {
  const zeroStats: UsageStats = {
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    estimatedCostUsd: '0',
    jobCount: 0,
  };

  test('remaining equals full free tier', () => {
    const result = calculateUsageResponse(zeroStats);
    assert.strictEqual(result.remaining.tokens, 100_000);
    assert.strictEqual(result.remaining.costUsd, 0.5);
  });

  test('on-demand is zero', () => {
    const result = calculateUsageResponse(zeroStats);
    assert.strictEqual(result.onDemand.tokens, 0);
    assert.strictEqual(result.onDemand.costUsd, 0);
  });

  test('percent used is zero', () => {
    const result = calculateUsageResponse(zeroStats);
    assert.strictEqual(result.percentUsed.tokens, 0);
    assert.strictEqual(result.percentUsed.cost, 0);
  });
});

// ─── Usage calculations: partial usage ──────────────────────────────

describe('Usage calculations — partial usage', () => {
  const partialStats: UsageStats = {
    inputTokens: 20_000,
    outputTokens: 10_000,
    totalTokens: 30_000,
    estimatedCostUsd: '0.15',
    jobCount: 5,
  };

  test('remaining tokens calculated correctly', () => {
    const result = calculateUsageResponse(partialStats);
    assert.strictEqual(result.remaining.tokens, 70_000);
  });

  test('remaining cost calculated correctly', () => {
    const result = calculateUsageResponse(partialStats);
    assert.strictEqual(result.remaining.costUsd, 0.35);
  });

  test('on-demand is zero when under limit', () => {
    const result = calculateUsageResponse(partialStats);
    assert.strictEqual(result.onDemand.tokens, 0);
    assert.strictEqual(result.onDemand.costUsd, 0);
  });

  test('percent used is 30% for tokens', () => {
    const result = calculateUsageResponse(partialStats);
    assert.strictEqual(result.percentUsed.tokens, 30);
  });

  test('percent used is 30% for cost', () => {
    const result = calculateUsageResponse(partialStats);
    assert.strictEqual(result.percentUsed.cost, 30);
  });
});

// ─── Usage calculations: over free tier ─────────────────────────────

describe('Usage calculations — over free tier', () => {
  const overStats: UsageStats = {
    inputTokens: 80_000,
    outputTokens: 70_000,
    totalTokens: 150_000,
    estimatedCostUsd: '0.75',
    jobCount: 20,
  };

  test('remaining tokens is zero when over limit', () => {
    const result = calculateUsageResponse(overStats);
    assert.strictEqual(result.remaining.tokens, 0);
  });

  test('remaining cost is zero when over limit', () => {
    const result = calculateUsageResponse(overStats);
    assert.strictEqual(result.remaining.costUsd, 0);
  });

  test('on-demand tokens calculated correctly', () => {
    const result = calculateUsageResponse(overStats);
    assert.strictEqual(result.onDemand.tokens, 50_000);
  });

  test('on-demand cost calculated correctly', () => {
    const result = calculateUsageResponse(overStats);
    assert.strictEqual(result.onDemand.costUsd, 0.25);
  });

  test('percent used capped at 100', () => {
    const result = calculateUsageResponse(overStats);
    assert.strictEqual(result.percentUsed.tokens, 100);
    assert.strictEqual(result.percentUsed.cost, 100);
  });
});

// ─── Usage calculations: exact free tier boundary ───────────────────

describe('Usage calculations — exact boundary', () => {
  const exactStats: UsageStats = {
    inputTokens: 60_000,
    outputTokens: 40_000,
    totalTokens: 100_000,
    estimatedCostUsd: '0.500000',
    jobCount: 10,
  };

  test('remaining is zero at exact boundary', () => {
    const result = calculateUsageResponse(exactStats);
    assert.strictEqual(result.remaining.tokens, 0);
    assert.strictEqual(result.remaining.costUsd, 0);
  });

  test('on-demand is zero at exact boundary', () => {
    const result = calculateUsageResponse(exactStats);
    assert.strictEqual(result.onDemand.tokens, 0);
    assert.strictEqual(result.onDemand.costUsd, 0);
  });

  test('percent used is 100 at exact boundary', () => {
    const result = calculateUsageResponse(exactStats);
    assert.strictEqual(result.percentUsed.tokens, 100);
    assert.strictEqual(result.percentUsed.cost, 100);
  });
});

// ─── Response shape contract ─────────────────────────────────────────

describe('Usage response shape', () => {
  test('response has all required top-level keys', () => {
    const result = calculateUsageResponse({
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      estimatedCostUsd: '0',
      jobCount: 0,
    });

    assert.ok('freeQuota' in result);
    assert.ok('used' in result);
    assert.ok('remaining' in result);
    assert.ok('onDemand' in result);
    assert.ok('percentUsed' in result);
  });

  test('freeQuota shape', () => {
    const result = calculateUsageResponse({
      inputTokens: 0, outputTokens: 0, totalTokens: 0,
      estimatedCostUsd: '0', jobCount: 0,
    });
    assert.strictEqual(typeof result.freeQuota.tokens, 'number');
    assert.strictEqual(typeof result.freeQuota.costUsd, 'number');
  });

  test('percentUsed values are numbers between 0 and 100', () => {
    const result = calculateUsageResponse({
      inputTokens: 0, outputTokens: 0, totalTokens: 50_000,
      estimatedCostUsd: '0.25', jobCount: 3,
    });
    assert.ok(result.percentUsed.tokens >= 0 && result.percentUsed.tokens <= 100);
    assert.ok(result.percentUsed.cost >= 0 && result.percentUsed.cost <= 100);
  });
});
