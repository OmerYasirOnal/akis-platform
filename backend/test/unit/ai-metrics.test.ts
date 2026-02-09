/**
 * Unit tests for AICallMetricsCollector
 */
import { describe, test } from 'node:test';
import assert from 'node:assert';

import { AICallMetricsCollector } from '../../src/services/ai/ai-metrics.js';
import type { AICallMetrics } from '../../src/services/ai/AIService.js';

function makeMetrics(overrides: Partial<AICallMetrics> = {}): AICallMetrics {
  return {
    purpose: 'test',
    provider: 'openai',
    model: 'gpt-4o-mini',
    success: true,
    durationMs: 1000,
    usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
    estimatedCostUsd: 0.001,
    ...overrides,
  };
}

describe('AICallMetricsCollector', () => {
  test('getTotals returns zeros before any calls', () => {
    const collector = new AICallMetricsCollector();
    const totals = collector.getTotals();
    assert.strictEqual(totals.totalDurationMs, 0);
    assert.strictEqual(totals.totalInputTokens, 0);
    assert.strictEqual(totals.totalOutputTokens, 0);
    assert.strictEqual(totals.totalTokens, 0);
    assert.strictEqual(totals.estimatedCostUsd, null);
  });

  test('records a single successful call', () => {
    const collector = new AICallMetricsCollector();
    collector.record(makeMetrics());
    const totals = collector.getTotals();
    assert.strictEqual(totals.totalDurationMs, 1000);
    assert.strictEqual(totals.totalInputTokens, 100);
    assert.strictEqual(totals.totalOutputTokens, 50);
    assert.strictEqual(totals.totalTokens, 150);
    assert.strictEqual(totals.estimatedCostUsd, 0.001);
  });

  test('accumulates multiple calls', () => {
    const collector = new AICallMetricsCollector();
    collector.record(makeMetrics({ durationMs: 500, usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 }, estimatedCostUsd: 0.001 }));
    collector.record(makeMetrics({ durationMs: 300, usage: { inputTokens: 200, outputTokens: 100, totalTokens: 300 }, estimatedCostUsd: 0.002 }));
    const totals = collector.getTotals();
    assert.strictEqual(totals.totalDurationMs, 800);
    assert.strictEqual(totals.totalInputTokens, 300);
    assert.strictEqual(totals.totalOutputTokens, 150);
    assert.strictEqual(totals.totalTokens, 450);
    assert.strictEqual(totals.estimatedCostUsd, 0.003);
  });

  test('ignores failed calls', () => {
    const collector = new AICallMetricsCollector();
    collector.record(makeMetrics({ success: false, durationMs: 5000, estimatedCostUsd: 1.0 }));
    const totals = collector.getTotals();
    assert.strictEqual(totals.totalDurationMs, 0);
    assert.strictEqual(totals.totalTokens, 0);
    assert.strictEqual(totals.estimatedCostUsd, null);
  });

  test('handles missing usage gracefully', () => {
    const collector = new AICallMetricsCollector();
    collector.record(makeMetrics({ usage: undefined, durationMs: 200, estimatedCostUsd: 0.0005 }));
    const totals = collector.getTotals();
    assert.strictEqual(totals.totalDurationMs, 200);
    assert.strictEqual(totals.totalInputTokens, 0);
    assert.strictEqual(totals.totalOutputTokens, 0);
    assert.strictEqual(totals.totalTokens, 0);
    assert.strictEqual(totals.estimatedCostUsd, 0.0005);
  });

  test('handles partial usage (only inputTokens)', () => {
    const collector = new AICallMetricsCollector();
    collector.record(makeMetrics({ usage: { inputTokens: 50 } }));
    const totals = collector.getTotals();
    assert.strictEqual(totals.totalInputTokens, 50);
    assert.strictEqual(totals.totalOutputTokens, 0);
    assert.strictEqual(totals.totalTokens, 0);
  });

  test('handles missing durationMs', () => {
    const collector = new AICallMetricsCollector();
    collector.record(makeMetrics({ durationMs: undefined }));
    const totals = collector.getTotals();
    assert.strictEqual(totals.totalDurationMs, 0);
    assert.strictEqual(totals.totalInputTokens, 100);
  });

  test('estimatedCostUsd is null when no cost data present', () => {
    const collector = new AICallMetricsCollector();
    collector.record(makeMetrics({ estimatedCostUsd: undefined }));
    const totals = collector.getTotals();
    assert.strictEqual(totals.estimatedCostUsd, null);
  });

  test('estimatedCostUsd rounds to 6 decimal places', () => {
    const collector = new AICallMetricsCollector();
    collector.record(makeMetrics({ estimatedCostUsd: 0.0000001 }));
    collector.record(makeMetrics({ estimatedCostUsd: 0.0000002 }));
    const totals = collector.getTotals();
    assert.ok(totals.estimatedCostUsd !== null);
    const decimals = totals.estimatedCostUsd.toString().split('.')[1]?.length ?? 0;
    assert.ok(decimals <= 6);
  });

  test('mix of successful and failed calls', () => {
    const collector = new AICallMetricsCollector();
    collector.record(makeMetrics({ durationMs: 100, estimatedCostUsd: 0.01 }));
    collector.record(makeMetrics({ success: false, durationMs: 9999, estimatedCostUsd: 99 }));
    collector.record(makeMetrics({ durationMs: 200, estimatedCostUsd: 0.02 }));
    const totals = collector.getTotals();
    assert.strictEqual(totals.totalDurationMs, 300);
    assert.strictEqual(totals.estimatedCostUsd, 0.03);
  });
});
