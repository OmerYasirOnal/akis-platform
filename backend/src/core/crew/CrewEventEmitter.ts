import type { CrewEvent } from './types.js';
import { EventEmitter } from 'events';

/**
 * CrewEventEmitter — Crew-level SSE event broadcasting.
 * Extends JobEventBus pattern for crew-wide events.
 * 
 * Events include: status changes, worker spawning, task updates, messages.
 * Frontend subscribes to crew:${crewRunId} channel.
 */
export class CrewEventEmitter {
  private readonly emitter = new EventEmitter();
  private readonly history = new Map<string, CrewEvent[]>();

  constructor() {
    this.emitter.setMaxListeners(50);
  }

  emitCrewEvent(event: CrewEvent) {
    const channel = `crew:${event.crewRunId}`;

    // Store in history for catch-up
    if (!this.history.has(event.crewRunId)) {
      this.history.set(event.crewRunId, []);
    }
    this.history.get(event.crewRunId)!.push(event);

    // Emit to subscribers
    this.emitter.emit(channel, event);
  }

  subscribe(crewRunId: string, callback: (event: CrewEvent) => void): () => void {
    const channel = `crew:${crewRunId}`;
    this.emitter.on(channel, callback);
    return () => {
      this.emitter.off(channel, callback);
    };
  }

  getHistory(crewRunId: string): CrewEvent[] {
    return this.history.get(crewRunId) ?? [];
  }

  getHistoryAfter(crewRunId: string, afterTimestamp: string): CrewEvent[] {
    const events = this.history.get(crewRunId) ?? [];
    return events.filter(e => e.timestamp > afterTimestamp);
  }

  cleanup(crewRunId: string) {
    this.history.delete(crewRunId);
    this.emitter.removeAllListeners(`crew:${crewRunId}`);
  }

  // Convenience methods for common events

  emitStatusChange(crewRunId: string, oldStatus: string, newStatus: string) {
    this.emitCrewEvent({
      type: 'crew:status_change',
      crewRunId,
      timestamp: new Date().toISOString(),
      data: { oldStatus, newStatus },
    });
  }

  emitWorkerSpawned(crewRunId: string, jobId: string, role: string, color: string, index: number) {
    this.emitCrewEvent({
      type: 'crew:worker_spawned',
      crewRunId,
      timestamp: new Date().toISOString(),
      data: { jobId, role, color, index },
    });
  }

  emitWorkerCompleted(crewRunId: string, jobId: string, role: string, tokenUsage?: number) {
    this.emitCrewEvent({
      type: 'crew:worker_completed',
      crewRunId,
      timestamp: new Date().toISOString(),
      data: { jobId, role, tokenUsage },
    });
  }

  emitWorkerFailed(crewRunId: string, jobId: string, role: string, error: string) {
    this.emitCrewEvent({
      type: 'crew:worker_failed',
      crewRunId,
      timestamp: new Date().toISOString(),
      data: { jobId, role, error },
    });
  }

  emitTaskCreated(crewRunId: string, taskId: string, title: string, assignToRole?: string) {
    this.emitCrewEvent({
      type: 'crew:task_created',
      crewRunId,
      timestamp: new Date().toISOString(),
      data: { taskId, title, assignToRole },
    });
  }

  emitTaskClaimed(crewRunId: string, taskId: string, workerJobId: string, workerRole: string) {
    this.emitCrewEvent({
      type: 'crew:task_claimed',
      crewRunId,
      timestamp: new Date().toISOString(),
      data: { taskId, workerJobId, workerRole },
    });
  }

  emitMergeStarted(crewRunId: string) {
    this.emitCrewEvent({
      type: 'crew:merge_started',
      crewRunId,
      timestamp: new Date().toISOString(),
      data: {},
    });
  }

  emitMergeCompleted(crewRunId: string, totalTokens: number, totalCostUsd: number) {
    this.emitCrewEvent({
      type: 'crew:merge_completed',
      crewRunId,
      timestamp: new Date().toISOString(),
      data: { totalTokens, totalCostUsd },
    });
  }
}
