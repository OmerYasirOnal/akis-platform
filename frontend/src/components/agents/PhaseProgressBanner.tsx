import { useCallback, useEffect, useMemo, useState } from 'react';
import type { StageStreamEvent } from '../../services/api/types';
import { useI18n } from '../../i18n/useI18n';
import { cn } from '../../utils/cn';

export interface PhaseProgressBannerProps {
  currentStage: string | null;
  stageMessage: string | null;
  isRunning: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  qualityScore?: number | null;
  startedAt?: number;
}

const STAGES: StageStreamEvent['stage'][] = [
  'init',
  'planning',
  'executing',
  'reflecting',
  'validating',
  'publishing',
  'completed',
];

const STAGE_ICONS: Record<StageStreamEvent['stage'] | 'failed', string> = {
  init: '🧠',
  planning: '📋',
  executing: '⚡',
  reflecting: '🔍',
  validating: '✅',
  publishing: '📤',
  completed: '✅',
  failed: '❌',
};

const PROGRESS_WIDTH_CLASS: Record<StageStreamEvent['stage'] | 'failed', string> = {
  init: 'w-[14%]',
  planning: 'w-[29%]',
  executing: 'w-[43%]',
  reflecting: 'w-[57%]',
  validating: 'w-[71%]',
  publishing: 'w-[86%]',
  completed: 'w-full',
  failed: 'w-full',
};

function isStage(value: string | null): value is StageStreamEvent['stage'] {
  return value !== null && STAGES.includes(value as StageStreamEvent['stage']);
}

function getQualityClass(score: number): string {
  if (score >= 70) return 'border-emerald-400 text-emerald-300';
  if (score >= 40) return 'border-amber-400 text-amber-300';
  return 'border-red-400 text-red-300';
}

export function PhaseProgressBanner({
  currentStage,
  stageMessage,
  isRunning,
  isCompleted,
  isFailed,
  qualityScore,
  startedAt,
}: PhaseProgressBannerProps) {
  const { t: translate } = useI18n();
  const t = useCallback((key: string) => translate(key as never), [translate]);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!isRunning || !startedAt) {
      setElapsedSeconds(0);
      return;
    }

    const tick = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [isRunning, startedAt]);

  const normalizedStage = useMemo<StageStreamEvent['stage'] | 'failed'>(() => {
    if (isFailed) return 'failed';
    if (isCompleted) return 'completed';
    if (isStage(currentStage)) return currentStage;
    return 'init';
  }, [currentStage, isCompleted, isFailed]);

  const phaseText = useMemo(() => {
    if (isFailed) return t('agentCanvas.phase.failed');
    return t(`agentCanvas.phase.${normalizedStage}`);
  }, [isFailed, normalizedStage, t]);

  const bannerClasses = cn(
    'relative h-16 w-full overflow-hidden rounded-lg border border-ak-border bg-ak-surface',
    isFailed && 'border-l-4 border-l-red-500 bg-red-500/10',
    !isFailed && isCompleted && 'border-l-4 border-l-blue-500',
    !isFailed && !isCompleted && isRunning && 'border-l-4 border-l-emerald-500',
    !isFailed && !isCompleted && !isRunning && 'border-l-4 border-l-ak-border'
  );

  if (!isRunning && !isCompleted && !isFailed) {
    return (
      <div className={bannerClasses} data-testid="phase-ready-banner">
        <div className="flex h-full items-center justify-between px-4">
          <div className="flex items-center gap-3 text-ak-text-secondary">
            <span className="text-lg">○</span>
            <p className="text-sm font-medium">{t('agentCanvas.ready')}</p>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-ak-surface-2">
          <div className="h-full w-0 bg-ak-primary" data-testid="phase-progress-fill" />
        </div>
      </div>
    );
  }

  const statusMessage = stageMessage ?? phaseText;
  const progressClass = PROGRESS_WIDTH_CLASS[normalizedStage];

  return (
    <div className={bannerClasses} role="status" aria-live="polite">
      <div className="flex h-full items-center justify-between px-4 pb-1">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'text-xl',
                isRunning && !isCompleted && !isFailed && 'animate-pulse'
              )}
              aria-hidden="true"
            >
              {STAGE_ICONS[normalizedStage]}
            </span>
            <p className="truncate text-sm font-semibold text-ak-text-primary" data-testid="phase-name">
              {phaseText}
            </p>
          </div>
          <p className="truncate text-xs text-ak-text-secondary">{statusMessage}</p>
        </div>

        <div className="ml-4 flex items-center gap-4 text-xs text-ak-text-secondary">
          {isRunning && (
            <span data-testid="phase-elapsed">
              {t('agentCanvas.elapsed')}: {elapsedSeconds}s
            </span>
          )}
          {isCompleted && typeof qualityScore === 'number' && (
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border text-[10px] font-semibold',
                getQualityClass(qualityScore)
              )}
              aria-label={`${t('agentCanvas.quality')}: ${qualityScore}`}
              data-testid="quality-score-badge"
            >
              {qualityScore}
            </div>
          )}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-1 bg-ak-surface-2">
        <div
          className={cn('h-full bg-ak-primary transition-all duration-500 ease-out', progressClass)}
          data-testid="phase-progress-fill"
        />
      </div>
    </div>
  );
}

export default PhaseProgressBanner;
