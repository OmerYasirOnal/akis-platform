import type { ReactNode } from 'react';
import { cn } from '../../../../utils/cn';

export interface SessionRailItem {
  id: string;
  title: string;
  typeLabel: string;
  kind: string;
  lastMessagePreview: string;
  hasError: boolean;
}

export interface SessionRailProps {
  title: string;
  newLabel: string;
  emptyLabel: string;
  sessions: SessionRailItem[];
  activeSessionId: string | null;
  animatedSessionId: string | null;
  getColor: (kind: string) => { bg: string; text: string };
  getIcon: (kind: string) => ReactNode;
  onCreate: () => void;
  onSelect: (sessionId: string) => void;
}

export function SessionRail({
  title,
  newLabel,
  emptyLabel,
  sessions,
  activeSessionId,
  animatedSessionId,
  getColor,
  getIcon,
  onCreate,
  onSelect,
}: SessionRailProps) {
  return (
    <div className="mt-3">
      <div className="mb-1.5 flex items-center justify-between px-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-ak-text-secondary/50">{title}</p>
        <button
          onClick={onCreate}
          className="rounded-md px-1.5 py-0.5 text-[10px] font-medium text-ak-text-secondary hover:bg-ak-surface-2 hover:text-ak-text-primary"
        >
          {newLabel}
        </button>
      </div>
      {sessions.length === 0 ? (
        <p className="px-2 text-[11px] text-ak-text-secondary/60">{emptyLabel}</p>
      ) : (
        <div className="space-y-0.5">
          {sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            const color = getColor(session.kind);
            return (
              <button
                key={session.id}
                onClick={() => onSelect(session.id)}
                className={cn(
                  'flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left transition-all',
                  isActive
                    ? 'bg-ak-surface-2 text-ak-text-primary'
                    : 'text-ak-text-secondary hover:bg-ak-surface-2/50 hover:text-ak-text-primary',
                  animatedSessionId === session.id && 'ring-1 ring-ak-primary/40 animate-pulse'
                )}
              >
                <div className={cn('mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg', color.bg, color.text)}>
                  {getIcon(session.kind)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-ak-surface px-1 py-0.5 text-[9px] font-semibold tracking-wide text-ak-text-secondary border border-ak-border">
                      {session.typeLabel}
                    </span>
                    {session.hasError && (
                      <span className="rounded bg-red-500/10 px-1 py-0.5 text-[9px] font-semibold text-red-400 border border-red-500/20">
                        !
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-[12px] font-medium">{session.title}</p>
                  <p
                    className={cn(
                      'truncate text-[10px]',
                      session.lastMessagePreview.startsWith('Error:') || session.lastMessagePreview.startsWith('Failed:')
                        ? 'text-red-400/70'
                        : 'text-ak-text-secondary/60'
                    )}
                  >
                    {session.lastMessagePreview || 'No messages yet'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SessionRail;
