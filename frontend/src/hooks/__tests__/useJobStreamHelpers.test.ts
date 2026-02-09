/**
 * Contract tests for useJobStream derived state logic
 * Re-creates the event filtering and derived state computation
 */
import { describe, it, expect } from 'vitest';

// ─── Re-create types from services/api/types ─────────────────────

interface BaseStreamEvent {
  eventId: number;
  ts: string;
  jobId: string;
}

interface StageStreamEvent extends BaseStreamEvent {
  type: 'stage';
  stage: 'init' | 'planning' | 'executing' | 'reflecting' | 'validating' | 'publishing' | 'completed' | 'failed';
  status: 'started' | 'progress' | 'completed';
  message?: string;
}

interface PlanStreamEvent extends BaseStreamEvent {
  type: 'plan';
  steps: Array<{ id: string; title: string; detail?: string }>;
  currentStepId?: string;
  planMarkdown?: string;
}

interface ToolStreamEvent extends BaseStreamEvent {
  type: 'tool';
  toolName: string;
  provider: string;
  ok: boolean;
}

interface ArtifactStreamEvent extends BaseStreamEvent {
  type: 'artifact';
  kind: string;
  label: string;
  path?: string;
}

interface TraceStreamEvent extends BaseStreamEvent {
  type: 'trace';
  eventType: string;
  title: string;
}

interface AiCallStreamEvent extends BaseStreamEvent {
  type: 'ai_call';
  purpose: string;
  provider: string;
  model: string;
  ok: boolean;
}

interface ErrorStreamEvent extends BaseStreamEvent {
  type: 'error';
  message: string;
  scope: string;
  fatal: boolean;
}

interface LogStreamEvent extends BaseStreamEvent {
  type: 'log';
  level: string;
  message: string;
}

type StreamEvent =
  | StageStreamEvent
  | PlanStreamEvent
  | ToolStreamEvent
  | ArtifactStreamEvent
  | TraceStreamEvent
  | AiCallStreamEvent
  | ErrorStreamEvent
  | LogStreamEvent;

// ─── Re-create derived state logic from useJobStream ─────────────

function getCurrentStage(events: StreamEvent[]): StageStreamEvent['stage'] | null {
  return (events.filter((e): e is StageStreamEvent => e.type === 'stage').pop()?.stage) ?? null;
}

function getStageMessage(events: StreamEvent[]): string | null {
  return (events.filter((e): e is StageStreamEvent => e.type === 'stage').pop()?.message) ?? null;
}

function getPlanSteps(events: StreamEvent[]): PlanStreamEvent['steps'] | null {
  return events.filter((e): e is PlanStreamEvent => e.type === 'plan').pop()?.steps ?? null;
}

function getCurrentStepId(events: StreamEvent[]): string | null {
  return events.filter((e): e is PlanStreamEvent => e.type === 'plan').pop()?.currentStepId ?? null;
}

function filterByType<T extends StreamEvent>(events: StreamEvent[], type: string): T[] {
  return events.filter(e => e.type === type) as T[];
}

function isTerminalEvent(event: StreamEvent): boolean {
  return event.type === 'stage' &&
    (event.stage === 'completed' || event.stage === 'failed') &&
    event.status === 'completed';
}

function shouldIgnoreSSEFrame(raw: string | undefined | null): boolean {
  return !raw || raw === 'undefined' || raw === 'null' || raw.startsWith(':');
}

// ─── Helpers ──────────────────────────────────────────────────────

const base = { ts: '2025-01-15T10:00:00Z', jobId: 'job-1' };

// ─── getCurrentStage ──────────────────────────────────────────────

describe('getCurrentStage', () => {
  it('returns null for empty events', () => {
    expect(getCurrentStage([])).toBeNull();
  });

  it('returns the latest stage', () => {
    const events: StreamEvent[] = [
      { ...base, eventId: 1, type: 'stage', stage: 'init', status: 'started' },
      { ...base, eventId: 2, type: 'stage', stage: 'planning', status: 'started' },
      { ...base, eventId: 3, type: 'stage', stage: 'executing', status: 'started' },
    ];
    expect(getCurrentStage(events)).toBe('executing');
  });

  it('ignores non-stage events', () => {
    const events: StreamEvent[] = [
      { ...base, eventId: 1, type: 'stage', stage: 'planning', status: 'started' },
      { ...base, eventId: 2, type: 'log', level: 'info', message: 'hello' },
    ];
    expect(getCurrentStage(events)).toBe('planning');
  });
});

// ─── getStageMessage ──────────────────────────────────────────────

describe('getStageMessage', () => {
  it('returns null when no stage events', () => {
    expect(getStageMessage([])).toBeNull();
  });

  it('returns message from latest stage', () => {
    const events: StreamEvent[] = [
      { ...base, eventId: 1, type: 'stage', stage: 'init', status: 'started', message: 'Starting...' },
      { ...base, eventId: 2, type: 'stage', stage: 'planning', status: 'started', message: 'Generating plan' },
    ];
    expect(getStageMessage(events)).toBe('Generating plan');
  });

  it('returns null when latest stage has no message', () => {
    const events: StreamEvent[] = [
      { ...base, eventId: 1, type: 'stage', stage: 'init', status: 'started' },
    ];
    expect(getStageMessage(events)).toBeNull();
  });
});

