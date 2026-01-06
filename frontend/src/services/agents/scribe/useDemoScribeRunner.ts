/**
 * React hook for the Demo Scribe Runner
 * Provides reactive state updates and lifecycle management
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  DemoScribeRunner,
  type ScribeRunState,
  type ScribeRunConfig,
} from './demoScribeRunner';

export interface UseDemoScribeRunnerReturn {
  state: ScribeRunState;
  start: (config: ScribeRunConfig) => void;
  cancel: () => void;
  reset: () => void;
  isRunning: boolean;
  isComplete: boolean;
  isIdle: boolean;
}

export function useDemoScribeRunner(): UseDemoScribeRunnerReturn {
  const runnerRef = useRef<DemoScribeRunner | null>(null);
  const [state, setState] = useState<ScribeRunState>({
    status: 'idle',
    logs: [],
    progress: 0,
    preview: '',
    diff: '',
    startedAt: null,
    completedAt: null,
    error: null,
  });

  useEffect(() => {
    // Create a new runner instance for this component
    runnerRef.current = new DemoScribeRunner();
    
    // Subscribe to state changes
    const unsubscribe = runnerRef.current.subscribe((newState) => {
      setState(newState);
    });

    return () => {
      unsubscribe();
      runnerRef.current?.destroy();
      runnerRef.current = null;
    };
  }, []);

  const start = useCallback((config: ScribeRunConfig) => {
    if (runnerRef.current) {
      void runnerRef.current.start(config);
    }
  }, []);

  const cancel = useCallback(() => {
    runnerRef.current?.cancel();
  }, []);

  const reset = useCallback(() => {
    runnerRef.current?.reset();
  }, []);

  const isRunning = !['idle', 'complete', 'cancelled', 'error'].includes(state.status);
  const isComplete = state.status === 'complete';
  const isIdle = state.status === 'idle';

  return {
    state,
    start,
    cancel,
    reset,
    isRunning,
    isComplete,
    isIdle,
  };
}

