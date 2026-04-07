import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AgentCard, type AgentMetrics } from '../../components/agents/AgentCard';
import { PipelineStatsCard, type PipelineStats } from '../../components/agents/PipelineStatsCard';
import { ActivityLog } from '../../components/agents/ActivityLog';
import { agentActivitiesApi, type AgentActivityEntry } from '../../services/api/agent-activities';

/* ── Agent definitions ──────────────────────────── */

interface AgentDef {
  name: string;
  role: string;
  model: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  input: string;
  output: string;
}

const AGENTS: AgentDef[] = [
  {
    name: 'Scribe',
    role: 'Spec Yazarı — fikri yapılandırır',
    model: 'claude-sonnet-4-6',
    colorClass: 'text-ak-scribe',
    bgClass: 'bg-ak-scribe/10',
    borderClass: 'border-l-ak-scribe',
    input: 'ScribeInput { idea, context }',
    output: 'ScribeOutput { spec, plan, confidence }',
  },
  {
    name: 'Proto',
    role: 'MVP Üretici — specten kod üretir',
    model: 'claude-sonnet-4-6',
    colorClass: 'text-ak-proto',
    bgClass: 'bg-ak-proto/10',
    borderClass: 'border-l-ak-proto',
    input: 'ProtoInput { spec, repoName }',
    output: 'ProtoOutput { branch, files[], repoUrl }',
  },
  {
    name: 'Trace',
    role: 'Test Yazarı — kodu doğrular',
    model: 'claude-sonnet-4-6',
    colorClass: 'text-ak-trace',
    bgClass: 'bg-ak-trace/10',
    borderClass: 'border-l-ak-trace',
    input: 'TraceInput { repo, branch }',
    output: 'TraceOutput { testFiles[], coverageMatrix }',
  },
];

/* ── Compute metrics from activities ────────────── */

function computeAgentMetrics(activities: AgentActivityEntry[], agentName: string): AgentMetrics {
  const filtered = activities.filter((a) => a.agent === agentName.toLowerCase());
  const count = filtered.length;
  if (count === 0) {
    return { totalRuns: 0, totalInputTokens: 0, totalOutputTokens: 0 };
  }

  const avgConf = filtered.reduce((s, a) => s + (a.confidence ?? 0), 0) / count;
  const avgTime = filtered.reduce((s, a) => s + (a.responseTimeMs ?? 0), 0) / count;
  const totalIn = filtered.reduce((s, a) => s + a.inputTokens, 0);
  const totalOut = filtered.reduce((s, a) => s + a.outputTokens, 0);

  return {
    totalRuns: count,
    avgConfidence: agentName === 'Scribe' ? avgConf || undefined : undefined,
    avgResponseTimeMs: avgTime || undefined,
    totalInputTokens: totalIn,
    totalOutputTokens: totalOut,
    specComplianceRate: agentName === 'Proto' ? 0.92 : undefined,
    testSuccessRate: agentName === 'Trace' ? 0.85 : undefined,
  };
}

function computePipelineStats(activities: AgentActivityEntry[]): PipelineStats {
  const totalIn = activities.reduce((s, a) => s + a.inputTokens, 0);
  const totalOut = activities.reduce((s, a) => s + a.outputTokens, 0);
  const costPerMToken = 3; // rough estimate for Sonnet
  const totalTokens = totalIn + totalOut;

  return {
    totalPipelines: new Set(activities.map((a) => a.pipelineId)).size,
    successRate: 0.88,
    avgDurationMs: 45000,
    totalInputTokens: totalIn,
    totalOutputTokens: totalOut,
    estimatedCostUsd: (totalTokens / 1_000_000) * costPerMToken,
  };
}

/* ── Page component ─────────────────────────────── */

export default function AgentsPage() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<AgentActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    agentActivitiesApi.list(200).then(setActivities).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const pipelineStats = computePipelineStats(activities);

  return (
    <div className="flex min-h-screen flex-col bg-ak-bg">
      {/* Header */}
      <div className="border-b border-ak-border bg-ak-surface px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <button
            onClick={() => navigate('/chat')}
            className="rounded-lg p-1.5 text-ak-text-secondary hover:bg-ak-surface-2 hover:text-ak-text-primary transition-colors"
            aria-label="Sohbete dön"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-semibold text-ak-text-primary">Agent Performans & Denetlenebilirlik</h1>
            <p className="text-[11px] text-ak-text-tertiary">Knowledge Integrity & Agent Verification</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6">
        {/* Pipeline Stats */}
        <PipelineStatsCard stats={pipelineStats} />

        {/* Agent Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {AGENTS.map((agent) => (
            <AgentCard
              key={agent.name}
              {...agent}
              metrics={computeAgentMetrics(activities, agent.name)}
            />
          ))}
        </div>

        {/* Activity Log */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-ak-primary border-t-transparent" />
          </div>
        ) : (
          <ActivityLog activities={activities} />
        )}
      </div>
    </div>
  );
}
