/**
 * Integrations API Client - GitHub, Atlassian OAuth, Jira, Confluence
 * For managing external integrations
 */
import { HttpClient } from './HttpClient';
import { getApiBaseUrl } from './config';

// Use centralized config to prevent /api/api double prefix
const httpClient = new HttpClient(getApiBaseUrl());

// Types
export interface GitHubStatus {
  connected: boolean;
  login?: string;
  avatarUrl?: string;
  error?: string | { code: string; message: string };
}

export interface GitHubDisconnectResponse {
  ok: boolean;
}

/**
 * Atlassian OAuth 2.0 (3LO) status
 * Single OAuth connection enables both Jira + Confluence
 */
export interface AtlassianOAuthStatus {
  connected: boolean;
  configured: boolean;
  siteUrl?: string;
  cloudId?: string;
  scopes?: string;
  jiraAvailable: boolean;
  confluenceAvailable: boolean;
  tokenExpiresAt?: string;
  refreshTokenRotatedAt?: string;
  error?: { code: string; message: string };
}

/**
 * Jira/Confluence individual status
 * Can be connected via OAuth or legacy API token
 */
export interface AtlassianStatus {
  connected: boolean;
  siteUrl?: string;
  userEmail?: string;
  tokenLast4?: string;
  lastValidatedAt?: string;
  viaOAuth?: boolean;
  scopes?: string;
  error?: { code: string; message: string };
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
  github: { connected: boolean; login?: string; error?: { code: string; message: string } };
  atlassian: { connected: boolean; siteUrl?: string; cloudId?: string; jiraAvailable: boolean; confluenceAvailable: boolean; error?: { code: string; message: string } };
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
    window.location.href = `${getApiBaseUrl()}/api/integrations/github/oauth/start`;
  },

  /**
   * Disconnect GitHub
   */
  async disconnectGitHub(): Promise<GitHubDisconnectResponse> {
    return httpClient.delete<GitHubDisconnectResponse>('/api/integrations/github');
  },

  // =========================================================================
  // Atlassian OAuth 2.0 (3LO) - Single OAuth for Jira + Confluence
  // =========================================================================

  /**
   * Get Atlassian OAuth status
   * Returns combined status for both Jira and Confluence
   */
  async getAtlassianStatus(): Promise<AtlassianOAuthStatus> {
    return httpClient.get<AtlassianOAuthStatus>('/api/integrations/atlassian/status');
  },

  /**
   * Start Atlassian OAuth flow (redirects browser)
   * One OAuth connection enables both Jira and Confluence
   */
  startAtlassianOAuth(): void {
    window.location.href = `${getApiBaseUrl()}/api/integrations/atlassian/oauth/start`;
  },

  /**
   * Disconnect Atlassian OAuth
   * Removes OAuth connection for both Jira and Confluence
   */
  async disconnectAtlassian(): Promise<{ ok: boolean }> {
    return httpClient.post<{ ok: boolean }>('/api/integrations/atlassian/disconnect', {});
  },

  // =========================================================================
  // Jira (Legacy API Token - Soft Deprecated)
  // OAuth is now the primary method
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

