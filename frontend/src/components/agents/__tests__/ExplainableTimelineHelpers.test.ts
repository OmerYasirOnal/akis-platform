/**
 * Contract tests for ExplainableTimeline pure helper functions
 */
import { describe, it, expect } from 'vitest';

// ─── Re-create helpers from ExplainableTimeline.tsx ─────────────

function getEventIcon(eventType: string): string {
  const icons: Record<string, string> = {
    'step_start': '▶️',
    'step_complete': '✅',
    'step_failed': '❌',
    'doc_read': '📄',
    'file_created': '📝',
    'file_modified': '✏️',
    'mcp_connect': '🔌',
    'mcp_call': '⚡',
    'ai_call': '🤖',
    'ai_parse_error': '⚠️',
    'tool_call': '🔧',
    'tool_result': '📤',
    'decision': '🧠',
    'plan_step': '📋',
    'reasoning': '💭',
    'error': '❌',
    'info': 'ℹ️',
  };
  return icons[eventType] || '•';
}

function getStatusColor(status?: string): string {
  const colors: Record<string, string> = {
    'success': 'text-emerald-400',
    'failed': 'text-red-400',
    'warning': 'text-amber-400',
    'info': 'text-ak-text-secondary',
  };
  return colors[status || 'info'] || 'text-ak-text-secondary';
}

function getStatusBg(status?: string): string {
  const colors: Record<string, string> = {
    'success': 'bg-emerald-500/10 border-emerald-500/30',
    'failed': 'bg-red-500/10 border-red-500/30',
    'warning': 'bg-amber-500/10 border-amber-500/30',
    'info': 'bg-ak-surface-2 border-ak-border',
  };
  return colors[status || 'info'] || 'bg-ak-surface-2 border-ak-border';
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

type TraceEvent = { askedWhat?: string; didWhat?: string; whyReason?: string; reasoningSummary?: string };

function isExplainableEvent(event: TraceEvent): boolean {
  return Boolean(event.askedWhat || event.didWhat || event.whyReason || event.reasoningSummary);
}

// ─── getEventIcon ─────────────────────────────────────────────────

describe('getEventIcon', () => {
  it('returns correct icon for known event types', () => {
    expect(getEventIcon('ai_call')).toBe('🤖');
    expect(getEventIcon('tool_call')).toBe('🔧');
    expect(getEventIcon('step_start')).toBe('▶️');
    expect(getEventIcon('error')).toBe('❌');
    expect(getEventIcon('doc_read')).toBe('📄');
  });

  it('returns bullet for unknown event type', () => {
    expect(getEventIcon('unknown_event')).toBe('•');
    expect(getEventIcon('')).toBe('•');
  });
});

// ─── getStatusColor ───────────────────────────────────────────────

describe('getStatusColor', () => {
  it('returns emerald for success', () => {
    expect(getStatusColor('success')).toBe('text-emerald-400');
  });

  it('returns red for failed', () => {
    expect(getStatusColor('failed')).toBe('text-red-400');
  });

  it('returns amber for warning', () => {
    expect(getStatusColor('warning')).toBe('text-amber-400');
  });

  it('defaults to info for undefined', () => {
    expect(getStatusColor(undefined)).toBe('text-ak-text-secondary');
    expect(getStatusColor()).toBe('text-ak-text-secondary');
  });

  it('defaults to secondary for unknown status', () => {
    expect(getStatusColor('random')).toBe('text-ak-text-secondary');
  });
});

// ─── getStatusBg ──────────────────────────────────────────────────

describe('getStatusBg', () => {
  it('returns correct bg for each status', () => {
    expect(getStatusBg('success')).toContain('bg-emerald');
    expect(getStatusBg('failed')).toContain('bg-red');
    expect(getStatusBg('warning')).toContain('bg-amber');
    expect(getStatusBg('info')).toContain('bg-ak-surface-2');
  });

  it('defaults for undefined', () => {
    expect(getStatusBg()).toContain('bg-ak-surface-2');
  });
});

// ─── formatDuration ───────────────────────────────────────────────

describe('formatDuration (ExplainableTimeline)', () => {
  it('formats milliseconds', () => expect(formatDuration(250)).toBe('250ms'));
  it('formats seconds', () => expect(formatDuration(3500)).toBe('3.5s'));
  it('formats minutes', () => expect(formatDuration(125000)).toBe('2m 5s'));
  it('handles 0ms', () => expect(formatDuration(0)).toBe('0ms'));
  it('handles boundary at 1000ms', () => expect(formatDuration(1000)).toBe('1.0s'));
  it('handles boundary at 60000ms', () => expect(formatDuration(60000)).toBe('1m 0s'));
});

// ─── isExplainableEvent ───────────────────────────────────────────

describe('isExplainableEvent', () => {
  it('returns true when askedWhat is set', () => {
    expect(isExplainableEvent({ askedWhat: 'List files in repo' })).toBe(true);
  });

  it('returns true when didWhat is set', () => {
    expect(isExplainableEvent({ didWhat: 'Created README.md' })).toBe(true);
  });

  it('returns true when whyReason is set', () => {
    expect(isExplainableEvent({ whyReason: 'Needed for documentation' })).toBe(true);
  });

  it('returns true when reasoningSummary is set', () => {
    expect(isExplainableEvent({ reasoningSummary: 'Analyzed the code structure' })).toBe(true);
  });

  it('returns false when no explainability fields', () => {
    expect(isExplainableEvent({})).toBe(false);
  });

  it('returns false for empty strings', () => {
    expect(isExplainableEvent({ askedWhat: '', didWhat: '' })).toBe(false);
  });
});
