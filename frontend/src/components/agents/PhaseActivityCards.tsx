import { memo, useCallback, useMemo, useState } from 'react';
import type { StreamEvent, StageStreamEvent } from '../../services/api/types';
import { useI18n } from '../../i18n/useI18n';
import { cn } from '../../utils/cn';

export interface PhaseActivityCardsProps {
  events: StreamEvent[];
  currentStage: string | null;
  isRunning: boolean;
}

type PhaseId = 'init' | 'planning' | 'executing' | 'reflecting' | 'validating' | 'publishing';

type PhaseState = 'completed' | 'active' | 'pending';

interface PhaseCardData {
  phase: PhaseId;
  state: PhaseState;
  durationMs: number;
  summary: string;
  details: StreamEvent[];
  barClass: string;
}

const PHASES: Array<{ id: PhaseId; icon: string }> = [
  { id: 'init', icon: '🧠' },
  { id: 'planning', icon: '📋' },
  { id: 'executing', icon: '⚡' },
  { id: 'reflecting', icon: '🔍' },
  { id: 'validating', icon: '✅' },
  { id: 'publishing', icon: '📤' },
];

const phaseMapping: Record<PhaseId, string[]> = {
  init: ['step_start'],
  planning: ['reasoning', 'decision', 'plan_step'],
  executing: ['doc_read', 'file_created', 'file_modified', 'mcp_call', 'tool_call'],
  reflecting: ['reasoning', 'ai_call'],
  validating: ['decision'],
  publishing: ['file_created', 'artifact'],
};

const BAR_BUCKETS: Array<{ limit: number; className: string }> = [
  { limit: 0, className: 'w-0' },
  { limit: 10, className: 'w-[10%]' },
  { limit: 20, className: 'w-[20%]' },
  { limit: 30, className: 'w-[30%]' },
  { limit: 40, className: 'w-[40%]' },
  { limit: 50, className: 'w-1/2' },
  { limit: 60, className: 'w-[60%]' },
  { limit: 70, className: 'w-[70%]' },
  { limit: 80, className: 'w-[80%]' },
  { limit: 90, className: 'w-[90%]' },
  { limit: 100, className: 'w-full' },
];

function toTimestamp(ts: string | undefined): number {
  if (!ts) return 0;
  const value = new Date(ts).getTime();
  return Number.isNaN(value) ? 0 : value;
}

