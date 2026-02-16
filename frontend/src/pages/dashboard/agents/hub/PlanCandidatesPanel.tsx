import { cn } from '../../../../utils/cn';
import Button from '../../../../components/common/Button';

export interface PlanCandidateView {
  id: string;
  title: string;
  summary: string;
  status: string;
  selected: boolean;
}

export interface PlanCandidatesPanelProps {
  title: string;
  subtitle: string;
  buildLabel: string;
  buildSelectedLabel: string;
  isRunning: boolean;
  candidates: PlanCandidateView[];
  selectedUnbuiltCandidateIds: string[];
  onToggleSelection: (candidateId: string) => void;
  onBuildSelected: () => void;
  onBuildSingle: (candidateId: string) => void;
}

export function PlanCandidatesPanel({
  title,
  subtitle,
  buildLabel,
  buildSelectedLabel,
  isRunning,
  candidates,
  selectedUnbuiltCandidateIds,
  onToggleSelection,
  onBuildSelected,
  onBuildSingle,
}: PlanCandidatesPanelProps) {
  const unbuilt = candidates.filter((candidate) => candidate.status === 'unbuilt');

  return (
    <div className="rounded-xl border border-ak-border bg-ak-surface p-3 space-y-2 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-ak-text-primary">{title}</p>
          <p className="text-[11px] text-ak-text-secondary">{subtitle}</p>
        </div>
        {unbuilt.length === 1 ? (
          <Button size="sm" disabled={isRunning} onClick={() => onBuildSingle(unbuilt[0].id)}>
            {buildLabel}
          </Button>
        ) : (
          <Button size="sm" disabled={selectedUnbuiltCandidateIds.length === 0 || isRunning} onClick={onBuildSelected}>
            {buildSelectedLabel}
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {candidates.map((candidate) => (
          <div
            key={candidate.id}
            className={cn(
              'flex items-start gap-2 rounded-lg border px-2.5 py-2 transition-colors',
              candidate.selected ? 'border-ak-primary/40 bg-ak-primary/10' : 'border-ak-border bg-ak-bg'
            )}
          >
            <input
              type="checkbox"
              checked={candidate.selected}
              disabled={candidate.status !== 'unbuilt'}
              onChange={() => onToggleSelection(candidate.id)}
              className="mt-0.5 h-4 w-4 rounded border-ak-border bg-ak-bg text-ak-primary"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ak-text-primary">{candidate.title}</p>
              <p className="truncate text-[11px] text-ak-text-secondary">{candidate.summary}</p>
            </div>
            <span className="text-[10px] uppercase tracking-wide text-ak-text-secondary/70">{candidate.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PlanCandidatesPanel;
