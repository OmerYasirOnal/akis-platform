import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LiveAgentCanvas } from '../LiveAgentCanvas';
import type { StreamEvent, TraceStreamEvent, ArtifactStreamEvent, StageStreamEvent } from '../../../services/api/types';

const useJobStreamMock = vi.fn();

vi.mock('../../../hooks/useJobStream', () => ({
  useJobStream: (...args: unknown[]) => useJobStreamMock(...args),
}));

vi.mock('../PhaseProgressBanner', () => ({
  PhaseProgressBanner: () => <div data-testid="phase-banner" />,
}));

vi.mock('../InnerMonologue', () => ({
  InnerMonologue: () => <div data-testid="inner-monologue" />,
}));

vi.mock('../PhaseActivityCards', () => ({
  PhaseActivityCards: () => <div data-testid="phase-activity-cards" />,
}));

vi.mock('../ExpandingFileTree', () => ({
  ExpandingFileTree: () => <div data-testid="expanding-file-tree" />,
}));

vi.mock('../StepTimeline', () => ({
  StepTimeline: () => <div data-testid="step-timeline" />,
}));

const translations: Record<string, string> = {
  'agentCanvas.view.stream': 'Stream',
  'agentCanvas.view.timeline': 'Timeline',
  'agentCanvas.view.quality': 'Quality',
  'agentCanvas.quality.title': 'Quality Snapshot',
  'agentCanvas.quality.status.running': 'Execution in progress',
  'agentCanvas.quality.status.completed': 'Execution completed',
  'agentCanvas.quality.status.failed': 'Execution failed',
};

vi.mock('../../../i18n/useI18n', () => ({
  useI18n: () => ({ t: (key: string) => translations[key] ?? key }),
}));

function makeHookResult(overrides: Partial<{
  events: StreamEvent[];
  currentStage: string | null;
  stageMessage: string | null;
  traceEvents: TraceStreamEvent[];
  artifactEvents: ArtifactStreamEvent[];
}> = {}) {
  return {
    events: [],
    currentStage: 'planning',
    stageMessage: 'Planning',
    planSteps: null,
    currentStepId: null,
    toolEvents: [],
    artifactEvents: [],
    traceEvents: [],
    aiCallEvents: [],
    errorEvents: [],
    logEvents: [],
    isConnected: true,
    isEnded: false,
    lastEventId: 0,
    connect: vi.fn(),
    disconnect: vi.fn(),
    clearEvents: vi.fn(),
    ...overrides,
  };
}

describe('LiveAgentCanvas', () => {
  beforeEach(() => {
    localStorage.clear();
    useJobStreamMock.mockReturnValue(makeHookResult({
      events: [
        {
          type: 'stage',
          eventId: 1,
          ts: '2026-02-12T10:00:00.000Z',
          jobId: 'job-1',
          stage: 'planning',
          status: 'started',
        } as StageStreamEvent,
      ],
    }));
  });

  it('renders stream sub-components while running', () => {
    render(
      <LiveAgentCanvas
        jobId="job-1"
        isRunning={true}
        isCompleted={false}
        isFailed={false}
      />
    );

    expect(screen.getByTestId('phase-banner')).toBeInTheDocument();
    expect(screen.getByTestId('inner-monologue')).toBeInTheDocument();
    expect(screen.getByTestId('phase-activity-cards')).toBeInTheDocument();
  });

  it('switches to quality view when job completes', async () => {
    const { rerender } = render(
      <LiveAgentCanvas
        jobId="job-1"
        isRunning={true}
        isCompleted={false}
        isFailed={false}
      />
    );

    rerender(
      <LiveAgentCanvas
        jobId="job-1"
        isRunning={false}
        isCompleted={true}
        isFailed={false}
        qualityScore={88}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('quality-view')).toBeInTheDocument();
      expect(screen.getByTestId('expanding-file-tree')).toBeInTheDocument();
    });
  });

  it('supports manual tab switching', () => {
    render(
      <LiveAgentCanvas
        jobId="job-1"
        isRunning={true}
        isCompleted={false}
        isFailed={false}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Timeline' }));
    expect(screen.getByTestId('step-timeline')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Quality' }));
    expect(screen.getByTestId('expanding-file-tree')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Stream' }));
    expect(screen.getByTestId('inner-monologue')).toBeInTheDocument();
  });
});
