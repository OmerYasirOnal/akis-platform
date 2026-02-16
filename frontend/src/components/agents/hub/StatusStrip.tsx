import { cn } from '../../../utils/cn';

type StatusTone = 'idle' | 'running' | 'success' | 'error';

const TONE_STYLES: Record<StatusTone, string> = {
  idle: 'bg-ak-surface-2 border-ak-border text-ak-text-secondary',
  running: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
  success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
  error: 'bg-red-500/10 border-red-500/30 text-red-300',
};

export interface StatusStripProps {
  label: string;
  value: string;
  secondaryLabel?: string;
  secondaryValue?: string;
  tone?: StatusTone;
  className?: string;
}

export function StatusStrip({
  label,
  value,
  secondaryLabel,
  secondaryValue,
  tone = 'idle',
  className,
}: StatusStripProps) {
  return (
    <div className={cn('rounded-lg border px-3 py-2', TONE_STYLES[tone], className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wider opacity-75">{label}</p>
          <p className="truncate text-sm font-semibold">{value}</p>
        </div>
        {secondaryLabel && secondaryValue && (
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-medium uppercase tracking-wider opacity-75">{secondaryLabel}</p>
            <p className="font-mono text-xs">{secondaryValue}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default StatusStrip;
