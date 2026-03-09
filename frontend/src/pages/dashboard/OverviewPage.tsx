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

const AGENT_INFO = [
  { name: 'Scribe', role: 'Idea \u2192 Spec', color: '#38bdf8' },
  { name: 'Proto', role: 'Spec \u2192 Scaffold', color: '#f59e0b' },
  { name: 'Trace', role: 'Code \u2192 Tests', color: '#a78bfa' },
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
    { label: 'Total Workflows', value: stats.total, sub: `+${stats.thisWeek} this week`, gradient: 'from-[#2dd4a8] to-[#1a9a78]' },
    { label: 'Success Rate', value: `${stats.successRate}%`, sub: `${stats.completed} of ${stats.total} completed`, gradient: 'from-[#38bdf8] to-[#0ea5e9]' },
    { label: 'Avg. Duration', value: stats.avgDuration, sub: 'Scribe \u2192 Trace', gradient: 'from-[#f59e0b] to-[#d97706]' },
    { label: 'Tests Generated', value: stats.testsGenerated, sub: `across ${stats.completed} workflows`, gradient: 'from-[#a78bfa] to-[#7c3aed]' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[26px] font-bold text-[#e2e8f0]">Welcome back</h1>
          <p className="mt-1 text-sm text-[#8492a6]">Here's what's happening with your workflows</p>
        </div>
        <Link
          to="/dashboard/workflows/new"
          className="rounded-lg bg-[#2dd4a8] px-5 py-2.5 text-sm font-semibold text-[#0c1017] shadow-[0_0_20px_rgba(45,212,168,0.3)] transition-all hover:bg-[#34e0b4] hover:shadow-[0_0_30px_rgba(45,212,168,0.4)]"
        >
          New Workflow
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="overflow-hidden rounded-xl border border-[#1e2738] bg-[#131820]">
            <div className={`h-[3px] bg-gradient-to-r ${card.gradient}`} />
            <div className="p-4">
              <p className="text-xs text-[#8492a6]">{card.label}</p>
              <p className="mt-1 text-2xl font-bold text-[#e2e8f0]">{card.value}</p>
              <p className="mt-0.5 text-xs text-[#4a5568]">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Agent Status */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#4a5568]">Agent Status</h2>
        <div className="grid grid-cols-3 gap-4">
          {AGENT_INFO.map((agent) => (
            <div key={agent.name} className="flex items-center gap-3 rounded-xl border border-[#1e2738] bg-[#131820] p-4">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-lg text-lg font-bold"
                style={{ background: `${agent.color}18`, color: agent.color }}
              >
                {agent.name[0]}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#e2e8f0]">{agent.name}</p>
                <p className="text-xs text-[#8492a6]">{agent.role}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-xs text-emerald-400">Operational</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Workflows */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#4a5568]">Recent Workflows</h2>
          <Link to="/dashboard/workflows" className="text-xs font-medium text-[#2dd4a8] hover:underline">View all &rarr;</Link>
        </div>
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2dd4a8] border-t-transparent" />
          </div>
        ) : recent.length === 0 ? (
          <div className="rounded-xl border border-[#1e2738] bg-[#131820] p-8 text-center">
            <p className="text-sm text-[#8492a6]">No workflows yet. Start your first one!</p>
            <Link to="/dashboard/workflows/new" className="mt-3 inline-block text-sm font-medium text-[#2dd4a8] hover:underline">Create Workflow &rarr;</Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#1e2738] bg-[#131820]">
            {recent.map((wf, i) => (
              <button
                key={wf.id}
                onClick={() => navigate(`/dashboard/workflows/${wf.id}`)}
                className={`flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-[#1c2233] ${i > 0 ? 'border-t border-[#1e2738]' : ''}`}
              >
                <MiniPipeline stages={wf.stages} />
                <span className="flex-1 truncate text-sm font-medium text-[#e2e8f0]">{wf.title}</span>
                <span className="text-xs text-[#4a5568]">{timeAgo(wf.createdAt)}</span>
                <StatusBadge status={wf.status} size="small" />
                <svg className="h-4 w-4 text-[#4a5568]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
