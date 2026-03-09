import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../components/workflow/StatusBadge';
import { MiniPipeline } from '../../components/workflow/MiniPipeline';
import { workflowsApi } from '../../services/api/workflows';
import type { Workflow, WorkflowStatus } from '../../types/workflow';
import { cn } from '../../utils/cn';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

type FilterKey = 'all' | 'completed' | 'running' | 'awaiting_approval' | 'failed';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'completed', label: 'Completed' },
  { key: 'running', label: 'Running' },
  { key: 'awaiting_approval', label: 'Awaiting' },
  { key: 'failed', label: 'Failed' },
];

function matchesFilter(status: WorkflowStatus, filter: FilterKey): boolean {
  if (filter === 'all') return true;
  if (filter === 'completed') return status === 'completed' || status === 'completed_partial';
  if (filter === 'running') return status === 'running';
  if (filter === 'awaiting_approval') return status === 'awaiting_approval';
  if (filter === 'failed') return status === 'failed';
  return true;
}

export default function WorkflowsPage() {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('all');

  useEffect(() => {
    workflowsApi.list()
      .then(setWorkflows)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = workflows.filter(wf => matchesFilter(wf.status, filter));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#e2e8f0]">Workflows</h1>
          <p className="mt-1 text-sm text-[#8492a6]">Manage your Scribe &rarr; Proto &rarr; Trace runs</p>
        </div>
        <Link
          to="/dashboard/workflows/new"
          className="rounded-lg bg-[#2dd4a8] px-5 py-2.5 text-sm font-semibold text-[#0c1017] shadow-[0_0_20px_rgba(45,212,168,0.3)] transition-all hover:bg-[#34e0b4]"
        >
          New Workflow
        </Link>
      </div>

      {/* Filter bar */}
      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'rounded-full px-4 py-1.5 text-xs font-semibold transition-colors',
              filter === f.key
                ? 'bg-[#2dd4a8] text-[#0c1017]'
                : 'border border-[#1e2738] bg-[#131820] text-[#8492a6] hover:border-[#2a3548] hover:text-[#e2e8f0]'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2dd4a8] border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-[#1e2738] bg-[#131820] p-8 text-center">
          <p className="text-sm text-[#8492a6]">
            {filter === 'all' ? 'No workflows yet.' : `No ${filter.replace('_', ' ')} workflows.`}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#1e2738] bg-[#131820]">
          {filtered.map((wf, i) => (
            <button
              key={wf.id}
              onClick={() => navigate(`/dashboard/workflows/${wf.id}`)}
              className={cn(
                'flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-[#1c2233]',
                i > 0 && 'border-t border-[#1e2738]',
              )}
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
  );
}
