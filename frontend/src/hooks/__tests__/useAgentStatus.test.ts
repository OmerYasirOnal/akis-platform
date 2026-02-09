import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAgentStatus } from '../useAgentStatus';

// Mock the agents API module
vi.mock('../../services/api/agents', () => ({
  agentsApi: {
    getRunningJobs: vi.fn(),
  },
}));

import { agentsApi } from '../../services/api/agents';

const mockGetRunningJobs = agentsApi.getRunningJobs as ReturnType<typeof vi.fn>;

describe('useAgentStatus', () => {
  beforeEach(() => {
    mockGetRunningJobs.mockReset();
  });

  it('starts in loading state', () => {
    mockGetRunningJobs.mockResolvedValue({ jobs: [] });
    const { result } = renderHook(() => useAgentStatus('scribe'));
    expect(result.current.isLoading).toBe(true);
  });

  it('returns inactive when no running jobs', async () => {
    mockGetRunningJobs.mockResolvedValue({ jobs: [] });
    const { result } = renderHook(() => useAgentStatus('scribe'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.status).toBe('inactive');
    expect(result.current.runningJobs).toEqual([]);
  });

  it('returns active when matching jobs exist', async () => {
    const jobs = [
      { id: '1', type: 'scribe', state: 'running', createdAt: '', updatedAt: '' },
    ];
    mockGetRunningJobs.mockResolvedValue({ jobs });
    const { result } = renderHook(() => useAgentStatus('scribe'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.status).toBe('active');
    expect(result.current.runningJobs).toHaveLength(1);
  });

  it('filters jobs by agent type', async () => {
    const jobs = [
      { id: '1', type: 'scribe', state: 'running', createdAt: '', updatedAt: '' },
      { id: '2', type: 'trace', state: 'running', createdAt: '', updatedAt: '' },
    ];
    mockGetRunningJobs.mockResolvedValue({ jobs });
    const { result } = renderHook(() => useAgentStatus('trace'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.status).toBe('active');
    expect(result.current.runningJobs).toHaveLength(1);
    expect(result.current.runningJobs[0].type).toBe('trace');
  });

  it('handles API error gracefully', async () => {
    mockGetRunningJobs.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useAgentStatus('scribe'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.status).toBe('inactive');
    expect(result.current.runningJobs).toEqual([]);
  });

  it('refresh function fetches latest status', async () => {
    mockGetRunningJobs.mockResolvedValue({ jobs: [] });
    const { result } = renderHook(() => useAgentStatus('scribe'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const callCount = mockGetRunningJobs.mock.calls.length;

    await act(async () => {
      await result.current.refresh();
    });
    expect(mockGetRunningJobs.mock.calls.length).toBe(callCount + 1);
  });
});

describe('useAgentStatus polling', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockGetRunningJobs.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('polls on the specified interval', async () => {
    mockGetRunningJobs.mockResolvedValue({ jobs: [] });
    renderHook(() => useAgentStatus('scribe', 5000));

    await waitFor(() => expect(mockGetRunningJobs).toHaveBeenCalledTimes(1));

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    await waitFor(() => expect(mockGetRunningJobs).toHaveBeenCalledTimes(2));
  });

  it('cleans up interval on unmount', async () => {
    mockGetRunningJobs.mockResolvedValue({ jobs: [] });
    const { unmount } = renderHook(() => useAgentStatus('scribe', 5000));

    await waitFor(() => expect(mockGetRunningJobs).toHaveBeenCalledTimes(1));
    unmount();

    await act(async () => {
      vi.advanceTimersByTime(10000);
    });
    // Should not have been called again after unmount
    expect(mockGetRunningJobs).toHaveBeenCalledTimes(1);
  });
});
