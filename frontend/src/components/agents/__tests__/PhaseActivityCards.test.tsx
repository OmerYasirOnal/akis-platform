import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { PhaseActivityCards } from '../PhaseActivityCards';
import type { StreamEvent } from '../../../services/api/types';

const translations: Record<string, string> = {
  'agentCanvas.phase.init': 'Initializing...',
  'agentCanvas.phase.planning': 'Planning execution steps',
  'agentCanvas.phase.executing': 'Executing tasks',
  'agentCanvas.phase.reflecting': 'Reviewing output quality',
  'agentCanvas.phase.validating': 'Validating results',
  'agentCanvas.phase.publishing': 'Publishing artifacts',
  'agentCanvas.elapsed': 'Elapsed',
  'agentCanvas.activity.summary.pending': 'Waiting for this phase...',
  'agentCanvas.activity.summary.events': '{count} events',
  'agentCanvas.activity.summary.filesRead': '{count} files read',
  'agentCanvas.activity.summary.filesGenerated': '{count} files generated',
  'agentCanvas.activity.summary.toolCalls': '{count} tool calls',
  'agentCanvas.activity.details.empty': 'No events yet for this phase.',
  'agentCanvas.activity.details.asked': 'Asked: {value}',
  'agentCanvas.activity.details.did': 'Did: {value}',
  'agentCanvas.activity.details.why': 'Why: {value}',
};

vi.mock('../../../i18n/useI18n', () => ({
  useI18n: () => ({ t: (key: string) => translations[key] ?? key }),
}));

const sampleEvents: StreamEvent[] = [
  {
    type: 'stage',
    eventId: 1,
    ts: '2026-02-12T10:00:00.000Z',
    jobId: 'job-1',
    stage: 'init',
    status: 'started',
    message: 'Init',
  },
  {
    type: 'stage',
    eventId: 2,
    ts: '2026-02-12T10:00:01.000Z',
    jobId: 'job-1',
    stage: 'planning',
    status: 'started',
    message: 'Plan',
  },
  {
    type: 'trace',
    eventId: 3,
    ts: '2026-02-12T10:00:01.200Z',
    jobId: 'job-1',
    eventType: 'reasoning',
    title: 'Analyze scope',
  },
  {
    type: 'stage',
    eventId: 4,
    ts: '2026-02-12T10:00:02.000Z',
    jobId: 'job-1',
    stage: 'executing',
    status: 'started',
    message: 'Execute',
  },
  {
    type: 'tool',
    eventId: 5,
    ts: '2026-02-12T10:00:02.300Z',
    jobId: 'job-1',
    toolName: 'github.readFile',
    provider: 'mcp',
    ok: true,
    did: 'Read auth module',
  },
];

describe('PhaseActivityCards', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-12T10:00:04.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders all phase cards', () => {
    render(<PhaseActivityCards events={sampleEvents} currentStage="executing" isRunning={true} />);

    expect(screen.getAllByTestId(/phase-card-/)).toHaveLength(6);
  });

  it('expands active phase by default', () => {
    render(<PhaseActivityCards events={sampleEvents} currentStage="executing" isRunning={true} />);

    expect(screen.getByTestId('phase-details-executing')).toBeInTheDocument();
  });

  it('shows completed phases with checkmark and duration', () => {
    render(<PhaseActivityCards events={sampleEvents} currentStage="executing" isRunning={true} />);

    const initCard = screen.getByTestId('phase-card-init');
    expect(within(initCard).getByText('✅')).toBeInTheDocument();
    expect(screen.getByTestId('phase-duration-init')).toHaveTextContent('1.0s');
  });
});
