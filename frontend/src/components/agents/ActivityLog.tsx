import { cn } from '../../utils/cn';
import type { AgentActivityEntry } from '../../services/api/agent-activities';

interface ActivityLogProps {
  activities: AgentActivityEntry[];
}

const AGENT_COLORS: Record<string, { text: string; bg: string }> = {
  scribe: { text: 'text-ak-scribe', bg: 'bg-ak-scribe/10' },
  proto: { text: 'text-ak-proto', bg: 'bg-ak-proto/10' },
  trace: { text: 'text-ak-trace', bg: 'bg-ak-trace/10' },
};

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('tr-TR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function ActivityLog({ activities }: ActivityLogProps) {
  if (activities.length === 0) {
    return (
      <div className="rounded-xl border border-ak-border bg-ak-surface p-6 text-center">
        <p className="text-sm text-ak-text-tertiary">Henüz agent aktivitesi yok.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-ak-border bg-ak-surface">
      <div className="border-b border-ak-border-subtle px-4 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-ak-text-tertiary">
          Aktivite Geçmişi
        </h3>
      </div>
      <div className="divide-y divide-ak-border-subtle">
        {activities.map((a) => {
          const colors = AGENT_COLORS[a.agent] ?? { text: 'text-ak-text-secondary', bg: 'bg-ak-surface-2' };
          return (
            <div key={a.id} className="flex items-center gap-3 px-4 py-2.5">
              {/* Time */}
              <span className="w-24 flex-shrink-0 font-mono text-[10px] tabular-nums text-ak-text-tertiary">
                {formatTime(a.createdAt)}
              </span>

              {/* Agent badge */}
              <span className={cn('rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase', colors.bg, colors.text)}>
                {a.agent}
              </span>

              {/* Action */}
              <span className="min-w-0 flex-1 truncate text-xs text-ak-text-secondary">{a.action}</span>

              {/* Metrics */}
              <div className="hidden items-center gap-3 sm:flex">
                {a.confidence != null && (
                  <span className="text-[10px] tabular-nums text-ak-text-tertiary">
                    {(a.confidence * 100).toFixed(0)}%
                  </span>
                )}
                <span className="text-[10px] tabular-nums text-ak-text-tertiary">
                  {a.inputTokens + a.outputTokens} tok
                </span>
                {a.responseTimeMs != null && (
                  <span className="text-[10px] tabular-nums text-ak-text-tertiary">
                    {(a.responseTimeMs / 1000).toFixed(1)}s
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
