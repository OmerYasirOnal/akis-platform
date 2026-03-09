import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../components/workflow/StatusBadge';
import { StageTimeline } from '../../components/workflow/StageTimeline';
import { workflowsApi } from '../../services/api/workflows';
import type { Workflow } from '../../types/workflow';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function WorkflowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflow = useCallback(async () => {
    if (!id) return;
    try {
      const wf = await workflowsApi.get(id);
      setWorkflow(wf);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load workflow');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchWorkflow();
  }, [fetchWorkflow]);

  // Polling for active workflows
  useEffect(() => {
    if (!workflow || !id) return;
    if (workflow.status === 'running' || workflow.status === 'awaiting_approval') {
      const interval = setInterval(async () => {
        try {
          const updated = await workflowsApi.poll(id);
          setWorkflow(updated);
        } catch { /* ignore polling errors */ }
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [workflow?.status, id]);

  const handleApprove = async () => {
    if (!id) return;
    try {
      const updated = await workflowsApi.approve(id);
      setWorkflow(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Approve failed');
    }
  };

  const handleReject = async () => {
    if (!id) return;
    try {
      const updated = await workflowsApi.reject(id);
      setWorkflow(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reject failed');
    }
  };

  const handleRetry = async () => {
    if (!id) return;
    try {
      const updated = await workflowsApi.retry(id);
      setWorkflow(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Retry failed');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2dd4a8] border-t-transparent" />
      </div>
    );
  }

  if (error && !workflow) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate('/dashboard/workflows')} className="text-sm text-[#8492a6] hover:text-[#e2e8f0]">&larr; Back to Workflows</button>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!workflow) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/dashboard/workflows')}
          className="mb-3 flex items-center gap-1 text-sm text-[#8492a6] transition-colors hover:text-[#e2e8f0]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Workflows
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-[#e2e8f0]">{workflow.title}</h1>
          <StatusBadge status={workflow.status} />
          <span className="text-xs text-[#4a5568]">{timeAgo(workflow.createdAt)}</span>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Stage Timeline */}
      <div className="rounded-xl border border-[#1e2738] bg-[#131820] p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#4a5568]">Pipeline Progress</h2>
        <StageTimeline
          workflow={workflow}
          onApprove={handleApprove}
          onReject={handleReject}
          onRetry={handleRetry}
        />
      </div>
    </div>
  );
}
