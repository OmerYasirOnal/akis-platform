import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useJobs } from '../useJobs';

vi.mock('../../services/api', () => ({
  api: {
    getJobs: vi.fn(),
  },
}));

import { api } from '../../services/api';

const mockGetJobs = api.getJobs as ReturnType<typeof vi.fn>;

const makeJobsResponse = (count: number, nextCursor: string | null = null) => ({
  items: Array.from({ length: count }, (_, i) => ({
    id: `job-${i}`,
    type: 'scribe' as const,
    state: 'completed' as const,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  })),
  nextCursor,
});

describe('useJobs', () => {
  beforeEach(() => {
    mockGetJobs.mockReset();
  });

  it('starts in loading state', () => {
    mockGetJobs.mockResolvedValue(makeJobsResponse(0));
    const { result } = renderHook(() => useJobs());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('loads jobs on mount', async () => {
    mockGetJobs.mockResolvedValue(makeJobsResponse(3));
    const { result } = renderHook(() => useJobs());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.jobs).toHaveLength(3);
    expect(result.current.error).toBeNull();
  });

  it('passes filter options to API', async () => {
    mockGetJobs.mockResolvedValue(makeJobsResponse(1));
    renderHook(() => useJobs({ type: 'trace', state: 'running', limit: 5 }));

    await waitFor(() => expect(mockGetJobs).toHaveBeenCalled());
    expect(mockGetJobs).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'trace', state: 'running', limit: 5 })
    );
  });

  it('defaults limit to 20', async () => {
    mockGetJobs.mockResolvedValue(makeJobsResponse(1));
    renderHook(() => useJobs());

    await waitFor(() => expect(mockGetJobs).toHaveBeenCalled());
    expect(mockGetJobs).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 20 })
    );
  });

  it('handles API error', async () => {
    mockGetJobs.mockRejectedValue(new Error('Server error'));
    const { result } = renderHook(() => useJobs());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Server error');
    expect(result.current.jobs).toEqual([]);
  });

  it('wraps non-Error throws in Error', async () => {
    mockGetJobs.mockRejectedValue('string error');
    const { result } = renderHook(() => useJobs());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Failed to load jobs');
  });

  it('tracks nextCursor for pagination', async () => {
    mockGetJobs.mockResolvedValue(makeJobsResponse(3, 'cursor-abc'));
    const { result } = renderHook(() => useJobs());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.nextCursor).toBe('cursor-abc');
  });

  it('loadMore appends results', async () => {
    mockGetJobs.mockResolvedValueOnce(makeJobsResponse(2, 'cursor-1'));
    const { result } = renderHook(() => useJobs());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.jobs).toHaveLength(2);

    mockGetJobs.mockResolvedValueOnce(makeJobsResponse(1, null));
    await act(async () => {
      result.current.loadMore();
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.jobs).toHaveLength(3);
    expect(result.current.nextCursor).toBeNull();
  });

  it('loadMore does nothing when no cursor', async () => {
    mockGetJobs.mockResolvedValue(makeJobsResponse(2, null));
    const { result } = renderHook(() => useJobs());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const callCount = mockGetJobs.mock.calls.length;

    act(() => {
      result.current.loadMore();
    });
    expect(mockGetJobs.mock.calls.length).toBe(callCount);
  });

  it('refetch replaces jobs from scratch', async () => {
    mockGetJobs.mockResolvedValueOnce(makeJobsResponse(2));
    const { result } = renderHook(() => useJobs());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockGetJobs.mockResolvedValueOnce(makeJobsResponse(5));
    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.jobs).toHaveLength(5);
  });
});