// ─── getPlanSteps ─────────────────────────────────────────────────

describe('getPlanSteps', () => {
  it('returns null when no plan events', () => {
    expect(getPlanSteps([])).toBeNull();
  });

  it('returns steps from latest plan event', () => {
    const steps = [{ id: 'step-1', title: 'Analyze code' }, { id: 'step-2', title: 'Generate docs' }];
    const events: StreamEvent[] = [
      { ...base, eventId: 1, type: 'plan', steps, currentStepId: 'step-1' },
    ];
    expect(getPlanSteps(events)).toEqual(steps);
  });
});

// ─── getCurrentStepId ─────────────────────────────────────────────

describe('getCurrentStepId', () => {
  it('returns null when no plan events', () => {
    expect(getCurrentStepId([])).toBeNull();
  });

  it('returns currentStepId from latest plan', () => {
    const events: StreamEvent[] = [
      { ...base, eventId: 1, type: 'plan', steps: [{ id: 's1', title: 'Step' }], currentStepId: 's1' },
    ];
    expect(getCurrentStepId(events)).toBe('s1');
  });

  it('returns null when plan has no currentStepId', () => {
    const events: StreamEvent[] = [
      { ...base, eventId: 1, type: 'plan', steps: [{ id: 's1', title: 'Step' }] },
    ];
    expect(getCurrentStepId(events)).toBeNull();
  });
});

// ─── filterByType ─────────────────────────────────────────────────

describe('filterByType', () => {
  const mixed: StreamEvent[] = [
    { ...base, eventId: 1, type: 'tool', toolName: 'listFiles', provider: 'mcp', ok: true },
    { ...base, eventId: 2, type: 'log', level: 'info', message: 'hello' },
    { ...base, eventId: 3, type: 'tool', toolName: 'readFile', provider: 'mcp', ok: true },
    { ...base, eventId: 4, type: 'error', message: 'fail', scope: 'mcp', fatal: false },
    { ...base, eventId: 5, type: 'ai_call', purpose: 'plan', provider: 'openai', model: 'gpt-4o', ok: true },
  ];

  it('filters tool events', () => {
    const tools = filterByType<ToolStreamEvent>(mixed, 'tool');
    expect(tools).toHaveLength(2);
    expect(tools[0].toolName).toBe('listFiles');
  });

  it('filters error events', () => {
    const errors = filterByType<ErrorStreamEvent>(mixed, 'error');
    expect(errors).toHaveLength(1);
  });

  it('filters ai_call events', () => {
    const aiCalls = filterByType<AiCallStreamEvent>(mixed, 'ai_call');
    expect(aiCalls).toHaveLength(1);
    expect(aiCalls[0].model).toBe('gpt-4o');
  });

  it('returns empty for non-existent type', () => {
    expect(filterByType(mixed, 'artifact')).toHaveLength(0);
  });
});

// ─── isTerminalEvent ──────────────────────────────────────────────

describe('isTerminalEvent', () => {
  it('completed stage with status completed is terminal', () => {
    const event: StageStreamEvent = { ...base, eventId: 1, type: 'stage', stage: 'completed', status: 'completed' };
    expect(isTerminalEvent(event)).toBe(true);
  });

  it('failed stage with status completed is terminal', () => {
    const event: StageStreamEvent = { ...base, eventId: 1, type: 'stage', stage: 'failed', status: 'completed' };
    expect(isTerminalEvent(event)).toBe(true);
  });

  it('completed stage with status started is NOT terminal', () => {
    const event: StageStreamEvent = { ...base, eventId: 1, type: 'stage', stage: 'completed', status: 'started' };
    expect(isTerminalEvent(event)).toBe(false);
  });

  it('executing stage is NOT terminal', () => {
    const event: StageStreamEvent = { ...base, eventId: 1, type: 'stage', stage: 'executing', status: 'completed' };
    expect(isTerminalEvent(event)).toBe(false);
  });

  it('non-stage events are NOT terminal', () => {
    const event: LogStreamEvent = { ...base, eventId: 1, type: 'log', level: 'info', message: 'done' };
    expect(isTerminalEvent(event)).toBe(false);
  });
});

// ─── shouldIgnoreSSEFrame ─────────────────────────────────────────

describe('shouldIgnoreSSEFrame', () => {
  it('ignores empty string', () => expect(shouldIgnoreSSEFrame('')).toBe(true));
  it('ignores undefined', () => expect(shouldIgnoreSSEFrame(undefined)).toBe(true));
  it('ignores null', () => expect(shouldIgnoreSSEFrame(null)).toBe(true));
  it('ignores "undefined" string', () => expect(shouldIgnoreSSEFrame('undefined')).toBe(true));
  it('ignores "null" string', () => expect(shouldIgnoreSSEFrame('null')).toBe(true));
  it('ignores SSE comments (colon prefix)', () => expect(shouldIgnoreSSEFrame(': keepalive')).toBe(true));
  it('accepts valid JSON frame', () => expect(shouldIgnoreSSEFrame('{"type":"stage"}')).toBe(false));
});
