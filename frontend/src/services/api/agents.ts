import { HttpClient } from './HttpClient';
import { getApiBaseUrl } from './config';

// Use centralized config to prevent /api/api double prefix
const httpClient = new HttpClient(getApiBaseUrl());

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
  aiProvider?: string | null;
  aiModel?: string | null;
  aiTotalDurationMs?: number | null;
  aiInputTokens?: number | null;
  aiOutputTokens?: number | null;
  aiTotalTokens?: number | null;
  aiEstimatedCostUsd?: number | string | null;
  /** Structured error code for classification (e.g., AI_RATE_LIMITED) */
  errorCode?: string | null;
  /** User-friendly error message */
  errorMessage?: string | null;
  /** MCP Gateway correlation id (safe to share, helps debug gateway logs) */
  correlationId?: string | null;
  plan?: unknown;
  audit?: unknown[];
  trace?: unknown[];
  artifacts?: unknown[];
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
  // NOTE: Coder and Developer agents shelved for S0.5 scope freeze.
];

export interface RunAgentRequest {
  type: AgentType;
  payload: unknown;
  requiresStrictValidation?: boolean;
}

export interface GetJobOptions {
  include?: ('plan' | 'audit' | 'trace' | 'artifacts')[];
}

export interface LatestTrace {
  title: string;
  detail?: string | null;
  timestamp: string;
}

export interface RunningJob {
  id: string;
  type: AgentType;
  state: 'pending' | 'running';
  payload?: {
    owner?: string;
    repo?: string;
    baseBranch?: string;
    [key: string]: unknown;
  };
  createdAt: string;
  updatedAt: string;
  latestTrace?: LatestTrace | null;
}

export interface RunningJobsResponse {
  jobs: RunningJob[];
}

export interface JobListItem {
  id: string;
  type: AgentType;
  state: JobState;
  errorCode: string | null;
  errorMessage: string | null;
  qualityScore: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobListResponse {
  items: JobListItem[];
  nextCursor: string | null;
}

export interface DuplicateJobError {
  error: {
    code: 'DUPLICATE_JOB';
    message: string;
  };
  existingJobId: string;
  existingJobState: string;
}

export const agentsApi = {
  listAgents: async (): Promise<AgentDefinition[]> => {
    return agents;
  },

  runAgent: async (request: RunAgentRequest): Promise<RunAgentResponse> => {
    return httpClient.post<RunAgentResponse>(
      '/api/agents/jobs',
      request,
      withCredentials
    );
  },

  getJob: async (jobId: string, options?: GetJobOptions): Promise<JobDetail> => {
    const includeParam = options?.include?.join(',');
    const url = includeParam 
      ? `/api/agents/jobs/${jobId}?include=${includeParam}`
      : `/api/agents/jobs/${jobId}`;
    return httpClient.get<JobDetail>(url, withCredentials);
  },

  /**
   * Get currently running or pending jobs for the authenticated user
   * Used for: live progress display, duplicate run prevention
   */
  getRunningJobs: async (): Promise<RunningJobsResponse> => {
    return httpClient.get<RunningJobsResponse>('/api/agents/jobs/running', withCredentials);
  },

  /**
   * Cancel a running or pending job
   * S2.0.2: Job lifecycle control
   */
  cancelJob: async (jobId: string): Promise<{ id: string; state: string; message: string }> => {
    return httpClient.post(
      `/api/agents/jobs/${jobId}/cancel`,
      {},
      withCredentials
    );
  },

  /**
   * List jobs with optional filtering (used for onboarding status checks)
   */
  listJobs: async (options?: { limit?: number }): Promise<JobListResponse> => {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', String(options.limit));
    const qs = params.toString();
    const url = qs ? `/api/agents/jobs?${qs}` : '/api/agents/jobs';
    return httpClient.get<JobListResponse>(url, withCredentials);
  },
};
