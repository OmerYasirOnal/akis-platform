import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useJob } from '../useJob';

vi.mock('../../services/api', () => ({
  api: {
    getJob: vi.fn(),
  },
}));

import { api } from '../../services/api';

const mockGetJob = api.getJob as ReturnType<typeof vi.fn>;

const makeJob = (overrides: Record<string, unknown> = {}) => ({
  id: 'j-1',
  type: 'scribe',
  state: 'completed',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('useJob', () => {
  beforeEach(() => {
    mockGetJob.mockReset();
  });

  it('starts in loading state', () => {
    mockGetJob.mockResolvedValue(makeJob());
    const { result } = renderHook(() => useJob('j-1'));
    expect(result.current.isLoading).toBe(true);
    expect(result.current.job).toBeNull();
  });

  it('loads job by id', async () => {
    mockGetJob.mockResolvedValue(makeJob({ id: 'j-42' }));
    const { result } = renderHook(() => useJob('j-42'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.job?.id).toBe('j-42');
    expect(result.current.error).toBeNull();
  });

  it('does nothing when jobId is undefined', () => {
    const { result } = renderHook(() => useJob(undefined));
    expect(mockGetJob).not.toHaveBeenCalled();
    expect(result.current.job).toBeNull();
  });

  it('passes include params for plan and audit', async () => {
    mockGetJob.mockResolvedValue(makeJob());
    renderHook(() => useJob('j-1', { includePlan: true, includeAudit: true }));

    await waitFor(() => expect(mockGetJob).toHaveBeenCalled());
    expect(mockGetJob).toHaveBeenCalledWith('j-1', ['plan', 'audit']);
  });

  it('omits include when no options set', async () => {
    mockGetJob.mockResolvedValue(makeJob());
    renderHook(() => useJob('j-1'));

    await waitFor(() => expect(mockGetJob).toHaveBeenCalled());
    expect(mockGetJob).toHaveBeenCalledWith('j-1', undefined);
  });

  it('handles API error', async () => {
    mockGetJob.mockRejectedValue(new Error('Not found'));
    const { result } = renderHook(() => useJob('j-bad'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error?.message).toBe('Not found');
    expect(result.current.job).toBeNull();
  });

  it('wraps non-Error throws', async () => {
    mockGetJob.mockRejectedValue('string error');
    const { result } = renderHook(() => useJob('j-1'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error?.message).toBe('Failed to load job');
  });

  it('stores requestId from response', async () => {
    mockGetJob.mockResolvedValue(makeJob({ requestId: 'req-123' }));
    const { result } = renderHook(() => useJob('j-1'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.requestId).toBe('req-123');
  });

  it('refetch reloads the job', async () => {
    mockGetJob.mockResolvedValue(makeJob({ state: 'running' }));
    const { result } = renderHook(() => useJob('j-1'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.job?.state).toBe('running');

    mockGetJob.mockResolvedValue(makeJob({ state: 'completed' }));
    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => expect(result.current.job?.state).toBe('completed'));
  });
});

describe('useJob auto-refresh', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockGetJob.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('polls running jobs when enabled', async () => {
    mockGetJob.mockResolvedValue(makeJob({ state: 'running' }));
    renderHook(() => useJob('j-1', { autoRefresh: true }));

    await waitFor(() => expect(mockGetJob).toHaveBeenCalledTimes(1));

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    await waitFor(() => expect(mockGetJob.mock.calls.length).toBeGreaterThanOrEqual(2));
  });

  it('stops polling for completed jobs', async () => {
    mockGetJob.mockResolvedValue(makeJob({ state: 'completed' }));
    renderHook(() => useJob('j-1', { autoRefresh: true }));

    await waitFor(() => expect(mockGetJob).toHaveBeenCalledTimes(1));
    const callCount = mockGetJob.mock.calls.length;

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    // Should NOT have polled again since job is completed
    expect(mockGetJob.mock.calls.length).toBe(callCount);
  });

  it('stops polling for failed jobs', async () => {
    mockGetJob.mockResolvedValue(makeJob({ state: 'failed' }));
    renderHook(() => useJob('j-1', { autoRefresh: true }));

    await waitFor(() => expect(mockGetJob).toHaveBeenCalledTimes(1));
    const callCount = mockGetJob.mock.calls.length;

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(mockGetJob.mock.calls.length).toBe(callCount);
  });
});
