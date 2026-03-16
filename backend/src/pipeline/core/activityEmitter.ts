import { EventEmitter } from 'events';

// Pipeline-level in-memory event bus for real-time activity tracking
export const pipelineBus = new EventEmitter();
pipelineBus.setMaxListeners(100);

export interface PipelineActivity {
  pipelineId: string;
  stage: 'scribe' | 'proto' | 'trace';
  step: string;
  message: string;
  detail?: string;
  progress?: number; // 0-100
  timestamp: string;
}

export function emitActivity(activity: PipelineActivity): void {
  pipelineBus.emit(`pipeline:${activity.pipelineId}`, activity);
}

export function createActivityEmitter(
  pipelineId: string,
  stage: PipelineActivity['stage'],
) {
  return (step: string, message: string, progress?: number, detail?: string) => {
    emitActivity({
      pipelineId,
      stage,
      step,
      message,
      progress,
      detail,
      timestamp: new Date().toISOString(),
    });
  };
}
