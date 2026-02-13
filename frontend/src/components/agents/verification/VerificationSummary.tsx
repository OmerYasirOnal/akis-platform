/**
 * M2-UI-5 (bonus): Summary card combining all verification gates.
 */
import { cn } from '../../../utils/cn';

export interface GateItem {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  /** Score 0–1 (or 0–100 for display; component normalizes) */
  score: number;
  /** Threshold 0–1 (or 0–100 for display) */
  threshold: number;
}

export interface VerificationSummaryProps {
  gates: GateItem[];
  overallStatus: 'pass' | 'warn' | 'fail';
  riskProfile?: string;
  className?: string;
}

const STATUS_ICONS: Record<'pass' | 'warn' | 'fail', string> = {
  pass: '✓',
  warn: '⚠',
  fail: '✕',
};

const STATUS_CONFIG: Record<
  'pass' | 'warn' | 'fail',
  { badge: string; icon: string }
> = {
  pass: { badge: 'bg-emerald-500/20 text-emerald-400', icon: 'text-emerald-400' },
  warn: { badge: 'bg-amber-500/20 text-amber-400', icon: 'text-amber-400' },
  fail: { badge: 'bg-red-500/20 text-red-400', icon: 'text-red-400' },
};

export function VerificationSummary({
  gates,
  overallStatus,
  riskProfile,
  className,
}: VerificationSummaryProps) {
  const overallCfg = STATUS_CONFIG[overallStatus];

  return (
    <div
      className={cn(
        'rounded-xl border border-ak-border bg-ak-surface-2 p-4',
        className
      )}
      aria-label="Verification summary"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold',
            overallCfg.badge
          )}
        >
          <span aria-hidden>{STATUS_ICONS[overallStatus]}</span>
          {overallStatus.charAt(0).toUpperCase() + overallStatus.slice(1)}
        </span>
        {riskProfile && (
          <span className="text-xs text-ak-text-secondary">
            Risk: {riskProfile}
          </span>
        )}
      </div>
      <ul className="space-y-2">
        {gates.map((g) => {
          const cfg = STATUS_CONFIG[g.status];
          const scoreVal = g.score <= 1 ? g.score : g.score / 100;
          const thresholdVal = g.threshold <= 1 ? g.threshold : g.threshold / 100;
          const scorePct = Math.round(scoreVal * 100);
          const thresholdPct = Math.round(thresholdVal * 100);
          return (
            <li
              key={g.name}
              className="flex items-center gap-3 text-sm"
            >
              <span className={cn('shrink-0', cfg.icon)} aria-hidden>
                {STATUS_ICONS[g.status]}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium capitalize text-ak-text-primary">
                    {g.name}
                  </span>
                  <span className="text-xs tabular-nums text-ak-text-secondary">
                    {scorePct}% / {thresholdPct}%
                  </span>
                </div>
                <div className="relative mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-ak-surface-3">
                  <div
                    className={cn(
                      'absolute inset-y-0 left-0 rounded-full transition-all duration-300',
                      g.status === 'pass' && 'bg-emerald-500',
                      g.status === 'warn' && 'bg-amber-500',
                      g.status === 'fail' && 'bg-red-500'
                    )}
                    style={{ width: `${Math.min(100, scorePct)}%` }}
                  />
                  {thresholdPct <= 100 && (
                    <div
                      className="absolute top-0 bottom-0 w-px bg-ak-text-secondary/70"
                      style={{ left: `${thresholdPct}%` }}
                      aria-hidden
                    />
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
