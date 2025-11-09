/**
 * HttpClient - Thin wrapper for HTTP requests
 * Provides timeout, retry/backoff hooks for OCI Free Tier constraints
 */

export interface HttpClientOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export class HttpClient {
  private defaultTimeout: number;
  private defaultRetries: number;
  private defaultRetryDelay: number;

  constructor(options: HttpClientOptions = {}) {
    this.defaultTimeout = options.timeout || 30000; // 30s default
    this.defaultRetries = options.retries || 3;
    this.defaultRetryDelay = options.retryDelay || 1000; // 1s default
  }

  /**
   * GET request with timeout and retry
   */
  async get(url: string, token?: string): Promise<Response> {
    return this.request(url, { method: 'GET' }, token);
  }

  /**
   * POST request with timeout and retry
   */
  async post(url: string, body: unknown, token?: string): Promise<Response> {
    return this.request(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      token
    );
  }

  /**
   * Generic request helper exposed for arbitrary HTTP methods
   */
  async send(url: string, init: RequestInit, token?: string): Promise<Response> {
    return this.request(url, init, token);
  }

  /**
   * Generic request with retry/backoff
   */
  private async request(
    url: string,
    init: RequestInit,
    token?: string
  ): Promise<Response> {
    const headers = new Headers(init.headers);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.defaultTimeout);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.defaultRetries; attempt++) {
      try {
        const response = await fetch(url, {
          ...init,
          headers,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < this.defaultRetries) {
          // Exponential backoff
          const delay = this.defaultRetryDelay * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    clearTimeout(timeoutId);
    throw lastError || new Error('Request failed after retries');
  }
}

