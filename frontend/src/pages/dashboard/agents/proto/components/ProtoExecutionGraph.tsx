import { useMemo } from 'react';
import { useI18n } from '../../../../../i18n/useI18n';
import { cn } from '../../../../../utils/cn';

export interface ProtoExecutionEvent {
  id?: string;
  stepId?: string;
  title?: string;
  timestamp: string;
  status?: 'running' | 'completed' | 'failed';
}

interface GraphNode {
  id: string;
  label: string;
  status: 'running' | 'completed' | 'failed' | 'idle';
  timestamp: string;
}

const STATUS_STYLES: Record<GraphNode['status'], string> = {
  idle: 'border-ak-border bg-ak-surface text-ak-text-secondary',
  running: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
  completed: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  failed: 'border-red-500/40 bg-red-500/10 text-red-300',
};

export interface ProtoExecutionGraphProps {
  events: ProtoExecutionEvent[];
  isRunning: boolean;
}

export function ProtoExecutionGraph({ events, isRunning }: ProtoExecutionGraphProps) {
  const { t } = useI18n();

  const nodes = useMemo<GraphNode[]>(() => {
    const deduped = new Map<string, GraphNode>();
    events.forEach((event, index) => {
      const key = event.stepId || event.id || `event-${index}`;
      const label = event.title || event.stepId || t('protoConsole.graph.unknownStep' as never);
      const nextStatus: GraphNode['status'] =
        event.status === 'failed'
          ? 'failed'
          : event.status === 'completed'
            ? 'completed'
            : event.status === 'running'
              ? 'running'
              : 'idle';
      deduped.set(key, {
        id: key,
        label,
        status: nextStatus,
        timestamp: event.timestamp,
      });
    });
    return Array.from(deduped.values()).slice(0, 8);
  }, [events, t]);

  if (nodes.length === 0) {
    return (
      <div className="rounded-lg border border-ak-border bg-ak-surface px-3 py-2 text-xs text-ak-text-secondary">
        {isRunning ? t('protoConsole.graph.waiting' as never) : t('protoConsole.graph.empty' as never)}
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-ak-border bg-ak-surface p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-ak-text-secondary">
          {t('protoConsole.graph.title' as never)}
        </p>
        {isRunning && (
          <span className="inline-flex items-center gap-1 rounded bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-300" />
            {t('protoConsole.graph.live' as never)}
          </span>
        )}
      </div>
      <ol className="space-y-2">
        {nodes.map((node, index) => (
          <li key={node.id} className="flex items-center gap-2">
            <span className="w-5 text-[11px] text-ak-text-secondary/70">{index + 1}.</span>
            <div className={cn('flex-1 rounded border px-2.5 py-1.5 text-xs', STATUS_STYLES[node.status])}>
              <div className="flex items-center justify-between gap-3">
                <span className="truncate font-medium">{node.label}</span>
                <span className="text-[10px] opacity-80">{new Date(node.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default ProtoExecutionGraph;
