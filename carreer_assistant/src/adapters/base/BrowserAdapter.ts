import type { PlatformType, PlatformConfig } from '../../config/platforms.js';

export abstract class BrowserAdapter {
  protected config: PlatformConfig;
  protected browser: unknown = null;
  protected page: unknown = null;

  constructor(config: PlatformConfig) {
    this.config = config;
  }

  get platform(): PlatformType {
    return this.config.platform;
  }

  get method() {
    return 'browser' as const;
  }

  async initialize(): Promise<void> {
    // Dynamic import to avoid requiring playwright when not needed
    const { chromium } = await import('playwright');
    this.browser = await chromium.launch({ headless: true });
    const context = await (this.browser as { newContext: (opts: Record<string, unknown>) => Promise<unknown> }).newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    this.page = await (context as { newPage: () => Promise<unknown> }).newPage();
  }

  async teardown(): Promise<void> {
    if (this.browser) {
      await (this.browser as { close: () => Promise<void> }).close();
      this.browser = null;
      this.page = null;
    }
  }

  protected async delay(): Promise<void> {
    const minDelay = this.config.rateLimit.minDelayMs;
    const jitter = Math.random() * 1000;
    await sleep(minDelay + jitter);
  }

  protected async screenshot(name: string): Promise<void> {
    if (this.page) {
      const p = this.page as { screenshot: (opts: { path: string }) => Promise<void> };
      await p.screenshot({ path: `data/screenshots/${name}-${Date.now()}.png` });
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
