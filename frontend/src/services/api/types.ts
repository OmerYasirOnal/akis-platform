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
  createdAt: string;
  updatedAt: string;
  plan?: JobPlan;
  audit?: JobAudit[];
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

