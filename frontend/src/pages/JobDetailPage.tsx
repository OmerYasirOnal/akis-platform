import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Job } from '../services/api';
import { Badge } from '../components/ui/Badge';
import { Pill } from '../components/ui/Pill';
import { CodeBlock } from '../components/ui/CodeBlock';
import { ErrorToast } from '../components/ui/ErrorToast';

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ message: string; code?: string; requestId?: string } | null>(
    null
  );
  const [includePlan, setIncludePlan] = useState(false);
  const [includeAudit, setIncludeAudit] = useState(false);
  const [requestId, setRequestId] = useState<string | undefined>();

  const loadJob = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);
      const include: string[] = [];
      if (includePlan) include.push('plan');
      if (includeAudit) include.push('audit');

      const response = await api.getJob(id, include.length > 0 ? include : undefined);
      setJob(response);
      setRequestId(response.requestId);
    } catch (err: unknown) {
      const apiError = err as { message?: string; code?: string; requestId?: string };
      setError({
        message: apiError.message || 'Failed to load job',
        code: apiError.code,
        requestId: apiError.requestId,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJob();
  }, [id, includePlan, includeAudit]);

  // Auto-refresh if job is not in terminal state
  useEffect(() => {
    if (!job || job.state === 'completed' || job.state === 'failed') {
      return;
    }

    const interval = setInterval(() => {
      loadJob();
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [job?.state]);

  if (isLoading && !job) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (error && !job) {
    return (
      <>
        <ErrorToast error={error} onClose={() => setError(null)} />
        <div className="text-center py-8">
          <p className="text-red-600">{error.message}</p>
          <Link to="/jobs" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            ← Back to Jobs
          </Link>
        </div>
      </>
    );
  }

  if (!job) {
    return <div className="text-center py-8">Job not found</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/jobs" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
          ← Back to Jobs
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Job Details</h1>
        {requestId && <p className="text-sm text-gray-500 mt-1">Request ID: {requestId}</p>}
      </div>

      {error && <ErrorToast error={error} onClose={() => setError(null)} />}

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-gray-500">ID</label>
            <p className="mt-1 text-sm text-gray-900">{job.id}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Type</label>
            <p className="mt-1">
              <Pill type={job.type} />
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">State</label>
            <p className="mt-1">
              <Badge state={job.state} />
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Created At</label>
            <p className="mt-1 text-sm text-gray-900">{new Date(job.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Updated At</label>
            <p className="mt-1 text-sm text-gray-900">{new Date(job.updatedAt).toLocaleString()}</p>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <input
              type="checkbox"
              checked={includePlan}
              onChange={(e) => setIncludePlan(e.target.checked)}
              className="mr-2"
            />
            Include Plan
          </label>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <input
              type="checkbox"
              checked={includeAudit}
              onChange={(e) => setIncludeAudit(e.target.checked)}
              className="mr-2"
            />
            Include Audit
          </label>
        </div>
      </div>

      {job.payload && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Payload</h2>
          <CodeBlock data={job.payload} />
        </div>
      )}

      {job.result && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Result</h2>
          <CodeBlock data={job.result} />
        </div>
      )}

      {job.error && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2 text-red-600">Error</h2>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{job.error}</p>
          </div>
        </div>
      )}

      {includePlan && job.plan && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Plan</h2>
          <CodeBlock data={job.plan} title="Plan Details" />
        </div>
      )}

      {includeAudit && job.audit && job.audit.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Audit Trail</h2>
          {job.audit.map((entry, index) => (
            <div key={index} className="mb-4">
              <CodeBlock
                data={entry}
                title={`Phase: ${entry.phase} - ${new Date(entry.createdAt).toLocaleString()}`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
