export interface RequestOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
}

export interface ApiError extends Error {
  code: string;
  statusCode: number;
  details?: unknown;
  requestId?: string;
}

export class HttpClient {
  private baseURL: string;

  constructor(baseURL: string = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000') {
    this.baseURL = baseURL.replace(/\/$/, ''); // Remove trailing slash
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async parseErrorResponse(response: Response): Promise<ApiError> {
    let errorData: { error?: { code?: string; message?: string; details?: unknown } } = {};
    try {
      errorData = await response.json();
    } catch {
      // If response is not JSON, use status text
    }

    const error: ApiError = new Error(
      errorData.error?.message || response.statusText || 'Request failed'
    ) as ApiError;
    error.code = errorData.error?.code || `HTTP_${response.status}`;
    error.statusCode = response.status;
    error.details = errorData.error?.details;
    error.requestId = response.headers.get('request-id') || undefined;

    return error;
  }

  private async fetchWithRetry(
    url: string,
    options: RequestOptions = {}
  ): Promise<Response> {
    const { retries = 3, retryDelay = 1000, ...fetchOptions } = options;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          ...fetchOptions,
          headers: {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
          },
        });

        // Don't retry on client errors (4xx) except 429 (rate limit)
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          throw await this.parseErrorResponse(response);
        }

        // Retry on server errors (5xx) or rate limit (429)
        if (response.status >= 500 || response.status === 429) {
          if (attempt < retries) {
            const delayMs = retryDelay * Math.pow(2, attempt); // Exponential backoff
            await this.delay(delayMs);
            continue;
          }
          throw await this.parseErrorResponse(response);
        }

        return response;
      } catch (error) {
        lastError = error as Error;
        // Don't retry if it's not a network error or server error
        if (error instanceof Error && !('statusCode' in error)) {
          // Network error - retry
          if (attempt < retries) {
            const delayMs = retryDelay * Math.pow(2, attempt);
            await this.delay(delayMs);
            continue;
          }
        } else {
          // Already parsed API error - don't retry
          throw error;
        }
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    const url = `${this.baseURL}${path}`;
    const response = await this.fetchWithRetry(url, {
      ...options,
      method: 'GET',
    });

    const requestId = response.headers.get('request-id');
    const data = await response.json();

    // Attach request-id to response if present
    if (requestId && typeof data === 'object' && data !== null) {
      (data as { requestId?: string }).requestId = requestId;
    }

    return data as T;
  }

  async post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const url = `${this.baseURL}${path}`;
    const response = await this.fetchWithRetry(url, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });

    const requestId = response.headers.get('request-id');
    const data = await response.json();

    if (requestId && typeof data === 'object' && data !== null) {
      (data as { requestId?: string }).requestId = requestId;
    }

    return data as T;
  }

  async put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const url = `${this.baseURL}${path}`;
    const response = await this.fetchWithRetry(url, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });

    const requestId = response.headers.get('request-id');
    const data = await response.json();

    if (requestId && typeof data === 'object' && data !== null) {
      (data as { requestId?: string }).requestId = requestId;
    }

    return data as T;
  }

  async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    const url = `${this.baseURL}${path}`;
    const response = await this.fetchWithRetry(url, {
      ...options,
      method: 'DELETE',
    });

    const requestId = response.headers.get('request-id');
    const data = await response.json();

    if (requestId && typeof data === 'object' && data !== null) {
      (data as { requestId?: string }).requestId = requestId;
    }

    return data as T;
  }
}