function formatDuration(ms: number): string {
  if (ms <= 0) return '0s';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.round((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

function getWidthClass(percentage: number): string {
  for (const bucket of BAR_BUCKETS) {
    if (percentage <= bucket.limit) {
      return bucket.className;
    }
  }

  return 'w-full';
}

function eventTypeName(event: StreamEvent): string {
  if (event.type === 'trace') return event.eventType;
  if (event.type === 'tool') return 'tool_call';
  if (event.type === 'ai_call') return 'ai_call';
  if (event.type === 'artifact') return 'artifact';
  if (event.type === 'stage') return event.stage;
  return event.type;
}

function inferPhaseByEvent(event: StreamEvent, currentStage: string | null): PhaseId {
  const eventType = eventTypeName(event);

  for (const phase of PHASES) {
    const matches = phaseMapping[phase.id];
    if (matches.includes(eventType)) {
      if (eventType === 'decision' && currentStage === 'validating') {
        return 'validating';
      }
      if (eventType === 'reasoning' && currentStage === 'reflecting') {
        return 'reflecting';
      }
      if (eventType === 'file_created' && currentStage === 'publishing') {
        return 'publishing';
      }
      return phase.id;
    }
  }

  return 'executing';
}

function buildSummary(
  details: StreamEvent[],
  t: (key: string) => string,
): string {
  const fileReads = details.filter(
    (event) =>
      (event.type === 'trace' && event.eventType === 'doc_read') ||
      (event.type === 'artifact' && event.kind === 'doc_read')
  ).length;

  const fileWrites = details.filter(
    (event) =>
      (event.type === 'trace' && (event.eventType === 'file_created' || event.eventType === 'file_modified')) ||
      (event.type === 'artifact' && event.kind === 'file')
  ).length;

  const toolCalls = details.filter((event) => event.type === 'tool').length;

  if (fileWrites > 0) {
    return t('agentCanvas.activity.summary.filesGenerated').replace('{count}', String(fileWrites));
  }

  if (fileReads > 0) {
    return t('agentCanvas.activity.summary.filesRead').replace('{count}', String(fileReads));
  }

  if (toolCalls > 0) {
    return t('agentCanvas.activity.summary.toolCalls').replace('{count}', String(toolCalls));
  }

  if (details.length > 0) {
    return t('agentCanvas.activity.summary.events').replace('{count}', String(details.length));
  }

  return t('agentCanvas.activity.summary.pending');
}

function getStageStarts(events: StreamEvent[]): Partial<Record<PhaseId, number>> {
  const stageStarts: Partial<Record<PhaseId, number>> = {};
  for (const event of events) {
    if (
      event.type === 'stage' &&
      event.status === 'started' &&
      PHASES.some((phase) => phase.id === event.stage)
    ) {
      stageStarts[event.stage as PhaseId] = toTimestamp(event.ts);
    }
  }

  return stageStarts;
}

function computePhaseCards(
  events: StreamEvent[],
  currentStage: string | null,
  isRunning: boolean,
  t: (key: string) => string,
): PhaseCardData[] {
  const phaseDetails = new Map<PhaseId, StreamEvent[]>();
  for (const phase of PHASES) {
    phaseDetails.set(phase.id, []);
  }

  const stageStarts = getStageStarts(events);
  const orderedStageStarts = PHASES
    .map((phase) => ({ phase: phase.id, start: stageStarts[phase.id] ?? 0 }))
    .filter((entry) => entry.start > 0)
    .sort((a, b) => a.start - b.start);

  const terminalEvent = events.find(
    (event) => event.type === 'stage' && (event.stage === 'completed' || event.stage === 'failed')
  ) as StageStreamEvent | undefined;
  const terminalTs = terminalEvent ? toTimestamp(terminalEvent.ts) : 0;

  for (const event of events) {
    if (event.type === 'stage') {
      continue;
    }

    const eventTs = toTimestamp(event.ts);
    const latestStage = [...orderedStageStarts]
      .reverse()
      .find((entry) => entry.start <= eventTs);

    const targetPhase = latestStage?.phase ?? inferPhaseByEvent(event, currentStage);
    phaseDetails.get(targetPhase)?.push(event);
  }

  const maxObservedIndex = PHASES.reduce((maxIdx, phase, idx) => {
    const hasEvents = (phaseDetails.get(phase.id)?.length ?? 0) > 0;
    const hasStarted = Boolean(stageStarts[phase.id]);
    return hasEvents || hasStarted ? idx : maxIdx;
  }, -1);

  const activeIndex = PHASES.findIndex((phase) => phase.id === currentStage);

  const durations = PHASES.map((phase, idx) => {
    const startTs = stageStarts[phase.id] ?? phaseDetails.get(phase.id)?.[0]?.ts;
    const normalizedStart = typeof startTs === 'string' ? toTimestamp(startTs) : startTs ?? 0;
    const nextStart = idx < PHASES.length - 1 ? stageStarts[PHASES[idx + 1].id] ?? 0 : 0;

    if (!normalizedStart) return 0;

    if (isRunning && idx === activeIndex) {
      return Math.max(0, Date.now() - normalizedStart);
    }

    if (nextStart > 0) {
      return Math.max(0, nextStart - normalizedStart);
    }

    if (terminalTs > 0) {
      return Math.max(0, terminalTs - normalizedStart);
    }

    return 0;
  });

  const totalDuration = durations.reduce((sum, value) => sum + value, 0);

  return PHASES.map((phase, idx) => {
    let state: PhaseState = 'pending';
    if (isRunning && activeIndex >= 0) {
      if (idx < activeIndex) state = 'completed';
      if (idx === activeIndex) state = 'active';
    } else if (idx <= maxObservedIndex) {
      state = 'completed';
    }

    const details = phaseDetails.get(phase.id) ?? [];
    const durationMs = durations[idx];
    const percentage = totalDuration > 0 ? Math.round((durationMs / totalDuration) * 100) : 0;

    return {
      phase: phase.id,
      state,
      durationMs,
      summary: buildSummary(details, t),
      details,
      barClass: getWidthClass(percentage),
    };
  });
}

function extractText(event: StreamEvent): string {
  if (event.type === 'trace') {
    return event.title;
  }

  if (event.type === 'tool') {
    return event.did ?? event.toolName;
  }

  if (event.type === 'ai_call') {
    const tokens = event.tokens?.total ?? 0;
    return `${event.model} • ${tokens} tokens • ${event.durationMs ?? 0}ms`;
  }

  if (event.type === 'artifact') {
    return event.label;
  }

  return event.type;
}

function PhaseActivityCardsComponent({ events, currentStage, isRunning }: PhaseActivityCardsProps) {
  const { t: translate } = useI18n();
  const t = useCallback((key: string) => translate(key as never), [translate]);

  const phaseCards = useMemo(
    () => computePhaseCards(events, currentStage, isRunning, t),
    [events, currentStage, isRunning, t],
  );

  const activePhaseId = phaseCards.find((phase) => phase.state === 'active')?.phase;
  const [expandedPhaseIds, setExpandedPhaseIds] = useState<Set<PhaseId>>(
    () => new Set(activePhaseId ? [activePhaseId] : []),
  );

  const togglePhase = (phase: PhaseId) => {
    setExpandedPhaseIds((prev) => {
      const next = new Set(prev);
      if (next.has(phase)) {
        next.delete(phase);
      } else {
        next.add(phase);
      }
      return next;
    });
  };

  return (
    <div className="relative pl-4">
      <div className="absolute bottom-0 left-2 top-0 w-0.5 bg-ak-border" aria-hidden="true" />
      <div className="space-y-3">
        {phaseCards.map((phaseCard) => {
          const isExpanded = expandedPhaseIds.has(phaseCard.phase) || phaseCard.state === 'active';
          const phaseIcon = PHASES.find((item) => item.id === phaseCard.phase)?.icon ?? '•';
          const title = t(`agentCanvas.phase.${phaseCard.phase}`);

          return (
            <div key={phaseCard.phase} data-testid={`phase-card-${phaseCard.phase}`}>
              <button
                type="button"
                onClick={() => togglePhase(phaseCard.phase)}
                className={cn(
                  'relative w-full rounded-lg border border-ak-border bg-ak-surface p-4 text-left transition-colors hover:bg-ak-surface-2',
                  phaseCard.state === 'active' && 'animate-pulse border-ak-primary/50',
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="text-base" aria-hidden="true">{phaseIcon}</span>
                    <span
                      className={cn(
                        'text-base',
                        phaseCard.state === 'completed' && 'text-emerald-400',
                        phaseCard.state === 'active' && 'text-ak-primary',
                        phaseCard.state === 'pending' && 'text-ak-text-secondary',
                      )}
                    >
                      {phaseCard.state === 'completed' ? '✅' : phaseCard.state === 'active' ? '⟳' : '○'}
                    </span>
                    <span className="truncate text-sm font-semibold text-ak-text-primary">{title}</span>
                  </div>
                  <span className="shrink-0 text-xs text-ak-text-secondary" data-testid={`phase-duration-${phaseCard.phase}`}>
                    {phaseCard.state === 'active'
                      ? `${t('agentCanvas.elapsed')}: ${formatDuration(phaseCard.durationMs)}`
                      : formatDuration(phaseCard.durationMs)}
                  </span>
                </div>

                <p className="mt-1 text-xs text-ak-text-secondary">{phaseCard.summary}</p>

                <div className="mt-2 h-1 rounded bg-ak-surface-2">
                  <div className={cn('h-full rounded bg-ak-primary transition-all duration-500', phaseCard.barClass)} />
                </div>
              </button>

              {isExpanded && (
                <div
                  className="rounded-b-lg border-x border-b border-ak-border bg-ak-surface-2 px-4 py-3"
                  data-testid={`phase-details-${phaseCard.phase}`}
                >
                  {phaseCard.details.length === 0 && (
                    <p className="text-xs text-ak-text-secondary">{t('agentCanvas.activity.details.empty')}</p>
                  )}

                  {phaseCard.details.length > 0 && (
                    <ul className="space-y-2 text-xs text-ak-text-secondary">
                      {phaseCard.details.map((event, index) => (
                        <li key={`${phaseCard.phase}-${index}`} className="rounded border border-ak-border/80 bg-ak-surface px-2 py-1">
                          {event.type === 'tool' ? (
                            <div className="space-y-1">
                              <p className="text-ak-text-primary">{extractText(event)}</p>
                              {event.asked && <p>{t('agentCanvas.activity.details.asked').replace('{value}', event.asked)}</p>}
                              {event.did && <p>{t('agentCanvas.activity.details.did').replace('{value}', event.did)}</p>}
                              {event.why && <p>{t('agentCanvas.activity.details.why').replace('{value}', event.why)}</p>}
                            </div>
                          ) : (
                            <p className="text-ak-text-primary">{extractText(event)}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const PhaseActivityCards = memo(PhaseActivityCardsComponent);
export default PhaseActivityCards;
