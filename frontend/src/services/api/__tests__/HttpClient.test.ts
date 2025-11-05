import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpClient, ApiError } from '../HttpClient';

// Mock fetch
global.fetch = vi.fn();

describe('HttpClient', () => {
  let client: HttpClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new HttpClient('http://localhost:3000');
  });

  it('should make GET request successfully', async () => {
    const mockResponse = { data: 'test' };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'request-id': 'test-request-id' }),
      json: async () => mockResponse,
    });

    const result = await client.get('/test');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/test',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
    expect(result).toEqual({ ...mockResponse, requestId: 'test-request-id' });
  });

  it('should handle API errors correctly', async () => {
    const errorResponse = {
      error: {
        code: 'NOT_FOUND',
        message: 'Resource not found',
      },
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: new Headers({ 'request-id': 'error-request-id' }),
      json: async () => errorResponse,
    });

    await expect(client.get('/test')).rejects.toThrow();
  });

  it('should retry on server errors', async () => {
    let callCount = 0;
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      if (callCount < 3) {
        return Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          headers: new Headers(),
          json: async () => ({ error: { code: 'SERVER_ERROR', message: 'Server error' } }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({ success: true }),
      });
    });

    const result = await client.get('/test', { retries: 3 });

    expect(callCount).toBe(3);
    expect(result).toEqual({ success: true });
  });

  it('should make POST request with body', async () => {
    const mockBody = { type: 'scribe', payload: { doc: 'test' } };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({ jobId: '123', state: 'pending' }),
    });

    await client.post('/test', mockBody);

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/test',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(mockBody),
      })
    );
  });
});
