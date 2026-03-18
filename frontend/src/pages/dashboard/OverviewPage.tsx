import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../components/workflow/StatusBadge';
import { MiniPipeline } from '../../components/workflow/MiniPipeline';
import { workflowsApi } from '../../services/api/workflows';
import { api } from '../../services/api/client';
import { formatConfidence } from '../../utils/format';
import type { Workflow, WorkflowStats } from '../../types/workflow';
import { TR } from '../../constants/tr';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'az önce';
  if (mins < 60) return `${mins}dk önce`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}sa önce`;
  return `${Math.floor(hrs / 24)}g önce`;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return TR.goodMorning;
  if (h < 18) return TR.goodAfternoon;
  return TR.goodEvening;
}

function computeStats(workflows: Workflow[]): WorkflowStats {
  const total = workflows.length;
  const completed = workflows.filter(w => w.status === 'completed' || w.status === 'completed_partial').length;
  const running = workflows.filter(w => w.status === 'running' || w.status === 'awaiting_approval').length;
  const failed = workflows.filter(w => w.status === 'failed').length;
  const testsGenerated = workflows.reduce((sum, w) => sum + (w.stages.trace.tests || 0), 0);
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thisWeek = workflows.filter(w => new Date(w.createdAt).getTime() > oneWeekAgo).length;

  return {
    total,
    completed,
    running,
    failed,
    avgDuration: total > 0 ? '~45s' : '—',
    testsGenerated,
    successRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    thisWeek,
  };
}

// ═══ Activity event from pipeline data ═══
interface ActivityEvent {
  time: string;
  icon: string;
  colorClass: string;
  title: string;
  detail: string;
}

function buildActivityEvents(workflows: Workflow[]): ActivityEvent[] {
  const events: ActivityEvent[] = [];

  for (const wf of workflows.slice(0, 10)) {
    // Workflow started
    events.push({
      time: wf.createdAt,
      icon: '▶',
      colorClass: 'text-ak-primary',
      title: `İş akışı başlatıldı: "${wf.title}"`,
      detail: '',
    });

    // Scribe completed
    if (wf.stages.scribe.status === 'completed' && wf.stages.scribe.endTime) {
      const conf = wf.stages.scribe.confidence;
      events.push({
        time: wf.stages.scribe.endTime,
        icon: '◆',
        colorClass: 'text-ak-scribe',
        title: `Scribe spec üretti${conf != null ? ` (${formatConfidence(conf)} güven)` : ''}`,
        detail: wf.title,
      });
    }

    // Proto completed
    if (wf.stages.proto.status === 'completed' && wf.stages.proto.endTime) {
      const fileCount = wf.stages.proto.files?.length || 0;
      events.push({
        time: wf.stages.proto.endTime,
        icon: '⬡',
        colorClass: 'text-ak-proto',
        title: `Proto ${fileCount} dosyayı GitHub'a gönderdi`,
        detail: wf.stages.proto.branch || '',
      });
    }

    // Trace completed
    if (wf.stages.trace.status === 'completed' && wf.stages.trace.endTime) {
      const testCount = wf.stages.trace.tests || 0;
      events.push({
        time: wf.stages.trace.endTime,
        icon: '◈',
        colorClass: 'text-ak-trace',
        title: `Trace ${testCount} test yazdı`,
        detail: wf.stages.trace.coverage || '',
      });
    }
  }

  // Sort newest first
  events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  return events.slice(0, 8);
}

// ═══ Agent health from pipeline data ═══
interface AgentHealth {
  name: string;
  icon: string;
  colorClass: string;
  bgClass: string;
  status: string;
  lastRun: string | null;
  metric: string;
  metricLabel: string;
}

