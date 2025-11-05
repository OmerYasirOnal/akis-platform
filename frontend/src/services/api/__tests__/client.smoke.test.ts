import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../client';

describe('API Client Smoke Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle getJobs with mock fetch', async () => {
    // Mock fetch globally
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            id: 'test-id',
            type: 'scribe',
            state: 'completed',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        nextCursor: null,
      }),
      headers: new Headers({ 'request-id': 'test-request-id' }),
    });

    const result = await api.getJobs();

    expect(result.items).toHaveLength(1);
    expect(result.items[0].type).toBe('scribe');
    expect(result.nextCursor).toBeNull();
  });

  it('should handle createJob for scribe type', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        jobId: 'new-job-id',
        state: 'pending',
      }),
      headers: new Headers({ 'request-id': 'create-request-id' }),
    });

    const result = await api.createJob({
      type: 'scribe',
      payload: { doc: 'Test document' },
    });

    expect(result.jobId).toBe('new-job-id');
    expect(result.state).toBe('pending');
  });

  it('should handle getJob with include params', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'test-id',
        type: 'scribe',
        state: 'completed',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        plan: { steps: [], rationale: 'Test plan' },
      }),
      headers: new Headers({ 'request-id': 'get-request-id' }),
    });

    const result = await api.getJob('test-id', ['plan']);

    expect(result.id).toBe('test-id');
    expect(result.plan).toBeDefined();
  });
});

