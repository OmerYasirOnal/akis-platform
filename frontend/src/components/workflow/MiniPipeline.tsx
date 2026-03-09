import { cn } from '../../utils/cn';
import type { WorkflowStages, StageStatus } from '../../types/workflow';

const AGENT_META = {
  scribe: { icon: '\u25C6', label: 'Scribe', colorClass: 'text-[#38bdf8] border-[#38bdf8]', bgClass: 'bg-[#38bdf8]/10' },
  proto: { icon: '\u2B21', label: 'Proto', colorClass: 'text-[#f59e0b] border-[#f59e0b]', bgClass: 'bg-[#f59e0b]/10' },
  trace: { icon: '\u25C8', label: 'Trace', colorClass: 'text-[#a78bfa] border-[#a78bfa]', bgClass: 'bg-[#a78bfa]/10' },
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
  return 'text-[#4a5568]/50 border-[#4a5568]/50 bg-transparent';
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
                  lineActive ? 'bg-[#4a5568]/60' : 'bg-[#4a5568]/25',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