function computeAgentHealth(workflows: Workflow[]): AgentHealth[] {
  const completed = workflows.filter(w => w.status === 'completed' || w.status === 'completed_partial');
  const recent5 = completed.slice(0, 5);

  // Scribe
  const scribeConfidences = recent5
    .map(w => w.stages.scribe.confidence)
    .filter((c): c is number => c != null);
  const avgScribeConfRaw = scribeConfidences.length > 0
    ? scribeConfidences.reduce((s, c) => s + c, 0) / scribeConfidences.length
    : 0;
  const lastScribe = completed[0]?.stages.scribe.endTime;

  // Proto
  const protoFileCounts = recent5
    .map(w => w.stages.proto.files?.length || 0)
    .filter(c => c > 0);
  const avgProtoFiles = protoFileCounts.length > 0
    ? Math.round(protoFileCounts.reduce((s, c) => s + c, 0) / protoFileCounts.length)
    : 0;
  const lastProto = completed[0]?.stages.proto.endTime;

  // Trace
  const traceTestCounts = recent5
    .map(w => w.stages.trace.tests || 0)
    .filter(c => c > 0);
  const avgTraceTests = traceTestCounts.length > 0
    ? Math.round(traceTestCounts.reduce((s, c) => s + c, 0) / traceTestCounts.length)
    : 0;
  const lastTrace = completed[0]?.stages.trace.endTime;

  return [
    {
      name: 'Scribe',
      icon: '◆',
      colorClass: 'text-ak-scribe',
      bgClass: 'bg-ak-scribe/10',
      status: TR.operational,
      lastRun: lastScribe || null,
      metric: formatConfidence(avgScribeConfRaw),
      metricLabel: TR.avgConfidence,
    },
    {
      name: 'Proto',
      icon: '⬡',
      colorClass: 'text-ak-proto',
      bgClass: 'bg-ak-proto/10',
      status: TR.operational,
      lastRun: lastProto || null,
      metric: `${avgProtoFiles}`,
      metricLabel: TR.avgFiles,
    },
    {
      name: 'Trace',
      icon: '◈',
      colorClass: 'text-ak-trace',
      bgClass: 'bg-ak-trace/10',
      status: TR.operational,
      lastRun: lastTrace || null,
      metric: `${avgTraceTests}`,
      metricLabel: TR.avgTests,
    },
  ];
}

/* Stat card icon components */
const IconWorkflows = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6z" />
  </svg>
);
const IconCheck = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconClock = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconTest = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 5.608a9.034 9.034 0 01-18.404 0L4.2 15.3" />
  </svg>
);

const STAT_ACCENTS = [
  { icon: <IconWorkflows />, accent: 'bg-ak-primary/10 text-ak-primary' },
  { icon: <IconCheck />, accent: 'bg-emerald-500/10 text-emerald-400' },
  { icon: <IconClock />, accent: 'bg-amber-500/10 text-amber-400' },
  { icon: <IconTest />, accent: 'bg-violet-500/10 text-violet-400' },
];

interface UsageData {
  usage: { totalTokens: number; estimatedCostUsd: number; jobCount: number };
  freeQuota: { tokens: number; costUsd: number };
  used: { tokens: number; costUsd: number };
  remaining: { tokens: number; costUsd: number };
  percentUsed: { tokens: number; cost: number };
}

