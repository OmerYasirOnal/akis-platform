/**
 * Contract tests for StepTimeline pure helper functions
 */
import { describe, it, expect } from 'vitest';

// ─── Re-create helpers from StepTimeline.tsx ────────────────────

const EVENT_ICONS: Record<string, string> = {
  'step_start': '▶',
  'step_complete': '✓',
  'step_failed': '✕',
  'doc_read': '📄',
  'file_created': '📝',
  'file_modified': '✏️',
  'mcp_connect': '🔌',
  'mcp_call': '⚡',
  'ai_call': '🤖',
  'ai_parse_error': '⚠',
  'tool_call': '🔧',
  'tool_result': '📤',
  'decision': '🎯',
  'plan_step': '📋',
  'reasoning': '💭',
  'error': '❌',
  'info': 'ℹ️',
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  'step_start': 'Step Started',
  'step_complete': 'Step Completed',
  'step_failed': 'Step Failed',
  'doc_read': 'Document Read',
  'file_created': 'File Created',
  'file_modified': 'File Modified',
  'mcp_connect': 'Gateway Connection',
  'mcp_call': 'GitHub Operation',
  'ai_call': 'AI Processing',
  'ai_parse_error': 'Parse Warning',
  'tool_call': 'Tool Invocation',
  'tool_result': 'Tool Result',
  'decision': 'Decision Made',
  'plan_step': 'Plan Step',
  'reasoning': 'Reasoning Summary',
  'error': 'Error',
  'info': 'Info',
};

const STEP_LABELS: Record<string, string> = {
  'branch-setup': '🌿 Branch Setup',
  'analyze-content': '🔍 Content Analysis',
  'generate-content': '✍️ Content Generation',
  'reflect-critique': '🔬 Quality Review',
  'commit-changes': '💾 Commit Changes',
  'create-pr': '🔀 Pull Request',
  'completion': '✅ Completed',
  'initialization': '🚀 Initialization',
  'planning': '📋 Planning',
  'execution': '⚡ Execution',
  'validation': '✓ Validation',
  'cleanup': '🧹 Cleanup',
  'parse-requirements': '📄 Parse Requirements',
  'generate-tests': '🧪 Generate Tests',
  'validate-tests': '✓ Validate Tests',
  'analyze-goal': '🎯 Analyze Goal',
  'scaffold': '🏗️ Scaffold',
  'implement': '💻 Implement',
  'test-prototype': '🧪 Test Prototype',
};

function getEventIcon(type: string): string {
  return EVENT_ICONS[type] || '•';
}

function getStepLabel(stepId: string): string {
  return STEP_LABELS[stepId] || stepId.split('-').map(w =>
    w.charAt(0).toUpperCase() + w.slice(1)
  ).join(' ');
}

