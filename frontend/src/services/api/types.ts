// This file will be generated from OpenAPI schema
// For now, we define basic types manually

export type JobType = 'scribe' | 'trace' | 'proto';
export type JobState = 'pending' | 'running' | 'completed' | 'failed';

export interface Job {
  id: string;
  type: JobType;
  state: JobState;
  payload?: unknown;
  result?: unknown;
  error?: string;
  /** Structured error code for classification (e.g., AI_RATE_LIMITED, MCP_UNREACHABLE) */
  errorCode?: string | null;
  /** User-friendly error message */
  errorMessage?: string | null;
  /** MCP Gateway correlation id (safe to share, helps debug gateway logs) */
  correlationId?: string | null;
  /** MCP Gateway URL used for this job (safe to share, no secrets) */
  mcpGatewayUrl?: string | null;
  /** Raw error payload for debugging (secrets redacted before display) */
  rawErrorPayload?: string | null;
  createdAt: string;
  updatedAt: string;
  plan?: JobPlan;
  audit?: JobAudit[];
  /** Request ID for tracing (from API response) */
  requestId?: string;
}

export interface JobPlan {
  steps: unknown[];
  rationale?: string;
  createdAt: string;
}

export interface JobAudit {
  phase: string;
  payload: unknown;
  createdAt: string;
}

export interface JobsListResponse {
  items: Job[];
  nextCursor: string | null;
}

export interface CreateJobRequest {
  type: JobType;
  payload?: {
    doc?: string; // for scribe
    spec?: string; // for trace
    goal?: string; // for proto
    [key: string]: unknown;
  };
}

export interface CreateJobResponse {
  jobId: string;
  state: JobState;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId?: string;
}
