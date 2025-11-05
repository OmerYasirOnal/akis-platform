export class HttpClient {
  constructor(private readonly defaultHeaders: Record<string, string> = {}) {}

  async get(url: string, headers: Record<string, string> = {}) {
    const res = await fetch(url, { headers: { ...this.defaultHeaders, ...headers } });
    return res;
  }

  async post(url: string, body: unknown, headers: Record<string, string> = {}) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...this.defaultHeaders, ...headers },
      body: JSON.stringify(body ?? {}),
    });
    return res;
  }
}


