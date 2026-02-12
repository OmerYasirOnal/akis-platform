import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PhaseProgressBanner } from '../PhaseProgressBanner';

const translations: Record<string, string> = {
  'agentCanvas.phase.init': 'Initializing...',
  'agentCanvas.phase.planning': 'Planning execution steps',
  'agentCanvas.phase.executing': 'Executing tasks',
  'agentCanvas.phase.reflecting': 'Reviewing output quality',
  'agentCanvas.phase.validating': 'Validating results',
  'agentCanvas.phase.publishing': 'Publishing artifacts',
  'agentCanvas.phase.completed': 'Completed successfully',
  'agentCanvas.phase.failed': 'Execution failed',
  'agentCanvas.ready': 'Ready to run',
  'agentCanvas.elapsed': 'Elapsed',
  'agentCanvas.quality': 'Quality Score',
};

vi.mock('../../../i18n/useI18n', () => ({
  useI18n: () => ({ t: (key: string) => translations[key] ?? key }),
}));

describe('PhaseProgressBanner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-12T10:00:10Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders ready state when job has not started', () => {
    render(
      <PhaseProgressBanner
        currentStage={null}
        stageMessage={null}
        isRunning={false}
        isCompleted={false}
        isFailed={false}
      />
    );

    expect(screen.getByText('Ready to run')).toBeInTheDocument();
    expect(screen.getByTestId('phase-ready-banner')).toBeInTheDocument();
  });

  it('shows phase label and progress while running', () => {
    render(
      <PhaseProgressBanner
        currentStage="planning"
        stageMessage={null}
        isRunning={true}
        isCompleted={false}
        isFailed={false}
        startedAt={new Date('2026-02-12T10:00:00Z').getTime()}
      />
    );

    expect(screen.getByTestId('phase-name')).toHaveTextContent('Planning execution steps');
    expect(screen.getByTestId('phase-elapsed')).toHaveTextContent('Elapsed: 10s');
    expect(screen.getByTestId('phase-progress-fill').className).toContain('w-[29%]');
  });

  it('shows quality score badge on completion', () => {
    render(
      <PhaseProgressBanner
        currentStage="completed"
        stageMessage={null}
        isRunning={false}
        isCompleted={true}
        isFailed={false}
        qualityScore={78}
      />
    );

    expect(screen.getByTestId('phase-name')).toHaveTextContent('Completed successfully');
    expect(screen.getByTestId('quality-score-badge')).toHaveTextContent('78');
  });

  it('shows error state when failed', () => {
    render(
      <PhaseProgressBanner
        currentStage="executing"
        stageMessage="Tool timeout"
        isRunning={false}
        isCompleted={false}
        isFailed={true}
      />
    );

    expect(screen.getByText('Execution failed')).toBeInTheDocument();
    expect(screen.getByText('Tool timeout')).toBeInTheDocument();
    expect(screen.getByRole('status').className).toContain('border-l-red-500');
  });
});
