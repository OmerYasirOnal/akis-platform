/**
 * M2-UI-1: Citation verification status badge.
 * States: verified, unverified, blocked, conflict.
 */
import { cn } from '../../../utils/cn';

type CitationStatus = 'verified' | 'unverified' | 'blocked' | 'conflict';

const CONFIG: Record<
  CitationStatus,
  { label: string; icon: string; tone: string; bg: string }
> = {
  verified: {
    label: 'Verified',
    icon: '✓',
    tone: 'text-emerald-400',
    bg: 'bg-emerald-500/20',
  },
  unverified: {
    label: 'Unverified',
    icon: '⚠',
    tone: 'text-amber-400',
    bg: 'bg-amber-500/20',
  },
  blocked: {
    label: 'Blocked',
    icon: '✕',
    tone: 'text-red-400',
    bg: 'bg-red-500/20',
  },
  conflict: {
    label: 'Conflict',
    icon: '!',
    tone: 'text-orange-400',
    bg: 'bg-orange-500/20',
  },
};

export interface CitationBadgeProps {
  status: CitationStatus;
  count?: number;
  className?: string;
}

export function CitationBadge({ status, count, className }: CitationBadgeProps) {
  const { label, icon, tone, bg } = CONFIG[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium border',
        tone,
        bg,
        'border-current/30',
        className
      )}
      aria-label={`Citation status: ${label}${count != null ? `, ${count} sources` : ''}`}
    >
      <span aria-hidden>{icon}</span>
      <span>{label}</span>
      {count != null && (
        <span className="opacity-80" aria-hidden>
          ({count})
        </span>
      )}
    </span>
  );
}
