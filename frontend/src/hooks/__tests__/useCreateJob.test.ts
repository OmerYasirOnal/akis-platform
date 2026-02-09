import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCreateJob } from '../useCreateJob';

vi.mock('../../services/api', () => ({
  api: {
    createJob: vi.fn(),
  },
}));

import { api } from '../../services/api';

const mockCreateJob = api.createJob as ReturnType<typeof vi.fn>;

describe('useCreateJob', () => {
  beforeEach(() => {
    mockCreateJob.mockReset();
  });

  it('starts with idle state', () => {
    const { result } = renderHook(() => useCreateJob());
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.response).toBeNull();
  });

  it('creates a job and stores response', async () => {
    const mockResponse = { jobId: 'j-1', state: 'pending' };
    mockCreateJob.mockResolvedValue(mockResponse);
    const { result } = renderHook(() => useCreateJob());

    let returnValue: unknown;
    await act(async () => {
      returnValue = await result.current.createJob({ type: 'scribe' });
    });

    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.response).toEqual(mockResponse);
    expect(result.current.error).toBeNull();
    expect(returnValue).toEqual(mockResponse);
  });

  it('sets isSubmitting during request', async () => {
    let resolvePromise: (v: unknown) => void;
    mockCreateJob.mockReturnValue(new Promise((r) => { resolvePromise = r; }));

    const { result } = renderHook(() => useCreateJob());

    let promise: Promise<unknown>;
    act(() => {
      promise = result.current.createJob({ type: 'trace' });
    });
    expect(result.current.isSubmitting).toBe(true);

    await act(async () => {
      resolvePromise!({ jobId: 'j-2', state: 'pending' });
      await promise!;
    });
    expect(result.current.isSubmitting).toBe(false);
  });

  it('handles Error throws and sets error state', async () => {
    mockCreateJob.mockRejectedValue(new Error('Validation failed'));
    const { result } = renderHook(() => useCreateJob());

    // The hook re-throws, so we catch it
    await act(async () => {
      try {
        await result.current.createJob({ type: 'proto' });
      } catch {
        // expected
      }
    });

    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.error?.message).toBe('Validation failed');
    expect(result.current.response).toBeNull();
  });

  it('wraps non-Error throws', async () => {
    mockCreateJob.mockRejectedValue('string error');
    const { result } = renderHook(() => useCreateJob());

    await act(async () => {
      try {
        await result.current.createJob({ type: 'scribe' });
      } catch {
        // expected
      }
    });

    expect(result.current.error?.message).toBe('Failed to create job');
  });

  it('clears previous response on new request', async () => {
    mockCreateJob.mockResolvedValueOnce({ jobId: 'j-1', state: 'pending' });
    const { result } = renderHook(() => useCreateJob());

    await act(async () => {
      await result.current.createJob({ type: 'scribe' });
    });
    expect(result.current.response).not.toBeNull();

    mockCreateJob.mockResolvedValueOnce({ jobId: 'j-2', state: 'pending' });
    await act(async () => {
      await result.current.createJob({ type: 'trace' });
    });

    expect(result.current.response?.jobId).toBe('j-2');
  });

  it('clears previous error on new request', async () => {
    mockCreateJob.mockRejectedValueOnce(new Error('First error'));
    const { result } = renderHook(() => useCreateJob());

    await act(async () => {
      try {
        await result.current.createJob({ type: 'scribe' });
      } catch {
        // expected
      }
    });
    expect(result.current.error).not.toBeNull();

    mockCreateJob.mockResolvedValueOnce({ jobId: 'j-ok', state: 'pending' });
    await act(async () => {
      await result.current.createJob({ type: 'scribe' });
    });
    expect(result.current.error).toBeNull();
  });
});
