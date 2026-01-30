/**
 * useJobStream - Real-time SSE streaming hook for job execution trace
 * S2.0.3: Live Execution Trace + Thinking UX
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  StreamEvent,
  StageStreamEvent,
  PlanStreamEvent,
  ToolStreamEvent,
  ArtifactStreamEvent,
  TraceStreamEvent,
  AiCallStreamEvent,
  ErrorStreamEvent,
  LogStreamEvent,
} from '../services/api/types';

// Re-export for convenience
export type {
  StreamEvent,
  StageStreamEvent,
  PlanStreamEvent,
  ToolStreamEvent,
  ArtifactStreamEvent,
  TraceStreamEvent,
  AiCallStreamEvent,
  ErrorStreamEvent,
  LogStreamEvent,
};

export interface UseJobStreamOptions {
  /** Auto-connect on mount (default: true) */
  autoConnect?: boolean;
  /** Include DB history on connect (default: true) */
  includeHistory?: boolean;
  /** Max reconnect attempts (default: 5) */
  maxReconnectAttempts?: number;
  /** Initial reconnect delay in ms (default: 1000) */
  reconnectDelayMs?: number;
  /** Reconnect backoff multiplier (default: 1.5) */
  reconnectBackoffMultiplier?: number;
  /** On event callback */
  onEvent?: (event: StreamEvent) => void;
  /** On connection state change */
  onConnectionChange?: (connected: boolean) => void;
  /** On error */
  onError?: (error: Error) => void;
}

export interface UseJobStreamResult {
  /** All received events */
  events: StreamEvent[];
  /** Current stage */
  currentStage: StageStreamEvent['stage'] | null;
  /** Current stage status message */
  stageMessage: string | null;
  /** Plan steps (if available) */
  planSteps: PlanStreamEvent['steps'] | null;
  /** Current plan step ID */
  currentStepId: string | null;
  /** Tool call events */
  toolEvents: ToolStreamEvent[];
  /** Artifact events */
  artifactEvents: ArtifactStreamEvent[];
  /** Trace events (timeline) */
  traceEvents: TraceStreamEvent[];
  /** AI call events */
  aiCallEvents: AiCallStreamEvent[];
  /** Error events */
  errorEvents: ErrorStreamEvent[];
  /** Log events */
  logEvents: LogStreamEvent[];
  /** Connection status */
  isConnected: boolean;
  /** Stream ended (job completed/failed) */
  isEnded: boolean;
  /** Last event ID (for reconnection) */
  lastEventId: number;
  /** Connect to stream */
  connect: () => void;
  /** Disconnect from stream */
  disconnect: () => void;
  /** Clear all events */
  clearEvents: () => void;
}

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export function useJobStream(
  jobId: string | null,
  options: UseJobStreamOptions = {}
): UseJobStreamResult {
  const {
    autoConnect = true,
    includeHistory = true,
    maxReconnectAttempts = 5,
    reconnectDelayMs = 1000,
    reconnectBackoffMultiplier = 1.5,
    onEvent,
    onConnectionChange,
    onError,
  } = options;

  // State
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [lastEventId, setLastEventId] = useState(0);

  // Refs for cleanup and reconnection
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derived state
  const currentStage = events
    .filter((e): e is StageStreamEvent => e.type === 'stage')
    .pop()?.stage ?? null;

  const stageMessage = events
    .filter((e): e is StageStreamEvent => e.type === 'stage')
    .pop()?.message ?? null;

  const planEvent = events
    .filter((e): e is PlanStreamEvent => e.type === 'plan')
    .pop();
  const planSteps = planEvent?.steps ?? null;
  const currentStepId = planEvent?.currentStepId ?? null;

  const toolEvents = events.filter((e): e is ToolStreamEvent => e.type === 'tool');
  const artifactEvents = events.filter((e): e is ArtifactStreamEvent => e.type === 'artifact');
  const traceEvents = events.filter((e): e is TraceStreamEvent => e.type === 'trace');
  const aiCallEvents = events.filter((e): e is AiCallStreamEvent => e.type === 'ai_call');
  const errorEvents = events.filter((e): e is ErrorStreamEvent => e.type === 'error');
  const logEvents = events.filter((e): e is LogStreamEvent => e.type === 'log');

  /**
   * Clear all events
   */
  const clearEvents = useCallback(() => {
    setEvents([]);
    setLastEventId(0);
    setIsEnded(false);
  }, []);

  /**
   * Disconnect from stream
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
    onConnectionChange?.(false);
  }, [onConnectionChange]);

  /**
   * Connect to stream
   */
  const connect = useCallback(() => {
    if (!jobId) return;
    
    // Close existing connection
    disconnect();
    
    // Build URL with query params
    const params = new URLSearchParams();
    if (lastEventId > 0) {
      params.set('cursor', String(lastEventId));
    }
    if (!includeHistory) {
      params.set('includeHistory', 'false');
    }
    
    const url = `${API_BASE}/agents/jobs/${jobId}/trace-stream${params.toString() ? `?${params}` : ''}`;
    
    try {
      const eventSource = new EventSource(url, { withCredentials: true });
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        onConnectionChange?.(true);
      };

      // Handle different event types
      const handleEvent = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data) as StreamEvent;
          
          // Update last event ID
          if (data.eventId) {
            setLastEventId(data.eventId);
          }
          
          // Add event to state
          setEvents(prev => [...prev, data]);
          
          // Call onEvent callback
          onEvent?.(data);
          
          // Check for terminal stages
          if (data.type === 'stage' && 
              (data.stage === 'completed' || data.stage === 'failed') && 
              data.status === 'completed') {
            setIsEnded(true);
            disconnect();
          }
        } catch (err) {
          console.error('[useJobStream] Failed to parse event:', err, event.data);
        }
      };

      // Listen for all event types
      eventSource.addEventListener('stage', handleEvent);
      eventSource.addEventListener('plan', handleEvent);
      eventSource.addEventListener('tool', handleEvent);
      eventSource.addEventListener('artifact', handleEvent);
      eventSource.addEventListener('trace', handleEvent);
      eventSource.addEventListener('ai_call', handleEvent);
      eventSource.addEventListener('error', handleEvent);
      eventSource.addEventListener('log', handleEvent);
      
      // Also listen for generic message events (fallback)
      eventSource.onmessage = handleEvent;

      eventSource.onerror = (err) => {
        console.error('[useJobStream] EventSource error:', err);
        setIsConnected(false);
        onConnectionChange?.(false);
        
        // Attempt reconnection if not ended
        if (!isEnded && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = reconnectDelayMs * Math.pow(reconnectBackoffMultiplier, reconnectAttemptsRef.current - 1);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`[useJobStream] Reconnecting (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          const error = new Error(`Failed to connect after ${maxReconnectAttempts} attempts`);
          onError?.(error);
        }
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('[useJobStream] Failed to create EventSource:', error);
      onError?.(error);
    }
  }, [
    jobId,
    lastEventId,
    includeHistory,
    disconnect,
    isEnded,
    maxReconnectAttempts,
    reconnectDelayMs,
    reconnectBackoffMultiplier,
    onEvent,
    onConnectionChange,
    onError,
  ]);

  // Auto-connect on mount/jobId change
  useEffect(() => {
    if (autoConnect && jobId) {
      clearEvents();
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [jobId, autoConnect]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    events,
    currentStage,
    stageMessage,
    planSteps,
    currentStepId,
    toolEvents,
    artifactEvents,
    traceEvents,
    aiCallEvents,
    errorEvents,
    logEvents,
    isConnected,
    isEnded,
    lastEventId,
    connect,
    disconnect,
    clearEvents,
  };
}
