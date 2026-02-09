/**
 * Contract tests for RunSummaryPanel pure helper functions
 * Re-creates helpers to test formatting and coercion logic
 */
import { describe, it, expect } from 'vitest';

// ─── Re-create helpers from RunSummaryPanel.tsx ─────────────────

const coerceNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const formatDuration = (value: number | null): string => {
  if (value === null) return '—';
  if (value < 1000) return `${value}ms`;
  const seconds = value / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m ${remainder.toFixed(0)}s`;
};

const formatTokens = (value: number | null): string => {
  if (value === null) return '—';
  return value.toLocaleString();
};

const formatCost = (value: number | null): string => {
  if (value === null) return '—';
  return `$${value.toFixed(4)}`;
};

type AiCallRow = {
  label: string;
  durationMs?: number;
  usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
  estimatedCostUsd?: number | null;
  success?: boolean;
};

type RunSummaryTotals = {
  durationMs: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  estimatedCostUsd: number | null;
};

const buildTotalsFromCalls = (calls: AiCallRow[]): RunSummaryTotals => {
  let durationMs = 0, inputTokens = 0, outputTokens = 0, totalTokens = 0, estimatedCostUsd = 0;
  let hasCost = false;
  calls.forEach((call) => {
    if (typeof call.durationMs === 'number') durationMs += call.durationMs;
    if (call.usage?.inputTokens) inputTokens += call.usage.inputTokens;
    if (call.usage?.outputTokens) outputTokens += call.usage.outputTokens;
    if (call.usage?.totalTokens) totalTokens += call.usage.totalTokens;
    if (typeof call.estimatedCostUsd === 'number') { estimatedCostUsd += call.estimatedCostUsd; hasCost = true; }
  });
  const normalizedTotals = totalTokens > 0 ? totalTokens : inputTokens + outputTokens;
  return {
    durationMs: calls.length > 0 ? durationMs : null,
    inputTokens: calls.length > 0 ? inputTokens || null : null,
    outputTokens: calls.length > 0 ? outputTokens || null : null,
    totalTokens: calls.length > 0 ? normalizedTotals || null : null,
    estimatedCostUsd: hasCost ? Number(estimatedCostUsd.toFixed(6)) : null,
  };
};

// ─── coerceNumber ─────────────────────────────────────────────────

describe('coerceNumber', () => {
  it('returns null for null', () => expect(coerceNumber(null)).toBeNull());
  it('returns null for undefined', () => expect(coerceNumber(undefined)).toBeNull());
  it('returns number for finite number', () => expect(coerceNumber(42)).toBe(42));
  it('returns null for NaN', () => expect(coerceNumber(NaN)).toBeNull());
  it('returns null for Infinity', () => expect(coerceNumber(Infinity)).toBeNull());
  it('returns null for -Infinity', () => expect(coerceNumber(-Infinity)).toBeNull());
  it('parses numeric string', () => expect(coerceNumber('3.14')).toBe(3.14));
  it('returns null for non-numeric string', () => expect(coerceNumber('abc')).toBeNull());
  it('coerces empty string to 0 (Number("") === 0)', () => expect(coerceNumber('')).toBe(0));
  it('returns null for object', () => expect(coerceNumber({})).toBeNull());
  it('returns null for boolean', () => expect(coerceNumber(true)).toBeNull());
  it('returns 0 for zero', () => expect(coerceNumber(0)).toBe(0));
  it('parses "0" string', () => expect(coerceNumber('0')).toBe(0));
});

// ─── formatDuration ───────────────────────────────────────────────

describe('formatDuration', () => {
  it('returns — for null', () => expect(formatDuration(null)).toBe('—'));
  it('formats milliseconds', () => expect(formatDuration(500)).toBe('500ms'));
  it('formats seconds', () => expect(formatDuration(5000)).toBe('5.0s'));
  it('formats minutes', () => expect(formatDuration(90000)).toBe('1m 30s'));
  it('handles 0ms', () => expect(formatDuration(0)).toBe('0ms'));
  it('handles sub-second', () => expect(formatDuration(999)).toBe('999ms'));
  it('handles exactly 1000ms', () => expect(formatDuration(1000)).toBe('1.0s'));
  it('handles exactly 60s', () => expect(formatDuration(60000)).toBe('1m 0s'));
});

// ─── formatTokens ─────────────────────────────────────────────────

describe('formatTokens', () => {
  it('returns — for null', () => expect(formatTokens(null)).toBe('—'));
  it('formats small number', () => expect(formatTokens(42)).toBe('42'));
  it('formats with locale separator', () => {
    const result = formatTokens(1234567);
    // Locale-dependent, but should contain digits
    expect(result).toContain('1');
    expect(result).toContain('234');
  });
  it('formats zero', () => expect(formatTokens(0)).toBe('0'));
});

// ─── formatCost ───────────────────────────────────────────────────

describe('formatCost', () => {
  it('returns — for null', () => expect(formatCost(null)).toBe('—'));
  it('formats with $ prefix and 4 decimals', () => expect(formatCost(0.0015)).toBe('$0.0015'));
  it('formats zero', () => expect(formatCost(0)).toBe('$0.0000'));
  it('formats larger amount', () => expect(formatCost(1.5)).toBe('$1.5000'));
});

// ─── buildTotalsFromCalls ─────────────────────────────────────────

describe('buildTotalsFromCalls', () => {
  it('returns all nulls for empty array', () => {
    const totals = buildTotalsFromCalls([]);
    expect(totals.durationMs).toBeNull();
    expect(totals.inputTokens).toBeNull();
    expect(totals.outputTokens).toBeNull();
    expect(totals.totalTokens).toBeNull();
    expect(totals.estimatedCostUsd).toBeNull();
  });

  it('sums metrics from multiple calls', () => {
    const calls: AiCallRow[] = [
      { label: 'plan', durationMs: 1000, usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 }, estimatedCostUsd: 0.001 },
      { label: 'generate', durationMs: 2000, usage: { inputTokens: 200, outputTokens: 100, totalTokens: 300 }, estimatedCostUsd: 0.002 },
    ];
    const totals = buildTotalsFromCalls(calls);
    expect(totals.durationMs).toBe(3000);
    expect(totals.inputTokens).toBe(300);
    expect(totals.outputTokens).toBe(150);
    expect(totals.totalTokens).toBe(450);
    expect(totals.estimatedCostUsd).toBe(0.003);
  });

  it('returns null estimatedCostUsd when no cost data', () => {
    const calls: AiCallRow[] = [
      { label: 'call1', durationMs: 500, usage: { inputTokens: 50, outputTokens: 25, totalTokens: 75 } },
    ];
    const totals = buildTotalsFromCalls(calls);
    expect(totals.estimatedCostUsd).toBeNull();
  });

  it('falls back to input+output when totalTokens is 0', () => {
    const calls: AiCallRow[] = [
      { label: 'call1', durationMs: 100, usage: { inputTokens: 100, outputTokens: 50 } },
    ];
    const totals = buildTotalsFromCalls(calls);
    expect(totals.totalTokens).toBe(150);
  });

  it('handles calls with missing usage', () => {
    const calls: AiCallRow[] = [
      { label: 'call1', durationMs: 500 },
    ];
    const totals = buildTotalsFromCalls(calls);
    expect(totals.durationMs).toBe(500);
    expect(totals.inputTokens).toBeNull();
    expect(totals.totalTokens).toBeNull();
  });
});
