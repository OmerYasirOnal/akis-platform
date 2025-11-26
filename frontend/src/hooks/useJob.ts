import { useState, useEffect, useCallback, useRef } from 'react';
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

  // Use refs for options to avoid unnecessary re-renders
  const includePlanRef = useRef(options.includePlan);
  const includeAuditRef = useRef(options.includeAudit);
  const autoRefreshRef = useRef(options.autoRefresh);

  // Update refs when options change
  includePlanRef.current = options.includePlan;
  includeAuditRef.current = options.includeAudit;
  autoRefreshRef.current = options.autoRefresh;

  const loadJob = useCallback(async () => {
    if (!jobId) return;

    try {
      setIsLoading(true);
      setError(null);
      const include: string[] = [];
      if (includePlanRef.current) include.push('plan');
      if (includeAuditRef.current) include.push('audit');

      const response = await api.getJob(jobId, include.length > 0 ? include : undefined);
      setJob(response);
      setRequestId(response.requestId);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load job'));
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  // Auto-refresh if job is not in terminal state
  useEffect(() => {
    if (!autoRefreshRef.current || !job || job.state === 'completed' || job.state === 'failed') {
      return;
    }

    const interval = setInterval(() => {
      loadJob();
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [job, loadJob]);

  return {
    job,
    requestId,
    isLoading,
    error,
    refetch: loadJob,
  };
}
