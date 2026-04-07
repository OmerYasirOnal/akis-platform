export interface PipelineStats {
  totalPipelines: number;
  successRate: number;
  avgDurationMs: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  estimatedCostUsd: number;
}

interface PipelineStatsCardProps {
  stats: PipelineStats;
}

export function PipelineStatsCard({ stats }: PipelineStatsCardProps) {
  const totalTokens = stats.totalInputTokens + stats.totalOutputTokens;

  return (
    <div className="rounded-xl border border-ak-border bg-ak-surface p-5">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ak-text-tertiary">
        Pipeline Genel
      </h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Toplam pipeline" value={stats.totalPipelines} />
        <Stat
          label="Başarı oranı"
          value={`${(stats.successRate * 100).toFixed(0)}%`}
          color={stats.successRate >= 0.8 ? 'text-green-400' : 'text-yellow-400'}
        />
        <Stat label="Ort. süre" value={formatDuration(stats.avgDurationMs)} />
        <Stat label="Toplam token" value={formatNumber(totalTokens)} />
        <Stat label="Tahmini maliyet" value={`$${stats.estimatedCostUsd.toFixed(2)}`} />
        <Stat
          label="Token dağılımı"
          value={`${Math.round((stats.totalInputTokens / Math.max(totalTokens, 1)) * 100)}% in`}
        />
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div>
      <span className={`text-lg font-bold tabular-nums ${color ?? 'text-ak-text-primary'}`}>
        {value}
      </span>
      <span className="block text-[10px] text-ak-text-tertiary">{label}</span>
    </div>
  );
}

function formatDuration(ms: number): string {
  if (ms === 0) return '—';
  const secs = ms / 1000;
  if (secs < 60) return `${secs.toFixed(0)}s`;
  const mins = secs / 60;
  return `${mins.toFixed(1)}dk`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}
