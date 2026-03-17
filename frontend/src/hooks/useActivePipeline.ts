import { useEffect, useRef, useState } from 'react';

const RUNNING_STAGES = [
  'scribe_clarifying',
  'scribe_generating',
  'proto_building',
  'trace_testing',
];

interface ActivePipeline {
  id: string;
  status: string;
}

/**
 * Polls /api/pipelines every `intervalMs` to find a running pipeline.
 * Returns the first running pipeline's id and status, or null.
 */
export function useActivePipeline(intervalMs = 5000): ActivePipeline | null {
  const [active, setActive] = useState<ActivePipeline | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const check = async () => {
      try {
        const resp = await fetch('/api/pipelines');
        if (!resp.ok) return;
        const data = await resp.json();
        const pipelines = data.pipelines || data || [];
        const running = pipelines.find(
          (p: { stage?: string; status?: string }) => {
            const stage = p.stage || p.status;
            return stage && RUNNING_STAGES.includes(stage);
          },
        );
        if (mountedRef.current) {
          setActive(
            running ? { id: running.id, status: running.stage || running.status } : null,
          );
        }
      } catch {
        // network error — keep previous state
      }
    };

    check();
    const interval = setInterval(check, intervalMs);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [intervalMs]);

  return active;
}
