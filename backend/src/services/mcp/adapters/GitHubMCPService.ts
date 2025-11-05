import { HttpClient } from '../../http/HttpClient';

export class GitHubMCPService {
  private readonly baseUrl: string;
  private readonly http: HttpClient;

  constructor(private readonly token: string, baseUrl = process.env.GITHUB_MCP_BASE_URL ?? 'https://api.github.com/mcp') {
    this.baseUrl = baseUrl;
    this.http = new HttpClient({ Authorization: `Bearer ${this.token}` });
  }

  // JSON-RPC style placeholder
  async ping(): Promise<boolean> {
    const res = await this.http.post(`${this.baseUrl}`, { jsonrpc: '2.0', method: 'system/ping', params: {}, id: '1' });
    return res.ok;
  }
}


