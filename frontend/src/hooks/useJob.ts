import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Job } from '../services/api';

interface UseJobOptions {
  includePlan?: boolean;
  includeAudit?: boolean;
  autoRefresh?: boolean;
}

export function useJob(jobId: string | undefined, options: UseJobOptions = {}) {
  const [job, setJob] = useState<Job | null>(null);
  const [requestId, setRequestId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadJob = async () => {
    if (!jobId) return;

    try {
      setIsLoading(true);
      setError(null);
      const include: string[] = [];
      if (options.includePlan) include.push('plan');
      if (options.includeAudit) include.push('audit');

      const response = await api.getJob(jobId, include.length > 0 ? include : undefined);
      setJob(response);
      setRequestId(response.requestId);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load job'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJob();
  }, [jobId, options.includePlan, options.includeAudit]);

  // Auto-refresh if job is not in terminal state
  useEffect(() => {
    if (!options.autoRefresh || !job || job.state === 'completed' || job.state === 'failed') {
      return;
    }

    const interval = setInterval(() => {
      loadJob();
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [job?.state, options.autoRefresh]);

  return {
    job,
    requestId,
    isLoading,
    error,
    refetch: loadJob,
  };
}
