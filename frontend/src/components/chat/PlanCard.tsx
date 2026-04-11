import { useState } from 'react';
import { cn } from '../../utils/cn';
import type { UserFriendlyPlan, ChangePlan, PlanStatus } from '../../types/plan';

interface PlanCardProps {
  plan: UserFriendlyPlan | ChangePlan;
  version: number;
  status: PlanStatus;
  isChangeRequest: boolean;
  onApprove?: () => void;
  onReject?: () => void;
}

const STATUS_LABELS: Record<PlanStatus, string> = {
  active: 'Aktif',
  edited: 'Düzenlendi',
  approved: 'Onaylandı',
  rejected: 'Reddedildi',
  cancelled: 'İptal Edildi',
};

const STATUS_COLORS: Record<PlanStatus, string> = {
  active: 'bg-ak-primary/10 text-ak-primary',
  edited: 'bg-yellow-500/10 text-yellow-400',
  approved: 'bg-green-500/10 text-green-400',
  rejected: 'bg-red-500/10 text-red-400',
  cancelled: 'bg-ak-surface text-ak-text-tertiary',
};

export function PlanCard({ plan, version, status, isChangeRequest, onApprove, onReject }: PlanCardProps) {
  const [expanded, setExpanded] = useState(status === 'active');
  const isActive = status === 'active';

  return (
    <div
      className={cn(
        'rounded-xl border transition-all duration-200',
        isActive
          ? 'border-ak-primary/30 bg-ak-surface shadow-lg shadow-ak-primary/5'
          : 'border-ak-border-subtle bg-ak-surface-2/50 opacity-70',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm">{isChangeRequest ? '🔄' : '📋'}</span>
          <span className="text-sm font-semibold text-ak-text-primary">
            {isChangeRequest ? 'Değişiklik Planı' : 'Proje Planı'}
            {': '}
            {'projectName' in plan ? plan.projectName : (plan as ChangePlan).changeName}
          </span>
          {version > 1 && (
            <span className="rounded bg-ak-surface-2 px-1.5 py-0.5 text-[10px] text-ak-text-tertiary">
              v{version}
            </span>
          )}
        </div>
        {!isActive && (
          <div className="flex items-center gap-2">
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', STATUS_COLORS[status])}>
              {STATUS_LABELS[status]}
            </span>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[11px] text-ak-text-tertiary hover:text-ak-text-secondary"
            >
              {expanded ? 'Gizle' : 'Detayları göster'}
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      {(isActive || expanded) && (
        <div className="border-t border-ak-border-subtle px-4 py-3 space-y-3">
          {/* Summary */}
          <p className="text-xs text-ak-text-secondary">{plan.summary}</p>

          {/* Features / Modified Files */}
          {!isChangeRequest && 'features' in plan ? (
            <div>
              <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-ak-text-tertiary">
                Özellikler
              </h4>
              <ol className="space-y-1">
                {(plan as UserFriendlyPlan).features.map((f, i) => (
                  <li key={i} className="flex gap-2 text-xs text-ak-text-secondary">
                    <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-ak-primary/10 text-[10px] font-medium text-ak-primary">
                      {i + 1}
                    </span>
                    <span>
                      <span className="font-medium text-ak-text-primary">{f.name}</span>
                      {f.description && (
                        <span className="text-ak-text-tertiary">{' — '}{f.description}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <div className="space-y-2">
              {'modifiedFiles' in plan && (plan as ChangePlan).modifiedFiles.length > 0 && (
                <div>
                  <h4 className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-ak-text-tertiary">
                    Değişecek Dosyalar
                  </h4>
                  {(plan as ChangePlan).modifiedFiles.map((f, i) => (
                    <div key={i} className="flex gap-1.5 text-xs text-ak-text-secondary">
                      <span className="text-yellow-400">📝</span>
                      <span className="font-mono text-ak-text-primary">{f.path}</span>
                      <span className="text-ak-text-tertiary">— {f.description}</span>
                    </div>
                  ))}
                </div>
              )}
              {'newFiles' in plan && (plan as ChangePlan).newFiles.length > 0 && (
                <div>
                  <h4 className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-ak-text-tertiary">
                    Yeni Dosyalar
                  </h4>
                  {(plan as ChangePlan).newFiles.map((f, i) => (
                    <div key={i} className="flex gap-1.5 text-xs text-ak-text-secondary">
                      <span>📄</span>
                      <span className="font-mono text-ak-text-primary">{f}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tech Choices */}
          {'techChoices' in plan && (plan as UserFriendlyPlan).techChoices.length > 0 && (
            <div>
              <h4 className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-ak-text-tertiary">
                Teknik Seçimler
              </h4>
              <p className="text-xs text-ak-text-secondary">
                {(plan as UserFriendlyPlan).techChoices.join(' · ')}
              </p>
            </div>
          )}

          {/* File count */}
          {'estimatedFiles' in plan && (
            <p className="text-xs text-ak-text-tertiary">
              Tahmini Dosya Sayısı: ~{(plan as UserFriendlyPlan).estimatedFiles}
            </p>
          )}

          {/* Test info */}
          <p className="text-xs text-ak-text-tertiary">
            🧪 {plan.requiresTests ? 'Trace testleri yazacak.' : 'Bu değişiklik test gerektirmiyor.'}
            {plan.testRationale && ` (${plan.testRationale})`}
          </p>
        </div>
      )}

      {/* Action Buttons — only for active plan */}
      {isActive && (
        <div className="flex gap-2 border-t border-ak-border-subtle px-4 py-3">
          <button
            onClick={onApprove}
            className={cn(
              'flex-1 rounded-lg bg-ak-primary px-4 py-2 text-sm font-semibold text-[color:var(--ak-on-primary)]',
              'hover:brightness-110 active:brightness-95 transition-all duration-150',
              'sm:flex-none',
            )}
          >
            ✅ Onayla
          </button>
          <button
            onClick={onReject}
            className={cn(
              'flex-1 rounded-lg border border-ak-border px-4 py-2 text-sm font-medium text-ak-text-secondary',
              'hover:border-red-400 hover:text-red-400 transition-all duration-150',
              'sm:flex-none',
            )}
          >
            ❌ İptal
          </button>
        </div>
      )}
    </div>
  );
}
