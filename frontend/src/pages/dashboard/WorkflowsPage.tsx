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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display text-ak-text-primary">Workflows</h1>
          <p className="mt-1 text-body text-ak-text-secondary">Manage your Scribe &rarr; Proto &rarr; Trace runs</p>
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

      {/* Filter bar */}
      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'rounded-full px-4 py-1.5 text-caption font-semibold transition-all duration-150',
              filter === f.key
                ? 'bg-ak-primary text-[#0a1215]'
                : 'border border-ak-border bg-ak-surface text-ak-text-secondary hover:border-ak-border-strong hover:text-ak-text-primary'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-ak-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ak-border bg-ak-surface/50 py-16">
          <p className="text-body text-ak-text-secondary">
            {filter === 'all' ? 'No workflows yet.' : `No ${filter.replace('_', ' ')} workflows.`}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-ak-border bg-ak-surface">
          {filtered.map((wf, i) => (
            <button
              key={wf.id}
              onClick={() => navigate(`/dashboard/workflows/${wf.id}`)}
              className={cn(
                'group flex w-full items-center gap-4 px-4 py-3 text-left transition-all duration-150 hover:bg-ak-hover',
                i > 0 && 'border-t border-ak-border-subtle',
              )}
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
  );
}
