/**
 * Integrations API Client - OAuth-based GitHub integration
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

export interface GitHubDisconnectResponse {
  ok: boolean;
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
   * Start GitHub OAuth flow (redirects browser)
   */
  startGitHubOAuth(): void {
    window.location.href = `${apiBaseURL}/api/integrations/github/oauth/start`;
  },

  /**
   * Disconnect GitHub
   */
  async disconnectGitHub(): Promise<GitHubDisconnectResponse> {
    return httpClient.delete<GitHubDisconnectResponse>('/api/integrations/github');
  },
};

