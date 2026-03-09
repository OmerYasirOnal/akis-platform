import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../components/workflow/StatusBadge';
import { MiniPipeline } from '../../components/workflow/MiniPipeline';
import { workflowsApi } from '../../services/api/workflows';
import type { Workflow, WorkflowStats } from '../../types/workflow';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
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
    avgDuration: '~45s',
    testsGenerated,
    successRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    thisWeek,
  };
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

export default function OverviewPage() {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    workflowsApi.list()
      .then(setWorkflows)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = computeStats(workflows);
  const recent = workflows.slice(0, 5);

  const statCards = [
    { label: 'Total Workflows', value: stats.total, sub: `+${stats.thisWeek} this week` },
    { label: 'Success Rate', value: `${stats.successRate}%`, sub: `${stats.completed} completed` },
    { label: 'Avg. Duration', value: stats.avgDuration, sub: 'Scribe \u2192 Trace' },
    { label: 'Tests Generated', value: stats.testsGenerated, sub: `across ${stats.completed} workflows` },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display text-ak-text-primary">{getGreeting()}</h1>
          <p className="mt-1 text-body text-ak-text-secondary">Here&apos;s what&apos;s happening with your workflows</p>
        </div>
        <Link
          to="/dashboard/workflows/new"
          className="group flex items-center gap-2 rounded-lg bg-ak-primary px-4 py-2 text-body font-semibold text-[#0a1215] shadow-ak-glow-sm transition-all duration-150 hover:shadow-ak-glow hover:-translate-y-px"
        >
          <svg className="h-4 w-4 transition-transform duration-150 group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Workflow
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-3">
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

      {/* Recent Workflows */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-caption font-semibold uppercase tracking-wider text-ak-text-tertiary">Recent Workflows</h2>
          <Link to="/dashboard/workflows" className="text-caption font-medium text-ak-text-secondary transition-colors hover:text-ak-primary">
            View all &rarr;
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
            <p className="text-body font-medium text-ak-text-primary">No workflows yet</p>
            <p className="mt-1 text-caption text-ak-text-secondary">Start your first workflow to see it here</p>
            <Link
              to="/dashboard/workflows/new"
              className="mt-4 rounded-lg bg-ak-primary/10 px-4 py-2 text-caption font-medium text-ak-primary transition-colors hover:bg-ak-primary/20"
            >
              Create Workflow &rarr;
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
    </div>
  );
}
