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
  createdFiles: string[];
}

export function usePipelineStream(
  pipelineId: string | undefined,
  isActive: boolean,
): UsePipelineStreamResult {
  const [activities, setActivities] = useState<PipelineActivity[]>([]);
  const [createdFiles, setCreatedFiles] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Clear activities synchronously before establishing new connection
    // (prevents race condition where old activities leak into new pipeline)
    setActivities([]);
    setCreatedFiles([]);

    if (!pipelineId || !isActive) {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    let retryCount = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    function connect() {
      if (cancelled) return;
      const es = new EventSource(`/api/pipelines/${pipelineId}/stream`);
      esRef.current = es;

      es.onopen = () => { setIsConnected(true); retryCount = 0; };

      es.onerror = () => {
        setIsConnected(false);
        es.close();
        esRef.current = null;
        // Reconnect with exponential backoff (max 30s)
        if (!cancelled && retryCount < 10) {
          const delay = Math.min(1000 * 2 ** retryCount, 30000);
          retryCount++;
          retryTimer = setTimeout(connect, delay);
        }
      };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'connected') return;
          const activity = data as PipelineActivity;
          setActivities((prev) => [...prev, activity]);

          // Track file_created events for real-time file list
          if (activity.step === 'file_created' && activity.detail) {
            setCreatedFiles((prev) => [...prev, activity.detail!]);
          }

          // Reset file list when stage moves away from proto
          if (activity.stage !== 'proto') {
            setCreatedFiles([]);
          }
        } catch {
          // parse error — ignore
        }
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (esRef.current) esRef.current.close();
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

  return { activities, currentStep, isConnected, progressByStage, createdFiles };
}
