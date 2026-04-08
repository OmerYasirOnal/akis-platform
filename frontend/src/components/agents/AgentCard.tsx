import { cn } from '../../utils/cn';

export interface AgentMetrics {
  totalRuns: number;
  avgConfidence?: number;
  avgResponseTimeMs?: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  avgFilesGenerated?: number;
  avgTestsPassed?: number;
  specComplianceRate?: number;
  testSuccessRate?: number;
}

interface AgentCardProps {
  name: string;
  role: string;
  model: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  input: string;
  output: string;
  metrics: AgentMetrics;
}

export function AgentCard({
  name,
  role,
  model,
  colorClass,
  borderClass,
  input,
  output,
  metrics,
}: AgentCardProps) {
  return (
    <div className={cn('rounded-xl border-l-4 border border-ak-border bg-ak-surface p-5', borderClass)}>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className={cn('text-sm font-bold', colorClass)}>{name}</h3>
          <p className="text-[11px] text-ak-text-tertiary">{role}</p>
        </div>
        <span className="rounded bg-ak-surface-2 px-2 py-0.5 font-mono text-[10px] text-ak-text-tertiary">
          {model}
        </span>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MetricCell label="Toplam çalışma" value={metrics.totalRuns} />
        {metrics.avgConfidence != null && (
          <MetricCell
            label="Ort. güven"
            value={`${(metrics.avgConfidence * 100).toFixed(0)}%`}
            color={metrics.avgConfidence >= 0.8 ? 'text-green-400' : 'text-yellow-400'}
          />
        )}
        {metrics.specComplianceRate != null && (
          <MetricCell
            label="Spec uyumu"
            value={`${(metrics.specComplianceRate * 100).toFixed(0)}%`}
            color="text-green-400"
          />
        )}
        {metrics.testSuccessRate != null && (
          <MetricCell
            label="Test başarısı"
            value={`${(metrics.testSuccessRate * 100).toFixed(0)}%`}
            color={metrics.testSuccessRate >= 0.8 ? 'text-green-400' : 'text-red-400'}
          />
        )}
        <MetricCell
          label="Ort. token"
          value={formatTokens(metrics.totalInputTokens + metrics.totalOutputTokens, metrics.totalRuns)}
        />
        {metrics.avgResponseTimeMs != null && (
          <MetricCell
            label="Ort. süre"
            value={`${(metrics.avgResponseTimeMs / 1000).toFixed(1)}s`}
          />
        )}
      </div>

      {/* I/O info */}
      <div className="mt-3 flex gap-2 border-t border-ak-border-subtle pt-3">
        <div className="flex-1">
          <span className="text-[9px] font-semibold uppercase tracking-widest text-ak-text-tertiary">Input</span>
          <p className="mt-0.5 font-mono text-[10px] text-ak-text-secondary">{input}</p>
        </div>
        <div className="flex-1">
          <span className="text-[9px] font-semibold uppercase tracking-widest text-ak-text-tertiary">Output</span>
          <p className="mt-0.5 font-mono text-[10px] text-ak-text-secondary">{output}</p>
        </div>
      </div>
    </div>
  );
}

function MetricCell({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div>
      <span className={cn('text-lg font-bold tabular-nums', color ?? 'text-ak-text-primary')}>
        {value}
      </span>
      <span className="block text-[10px] text-ak-text-tertiary">{label}</span>
    </div>
  );
}

function formatTokens(total: number, runs: number): string {
  if (runs === 0) return '0';
  const avg = Math.round(total / runs);
  if (avg >= 1000) return `${(avg / 1000).toFixed(1)}k`;
  return String(avg);
}
