/**
 * Integrations API Client - GitHub, Jira, Confluence
 * For managing external integrations
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

export interface AtlassianStatus {
  connected: boolean;
  siteUrl?: string;
  userEmail?: string;
  tokenLast4?: string;
  lastValidatedAt?: string;
}

export interface AtlassianConnectRequest {
  siteUrl: string;
  email: string;
  apiToken: string;
}

export interface AtlassianConnectResponse {
  success: boolean;
  message?: string;
  displayName?: string;
}

export interface AtlassianTestResponse {
  success: boolean;
  displayName?: string;
  error?: string;
}

export interface AllIntegrationsStatus {
  github: { connected: boolean; login?: string };
  jira: AtlassianStatus;
  confluence: AtlassianStatus;
}

/**
 * Integrations API
 */
export const integrationsApi = {
  // =========================================================================
  // All Integrations
  // =========================================================================
  
  /**
   * Get all integration statuses
   */
  async getAllStatuses(): Promise<AllIntegrationsStatus> {
    return httpClient.get<AllIntegrationsStatus>('/api/integrations');
  },

  // =========================================================================
  // GitHub
  // =========================================================================
  
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

  // =========================================================================
  // Jira
  // =========================================================================
  
  /**
   * Get Jira connection status
   */
  async getJiraStatus(): Promise<AtlassianStatus> {
    return httpClient.get<AtlassianStatus>('/api/integrations/jira/status');
  },

  /**
   * Connect Jira
   */
  async connectJira(data: AtlassianConnectRequest): Promise<AtlassianConnectResponse> {
    return httpClient.post<AtlassianConnectResponse>('/api/integrations/jira', data);
  },

  /**
   * Test Jira connection
   */
  async testJira(): Promise<AtlassianTestResponse> {
    return httpClient.post<AtlassianTestResponse>('/api/integrations/jira/test', {});
  },

  /**
   * Disconnect Jira
   */
  async disconnectJira(): Promise<{ ok: boolean }> {
    return httpClient.delete<{ ok: boolean }>('/api/integrations/jira');
  },

  // =========================================================================
  // Confluence
  // =========================================================================
  
  /**
   * Get Confluence connection status
   */
  async getConfluenceStatus(): Promise<AtlassianStatus> {
    return httpClient.get<AtlassianStatus>('/api/integrations/confluence/status');
  },

  /**
   * Connect Confluence
   */
  async connectConfluence(data: AtlassianConnectRequest): Promise<AtlassianConnectResponse> {
    return httpClient.post<AtlassianConnectResponse>('/api/integrations/confluence', data);
  },

  /**
   * Test Confluence connection
   */
  async testConfluence(): Promise<AtlassianTestResponse> {
    return httpClient.post<AtlassianTestResponse>('/api/integrations/confluence/test', {});
  },

  /**
   * Disconnect Confluence
   */
  async disconnectConfluence(): Promise<{ ok: boolean }> {
    return httpClient.delete<{ ok: boolean }>('/api/integrations/confluence');
  },
};

