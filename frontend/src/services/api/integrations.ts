/**
 * Integrations API Client - S0.4.6
 * For managing external integrations (GitHub, etc.)
 */
import { HttpClient } from './HttpClient';

const apiBaseURL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  'http://localhost:3000';

const httpClient = new HttpClient(apiBaseURL);

// Types
export interface GitHubStatus {
  connected: boolean;
  login?: string;
  avatarUrl?: string;
  error?: string;
}

export interface GitHubConnectTokenRequest {
  token: string;
}

export interface GitHubConnectTokenResponse {
  connected: boolean;
  login: string;
}

export interface GitHubDisconnectResponse {
  success: boolean;
  message: string;
}

/**
 * Integrations API
 */
export const integrationsApi = {
  /**
   * Get GitHub connection status
   */
  async getGitHubStatus(): Promise<GitHubStatus> {
    return httpClient.get<GitHubStatus>('/api/integrations/github/status');
  },

  /**
   * Connect GitHub using Personal Access Token
   */
  async connectGitHubToken(token: string): Promise<GitHubConnectTokenResponse> {
    return httpClient.post<GitHubConnectTokenResponse>(
      '/api/integrations/github/token',
      { token }
    );
  },

  /**
   * Disconnect GitHub
   */
  async disconnectGitHub(): Promise<GitHubDisconnectResponse> {
    return httpClient.delete<GitHubDisconnectResponse>('/api/integrations/github');
  },

  /**
   * Start GitHub OAuth flow
   */
  startGitHubOAuth(returnTo?: string): void {
    const params = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : '';
    window.location.href = `${apiBaseURL}/api/integrations/connect/github${params}`;
  },
};

