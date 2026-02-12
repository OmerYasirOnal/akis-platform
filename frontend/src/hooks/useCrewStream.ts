import { useState, useEffect, useCallback, useRef } from 'react';
import { getApiBaseUrl } from '../services/api/config';

export interface CrewStreamEvent {
  type: string;
  crewRunId: string;
  timestamp: string;
  data: Record<string, unknown>;
}

interface UseCrewStreamOptions {
  autoConnect?: boolean;
  includeHistory?: boolean;
}

interface UseCrewStreamReturn {
  events: CrewStreamEvent[];
  isConnected: boolean;
  isEnded: boolean;
  currentStatus: string | null;
  workerUpdates: Map<string, CrewStreamEvent[]>;
  messages: CrewStreamEvent[];
  taskUpdates: CrewStreamEvent[];
  disconnect: () => void;
}

export function useCrewStream(
  crewRunId: string | null,
  options: UseCrewStreamOptions = {},
): UseCrewStreamReturn {
  const { autoConnect = true } = options;
  const [events, setEvents] = useState<CrewStreamEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    if (!crewRunId || !autoConnect) return;

    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api/agents/crew/${crewRunId}/stream`;
    const es = new EventSource(url, { withCredentials: true });
    eventSourceRef.current = es;

    const handleEvent = (event: MessageEvent) => {
      try {
        const parsed: CrewStreamEvent = JSON.parse(event.data);
        setEvents(prev => [...prev, parsed]);

        if (parsed.type === 'crew:status_change') {
          const newStatus = parsed.data.newStatus as string;
          setCurrentStatus(newStatus);
          if (newStatus === 'completed' || newStatus === 'failed') {
            setIsEnded(true);
            disconnect();
          }
        }
      } catch {
        // ignore parse errors
      }
    };

    // Listen to all crew event types
    const eventTypes = [
      'crew:status_change',
      'crew:worker_spawned',
      'crew:worker_completed',
      'crew:worker_failed',
      'crew:task_created',
      'crew:task_claimed',
      'crew:task_completed',
      'crew:task_blocked',
      'crew:message',
      'crew:merge_started',
      'crew:merge_completed',
      'crew:reflection',
    ];

    for (const type of eventTypes) {
      es.addEventListener(type, handleEvent);
    }

    es.onopen = () => setIsConnected(true);
    es.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      for (const type of eventTypes) {
        es.removeEventListener(type, handleEvent);
      }
      es.close();
      eventSourceRef.current = null;
    };
  }, [crewRunId, autoConnect, disconnect]);

  // Derived state
  const workerUpdates = new Map<string, CrewStreamEvent[]>();
  const messages: CrewStreamEvent[] = [];
  const taskUpdates: CrewStreamEvent[] = [];

  for (const event of events) {
    if (event.type.startsWith('crew:worker_')) {
      const jobId = event.data.jobId as string;
      if (!workerUpdates.has(jobId)) {
        workerUpdates.set(jobId, []);
      }
      workerUpdates.get(jobId)!.push(event);
    } else if (event.type === 'crew:message') {
      messages.push(event);
    } else if (event.type.startsWith('crew:task_')) {
      taskUpdates.push(event);
    }
  }

  return {
    events,
    isConnected,
    isEnded,
    currentStatus,
    workerUpdates,
    messages,
    taskUpdates,
    disconnect,
  };
}
