import React from 'react';

interface WorkerCardProps {
  jobId: string;
  role: string;
  agentType: string;
  color: string;
  state: string;
  workerIndex: number;
  tokenUsage?: number | null;
  costUsd?: string | null;
  error?: string | null;
  onTalk?: (jobId: string) => void;
  onFocus?: (jobId: string) => void;
}

const stateLabels: Record<string, string> = {
  pending: 'Bekliyor',
  running: 'Çalışıyor',
  completed: 'Tamamlandı',
  failed: 'Başarısız',
  awaiting_approval: 'Onay Bekliyor',
};

const stateColors: Record<string, string> = {
  pending: 'text-zinc-400',
  running: 'text-blue-400',
  completed: 'text-emerald-400',
  failed: 'text-red-400',
  awaiting_approval: 'text-amber-400',
};

export const WorkerCard: React.FC<WorkerCardProps> = ({
  jobId,
  role,
  agentType,
  color,
  state,
  // workerIndex - reserved for future use
  tokenUsage,
  costUsd,
  error,
  onTalk,
  onFocus,
}) => {
  const progress = state === 'completed' ? 100
    : state === 'running' ? 50
    : state === 'failed' ? 0
    : 0;

  return (
    <div
      className="relative rounded-lg border border-zinc-700/50 bg-zinc-800/50 p-4 hover:border-zinc-600/50 transition-colors cursor-pointer"
      onClick={() => onFocus?.(jobId)}
      style={{ borderLeftColor: color, borderLeftWidth: '3px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm font-medium text-zinc-200">
            @{role}
          </span>
        </div>
        <span className="text-xs text-zinc-500">{agentType}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-zinc-700/50 rounded-full h-1.5 mb-3">
        <div
          className="h-1.5 rounded-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            backgroundColor: state === 'failed' ? '#EF4444' : color,
          }}
        />
      </div>

      {/* Status */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-medium ${stateColors[state] || 'text-zinc-400'}`}>
          {stateLabels[state] || state}
        </span>
        {state === 'running' && (
          <span className="inline-flex items-center">
            <span className="animate-pulse w-1.5 h-1.5 rounded-full bg-blue-400 mr-1" />
            <span className="text-xs text-zinc-500">canlı</span>
          </span>
        )}
      </div>

      {/* Metrics */}
      <div className="flex items-center gap-3 text-xs text-zinc-500">
        {tokenUsage != null && (
          <span>{tokenUsage.toLocaleString()} token</span>
        )}
        {costUsd && (
          <span>${parseFloat(costUsd).toFixed(4)}</span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-2 text-xs text-red-400 truncate" title={error}>
          {error}
        </div>
      )}

      {/* Talk button */}
      {onTalk && state === 'running' && (
        <button
          onClick={(e) => { e.stopPropagation(); onTalk(jobId); }}
          className="mt-3 w-full text-xs py-1.5 rounded border border-zinc-600 text-zinc-300 hover:bg-zinc-700/50 transition-colors"
        >
          Konuş
        </button>
      )}
    </div>
  );
};
