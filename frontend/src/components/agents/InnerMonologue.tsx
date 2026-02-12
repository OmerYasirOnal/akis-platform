import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  StreamEvent,
  StageStreamEvent,
  TraceStreamEvent,
} from '../../services/api/types';
import { useI18n } from '../../i18n/useI18n';
import { cn } from '../../utils/cn';
import { useTypewriter } from '../../hooks/useTypewriter';

export interface InnerMonologueProps {
  events: StreamEvent[];
  traceEvents: TraceStreamEvent[];
  stageEvents: StageStreamEvent[];
  isRunning: boolean;
  maxDisplayedMessages?: number;
}

interface MonologueMessage {
  id: string;
  text: string;
  timestamp: string;
  isPhaseTransition: boolean;
  phaseLabel?: string;
}

function formatTemplate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce((output, [key, value]) => {
    return output.replaceAll(`{${key}}`, value);
  }, template);
}

function toDetailText(detail?: Record<string, unknown>): string {
  if (!detail) return '';

  const primary = detail.message ?? detail.summary ?? detail.reason;
  if (typeof primary === 'string') {
    return primary;
  }

  try {
    return JSON.stringify(detail);
  } catch {
    return '';
  }
}

function formatTime(ts: string): string {
  return new Date(ts).toLocaleTimeString(undefined, { hour12: false });
}

function toMessages(
  sourceEvents: StreamEvent[],
  t: (key: string) => string
): MonologueMessage[] {
  const messages: MonologueMessage[] = [];

  for (const event of sourceEvents) {
    if (event.type === 'stage') {
      if (event.stage === 'planning' && event.status === 'started') {
        messages.push({
          id: `stage-${event.eventId}`,
          text: t('agentCanvas.monologue.stagePlanning'),
          timestamp: event.ts,
          isPhaseTransition: true,
          phaseLabel: t('agentCanvas.phase.planning'),
        });
      }

      if (event.stage === 'completed') {
        messages.push({
          id: `stage-${event.eventId}`,
          text: t('agentCanvas.monologue.stageCompleted'),
          timestamp: event.ts,
          isPhaseTransition: true,
          phaseLabel: t('agentCanvas.phase.completed'),
        });
      }

      if (event.stage === 'failed') {
        messages.push({
          id: `stage-${event.eventId}`,
          text: formatTemplate(t('agentCanvas.monologue.stageFailed'), {
            message: event.message ?? '-',
          }),
          timestamp: event.ts,
          isPhaseTransition: true,
          phaseLabel: t('agentCanvas.phase.failed'),
        });
      }

      continue;
    }

    if (event.type === 'trace') {
      if (event.eventType === 'doc_read') {
        messages.push({
          id: `trace-${event.eventId}`,
          text: formatTemplate(t('agentCanvas.monologue.reading'), {
            title: event.title,
          }),
          timestamp: event.ts,
          isPhaseTransition: false,
        });
      }

      if (event.eventType === 'file_created') {
        messages.push({
          id: `trace-${event.eventId}`,
          text: formatTemplate(t('agentCanvas.monologue.generating'), {
            title: event.title,
          }),
          timestamp: event.ts,
          isPhaseTransition: false,
        });
      }

      if (event.eventType === 'reasoning') {
        messages.push({
          id: `trace-${event.eventId}`,
          text: formatTemplate(t('agentCanvas.monologue.reasoning'), {
            summary: event.reasoningSummary ?? event.title,
          }),
          timestamp: event.ts,
          isPhaseTransition: false,
        });
      }

      if (event.eventType === 'decision') {
        messages.push({
          id: `trace-${event.eventId}`,
          text: formatTemplate(t('agentCanvas.monologue.decision'), {
            title: event.title,
            detail: toDetailText(event.detail),
          }),
          timestamp: event.ts,
          isPhaseTransition: false,
        });
      }

      continue;
    }

    if (event.type === 'tool') {
      messages.push({
        id: `tool-${event.eventId}`,
        text: event.ok
          ? formatTemplate(t('agentCanvas.monologue.toolSuccess'), {
              did: event.did ?? event.toolName,
            })
          : formatTemplate(t('agentCanvas.monologue.toolFailed'), {
              error: event.errorSummary ?? event.toolName,
            }),
        timestamp: event.ts,
        isPhaseTransition: false,
      });

      continue;
    }

    if (event.type === 'ai_call' && event.ok) {
      const totalTokens =
        event.tokens?.total ??
        (event.tokens?.input ?? 0) + (event.tokens?.output ?? 0);

      messages.push({
        id: `ai-${event.eventId}`,
        text: formatTemplate(t('agentCanvas.monologue.aiResponded'), {
          model: event.model,
          tokens: String(totalTokens),
          durationMs: String(event.durationMs ?? 0),
        }),
        timestamp: event.ts,
        isPhaseTransition: false,
      });

      continue;
    }

    if (event.type === 'artifact') {
      if (event.kind === 'file') {
        messages.push({
          id: `artifact-${event.eventId}`,
          text: formatTemplate(t('agentCanvas.monologue.produced'), {
            label: event.label,
          }),
          timestamp: event.ts,
          isPhaseTransition: false,
        });
      }

      if (event.kind === 'doc_read') {
        messages.push({
          id: `artifact-${event.eventId}`,
          text: formatTemplate(t('agentCanvas.monologue.readArtifact'), {
            label: event.label,
          }),
          timestamp: event.ts,
          isPhaseTransition: false,
        });
      }
    }
  }

  return messages;
}

