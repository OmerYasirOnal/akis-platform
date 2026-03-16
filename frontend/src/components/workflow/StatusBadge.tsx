import { cn } from '../../utils/cn';
import type { WorkflowStatus, StageStatus } from '../../types/workflow';

type BadgeStatus = WorkflowStatus | StageStatus;

const STATUS_CONFIG: Record<string, { label: string; colorClass: string; dotClass?: string }> = {
  completed: { label: 'Tamamlandı', colorClass: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' },
  completed_partial: { label: 'Kısmi', colorClass: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
  running: { label: 'Çalışıyor', colorClass: 'text-amber-400 bg-amber-400/10 border-amber-400/30', dotClass: 'bg-amber-400' },
  awaiting_approval: { label: 'Onay Bekliyor', colorClass: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
  failed: { label: 'Başarısız', colorClass: 'text-red-400 bg-red-400/10 border-red-400/30' },
  cancelled: { label: 'İptal', colorClass: 'text-ak-text-tertiary bg-ak-text-tertiary/10 border-ak-text-tertiary/30' },
  idle: { label: 'Beklemede', colorClass: 'text-ak-text-tertiary bg-ak-text-tertiary/10 border-ak-text-tertiary/30' },
  pending: { label: 'Beklemede', colorClass: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
};

interface StatusBadgeProps {
  status: BadgeStatus;
  size?: 'small' | 'normal';
  className?: string;
}

export function StatusBadge({ status, size = 'normal', className }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.idle;
  const isSmall = size === 'small';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-mono font-semibold uppercase tracking-wide',
        isSmall ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-[11px]',
        cfg.colorClass,
        className,
      )}
    >
      {status === 'running' && cfg.dotClass && (
        <span className={cn('h-1.5 w-1.5 rounded-full animate-pulse', cfg.dotClass)} />
      )}
      {status === 'completed' && <span>&#10003;</span>}
      {cfg.label}
    </span>
  );
}
