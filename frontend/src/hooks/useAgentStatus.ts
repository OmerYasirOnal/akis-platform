import { useState, useEffect, useCallback, useRef } from 'react';
import { agentsApi, type AgentType, type RunningJob } from '../services/api/agents';

export type AgentStatus = 'active' | 'inactive';

interface UseAgentStatusResult {
  status: AgentStatus;
  runningJobs: RunningJob[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Polls backend for running jobs of a given agent type.
 * Returns 'active' if at least one job is running/pending, 'inactive' otherwise.
 */
export function useAgentStatus(agentType: AgentType, pollInterval = 10_000): UseAgentStatusResult {
  const [runningJobs, setRunningJobs] = useState<RunningJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  const fetchStatus = useCallback(async () => {
    try {
      const result = await agentsApi.getRunningJobs();
      if (!mountedRef.current) return;
      const filtered = result.jobs.filter((j) => j.type === agentType);
      setRunningJobs(filtered);
    } catch {
      if (!mountedRef.current) return;
      setRunningJobs([]);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [agentType]);

  useEffect(() => {
    mountedRef.current = true;
    void fetchStatus();

    const id = setInterval(() => {
      void fetchStatus();
    }, pollInterval);

    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, [fetchStatus, pollInterval]);

  const status: AgentStatus = runningJobs.length > 0 ? 'active' : 'inactive';

  return { status, runningJobs, isLoading, refresh: fetchStatus };
}
