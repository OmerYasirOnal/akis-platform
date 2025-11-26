import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import type { Job, JobsListResponse } from '../services/api';

interface UseJobsOptions {
  type?: 'scribe' | 'trace' | 'proto';
  state?: 'pending' | 'running' | 'completed' | 'failed';
  limit?: number;
}

export function useJobs(options: UseJobsOptions = {}) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Use refs for options to avoid unnecessary re-renders
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const loadJobs = useCallback(async (cursor?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const currentOptions = optionsRef.current;
      const response: JobsListResponse = await api.getJobs({
        type: currentOptions.type,
        state: currentOptions.state,
        limit: currentOptions.limit || 20,
        cursor,
      });
      if (cursor) {
        setJobs((prev) => [...prev, ...response.items]);
      } else {
        setJobs(response.items);
      }
      setNextCursor(response.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load jobs'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs, options.type, options.state]);

  const loadMore = useCallback(() => {
    if (nextCursor) {
      loadJobs(nextCursor);
    }
  }, [nextCursor, loadJobs]);

  const refetch = useCallback(() => loadJobs(), [loadJobs]);

  return {
    jobs,
    nextCursor,
    isLoading,
    error,
    loadMore,
    refetch,
  };
}
