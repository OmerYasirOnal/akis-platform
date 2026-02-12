import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { InnerMonologue } from '../InnerMonologue';
import type { StreamEvent } from '../../../services/api/types';

const translations: Record<string, string> = {
  'agentCanvas.monologue.empty': 'Execution updates will appear here.',
  'agentCanvas.monologue.waiting': 'Waiting for agent events...',
  'agentCanvas.monologue.phaseLabel': 'Phase',
  'agentCanvas.monologue.stagePlanning': '🧠 Planning how to approach this task...',
  'agentCanvas.monologue.stageCompleted': '✅ Task completed successfully!',
  'agentCanvas.monologue.stageFailed': '❌ Execution failed: {message}',
  'agentCanvas.monologue.reading': '📄 Reading `{title}`...',
  'agentCanvas.monologue.generating': '✏️ Generating `{title}`...',
  'agentCanvas.monologue.reasoning': '💭 {summary}',
  'agentCanvas.monologue.decision': '🎯 {title}: {detail}',
  'agentCanvas.monologue.toolSuccess': '🔧 {did}',
  'agentCanvas.monologue.toolFailed': '⚠️ Tool call failed: {error}',
  'agentCanvas.monologue.aiResponded': '🤖 AI responded ({model}, {tokens} tokens, {durationMs}ms)',
  'agentCanvas.monologue.produced': '📦 Produced: `{label}`',
  'agentCanvas.monologue.readArtifact': '📖 Read: `{label}`',
  'agentCanvas.phase.planning': 'Planning execution steps',
  'agentCanvas.phase.completed': 'Completed successfully',
  'agentCanvas.phase.failed': 'Execution failed',
};

vi.mock('../../../i18n/useI18n', () => ({
  useI18n: () => ({ t: (key: string) => translations[key] ?? key }),
}));

function withTemplate(template: string, value: string): string {
  return template.replace('{title}', value).replace('{summary}', value);
}

describe('InnerMonologue', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders mapped messages from trace events', async () => {
    const events: StreamEvent[] = [
      {
        type: 'trace',
        eventId: 1,
        ts: '2026-02-12T10:00:00.000Z',
        jobId: 'job-1',
        eventType: 'doc_read',
        title: 'README.md',
      },
    ];

    render(
      <InnerMonologue
        events={events}
        traceEvents={[]}
        stageEvents={[]}
        isRunning={true}
      />
    );

    expect(await screen.findByText(withTemplate(translations['agentCanvas.monologue.reading'], 'README.md'))).toBeInTheDocument();
  });

  it('animates latest message with typewriter effect', async () => {
    const summary = 'Reasoning in progress';
    const fullMessage = withTemplate(translations['agentCanvas.monologue.reasoning'], summary);

    const events: StreamEvent[] = [
      {
        type: 'trace',
        eventId: 2,
        ts: '2026-02-12T10:00:01.000Z',
        jobId: 'job-1',
        eventType: 'reasoning',
        title: 'reasoning',
        reasoningSummary: summary,
      },
    ];

    render(
      <InnerMonologue
        events={events}
        traceEvents={[]}
        stageEvents={[]}
        isRunning={true}
      />
    );

    expect(screen.queryByText(fullMessage)).toBeNull();

    await waitFor(() => {
      expect(screen.getByText(fullMessage)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('auto-scrolls to bottom when new messages arrive', () => {
    const firstEvents: StreamEvent[] = [
      {
        type: 'trace',
        eventId: 10,
        ts: '2026-02-12T10:00:02.000Z',
        jobId: 'job-1',
        eventType: 'doc_read',
        title: 'a.md',
      },
    ];

    const { rerender } = render(
      <InnerMonologue
        events={firstEvents}
        traceEvents={[]}
        stageEvents={[]}
        isRunning={true}
      />
    );

    const log = screen.getByRole('log') as HTMLDivElement;

    Object.defineProperty(log, 'scrollHeight', {
      configurable: true,
      value: 420,
    });

    const secondEvents: StreamEvent[] = [
      ...firstEvents,
      {
        type: 'trace',
        eventId: 11,
        ts: '2026-02-12T10:00:03.000Z',
        jobId: 'job-1',
        eventType: 'file_created',
        title: 'b.md',
      },
    ];

    rerender(
      <InnerMonologue
        events={secondEvents}
        traceEvents={[]}
        stageEvents={[]}
        isRunning={true}
      />
    );

    expect(log.scrollTop).toBe(420);
  });
});
