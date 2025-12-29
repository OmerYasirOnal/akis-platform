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

export type JobState = 'pending' | 'running' | 'completed' | 'failed';

export interface AgentDefinition {
  id: AgentType;
  name: string;
  description: string;
  capabilities: string[];
}

export interface RunAgentResponse {
  jobId: string;
  state: JobState;
}

export interface ModelConfig {
  providerId: string;
  modelId: string;
  optionalNonSecretTuning?: Record<string, string | number | boolean>;
}

export interface RunAgentRequest {
  type: AgentType;
  agentType?: AgentType;
  payload?: unknown;
  agentConfig?: Record<string, unknown>;
  modelConfig?: ModelConfig;
  requiresStrictValidation?: boolean;
}

export interface JobDetail {
  id: string;
  type: AgentType;
  agentType?: AgentType;
  state: JobState;
  createdAt: string;
  updatedAt: string;
  modelProviderId?: string | null;
  modelId?: string | null;
  modelConfig?: Record<string, unknown>;
  payload?: unknown;
  result?: unknown;
  error?: unknown;
  /** Structured error code for classification (e.g., AI_RATE_LIMITED) */
  errorCode?: string | null;
  /** User-friendly error message */
  errorMessage?: string | null;
  /** MCP Gateway correlation id (safe to share, helps debug gateway logs) */
  correlationId?: string | null;
  plan?: unknown;
  audit?: unknown[];
}

const agents: AgentDefinition[] = [
  {
    id: 'scribe',
    name: 'Scribe',
    description: 'Summarises pull requests and ships documentation updates automatically.',
    capabilities: [
      'Monitors Git activity to capture relevant context',
      'Generates product-ready docs from diffs',
      'Publishes to your wiki with one click approval',
    ],
  },
  {
    id: 'trace',
    name: 'Trace',
    description: 'Turns specs into executable test plans with coverage insights.',
    capabilities: [
      'Parses Jira or Notion specs to extract scenarios',
      'Produces API and UI test cases ranked by risk',
      'Feeds results back into QA dashboards for review',
    ],
  },
  {
    id: 'proto',
    name: 'Proto',
    description: 'Bootstraps working MVP scaffolds from high-level goals.',
    capabilities: [
      'Designs component trees and data flows',
      'Drafts service contracts and seed data',
      'Hands you deployable code to iterate on quickly',
    ],
  },
];

export const agentsApi = {
  listAgents: async (): Promise<AgentDefinition[]> => {
    return agents;
  },

  runAgent: async (
    requestOrType: RunAgentRequest | AgentType,
    payload?: unknown
  ): Promise<RunAgentResponse> => {
    const request: RunAgentRequest =
      typeof requestOrType === 'string'
        ? { type: requestOrType, agentType: requestOrType, payload }
        : requestOrType;

    return httpClient.post<RunAgentResponse>('/api/agents/jobs', request, withCredentials);
  },

  getJob: async (jobId: string): Promise<JobDetail> => {
    return httpClient.get<JobDetail>(`/api/agents/jobs/${jobId}`, withCredentials);
  },
};
