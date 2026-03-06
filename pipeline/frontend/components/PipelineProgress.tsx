import type { PipelineStage } from '../types';

const STEPS = [
  { key: 'scribe', label: 'Scribe', stages: ['scribe_clarifying', 'scribe_generating', 'awaiting_approval'] },
  { key: 'proto', label: 'Proto', stages: ['proto_building'] },
  { key: 'trace', label: 'Trace', stages: ['trace_testing'] },
] as const;

const TERMINAL_STAGES: PipelineStage[] = ['completed', 'completed_partial', 'failed', 'cancelled'];

function getStepStatus(step: typeof STEPS[number], stage: PipelineStage): 'active' | 'completed' | 'pending' | 'error' {
  if (stage === 'failed') {
    if (step.stages.some((s) => s === stage)) return 'error';
    const stepIdx = STEPS.findIndex((s) => s.key === step.key);
    const activeIdx = STEPS.findIndex((s) => s.stages.some((st) => st === stage));
    return stepIdx < activeIdx ? 'completed' : 'pending';
  }
  if (stage === 'completed' || stage === 'completed_partial') return 'completed';
  if (step.stages.includes(stage as never)) return 'active';
  const stepIdx = STEPS.findIndex((s) => s.key === step.key);
  const activeStepIdx = STEPS.findIndex((s) => s.stages.includes(stage as never));
  if (activeStepIdx === -1) return 'pending';
  return stepIdx < activeStepIdx ? 'completed' : 'pending';
}

interface Props {
  stage: PipelineStage;
}

export function PipelineProgress({ stage }: Props) {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      {STEPS.map((step, i) => {
        const status = getStepStatus(step, stage);
        return (
          <div key={step.key} className="flex items-center flex-1">
            {/* Step circle */}
            <div className="flex items-center gap-3">
              <div
                className={`
                  w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium
                  transition-all duration-300
                  ${status === 'active' ? 'bg-ak-primary text-ak-bg shadow-ak-glow-sm animate-pulse' : ''}
                  ${status === 'completed' ? 'bg-ak-primary/20 text-ak-primary' : ''}
                  ${status === 'pending' ? 'bg-ak-surface-2 text-ak-text-secondary' : ''}
                  ${status === 'error' ? 'bg-ak-danger/20 text-ak-danger' : ''}
                `}
              >
                {status === 'completed' ? '✓' : i + 1}
              </div>
              <span
                className={`
                  text-sm font-medium
                  ${status === 'active' ? 'text-ak-primary' : ''}
                  ${status === 'completed' ? 'text-ak-text-primary' : ''}
                  ${status === 'pending' ? 'text-ak-text-secondary' : ''}
                  ${status === 'error' ? 'text-ak-danger' : ''}
                `}
              >
                {step.label}
              </span>
            </div>
            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div className="flex-1 mx-4">
                <div
                  className={`
                    h-0.5 rounded-full transition-all duration-500
                    ${status === 'completed' ? 'bg-ak-primary/40' : 'bg-ak-border'}
                  `}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