export function InnerMonologue({
  events,
  traceEvents,
  stageEvents,
  isRunning,
  maxDisplayedMessages = 20,
}: InnerMonologueProps) {
  const { t: translate } = useI18n();
  const t = useCallback((key: string) => translate(key as never), [translate]);

  const logRef = useRef<HTMLDivElement | null>(null);
  const isNearBottomRef = useRef(true);
  const [showNewMessages, setShowNewMessages] = useState(false);
  const prevCountRef = useRef(0);

  const sourceEvents = useMemo<StreamEvent[]>(() => {
    if (events.length > 0) {
      return events;
    }

    return [...stageEvents, ...traceEvents];
  }, [events, stageEvents, traceEvents]);

  const monologueMessages = useMemo(() => {
    const all = toMessages(sourceEvents, t);
    return all.slice(-maxDisplayedMessages);
  }, [maxDisplayedMessages, sourceEvents, t]);

  const latestMessage = monologueMessages[monologueMessages.length - 1];
  const { displayedText, isTyping } = useTypewriter(latestMessage?.text ?? '');

  // Track scroll position to determine if user is near bottom
  useEffect(() => {
    const node = logRef.current;
    if (!node) return;

    const handleScroll = () => {
      const threshold = 60;
      const distanceFromBottom = node.scrollHeight - node.scrollTop - node.clientHeight;
      isNearBottomRef.current = distanceFromBottom <= threshold;
      if (isNearBottomRef.current) {
        setShowNewMessages(false);
      }
    };

    node.addEventListener('scroll', handleScroll, { passive: true });
    return () => node.removeEventListener('scroll', handleScroll);
  }, []);

  // Smart auto-scroll: only scroll if user is near bottom
  useEffect(() => {
    const node = logRef.current;
    if (!node) return;

    const hasNewMessages = monologueMessages.length > prevCountRef.current;
    prevCountRef.current = monologueMessages.length;

    if (isNearBottomRef.current) {
      node.scrollTop = node.scrollHeight;
    } else if (hasNewMessages) {
      setShowNewMessages(true);
    }
  }, [monologueMessages.length]);

  const scrollToBottom = useCallback(() => {
    const node = logRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
    setShowNewMessages(false);
  }, []);

  return (
    <div className="relative rounded-lg bg-ak-surface p-4">
      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        className="max-h-[60vh] overflow-y-auto pr-1 font-mono text-sm"
      >
        {monologueMessages.length === 0 && (
          <p className="text-ak-text-secondary" role="status">
            {isRunning ? t('agentCanvas.monologue.waiting') : t('agentCanvas.monologue.empty')}
          </p>
        )}

        {monologueMessages.map((message, index) => {
          const isLatest = index === monologueMessages.length - 1;
          const content = isLatest ? displayedText : message.text;

          return (
            <div key={message.id} className="py-1" role="status">
              {message.isPhaseTransition && (
                <div className="my-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.08em] text-ak-text-secondary/80">
                  <span className="h-px flex-1 bg-ak-border" />
                  <span>{message.phaseLabel ?? t('agentCanvas.monologue.phaseLabel')}</span>
                  <span className="h-px flex-1 bg-ak-border" />
                </div>
              )}

              <div className="flex items-start justify-between gap-3">
                <p
                  className={cn(
                    'break-words whitespace-pre-wrap',
                    isLatest ? 'text-ak-text-primary' : 'text-ak-text-secondary'
                  )}
                >
                  {content}
                  {isLatest && isTyping && (
                    <span aria-hidden="true" className="ml-0.5 animate-pulse text-ak-primary">
                      |
                    </span>
                  )}
                </p>
                <span className="shrink-0 text-[10px] text-ak-text-secondary/70">{formatTime(message.timestamp)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating "new messages" pill */}
      {showNewMessages && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-ak-primary px-4 py-1.5 text-xs font-medium text-ak-on-primary shadow-lg transition-all hover:shadow-xl hover:brightness-110"
        >
          {t('agentCanvas.monologue.newMessages')}
        </button>
      )}
    </div>
  );
}

export default InnerMonologue;
