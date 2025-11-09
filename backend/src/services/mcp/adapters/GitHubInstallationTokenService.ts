import { HttpClient } from '../../http/HttpClient.js';
import { signGitHubAppJwt } from '../../../utils/jwt.js';

const GITHUB_API_BASE = 'https://api.github.com';

export interface GitHubInstallationTokenOptions {
  appId: string;
  privateKey: string;
  baseUrl?: string;
  httpClient?: HttpClient;
}

export interface InstallationTokenResult {
  token: string;
  expiresAt: Date;
}

export class GitHubInstallationTokenService {
  private readonly appId: string;
  private readonly privateKey: string;
  private readonly baseUrl: string;
  private readonly httpClient: HttpClient;

  constructor(options: GitHubInstallationTokenOptions) {
    this.appId = options.appId;
    this.privateKey = options.privateKey;
    this.baseUrl = options.baseUrl ?? GITHUB_API_BASE;
    this.httpClient = options.httpClient ?? new HttpClient();
  }

  async createInstallationToken(installationId: string): Promise<InstallationTokenResult> {
    const jwt = signGitHubAppJwt(this.appId, this.privateKey);
    const url = `${this.baseUrl}/app/installations/${installationId}/access_tokens`;

    const response = await this.httpClient.send(
      url,
      {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
        },
        body: JSON.stringify({}),
      },
      jwt
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to create installation access token (status ${response.status}): ${errorText}`
      );
    }

    const json = (await response.json()) as { token: string; expires_at: string };
    return {
      token: json.token,
      expiresAt: new Date(json.expires_at),
    };
  }
}


