import { cn } from '../../utils/cn';
import type { WorkflowStages, StageStatus } from '../../types/workflow';

const AGENT_META = {
  scribe: { icon: '\u25C6', label: 'Scribe', colorClass: 'text-ak-scribe border-ak-scribe', bgClass: 'bg-ak-scribe/10' },
  proto: { icon: '\u2B21', label: 'Proto', colorClass: 'text-ak-proto border-ak-proto', bgClass: 'bg-ak-proto/10' },
  trace: { icon: '\u25C8', label: 'Trace', colorClass: 'text-ak-trace border-ak-trace', bgClass: 'bg-ak-trace/10' },
} as const;

function getNodeClasses(status: StageStatus, agentKey: keyof typeof AGENT_META) {
  const meta = AGENT_META[agentKey];
  const active = status === 'completed' || status === 'running';
  const failed = status === 'failed';

  if (failed) {
    return 'text-red-400 border-red-400 bg-red-400/10';
  }
  if (active) {
    return cn(meta.colorClass, meta.bgClass);
  }
  return 'text-ak-text-tertiary/50 border-ak-text-tertiary/50 bg-transparent';
}

interface MiniPipelineProps {
  stages: WorkflowStages;
  className?: string;
}

export function MiniPipeline({ stages, className }: MiniPipelineProps) {
  const agents: (keyof typeof AGENT_META)[] = ['scribe', 'proto', 'trace'];

  return (
    <div className={cn('flex items-center', className)}>
      {agents.map((key, i) => {
        const s = stages[key];
        const meta = AGENT_META[key];
        const nextAgent = agents[i + 1];
        const nextStatus = nextAgent ? stages[nextAgent].status : 'idle';
        const lineActive = nextStatus !== 'idle';

        return (
          <div key={key} className="flex items-center">
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-lg border-[1.5px] text-[11px] font-semibold transition-all duration-300',
                getNodeClasses(s.status, key),
                s.status === 'running' && 'animate-pulse',
              )}
              title={`${meta.label}: ${s.status}`}
            >
              {meta.icon}
            </div>
            {i < 2 && (
              <div
                className={cn(
                  'h-[1.5px] w-4',
                  lineActive ? 'bg-ak-text-tertiary/60' : 'bg-ak-text-tertiary/25',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
