/**
 * Agent Config API - S0.4.6
 * Frontend API client for agent configuration endpoints
 */
import { HttpClient } from './HttpClient';

const apiBaseURL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  'http://localhost:3000';

const httpClient = new HttpClient(apiBaseURL);

const withCredentials = {
  credentials: 'include' as const,
};

export type AgentType = 'scribe' | 'trace' | 'proto';
export type TriggerMode = 'on_pr_merge' | 'scheduled' | 'manual';
export type TargetPlatform = 'github_repo' | 'confluence' | 'notion' | 'github_wiki';

export interface ScribeConfig {
  id?: string;
  agentType: 'scribe';
  enabled: boolean;
  repositoryOwner: string | null;
  repositoryName: string | null;
  baseBranch: string | null;
  branchPattern: string | null;
  targetPlatform: TargetPlatform | null;
  targetConfig: Record<string, unknown>;
  triggerMode: TriggerMode;
  scheduleCron: string | null;
  prTitleTemplate: string | null;
  prBodyTemplate: string | null;
  autoMerge: boolean;
  includeGlobs: string[] | null;
  excludeGlobs: string[] | null;
  jobTimeoutSeconds: number | null;
  maxRetries: number | null;
  llmModelOverride: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface IntegrationStatus {
  github: {
    connected: boolean;
    details: {
      username: string | null;
      appInstalled: boolean;
      repositories: Array<{ fullName: string; permissions: string[] }> | null;
    } | null;
    lastChecked: string | null;
  };
  confluence: {
    connected: boolean;
    details: {
      cloudId: string | null;
      siteName: string | null;
      accessibleSpaces: string[] | null;
    } | null;
    lastChecked: string | null;
  };
  jira: {
    connected: boolean;
    details: {
      cloudId: string | null;
      siteName: string | null;
      accessibleSpaces: string[] | null;
    } | null;
    lastChecked: string | null;
  };
}

export interface ConfigResponse {
  config: ScribeConfig | null;
  integrationStatus: IntegrationStatus;
}

export interface ValidationCheck {
  passed: boolean;
  message: string;
}

export interface ValidationResponse {
  valid: boolean;
  checks: Record<string, ValidationCheck>;
}

export interface ModelAllowlistResponse {
  allowlist: string[];
  defaultModel: string | null;
}

export interface ConfigUpdatePayload {
  enabled?: boolean;
  repositoryOwner?: string;
  repositoryName?: string;
  baseBranch?: string;
  branchPattern?: string;
  targetPlatform?: TargetPlatform;
  targetConfig?: Record<string, unknown>;
  triggerMode?: TriggerMode;
  scheduleCron?: string | null;
  prTitleTemplate?: string;
  prBodyTemplate?: string | null;
  autoMerge?: boolean;
  includeGlobs?: string[] | null;
  excludeGlobs?: string[] | null;
  jobTimeoutSeconds?: number;
  maxRetries?: number;
  llmModelOverride?: string | null;
}

export const agentConfigsApi = {
  /**
   * List all agent configurations for current user
   */
  listConfigs: async (): Promise<{ configs: ScribeConfig[] }> => {
    return httpClient.get<{ configs: ScribeConfig[] }>(
      '/api/agents/configs',
      withCredentials
    );
  },

  /**
   * Get agent configuration
   */
  getConfig: async (agentType: AgentType): Promise<ConfigResponse> => {
    return httpClient.get<ConfigResponse>(
      `/api/agents/configs/${agentType}`,
      withCredentials
    );
  },

  /**
   * Create or update agent configuration (idempotent upsert)
   * Note: Uses POST for backend compatibility; semantically equivalent to PUT
   */
  updateConfig: async (
    agentType: AgentType,
    payload: ConfigUpdatePayload
  ): Promise<{ config: ScribeConfig; message: string }> => {
    return httpClient.post<{ config: ScribeConfig; message: string }>(
      `/api/agents/configs/${agentType}`,
      payload,
      withCredentials
    );
  },

  /**
   * Validate configuration (pre-flight checks)
   */
  validateConfig: async (
    agentType: AgentType,
    payload: Partial<ConfigUpdatePayload>
  ): Promise<ValidationResponse> => {
    return httpClient.post<ValidationResponse>(
      `/api/agents/configs/${agentType}/validate`,
      payload,
      withCredentials
    );
  },

  getModelAllowlist: async (agentType: AgentType): Promise<ModelAllowlistResponse> => {
    return httpClient.get<ModelAllowlistResponse>(
      `/api/agents/configs/${agentType}/models`,
      withCredentials
    );
  },
};

export const integrationsApi = {
  /**
   * Get integration status
   */
  getStatus: async (): Promise<{ integrations: IntegrationStatus }> => {
    return httpClient.get<{ integrations: IntegrationStatus }>(
      '/api/integrations/status',
      withCredentials
    );
  },
};
