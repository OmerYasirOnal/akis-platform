import type { PipelineStage } from '../types';

const STAGE_MESSAGES: Record<string, string> = {
  scribe_clarifying: 'Scribe düşünüyor...',
  scribe_generating: 'Spec oluşturuluyor...',
  proto_building: 'Kod üretiliyor...',
  trace_testing: 'Testler yazılıyor...',
};

interface Props {
  stage: PipelineStage;
  visible?: boolean;
}

export function AgentStatusIndicator({ stage, visible = true }: Props) {
  const message = STAGE_MESSAGES[stage];
  if (!message || !visible) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-3 mb-4">
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-ak-primary animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1.5 h-1.5 rounded-full bg-ak-primary animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-1.5 h-1.5 rounded-full bg-ak-primary animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-sm text-ak-text-secondary">{message}</span>
    </div>
  );
}
