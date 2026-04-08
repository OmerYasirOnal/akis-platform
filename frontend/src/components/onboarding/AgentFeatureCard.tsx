import { cn } from '../../utils/cn';

interface AgentFeatureCardProps {
  agent: 'scribe' | 'proto' | 'trace';
  title: string;
  description: string;
  icon: React.ReactNode;
  delay?: number;
}

const agentStyles = {
  scribe: { accent: 'bg-ak-scribe', border: 'hover:border-ak-scribe/30', iconBg: 'bg-ak-scribe/10', text: 'text-ak-scribe' },
  proto: { accent: 'bg-ak-proto', border: 'hover:border-ak-proto/30', iconBg: 'bg-ak-proto/10', text: 'text-ak-proto' },
  trace: { accent: 'bg-ak-trace', border: 'hover:border-ak-trace/30', iconBg: 'bg-ak-trace/10', text: 'text-ak-trace' },
};

export function AgentFeatureCard({ agent, title, description, icon, delay = 0 }: AgentFeatureCardProps) {
  const s = agentStyles[agent];

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 rounded-2xl border border-ak-border bg-ak-surface p-4',
        'transition-all duration-200 animate-fade-in',
        s.border,
        'hover:shadow-ak-glow-sm',
      )}
      style={delay > 0 ? { animationDelay: `${delay}ms`, animationFillMode: 'backwards' } : undefined}
    >
      {/* Left accent strip */}
      <div className={cn('absolute left-0 top-3 bottom-3 w-[3px] rounded-full', s.accent)} />

      {/* Icon */}
      <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ml-2', s.iconBg)}>
        <span className={s.text}>{icon}</span>
      </div>

      {/* Content */}
      <div className="min-w-0">
        <h3 className={cn('text-sm font-semibold', s.text)}>{title}</h3>
        <p className="mt-0.5 text-xs text-ak-text-tertiary leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
