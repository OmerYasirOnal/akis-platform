import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CrewEventEmitter } from '../../../src/core/crew/CrewEventEmitter.js';
import type { CrewEvent } from '../../../src/core/crew/types.js';

describe('CrewEventEmitter', () => {
  let emitter: CrewEventEmitter;

  beforeEach(() => {
    emitter = new CrewEventEmitter();
  });

  it('emits events to subscribers', () => {
    const callback = vi.fn();
    emitter.subscribe('crew-1', callback);

    emitter.emitCrewEvent({
      type: 'crew:status_change',
      crewRunId: 'crew-1',
      timestamp: new Date().toISOString(),
      data: { oldStatus: 'planning', newStatus: 'running' },
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'crew:status_change',
        crewRunId: 'crew-1',
      }),
    );
  });

  it('stores events in history', () => {
    emitter.emitCrewEvent({
      type: 'crew:worker_spawned',
      crewRunId: 'crew-1',
      timestamp: '2026-01-01T00:00:00Z',
      data: { jobId: 'job-1', role: 'content' },
    });

    emitter.emitCrewEvent({
      type: 'crew:worker_spawned',
      crewRunId: 'crew-1',
      timestamp: '2026-01-01T00:00:01Z',
      data: { jobId: 'job-2', role: 'ui' },
    });

    const history = emitter.getHistory('crew-1');
    expect(history).toHaveLength(2);
  });

  it('returns history after timestamp', () => {
    emitter.emitCrewEvent({
      type: 'crew:worker_spawned',
      crewRunId: 'crew-1',
      timestamp: '2026-01-01T00:00:00Z',
      data: { jobId: 'job-1' },
    });

    emitter.emitCrewEvent({
      type: 'crew:worker_completed',
      crewRunId: 'crew-1',
      timestamp: '2026-01-01T00:00:05Z',
      data: { jobId: 'job-1' },
    });

    const after = emitter.getHistoryAfter('crew-1', '2026-01-01T00:00:02Z');
    expect(after).toHaveLength(1);
    expect(after[0].type).toBe('crew:worker_completed');
  });

  it('unsubscribe stops receiving events', () => {
    const callback = vi.fn();
    const unsub = emitter.subscribe('crew-1', callback);

    emitter.emitCrewEvent({
      type: 'crew:status_change',
      crewRunId: 'crew-1',
      timestamp: new Date().toISOString(),
      data: {},
    });

    expect(callback).toHaveBeenCalledTimes(1);

    unsub();

    emitter.emitCrewEvent({
      type: 'crew:status_change',
      crewRunId: 'crew-1',
      timestamp: new Date().toISOString(),
      data: {},
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('cleanup removes history and listeners', () => {
    const callback = vi.fn();
    emitter.subscribe('crew-1', callback);

    emitter.emitCrewEvent({
      type: 'crew:status_change',
      crewRunId: 'crew-1',
      timestamp: new Date().toISOString(),
      data: {},
    });

    emitter.cleanup('crew-1');

    expect(emitter.getHistory('crew-1')).toHaveLength(0);
  });

  it('convenience methods emit correct event types', () => {
    const callback = vi.fn();
    emitter.subscribe('crew-1', callback);

    emitter.emitStatusChange('crew-1', 'planning', 'running');
    emitter.emitWorkerSpawned('crew-1', 'job-1', 'content', '#10B981', 0);
    emitter.emitWorkerCompleted('crew-1', 'job-1', 'content', 1000);
    emitter.emitWorkerFailed('crew-1', 'job-2', 'ui', 'timeout');
    emitter.emitMergeStarted('crew-1');
    emitter.emitMergeCompleted('crew-1', 5000, 0.05);

    expect(callback).toHaveBeenCalledTimes(6);

    const types = callback.mock.calls.map((c: [CrewEvent]) => c[0].type);
    expect(types).toEqual([
      'crew:status_change',
      'crew:worker_spawned',
      'crew:worker_completed',
      'crew:worker_failed',
      'crew:merge_started',
      'crew:merge_completed',
    ]);
  });

  it('does not cross-emit between crew runs', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    emitter.subscribe('crew-1', callback1);
    emitter.subscribe('crew-2', callback2);

    emitter.emitCrewEvent({
      type: 'crew:status_change',
      crewRunId: 'crew-1',
      timestamp: new Date().toISOString(),
      data: {},
    });

    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(0);
  });
});
