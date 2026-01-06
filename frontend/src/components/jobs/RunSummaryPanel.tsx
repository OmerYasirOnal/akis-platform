import type { Job, JobTraceEvent } from '../../services/api/types';

type AiUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

type AiCallDetail = {
  provider?: string;
  model?: string;
  usage?: AiUsage;
  estimatedCostUsd?: number | string | null;
};

type AiCallRow = {
  label: string;
  provider?: string;
  model?: string;
  durationMs?: number;
  usage?: AiUsage;
  estimatedCostUsd?: number | null;
  success?: boolean;
};

type RunSummaryTotals = {
  durationMs: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  estimatedCostUsd: number | null;
};

type RunSummaryPanelProps = {
  job: Job;
  traces: JobTraceEvent[];
};

const coerceNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const formatDuration = (value: number | null): string => {
  if (value === null) return 'N/A';
  if (value < 1000) return `${value}ms`;
  const seconds = value / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m ${remainder.toFixed(0)}s`;
};

const formatTokens = (value: number | null): string => {
  if (value === null) return 'N/A';
  return value.toLocaleString();
};

const formatCost = (value: number | null): string => {
  if (value === null) return 'N/A';
  return `$${value.toFixed(6)}`;
};

const buildTotalsFromJob = (job: Job): RunSummaryTotals => ({
  durationMs: coerceNumber(job.aiTotalDurationMs),
  inputTokens: coerceNumber(job.aiInputTokens),
  outputTokens: coerceNumber(job.aiOutputTokens),
  totalTokens: coerceNumber(job.aiTotalTokens),
  estimatedCostUsd: coerceNumber(job.aiEstimatedCostUsd),
});

const buildTotalsFromCalls = (calls: AiCallRow[]): RunSummaryTotals => {
  let durationMs = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  let totalTokens = 0;
  let estimatedCostUsd = 0;
  let hasCost = false;

  calls.forEach((call) => {
    if (typeof call.durationMs === 'number') {
      durationMs += call.durationMs;
    }
    if (call.usage?.inputTokens) inputTokens += call.usage.inputTokens;
    if (call.usage?.outputTokens) outputTokens += call.usage.outputTokens;
    if (call.usage?.totalTokens) totalTokens += call.usage.totalTokens;
    if (typeof call.estimatedCostUsd === 'number') {
      estimatedCostUsd += call.estimatedCostUsd;
      hasCost = true;
    }
  });

  const normalizedTotals = totalTokens > 0 ? totalTokens : inputTokens + outputTokens;

  return {
    durationMs: calls.length > 0 ? durationMs : null,
    inputTokens: calls.length > 0 ? inputTokens || null : null,
    outputTokens: calls.length > 0 ? outputTokens || null : null,
    totalTokens: calls.length > 0 ? normalizedTotals || null : null,
    estimatedCostUsd: hasCost ? Number(estimatedCostUsd.toFixed(6)) : null,
  };
};

const buildCallRows = (traces: JobTraceEvent[]): AiCallRow[] => {
  return traces
    .filter((trace) => trace.eventType === 'ai_call')
    .map((trace, index) => {
      const detail = (trace.detail ?? {}) as AiCallDetail;
      const label = trace.title?.replace(/^AI:\s*/i, '') || `AI Call ${index + 1}`;
      return {
        label,
        provider: detail.provider,
        model: detail.model,
        durationMs: trace.durationMs,
        usage: detail.usage,
        estimatedCostUsd: coerceNumber(detail.estimatedCostUsd),
        success: trace.status !== 'failed',
      };
    });
};

const formatUsage = (usage?: AiUsage): string => {
  if (!usage) return 'N/A';
  const input = usage.inputTokens ?? 0;
  const output = usage.outputTokens ?? 0;
  const total = usage.totalTokens ?? input + output;
  return `${formatTokens(total)} (in ${formatTokens(input)} / out ${formatTokens(output)})`;
};

export const RunSummaryPanel = ({ job, traces }: RunSummaryPanelProps) => {
  const calls = buildCallRows(traces);
  const totalsFromJob = buildTotalsFromJob(job);
  const totalsFromCalls = buildTotalsFromCalls(calls);

  const totals: RunSummaryTotals = {
    durationMs: totalsFromJob.durationMs ?? totalsFromCalls.durationMs,
    inputTokens: totalsFromJob.inputTokens ?? totalsFromCalls.inputTokens,
    outputTokens: totalsFromJob.outputTokens ?? totalsFromCalls.outputTokens,
    totalTokens: totalsFromJob.totalTokens ?? totalsFromCalls.totalTokens,
    estimatedCostUsd: totalsFromJob.estimatedCostUsd ?? totalsFromCalls.estimatedCostUsd,
  };

  const model =
    job.aiModel || calls.find((call) => call.model)?.model || 'N/A';
  const provider =
    job.aiProvider || calls.find((call) => call.provider)?.provider || 'N/A';

  const hasTotals =
    totals.durationMs !== null ||
    totals.inputTokens !== null ||
    totals.outputTokens !== null ||
    totals.totalTokens !== null ||
    totals.estimatedCostUsd !== null;

  if (calls.length === 0 && !hasTotals && !job.aiModel) {
    return null;
  }

  return (
    <div className="bg-ak-surface-2 shadow rounded-lg p-6 mb-6 border border-ak-border">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ak-text-primary">Run Summary</h2>
          <p className="text-xs text-ak-text-secondary">
            AI usage metrics captured during this job (cost is an estimate).
          </p>
        </div>
        <div className="text-xs text-ak-text-secondary">
          Provider: <span className="text-ak-text-primary">{provider}</span>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-ak-border bg-ak-surface px-4 py-3">
          <p className="text-xs uppercase tracking-wider text-ak-text-secondary">Model</p>
          <p className="mt-1 text-sm font-semibold text-ak-text-primary">{model}</p>
        </div>
        <div className="rounded-lg border border-ak-border bg-ak-surface px-4 py-3">
          <p className="text-xs uppercase tracking-wider text-ak-text-secondary">Total Duration</p>
          <p className="mt-1 text-sm font-semibold text-ak-text-primary">
            {formatDuration(totals.durationMs)}
          </p>
        </div>
        <div className="rounded-lg border border-ak-border bg-ak-surface px-4 py-3">
          <p className="text-xs uppercase tracking-wider text-ak-text-secondary">Total Tokens</p>
          <p className="mt-1 text-sm font-semibold text-ak-text-primary">
            {formatTokens(totals.totalTokens)}
          </p>
          <p className="mt-1 text-xs text-ak-text-secondary">
            In {formatTokens(totals.inputTokens)} / Out {formatTokens(totals.outputTokens)}
          </p>
        </div>
        <div className="rounded-lg border border-ak-border bg-ak-surface px-4 py-3">
          <p className="text-xs uppercase tracking-wider text-ak-text-secondary">Estimated Cost</p>
          <p className="mt-1 text-sm font-semibold text-ak-text-primary">
            {formatCost(totals.estimatedCostUsd)}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-ak-text-primary">Per-Call Breakdown</h3>
        {calls.length === 0 ? (
          <p className="mt-2 text-xs text-ak-text-secondary">
            No AI call traces recorded.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {calls.map((call, index) => (
              <div
                key={`${call.label}-${index}`}
                className="rounded-lg border border-ak-border bg-ak-surface px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-ak-text-primary">
                      {call.label}
                    </p>
                    <p className="text-xs text-ak-text-secondary">
                      Model: {call.model || model}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      call.success === false ? 'text-ak-danger' : 'text-green-400'
                    }`}
                  >
                    {call.success === false ? 'Failed' : 'Success'}
                  </span>
                </div>
                <div className="mt-2 grid gap-2 text-xs text-ak-text-secondary sm:grid-cols-3">
                  <div>
                    <span className="font-medium text-ak-text-primary">Duration:</span>{' '}
                    {formatDuration(call.durationMs ?? null)}
                  </div>
                  <div>
                    <span className="font-medium text-ak-text-primary">Tokens:</span>{' '}
                    {formatUsage(call.usage)}
                  </div>
                  <div>
                    <span className="font-medium text-ak-text-primary">Cost:</span>{' '}
                    {formatCost(call.estimatedCostUsd ?? null)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
