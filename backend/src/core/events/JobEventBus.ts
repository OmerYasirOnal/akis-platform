import { EventEmitter } from 'events';

export type JobPhase = 'thinking' | 'discovery' | 'reading' | 'creating' | 'publishing' | 'done' | 'error';

export interface JobEvent {
  phase: JobPhase;
  message: string;
  ts: string;
  detail?: Record<string, unknown>;
}

const MAX_EVENTS_PER_JOB = 100;
const CLEANUP_INTERVAL_MS = 30 * 60 * 1000;

class JobEventBusImpl extends EventEmitter {
  private eventHistory: Map<string, JobEvent[]> = new Map();
  private jobTimestamps: Map<string, number> = new Map();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    super();
    this.setMaxListeners(200);
    this.startCleanup();
  }

  emitJobEvent(jobId: string, event: JobEvent): void {
    if (!this.eventHistory.has(jobId)) {
      this.eventHistory.set(jobId, []);
    }
    const history = this.eventHistory.get(jobId)!;
    history.push(event);
    if (history.length > MAX_EVENTS_PER_JOB) {
      history.shift();
    }
    this.jobTimestamps.set(jobId, Date.now());
    this.emit(`job:${jobId}`, event);
  }

  subscribe(jobId: string, callback: (event: JobEvent) => void): void {
    this.on(`job:${jobId}`, callback);
  }

  unsubscribe(jobId: string, callback: (event: JobEvent) => void): void {
    this.off(`job:${jobId}`, callback);
  }

  getHistory(jobId: string): JobEvent[] {
    return this.eventHistory.get(jobId) || [];
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [jobId, timestamp] of this.jobTimestamps) {
        if (now - timestamp > CLEANUP_INTERVAL_MS) {
          this.eventHistory.delete(jobId);
          this.jobTimestamps.delete(jobId);
          this.removeAllListeners(`job:${jobId}`);
        }
      }
    }, CLEANUP_INTERVAL_MS);
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.eventHistory.clear();
    this.jobTimestamps.clear();
    this.removeAllListeners();
  }
}

export const jobEventBus = new JobEventBusImpl();
