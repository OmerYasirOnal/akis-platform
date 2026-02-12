import { useEffect, useMemo, useState } from 'react';
import type { JobTraceEvent, StageStreamEvent, TraceStreamEvent } from '../../services/api/types';
import { useJobStream } from '../../hooks/useJobStream';
import { useI18n } from '../../i18n/useI18n';
import { cn } from '../../utils/cn';
import { PhaseProgressBanner } from './PhaseProgressBanner';
import { InnerMonologue } from './InnerMonologue';
import { PhaseActivityCards } from './PhaseActivityCards';
import { ExpandingFileTree } from './ExpandingFileTree';
import { StepTimeline } from './StepTimeline';

export interface LiveAgentCanvasProps {
  jobId: string | null;
  isRunning: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  qualityScore?: number | null;
  startedAt?: number;
  defaultView?: 'stream' | 'timeline' | 'quality';
}

type CanvasView = 'stream' | 'timeline' | 'quality';

const VIEW_STORAGE_KEY = 'akis.liveAgentCanvas.view';

function toTimestamp(ts: string): number {
  const value = new Date(ts).getTime();
  return Number.isNaN(value) ? Date.now() : value;
}

function mapTimelineTraces(events: TraceStreamEvent[]): JobTraceEvent[] {
  return events.map((event) => ({
    id: `stream-${event.eventId}`,
    eventType: event.eventType,
    stepId: event.stepId,
    title: event.title,
    detail: event.detail,
    durationMs: event.durationMs,
    status: event.status,
    correlationId: event.correlationId,
    timestamp: event.ts,
    toolName: event.toolName,
    inputSummary: event.inputSummary,
    outputSummary: event.outputSummary,
    reasoningSummary: event.reasoningSummary,
    askedWhat: event.askedWhat,
    didWhat: event.didWhat,
    whyReason: event.whyReason,
  }));
}

export function LiveAgentCanvas({
  jobId,
  isRunning,
  isCompleted,
  isFailed,
  qualityScore,
  startedAt,
  defaultView = 'stream',
}: LiveAgentCanvasProps) {
  const { t: translate } = useI18n();
  const t = (key: string) => translate(key as never);

  const {
    events,
    currentStage,
    stageMessage,
    traceEvents,
    artifactEvents,
  } = useJobStream(jobId, {
    autoConnect: Boolean(jobId),
    includeHistory: true,
  });

  const stageEvents = useMemo(
    () => events.filter((event): event is StageStreamEvent => event.type === 'stage'),
    [events],
  );

  const resolvedStartedAt = useMemo(() => {
    if (startedAt) return startedAt;
    if (events.length === 0) return undefined;
    return toTimestamp(events[0].ts);
  }, [events, startedAt]);

  const timelineTraces = useMemo(() => mapTimelineTraces(traceEvents), [traceEvents]);

  const [activeView, setActiveView] = useState<CanvasView>(() => {
    const savedView = typeof window !== 'undefined' ? window.localStorage.getItem(VIEW_STORAGE_KEY) : null;
    if (savedView === 'stream' || savedView === 'timeline' || savedView === 'quality') {
      return savedView;
    }
    return defaultView;
  });

  useEffect(() => {
    if (isCompleted) {
      setActiveView('quality');
    }
  }, [isCompleted]);

  useEffect(() => {
    window.localStorage.setItem(VIEW_STORAGE_KEY, activeView);
  }, [activeView]);

  const qualityStatus = isFailed
    ? t('agentCanvas.quality.status.failed')
    : isCompleted
      ? t('agentCanvas.quality.status.completed')
      : t('agentCanvas.quality.status.running');

  return (
    <div className="flex h-full min-h-[420px] flex-col gap-3" data-testid="live-agent-canvas">
      <PhaseProgressBanner
        currentStage={currentStage}
        stageMessage={stageMessage}
        isRunning={isRunning}
        isCompleted={isCompleted}
        isFailed={isFailed}
        qualityScore={qualityScore}
        startedAt={resolvedStartedAt}
      />

      <div className="flex items-center gap-2 border-b border-ak-border pb-2">
        {(['stream', 'timeline', 'quality'] as CanvasView[]).map((view) => (
          <button
            key={view}
            type="button"
            onClick={() => setActiveView(view)}
            className={cn(
              'rounded px-3 py-1.5 text-xs font-medium transition-colors',
              activeView === view
                ? 'bg-ak-primary/15 text-ak-primary'
                : 'text-ak-text-secondary hover:bg-ak-surface hover:text-ak-text-primary',
            )}
          >
            {t(`agentCanvas.view.${view}`)}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {activeView === 'stream' && (
          <div className="flex h-full flex-col gap-3">
            <div className="sm:h-1/2 lg:h-3/5" data-testid="stream-monologue">
              <InnerMonologue
                events={events}
                traceEvents={traceEvents}
                stageEvents={stageEvents}
                isRunning={isRunning}
              />
            </div>
            <div className="hidden sm:block lg:h-2/5" data-testid="stream-phases">
              <PhaseActivityCards
                events={events}
                currentStage={currentStage}
                isRunning={isRunning}
              />
            </div>
          </div>
        )}

        {activeView === 'timeline' && (
          <div className="rounded-lg bg-ak-surface p-3" data-testid="timeline-view">
            <StepTimeline traces={timelineTraces} />
          </div>
        )}

        {activeView === 'quality' && (
          <div className="space-y-3" data-testid="quality-view">
            <div className="rounded-lg bg-ak-surface p-4">
              <p className="text-xs uppercase tracking-[0.08em] text-ak-text-secondary">
                {t('agentCanvas.quality.title')}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-semibold text-ak-text-primary">
                  {typeof qualityScore === 'number' ? qualityScore : '--'}
                </p>
                <p className="text-xs text-ak-text-secondary">{qualityStatus}</p>
              </div>
            </div>

            <ExpandingFileTree
              artifactEvents={artifactEvents}
              traceEvents={traceEvents}
              isRunning={isRunning}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default LiveAgentCanvas;
