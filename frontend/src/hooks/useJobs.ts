import { useState, useEffect } from 'react';
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

  const loadJobs = async (cursor?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response: JobsListResponse = await api.getJobs({
        ...options,
        limit: options.limit || 20,
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
  };

  useEffect(() => {
    loadJobs();
  }, [options.type, options.state]);

  const loadMore = () => {
    if (nextCursor) {
      loadJobs(nextCursor);
    }
  };

  return {
    jobs,
    nextCursor,
    isLoading,
    error,
    loadMore,
    refetch: () => loadJobs(),
  };
}
