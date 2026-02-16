/**
 * M2-UI-3: Source freshness label with relative time and status indicator.
 * Auto-calculates: <3 months = fresh, 3–6 = stale-ish, >6 = stale.
 */
import { cn } from '../../../utils/cn';

type FreshnessStatus = 'fresh' | 'stale-ish' | 'stale' | 'unknown';

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

function monthsAgo(date: Date): number {
  return (Date.now() - date.getTime()) / MONTH_MS;
}

function computeStatus(date: Date): FreshnessStatus {
  const months = monthsAgo(date);
  if (months < 3) return 'fresh';
  if (months < 6) return 'stale-ish';
  return 'stale';
}

function formatRelative(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
  if (diffDay < 30) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
  if (diffMonth < 12) return `${diffMonth} month${diffMonth === 1 ? '' : 's'} ago`;
  return `${diffYear} year${diffYear === 1 ? '' : 's'} ago`;
}

const STATUS_CONFIG: Record<
  FreshnessStatus,
  { dot: string; label: string }
> = {
  fresh: { dot: 'bg-emerald-500', label: 'Fresh' },
  'stale-ish': { dot: 'bg-amber-500', label: 'Stale-ish' },
  stale: { dot: 'bg-red-500', label: 'Stale' },
  unknown: { dot: 'bg-ak-text-secondary', label: 'Unknown' },
};

export interface FreshnessLabelProps {
  date?: string | Date;
  status?: FreshnessStatus;
  className?: string;
}

export function FreshnessLabel({ date, status: propStatus, className }: FreshnessLabelProps) {
  const parsedDate = date
    ? typeof date === 'string'
      ? new Date(date)
      : date
    : null;
  const isValidDate = parsedDate && !Number.isNaN(parsedDate.getTime());
  const status: FreshnessStatus =
    propStatus ?? (isValidDate ? computeStatus(parsedDate) : 'unknown');
  const relative = isValidDate ? formatRelative(parsedDate) : null;
  const { dot, label } = STATUS_CONFIG[status];
  const displayValue = relative ?? label;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs text-ak-text-secondary',
        className
      )}
      aria-label={`Source freshness: ${label}${relative ? `, ${relative}` : ''}`}
    >
      <span
        className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dot)}
        aria-hidden
      />
      <span>{displayValue}</span>
    </span>
  );
}
