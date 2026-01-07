import type { Job, JobTraceEvent, JobAiCall } from '../../services/api/types';

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

/** Badge component for key source and fallback */
const KeySourceBadge = ({ keySource, fallbackReason }: { keySource: string | null; fallbackReason: string | null }) => {
  if (!keySource) return null;
  
  const isEnvFallback = keySource === 'env';
  const badgeClass = isEnvFallback
    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
    : 'bg-green-500/20 text-green-300 border-green-500/30';
  const label = isEnvFallback ? 'ENV Key' : 'User Key';
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded border ${badgeClass}`}>
      {label}
      {isEnvFallback && fallbackReason && (
        <span className="text-yellow-400" title={fallbackReason}>⚠</span>
      )}
    </span>
  );
};

/** Explain why this provider was selected */
const formatFallbackReason = (reason: string | null): string => {
  if (!reason) return '';
  
  const reasonMap: Record<string, string> = {
    'PAYLOAD_PROVIDER': 'Explicitly set in job request',
    'USER_ACTIVE_PROVIDER': 'Your active provider setting',
    'ENV_DEFAULT_NO_USER_ACTIVE': 'System default (no active provider set)',
    'ENV_DEFAULT_NO_USER_ID': 'System default (no user context)',
    'USER_KEY_MISSING': 'Your key not found, using system key',
    'USE_ENV_AI_FLAG': 'Forced by useEnvAI flag',
    'NON_SCRIBE_JOB': 'Non-Scribe jobs use system config',
    'NO_USER_ID': 'No user context available',
  };
  
  return reasonMap[reason] || reason;
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

/**
 * Build call rows from job.ai.calls (preferred) or fallback to traces
 */
const buildCallRows = (job: Job, traces: JobTraceEvent[]): AiCallRow[] => {
  // Prefer job.ai.calls if available (new structured format)
  if (job.ai?.calls && job.ai.calls.length > 0) {
    return job.ai.calls.map((call: JobAiCall) => ({
      label: call.purpose || `AI Call ${call.callIndex + 1}`,
      provider: call.provider,
      model: call.model,
      durationMs: call.durationMs ?? undefined,
      usage: {
        inputTokens: call.inputTokens ?? undefined,
        outputTokens: call.outputTokens ?? undefined,
        totalTokens: call.totalTokens ?? undefined,
      },
      estimatedCostUsd: coerceNumber(call.estimatedCostUsd),
      success: call.success,
    }));
  }

  // Fallback to traces for backward compatibility
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
  const calls = buildCallRows(job, traces);
  const totalsFromJob = buildTotalsFromJob(job);
  const totalsFromCalls = buildTotalsFromCalls(calls);

  // Use job.ai.summary if available, otherwise fallback to legacy fields
  const aiSummary = job.ai?.summary;
  const totals: RunSummaryTotals = {
    durationMs: coerceNumber(aiSummary?.totalDurationMs) ?? totalsFromJob.durationMs ?? totalsFromCalls.durationMs,
    inputTokens: coerceNumber(aiSummary?.inputTokens) ?? totalsFromJob.inputTokens ?? totalsFromCalls.inputTokens,
    outputTokens: coerceNumber(aiSummary?.outputTokens) ?? totalsFromJob.outputTokens ?? totalsFromCalls.outputTokens,
    totalTokens: coerceNumber(aiSummary?.totalTokens) ?? totalsFromJob.totalTokens ?? totalsFromCalls.totalTokens,
    estimatedCostUsd: coerceNumber(aiSummary?.estimatedCostUsd) ?? totalsFromJob.estimatedCostUsd ?? totalsFromCalls.estimatedCostUsd,
  };

  // Resolved provider/model (preferred) vs requested (fallback)
  const resolvedProvider = job.ai?.resolved?.provider;
  const resolvedModel = job.ai?.resolved?.model;
  const requestedProvider = job.ai?.requested?.provider || job.aiProvider;
  const requestedModel = job.ai?.requested?.model || job.aiModel;
  
  // Display resolved if available, otherwise requested
  const displayProvider = resolvedProvider || requestedProvider || calls.find((call) => call.provider)?.provider || 'N/A';
  const displayModel = resolvedModel || requestedModel || calls.find((call) => call.model)?.model || 'N/A';
  
  // Key source and fallback info
  const keySource = job.ai?.resolved?.keySource || null;
  const fallbackReason = job.ai?.resolved?.fallbackReason || null;
  
  // Show if requested differs from resolved
  const showRequestedVsResolved = resolvedProvider && requestedProvider && resolvedProvider !== requestedProvider;

  const hasTotals =
    totals.durationMs !== null ||
    totals.inputTokens !== null ||
    totals.outputTokens !== null ||
    totals.totalTokens !== null ||
    totals.estimatedCostUsd !== null;

  if (calls.length === 0 && !hasTotals && !displayModel) {
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
        <div className="flex items-center gap-2 text-xs text-ak-text-secondary">
          <span>Provider: <span className="text-ak-text-primary font-medium">{displayProvider}</span></span>
          <KeySourceBadge keySource={keySource} fallbackReason={fallbackReason} />
        </div>
      </div>

      {/* Provider resolution explanation */}
      {fallbackReason && (
        <div className="mt-2 p-2 rounded bg-ak-surface border border-ak-border text-xs text-ak-text-secondary">
          <span className="font-medium text-ak-text-primary">Why this provider?</span>{' '}
          {formatFallbackReason(fallbackReason)}
          {showRequestedVsResolved && (
            <span className="ml-2 text-yellow-400">
              (Requested: {requestedProvider} → Used: {resolvedProvider})
            </span>
          )}
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-ak-border bg-ak-surface px-4 py-3">
          <p className="text-xs uppercase tracking-wider text-ak-text-secondary">Model (Resolved)</p>
          <p className="mt-1 text-sm font-semibold text-ak-text-primary">{displayModel}</p>
          {requestedModel && requestedModel !== displayModel && (
            <p className="mt-1 text-xs text-ak-text-secondary">Requested: {requestedModel}</p>
          )}
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
                      Model: {call.model || displayModel}
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

