import { apiHttpClient } from './HttpClient';

const httpClient = apiHttpClient;

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

export interface JobDetail {
  id: string;
  type: AgentType;
  state: JobState;
  createdAt: string;
  updatedAt: string;
  payload?: unknown;
  result?: unknown;
  error?: unknown;
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

  runAgent: async (type: AgentType, payload: unknown): Promise<RunAgentResponse> => {
    return httpClient.post<RunAgentResponse>(
      '/agents/jobs',
      {
        type,
        payload,
      },
      withCredentials
    );
  },

  getJob: async (jobId: string): Promise<JobDetail> => {
    return httpClient.get<JobDetail>(`/agents/jobs/${jobId}`, withCredentials);
  },
};

