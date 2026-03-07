import type { PipelineError } from '../types';

interface Props {
  error: PipelineError;
  onRetry?: () => void;
  onStartOver?: () => void;
  onReconnectGitHub?: () => void;
}

export function PipelineErrorCard({ error, onRetry, onStartOver, onReconnectGitHub }: Props) {
  return (
    <div className="rounded-2xl border border-ak-danger/20 bg-ak-danger/5 p-5">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-ak-danger/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-ak-danger text-sm">!</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-ak-text-primary font-medium mb-1">{error.message}</p>
          {error.technicalDetail && (
            <p className="text-xs text-ak-text-secondary font-mono mb-3">{error.technicalDetail}</p>
          )}

          <div className="flex flex-wrap gap-2">
            {error.retryable && error.recoveryAction === 'retry' && onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-2 text-xs rounded-lg bg-ak-primary/10 text-ak-primary border border-ak-primary/20 hover:bg-ak-primary/20 transition-colors"
              >
                Tekrar Dene
              </button>
            )}
            {error.recoveryAction === 'reconnect_github' && onReconnectGitHub && (
              <button
                onClick={onReconnectGitHub}
                className="px-4 py-2 text-xs rounded-lg bg-ak-surface-2 text-ak-text-primary border border-ak-border hover:border-ak-text-secondary/30 transition-colors"
              >
                GitHub Bağla
              </button>
            )}
            {error.recoveryAction === 'edit_spec' && (
              <button
                onClick={onStartOver}
                className="px-4 py-2 text-xs rounded-lg bg-ak-surface-2 text-ak-text-primary border border-ak-border hover:border-ak-text-secondary/30 transition-colors"
              >
                Spec Düzenle
              </button>
            )}
            {error.recoveryAction === 'start_over' && onStartOver && (
              <button
                onClick={onStartOver}
                className="px-4 py-2 text-xs rounded-lg bg-ak-surface-2 text-ak-text-primary border border-ak-border hover:border-ak-text-secondary/30 transition-colors"
              >
                Baştan Başla
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
