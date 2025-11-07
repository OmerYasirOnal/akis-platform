import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ErrorToast } from '../components/ui/ErrorToast';

export default function NewJobPage() {
  const navigate = useNavigate();
  const [jobType, setJobType] = useState<'scribe' | 'trace' | 'proto'>('scribe');
  const [doc, setDoc] = useState('');
  const [spec, setSpec] = useState('');
  const [goal, setGoal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<{ message: string; code?: string; requestId?: string } | null>(
    null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let payload: Record<string, unknown> = {};
      if (jobType === 'scribe') {
        if (!doc.trim()) {
          setError({ message: 'Document content is required for Scribe jobs' });
          setIsSubmitting(false);
          return;
        }
        payload = { doc: doc.trim() };
      } else if (jobType === 'trace') {
        if (!spec.trim()) {
          setError({ message: 'Specification is required for Trace jobs' });
          setIsSubmitting(false);
          return;
        }
        payload = { spec: spec.trim() };
      } else if (jobType === 'proto') {
        payload = { goal: goal.trim() || 'Generate prototype' };
      }

      const response = await api.createJob({
        type: jobType,
        payload,
      });

      navigate(`/jobs/${response.jobId}`);
    } catch (err: unknown) {
      const apiError = err as { message?: string; code?: string; requestId?: string };
      setError({
        message: apiError.message || 'Failed to create job',
        code: apiError.code,
        requestId: apiError.requestId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-ak-text-primary mb-6">Create New Job</h1>

      {error && <ErrorToast error={error} onClose={() => setError(null)} />}

      <form onSubmit={handleSubmit} className="bg-ak-surface-2 shadow rounded-lg p-6 border border-ak-border">
        <div className="mb-4">
          <label className="block text-sm font-medium text-ak-text-primary mb-2">Job Type</label>
          <select
            value={jobType}
            onChange={(e) => setJobType(e.target.value as typeof jobType)}
            className="w-full px-3 py-2 bg-ak-surface border border-ak-border text-ak-text-primary rounded-md focus:outline-none focus:ring-2 focus:ring-ak-primary focus:ring-offset-2 focus:ring-offset-ak-bg"
          >
            <option value="scribe">Scribe (Documentation)</option>
            <option value="trace">Trace (Test Generation)</option>
            <option value="proto">Proto (Prototype)</option>
          </select>
        </div>

        {jobType === 'scribe' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-ak-text-primary mb-2">Document Content</label>
            <textarea
              value={doc}
              onChange={(e) => setDoc(e.target.value)}
              rows={10}
              className="w-full px-3 py-2 bg-ak-surface border border-ak-border text-ak-text-primary rounded-md focus:outline-none focus:ring-2 focus:ring-ak-primary focus:ring-offset-2 focus:ring-offset-ak-bg placeholder:text-ak-text-secondary"
              placeholder="Enter document content to process..."
              required
            />
          </div>
        )}

        {jobType === 'trace' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-ak-text-primary mb-2">Specification</label>
            <textarea
              value={spec}
              onChange={(e) => setSpec(e.target.value)}
              rows={10}
              className="w-full px-3 py-2 bg-ak-surface border border-ak-border text-ak-text-primary rounded-md focus:outline-none focus:ring-2 focus:ring-ak-primary focus:ring-offset-2 focus:ring-offset-ak-bg placeholder:text-ak-text-secondary"
              placeholder="Enter test specification..."
              required
            />
          </div>
        )}

        {jobType === 'proto' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-ak-text-primary mb-2">Goal</label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 bg-ak-surface border border-ak-border text-ak-text-primary rounded-md focus:outline-none focus:ring-2 focus:ring-ak-primary focus:ring-offset-2 focus:ring-offset-ak-bg placeholder:text-ak-text-secondary"
              placeholder="Enter prototype goal or requirements..."
            />
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-ak-primary text-ak-bg rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity focus:outline-none focus:ring-2 focus:ring-ak-primary focus:ring-offset-2 focus:ring-offset-ak-bg"
          >
            {isSubmitting ? 'Creating...' : 'Create Job'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/jobs')}
            className="px-4 py-2 bg-ak-surface text-ak-text-primary rounded-md hover:bg-ak-surface-2 transition-colors focus:outline-none focus:ring-2 focus:ring-ak-primary focus:ring-offset-2 focus:ring-offset-ak-bg"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
