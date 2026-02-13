export interface WebhookConfig {
  url: string;
  headers?: Record<string, string>;
}

export class WebhookNotifier {
  private config: WebhookConfig | null = null;

  constructor(config?: WebhookConfig) {
    this.config = config ?? null;
  }

  async notify(event: string, payload: Record<string, unknown>): Promise<boolean> {
    if (!this.config) return false;

    try {
      const response = await fetch(this.config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.headers,
        },
        body: JSON.stringify({
          event,
          timestamp: new Date().toISOString(),
          payload,
        }),
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}
