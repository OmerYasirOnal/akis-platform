import * as vscode from 'vscode';
import * as https from 'https';
import * as http from 'http';

export interface AkisAgent {
  type: 'scribe' | 'trace' | 'proto' | 'piri';
  name: string;
  description: string;
}

export interface AkisJob {
  id: string;
  type: string;
  state: 'pending' | 'running' | 'completed' | 'failed' | 'awaiting_approval';
  payload: Record<string, unknown>;
  result?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AkisJobCreateParams {
  agentType: string;
  payload: Record<string, unknown>;
}

export class AkisApiClient {
  private baseUrl: string;
  private token: string;

  constructor() {
    const config = vscode.workspace.getConfiguration('akis');
    this.baseUrl = config.get<string>('serverUrl', 'https://staging.akisflow.com');
    this.token = config.get<string>('apiToken', '');
  }

  reload(): void {
    const config = vscode.workspace.getConfiguration('akis');
    this.baseUrl = config.get<string>('serverUrl', 'https://staging.akisflow.com');
    this.token = config.get<string>('apiToken', '');
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = new URL(path, this.baseUrl);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;

    return new Promise((resolve, reject) => {
      const options: http.RequestOptions = {
        method,
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
        },
      };

      const req = lib.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data) as T);
            } catch {
              resolve(data as unknown as T);
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', reject);

      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  }

  async getRunningJobs(): Promise<AkisJob[]> {
    return this.request<AkisJob[]>('GET', '/api/agents/jobs/running');
  }

  async getRecentJobs(limit = 20): Promise<AkisJob[]> {
    return this.request<AkisJob[]>('GET', `/api/agents/jobs?limit=${limit}`);
  }

  async getJob(jobId: string): Promise<AkisJob> {
    return this.request<AkisJob>('GET', `/api/agents/jobs/${jobId}`);
  }

  async createJob(params: AkisJobCreateParams): Promise<AkisJob> {
    return this.request<AkisJob>('POST', '/api/agents/run', {
      type: params.agentType,
      ...params.payload,
    });
  }

  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>('GET', '/health');
  }
}
