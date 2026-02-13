/**
 * M2-UI-2: Horizontal progress-bar-style confidence indicator.
 * Color coding: 0–40 red, 41–70 yellow, 71–100 green.
 */
import { cn } from '../../../utils/cn';

type ConfidenceSize = 'sm' | 'md';

function getColorClass(score: number): string {
  if (score <= 40) return 'bg-red-500';
  if (score <= 70) return 'bg-amber-500';
  return 'bg-emerald-500';
}

export interface ConfidenceIndicatorProps {
  score: number;
  label?: string;
  size?: ConfidenceSize;
  className?: string;
}

export function ConfidenceIndicator({
  score,
  label,
  size = 'md',
  className,
}: ConfidenceIndicatorProps) {
  const clamped = Math.min(100, Math.max(0, score));
  const colorClass = getColorClass(clamped);
  const barHeight = size === 'sm' ? 'h-1.5' : 'h-2';

  return (
    <div
      className={cn('flex flex-col gap-1', className)}
      aria-label={label ? `${label}: ${clamped}% confidence` : `Confidence: ${clamped}%`}
    >
      <div className="flex items-center justify-between gap-2">
        {label && (
          <span className="text-xs text-ak-text-secondary">{label}</span>
        )}
        <span
          className={cn(
            'text-xs font-medium tabular-nums',
            clamped <= 40 && 'text-red-400',
            clamped > 40 && clamped <= 70 && 'text-amber-400',
            clamped > 70 && 'text-emerald-400'
          )}
        >
          {clamped}%
        </span>
      </div>
      <div
        className={cn('w-full rounded-full bg-ak-surface-3 overflow-hidden', barHeight)}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300 ease-out',
            colorClass
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