export default function OverviewPage() {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [usageData, setUsageData] = useState<UsageData | null>(null);

  useEffect(() => {
    workflowsApi.list()
      .then(setWorkflows)
      .catch(() => {})
      .finally(() => setLoading(false));
    api.getUsage()
      .then(setUsageData)
      .catch(() => {});
  }, []);

  const stats = computeStats(workflows);
  const recent = workflows.slice(0, 5);
  const activityEvents = buildActivityEvents(workflows);
  const agentHealth = computeAgentHealth(workflows);

  const statCards = [
    { label: TR.totalWorkflows, value: stats.total, sub: `+${stats.thisWeek} ${TR.thisWeek}` },
    { label: TR.successRate, value: `${stats.successRate}%`, sub: `${stats.completed} ${TR.completed}` },
    { label: TR.avgDuration, value: stats.avgDuration, sub: TR.scribeToTrace },
    { label: TR.testsGenerated, value: stats.testsGenerated, sub: `${stats.completed} ${TR.acrossWorkflows}` },
  ];

  return (
    <div className="mx-auto w-full animate-fade-in space-y-8" style={{ maxWidth: 1280 }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-display text-ak-text-primary truncate">{getGreeting()}</h1>
          <p className="mt-1 text-body text-ak-text-secondary truncate">{TR.whatsHappening}</p>
        </div>
        <Link
          to="/dashboard/workflows/new"
          className="group flex shrink-0 items-center gap-2 rounded-lg bg-ak-primary px-4 py-2 text-body font-semibold text-[#0a1215] shadow-ak-glow-sm transition-all duration-150 hover:shadow-ak-glow hover:-translate-y-px"
        >
          <svg className="h-4 w-4 transition-transform duration-150 group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {TR.newWorkflow}
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((card, idx) => (
          <div
            key={card.label}
            className="group rounded-xl border border-ak-border bg-ak-surface p-4 transition-all duration-150 hover:border-ak-border-strong hover:-translate-y-px hover:shadow-ak-sm"
          >
            <div className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${STAT_ACCENTS[idx].accent}`}>
                {STAT_ACCENTS[idx].icon}
              </div>
              <span className="text-caption text-ak-text-secondary">{card.label}</span>
            </div>
            <p className="mt-3 text-2xl font-bold text-ak-text-primary">{card.value}</p>
            <p className="mt-0.5 text-caption text-ak-text-tertiary">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* API Usage Card */}
      {usageData && (
        <div className="rounded-xl border border-ak-border bg-ak-surface p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <span className="text-caption font-semibold uppercase tracking-wider text-ak-text-tertiary">{TR.apiUsage}</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-ak-text-primary">${usageData.used.costUsd.toFixed(4)}</span>
              <span className="ml-1 text-xs text-ak-text-tertiary">/ ${usageData.freeQuota.costUsd.toFixed(2)}</span>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <div className="flex-1">
              <div className="mb-1 flex justify-between text-[10px]">
                <span className="text-ak-text-tertiary">
                  {(usageData.used.tokens / 1000).toFixed(1)}K {TR.tokensUsed}
                </span>
                <span className="text-ak-text-tertiary">
                  {(usageData.freeQuota.tokens / 1000).toFixed(0)}K {TR.limit}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-ak-border">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, usageData.percentUsed.tokens)}%`,
                    backgroundColor: usageData.percentUsed.tokens > 80 ? '#FF6B6B' : '#07D1AF',
                  }}
                />
              </div>
            </div>
            <span className="text-xs font-medium text-ak-text-secondary">
              {usageData.usage.jobCount} {TR.calls}
            </span>
          </div>
        </div>
      )}

      {/* Agent Health Cards */}
      <div>
        <h2 className="mb-3 text-caption font-semibold uppercase tracking-wider text-ak-text-tertiary">{TR.agentHealth}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {agentHealth.map((agent) => (
            <div
              key={agent.name}
              className="rounded-xl border border-ak-border bg-ak-surface p-4 transition-all duration-150 hover:border-ak-border-strong"
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg text-base font-bold ${agent.bgClass} ${agent.colorClass}`}>
                  {agent.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-ak-text-primary">{agent.name}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      {agent.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-ak-text-tertiary">
                    {TR.lastRun}: {agent.lastRun ? timeAgo(agent.lastRun) : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-lg font-bold text-ak-text-primary">{agent.metric}</span>
                <span className="text-[11px] text-ak-text-tertiary">{agent.metricLabel}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two-column: Recent Workflows + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Recent Workflows */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-caption font-semibold uppercase tracking-wider text-ak-text-tertiary">{TR.recentWorkflows}</h2>
            <Link to="/dashboard/workflows" className="text-caption font-medium text-ak-text-secondary transition-colors hover:text-ak-primary">
              {TR.viewAll} &rarr;
            </Link>
          </div>

          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-ak-primary border-t-transparent" />
            </div>
          ) : recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ak-border bg-ak-surface/50 py-16">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-ak-primary/10">
                <svg className="h-6 w-6 text-ak-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <p className="text-body font-medium text-ak-text-primary">{TR.noWorkflows}</p>
              <p className="mt-1 text-caption text-ak-text-secondary">{TR.createFirst}</p>
              <Link
                to="/dashboard/workflows/new"
                className="mt-4 rounded-lg bg-ak-primary/10 px-4 py-2 text-caption font-medium text-ak-primary transition-colors hover:bg-ak-primary/20"
              >
                {TR.createWorkflow} &rarr;
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-ak-border bg-ak-surface">
              {recent.map((wf, i) => (
                <button
                  key={wf.id}
                  onClick={() => navigate(`/dashboard/workflows/${wf.id}`)}
                  className={`group flex w-full items-center gap-4 px-4 py-3 text-left transition-all duration-150 hover:bg-ak-hover ${i > 0 ? 'border-t border-ak-border-subtle' : ''}`}
                >
                  <MiniPipeline stages={wf.stages} />
                  <span className="flex-1 truncate text-body font-medium text-ak-text-primary">{wf.title}</span>
                  <span className="text-caption text-ak-text-tertiary">{timeAgo(wf.createdAt)}</span>
                  <StatusBadge status={wf.status} size="small" />
                  <svg className="h-4 w-4 text-ak-text-tertiary transition-transform duration-150 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions — 1/3 width */}
        <div>
          <h2 className="mb-3 text-caption font-semibold uppercase tracking-wider text-ak-text-tertiary">{TR.quickActions}</h2>
          <div className="space-y-2">
            <Link
              to="/dashboard/workflows/new"
              className="group flex items-center gap-3 rounded-xl border border-ak-border bg-ak-surface p-4 transition-all duration-150 hover:border-ak-primary/30 hover:bg-ak-primary/5"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ak-primary/10 text-ak-primary transition-colors group-hover:bg-ak-primary/20">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ak-text-primary">{TR.newWorkflow}</p>
                <p className="text-[11px] text-ak-text-tertiary">{TR.describeIdea}</p>
              </div>
            </Link>

            <Link
              to="/dashboard/agents"
              className="group flex items-center gap-3 rounded-xl border border-ak-border bg-ak-surface p-4 transition-all duration-150 hover:border-violet-400/30 hover:bg-violet-400/5"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-400/10 text-violet-400 transition-colors group-hover:bg-violet-400/20">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ak-text-primary">{TR.agents}</p>
                <p className="text-[11px] text-ak-text-tertiary">{TR.checkAgents}</p>
              </div>
            </Link>

            <Link
              to="/dashboard/settings"
              className="group flex items-center gap-3 rounded-xl border border-ak-border bg-ak-surface p-4 transition-all duration-150 hover:border-ak-border-strong hover:bg-black/[0.02]"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/[0.04] text-ak-text-secondary transition-colors group-hover:bg-black/[0.06]">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ak-text-primary">{TR.settings}</p>
                <p className="text-[11px] text-ak-text-tertiary">{TR.manageIntegrations}</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity Timeline */}
      {activityEvents.length > 0 && (
        <div>
          <h2 className="mb-3 text-caption font-semibold uppercase tracking-wider text-ak-text-tertiary">{TR.recentActivity}</h2>
          <div className="overflow-hidden rounded-xl border border-ak-border bg-ak-surface">
            {activityEvents.map((event, i) => (
              <div
                key={`${event.time}-${i}`}
                className={`flex items-start gap-3 px-4 py-3 ${i > 0 ? 'border-t border-ak-border-subtle' : ''}`}
              >
                <span className="mt-0.5 flex-shrink-0 text-[11px] font-mono text-ak-text-tertiary w-12">
                  {formatTime(event.time)}
                </span>
                <span className={`mt-0.5 flex-shrink-0 text-xs ${event.colorClass}`}>{event.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ak-text-primary">{event.title}</p>
                  {event.detail && (
                    <p className="mt-0.5 truncate font-mono text-[11px] text-ak-text-tertiary">{event.detail}</p>
                  )}
                </div>
                <span className="flex-shrink-0 text-[11px] text-ak-text-tertiary">{timeAgo(event.time)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
