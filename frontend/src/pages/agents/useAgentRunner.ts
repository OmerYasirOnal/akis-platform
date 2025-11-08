import { useCallback, useEffect, useRef, useState } from 'react';
import type { AgentType, JobDetail } from '../../services/api/agents';
import { agentsApi } from '../../services/api/agents';

const POLL_INTERVAL_MS = 2500;

const isFinalState = (state: JobDetail['state']) => {
  return state === 'completed' || state === 'failed';
};

export const useAgentRunner = (type: AgentType) => {
  const [job, setJob] = useState<JobDetail | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  const pollTimer = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (pollTimer.current !== null) {
        clearInterval(pollTimer.current);
      }
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (pollTimer.current !== null) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
    if (isMountedRef.current) {
      setIsPolling(false);
    }
  }, []);

  const pollJob = useCallback(
    async (id: string) => {
      try {
        const nextJob = await agentsApi.getJob(id);
        if (!isMountedRef.current) {
          return;
        }

        setJob(nextJob);

        if (isFinalState(nextJob.state)) {
          stopPolling();
        }
      } catch (err) {
        console.error('Failed to poll job status', err);
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : 'Unknown polling error');
        }
        stopPolling();
      }
    },
    [stopPolling]
  );

  const startPolling = useCallback(
    (id: string) => {
      if (pollTimer.current !== null) {
        clearInterval(pollTimer.current);
      }

      setIsPolling(true);
      pollTimer.current = window.setInterval(() => {
        void pollJob(id);
      }, POLL_INTERVAL_MS);

      void pollJob(id);
    },
    [pollJob]
  );

  const runAgent = useCallback(
    async (payload: unknown) => {
      setIsSubmitting(true);
      setError(null);
      setJob(null);

      try {
        const response = await agentsApi.runAgent(type, payload);
        if (!isMountedRef.current) {
          return;
        }

        setJobId(response.jobId);
        setJob({
          id: response.jobId,
          type,
          state: response.state,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        startPolling(response.jobId);
      } catch (err) {
        console.error('Failed to run agent', err);
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : 'Agent run failed.');
        }
      } finally {
        if (isMountedRef.current) {
          setIsSubmitting(false);
        }
      }
    },
    [startPolling, type]
  );

  const reset = useCallback(() => {
    stopPolling();
    setJob(null);
    setJobId(null);
    setError(null);
  }, [stopPolling]);

  return {
    runAgent,
    reset,
    job,
    jobId,
    error,
    isSubmitting,
    isPolling,
  };
};

