import type { PipelineActivity } from '../../hooks/usePipelineStream';

interface ActivityLogProps {
  activities: PipelineActivity[];
  currentStep: PipelineActivity | null;
  isRunning: boolean;
  stageName?: 'scribe' | 'proto' | 'trace';
  progress?: number;
}

export function ActivityLog({
  activities,
  currentStep,
  isRunning,
  stageName,
  progress,
}: ActivityLogProps) {
  const stageActivities = stageName
    ? activities.filter((a) => a.stage === stageName)
    : activities;

  if (!isRunning && stageActivities.length === 0) return null;

  return (
    <div className="mt-3 space-y-1">
      {/* Progress bar */}
      {isRunning && progress !== undefined && (
        <div
          className="w-full h-1 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--ak-border, #e5e7eb)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              backgroundColor: 'var(--ak-primary, #6366f1)',
            }}
          />
        </div>
      )}

      {/* Activity list */}
      <div className="space-y-0.5 max-h-40 overflow-y-auto">
        {stageActivities.map((activity, i) => {
          const time = new Date(activity.timestamp).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
          const isError = activity.step === 'error';
          const isComplete =
            activity.step === 'complete' ||
            activity.step === 'pipeline_complete';
          const isAiCall = activity.step === 'ai_call';

          return (
            <div key={i} className="flex items-start gap-2 text-xs leading-relaxed">
              <span
                className="font-mono shrink-0 opacity-40 tabular-nums"
                style={{ width: '56px' }}
              >
                {time}
              </span>
              <span
                className={
                  isError
                    ? 'text-red-400'
                    : isComplete
                      ? 'text-green-400'
                      : isAiCall
                        ? 'opacity-90'
                        : 'opacity-60'
                }
              >
                {isError && '\u2717 '}
                {isComplete && '\u2713 '}
                {activity.message}
              </span>
            </div>
          );
        })}

        {/* Active step pulse */}
        {isRunning &&
          currentStep &&
          currentStep.step !== 'complete' &&
          currentStep.step !== 'error' &&
          currentStep.step !== 'pipeline_complete' && (
            <div
              className="flex items-center gap-2 text-xs"
              style={{ color: 'var(--ak-primary, #6366f1)' }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: 'var(--ak-primary, #6366f1)' }}
              />
              <span>{currentStep.message}</span>
            </div>
          )}
      </div>
    </div>
  );
}
