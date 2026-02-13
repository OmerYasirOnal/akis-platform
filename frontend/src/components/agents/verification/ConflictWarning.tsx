/**
 * M2-UI-4: Collapsible warning banner for source conflicts.
 */
import { useState } from 'react';
import { cn } from '../../../utils/cn';

export interface ConflictItem {
  topic: string;
  severity: 'critical' | 'major' | 'minor';
  sources: string[];
}

export interface ConflictWarningProps {
  conflicts: ConflictItem[];
  className?: string;
}

const SEVERITY_CONFIG: Record<
  ConflictItem['severity'],
  { label: string; badge: string }
> = {
  critical: { label: 'Critical', badge: 'bg-red-500/20 text-red-400' },
  major: { label: 'Major', badge: 'bg-amber-500/20 text-amber-400' },
  minor: { label: 'Minor', badge: 'bg-amber-500/10 text-amber-300' },
};

export function ConflictWarning({ conflicts, className }: ConflictWarningProps) {
  const [expanded, setExpanded] = useState(false);
  const count = conflicts.length;

  if (count === 0) return null;

  return (
    <div
      className={cn(
        'rounded-xl border border-amber-500/40 bg-amber-500/10',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-amber-500/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
        aria-expanded={expanded}
        aria-controls="conflict-details"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-amber-200">
          <span aria-hidden>⚠</span>
          Source conflicts
          <span className="rounded-full bg-amber-500/30 px-2 py-0.5 text-xs">
            {count}
          </span>
        </span>
        <span
          className={cn(
            'text-amber-400 transition-transform duration-200',
            expanded && 'rotate-180'
          )}
          aria-hidden
        >
          ▼
        </span>
      </button>
      <div
        id="conflict-details"
        className={cn(
          'border-t border-amber-500/20 transition-all duration-200',
          expanded ? 'block' : 'hidden'
        )}
      >
        <ul className="space-y-3 p-4">
          {conflicts.map((c, i) => {
            const cfg = SEVERITY_CONFIG[c.severity];
            return (
              <li key={`${c.topic}-${i}`} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-ak-text-primary">
                    {c.topic}
                  </span>
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.5 text-xs font-medium',
                      cfg.badge
                    )}
                  >
                    {cfg.label}
                  </span>
                </div>
                <ul className="ml-2 list-inside list-disc text-xs text-ak-text-secondary">
                  {c.sources.map((s, j) => (
                    <li key={j}>{s}</li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
