import { useEffect, useRef, useState } from 'react';

export interface PipelineActivity {
  pipelineId: string;
  stage: 'scribe' | 'proto' | 'trace';
  step: string;
  message: string;
  detail?: string;
  progress?: number;
  timestamp: string;
}

interface UsePipelineStreamResult {
  activities: PipelineActivity[];
  currentStep: PipelineActivity | null;
  isConnected: boolean;
  progressByStage: Record<string, number>;
}

export function usePipelineStream(
  pipelineId: string | undefined,
  isActive: boolean,
): UsePipelineStreamResult {
  const [activities, setActivities] = useState<PipelineActivity[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Clear activities synchronously before establishing new connection
    // (prevents race condition where old activities leak into new pipeline)
    setActivities([]);

    if (!pipelineId || !isActive) {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    const es = new EventSource(`/api/pipelines/${pipelineId}/stream`);
    esRef.current = es;

    es.onopen = () => setIsConnected(true);
    es.onerror = () => setIsConnected(false);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'connected') return;
        setActivities((prev) => [...prev, data as PipelineActivity]);
      } catch {
        // parse error — ignore
      }
    };

    return () => {
      es.close();
      esRef.current = null;
      setIsConnected(false);
    };
  }, [pipelineId, isActive]);

  const currentStep =
    activities.length > 0 ? activities[activities.length - 1] : null;

  const progressByStage = activities.reduce<Record<string, number>>(
    (acc, a) => {
      if (a.progress !== undefined) acc[a.stage] = a.progress;
      return acc;
    },
    {},
  );

  return { activities, currentStep, isConnected, progressByStage };
}
