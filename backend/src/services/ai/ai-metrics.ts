import type { AICallMetrics } from './AIService.js';

export type AITotals = {
  totalDurationMs: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number | null;
};

export class AICallMetricsCollector {
  private totalDurationMs = 0;
  private totalInputTokens = 0;
  private totalOutputTokens = 0;
  private totalTokens = 0;
  private totalEstimatedCostUsd = 0;
  private hasCost = false;

  record(metrics: AICallMetrics): void {
    if (!metrics.success) {
      return;
    }

    if (typeof metrics.durationMs === 'number') {
      this.totalDurationMs += metrics.durationMs;
    }

    if (metrics.usage) {
      if (typeof metrics.usage.inputTokens === 'number') {
        this.totalInputTokens += metrics.usage.inputTokens;
      }
      if (typeof metrics.usage.outputTokens === 'number') {
        this.totalOutputTokens += metrics.usage.outputTokens;
      }
      if (typeof metrics.usage.totalTokens === 'number') {
        this.totalTokens += metrics.usage.totalTokens;
      }
    }

    if (typeof metrics.estimatedCostUsd === 'number') {
      this.totalEstimatedCostUsd += metrics.estimatedCostUsd;
      this.hasCost = true;
    }
  }

  getTotals(): AITotals {
    return {
      totalDurationMs: this.totalDurationMs,
      totalInputTokens: this.totalInputTokens,
      totalOutputTokens: this.totalOutputTokens,
      totalTokens: this.totalTokens,
      estimatedCostUsd: this.hasCost ? Number(this.totalEstimatedCostUsd.toFixed(6)) : null,
    };
  }
}
