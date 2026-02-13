import type { PlatformType } from '../../config/platforms.js';
import type { PlatformConfig } from '../../config/platforms.js';

export abstract class APIAdapter {
  protected config: PlatformConfig;
  private lastRequestTime = 0;

  constructor(config: PlatformConfig) {
    this.config = config;
  }

  get platform(): PlatformType {
    return this.config.platform;
  }

  get method() {
    return 'api' as const;
  }

  protected async rateLimitedFetch(url: string, init?: RequestInit): Promise<Response> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    const minDelay = this.config.rateLimit.minDelayMs;

    if (elapsed < minDelay) {
      await sleep(minDelay - elapsed);
    }

    this.lastRequestTime = Date.now();

    const response = await fetch(url, init);

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('retry-after') ?? '60', 10);
      await sleep(retryAfter * 1000);
      return this.rateLimitedFetch(url, init);
    }

    return response;
  }

  protected buildHeaders(token?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