function getEventTypeLabel(type: string): string {
  return EVENT_TYPE_LABELS[type] || type.split('_').map(w =>
    w.charAt(0).toUpperCase() + w.slice(1)
  ).join(' ');
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

type TraceEvent = { eventType: string; status?: string; reasoningSummary?: string; toolName?: string };
type FilterType = 'all' | 'reasoning' | 'tools' | 'files' | 'errors';

function getStepStatus(events: TraceEvent[]): 'running' | 'completed' | 'failed' | 'info' {
  if (events.some(e => e.eventType === 'step_failed' || e.eventType === 'error')) return 'failed';
  if (events.some(e => e.eventType === 'step_complete')) return 'completed';
  if (events.some(e => e.eventType === 'step_start')) return 'running';
  return 'info';
}

function matchesFilter(event: TraceEvent, filter: FilterType): boolean {
  switch (filter) {
    case 'all': return true;
    case 'reasoning': return Boolean(event.reasoningSummary || event.eventType === 'reasoning' || event.eventType === 'decision');
    case 'tools': return Boolean(event.toolName || event.eventType === 'tool_call' || event.eventType === 'tool_result' || event.eventType === 'mcp_call');
    case 'files': return ['doc_read', 'file_created', 'file_modified'].includes(event.eventType);
    case 'errors': return event.eventType === 'error' || event.eventType === 'step_failed' || event.status === 'failed';
    default: return true;
  }
}

// ─── getEventIcon ─────────────────────────────────────────────────

describe('getEventIcon (StepTimeline)', () => {
  it('returns known icons', () => {
    expect(getEventIcon('ai_call')).toBe('🤖');
    expect(getEventIcon('tool_call')).toBe('🔧');
    expect(getEventIcon('step_start')).toBe('▶');
  });

  it('returns bullet for unknown', () => {
    expect(getEventIcon('custom')).toBe('•');
  });
});

// ─── getStepLabel ─────────────────────────────────────────────────

describe('getStepLabel', () => {
  it('returns known step labels', () => {
    expect(getStepLabel('branch-setup')).toBe('🌿 Branch Setup');
    expect(getStepLabel('create-pr')).toBe('🔀 Pull Request');
    expect(getStepLabel('planning')).toBe('📋 Planning');
  });

  it('title-cases unknown step IDs', () => {
    expect(getStepLabel('custom-step')).toBe('Custom Step');
    expect(getStepLabel('my-new-thing')).toBe('My New Thing');
  });

  it('handles single-word step ID', () => {
    expect(getStepLabel('test')).toBe('Test');
  });
});

// ─── getEventTypeLabel ────────────────────────────────────────────

describe('getEventTypeLabel', () => {
  it('returns known labels', () => {
    expect(getEventTypeLabel('ai_call')).toBe('AI Processing');
    expect(getEventTypeLabel('doc_read')).toBe('Document Read');
    expect(getEventTypeLabel('mcp_call')).toBe('GitHub Operation');
  });

  it('title-cases unknown event types', () => {
    expect(getEventTypeLabel('custom_event')).toBe('Custom Event');
    expect(getEventTypeLabel('my_special_type')).toBe('My Special Type');
  });
});

// ─── formatDuration ───────────────────────────────────────────────

describe('formatDuration (StepTimeline)', () => {
  it('formats milliseconds', () => expect(formatDuration(100)).toBe('100ms'));
  it('formats seconds', () => expect(formatDuration(4200)).toBe('4.2s'));
  it('formats minutes', () => expect(formatDuration(90000)).toBe('1m 30s'));
  it('handles 0ms', () => expect(formatDuration(0)).toBe('0ms'));
});

// ─── getStepStatus ────────────────────────────────────────────────

describe('getStepStatus', () => {
  it('returns failed if any event is step_failed', () => {
    expect(getStepStatus([
      { eventType: 'step_start' },
      { eventType: 'step_failed' },
    ])).toBe('failed');
  });

  it('returns failed if any event is error', () => {
    expect(getStepStatus([
      { eventType: 'ai_call' },
      { eventType: 'error' },
    ])).toBe('failed');
  });

  it('returns completed if step_complete present (no failures)', () => {
    expect(getStepStatus([
      { eventType: 'step_start' },
      { eventType: 'ai_call' },
      { eventType: 'step_complete' },
    ])).toBe('completed');
  });

  it('returns running if step_start present but no completion/failure', () => {
    expect(getStepStatus([
      { eventType: 'step_start' },
      { eventType: 'ai_call' },
    ])).toBe('running');
  });

  it('returns info when no step lifecycle events', () => {
    expect(getStepStatus([
      { eventType: 'ai_call' },
      { eventType: 'info' },
    ])).toBe('info');
  });

  it('returns info for empty events', () => {
    expect(getStepStatus([])).toBe('info');
  });

  it('failed takes priority over completed', () => {
    expect(getStepStatus([
      { eventType: 'step_complete' },
      { eventType: 'step_failed' },
    ])).toBe('failed');
  });
});

// ─── matchesFilter ────────────────────────────────────────────────

describe('matchesFilter', () => {
  it('all filter matches everything', () => {
    expect(matchesFilter({ eventType: 'ai_call' }, 'all')).toBe(true);
    expect(matchesFilter({ eventType: 'error' }, 'all')).toBe(true);
  });

  it('reasoning filter matches reasoning events', () => {
    expect(matchesFilter({ eventType: 'reasoning' }, 'reasoning')).toBe(true);
    expect(matchesFilter({ eventType: 'decision' }, 'reasoning')).toBe(true);
    expect(matchesFilter({ eventType: 'ai_call', reasoningSummary: 'analysis' }, 'reasoning')).toBe(true);
  });

  it('reasoning filter rejects non-reasoning events', () => {
    expect(matchesFilter({ eventType: 'ai_call' }, 'reasoning')).toBe(false);
    expect(matchesFilter({ eventType: 'doc_read' }, 'reasoning')).toBe(false);
  });

  it('tools filter matches tool events', () => {
    expect(matchesFilter({ eventType: 'tool_call' }, 'tools')).toBe(true);
    expect(matchesFilter({ eventType: 'tool_result' }, 'tools')).toBe(true);
    expect(matchesFilter({ eventType: 'mcp_call' }, 'tools')).toBe(true);
    expect(matchesFilter({ eventType: 'ai_call', toolName: 'listFiles' }, 'tools')).toBe(true);
  });

  it('tools filter rejects non-tool events', () => {
    expect(matchesFilter({ eventType: 'ai_call' }, 'tools')).toBe(false);
  });

  it('files filter matches file events', () => {
    expect(matchesFilter({ eventType: 'doc_read' }, 'files')).toBe(true);
    expect(matchesFilter({ eventType: 'file_created' }, 'files')).toBe(true);
    expect(matchesFilter({ eventType: 'file_modified' }, 'files')).toBe(true);
  });

  it('files filter rejects non-file events', () => {
    expect(matchesFilter({ eventType: 'ai_call' }, 'files')).toBe(false);
  });

  it('errors filter matches error events', () => {
    expect(matchesFilter({ eventType: 'error' }, 'errors')).toBe(true);
    expect(matchesFilter({ eventType: 'step_failed' }, 'errors')).toBe(true);
    expect(matchesFilter({ eventType: 'ai_call', status: 'failed' }, 'errors')).toBe(true);
  });

  it('errors filter rejects non-error events', () => {
    expect(matchesFilter({ eventType: 'ai_call' }, 'errors')).toBe(false);
    expect(matchesFilter({ eventType: 'step_complete' }, 'errors')).toBe(false);
  });
});
