import { HttpClient } from '../../http/HttpClient';

export class JiraMCPService {
  private readonly baseUrl: string;
  private readonly http: HttpClient;

  constructor(private readonly token: string, baseUrl = process.env.ATLASSIAN_MCP_BASE_URL ?? 'https://api.atlassian.com/mcp') {
    this.baseUrl = baseUrl;
    this.http = new HttpClient({ Authorization: `Bearer ${this.token}` });
  }

  async getStatus(): Promise<boolean> {
    const res = await this.http.get(`${this.baseUrl}/v1/status`);
    return res.ok;
  }
}


