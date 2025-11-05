import { HttpClient } from './HttpClient';
import type { Job, JobsListResponse, CreateJobRequest, CreateJobResponse } from './types';

const httpClient = new HttpClient();

export const api = {
  // GET /api/agents/jobs
  getJobs: async (params?: {
    type?: 'scribe' | 'trace' | 'proto';
    state?: 'pending' | 'running' | 'completed' | 'failed';
    limit?: number;
    cursor?: string;
  }): Promise<JobsListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set('type', params.type);
    if (params?.state) searchParams.set('state', params.state);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.cursor) searchParams.set('cursor', params.cursor);

    const query = searchParams.toString();
    return httpClient.get<JobsListResponse>(`/api/agents/jobs${query ? `?${query}` : ''}`);
  },

  // GET /api/agents/jobs/:id
  getJob: async (id: string, include?: string[]): Promise<Job & { requestId?: string }> => {
    const searchParams = new URLSearchParams();
    if (include && include.length > 0) {
      searchParams.set('include', include.join(','));
    }

    const query = searchParams.toString();
    return httpClient.get<Job & { requestId?: string }>(
      `/api/agents/jobs/${id}${query ? `?${query}` : ''}`
    );
  },

  // POST /api/agents/jobs
  createJob: async (
    request: CreateJobRequest
  ): Promise<CreateJobResponse & { requestId?: string }> => {
    return httpClient.post<CreateJobResponse & { requestId?: string }>('/api/agents/jobs', request);
  },

  // GET /
  getRoot: async (): Promise<{ name: string; status: string; version: string }> => {
    return httpClient.get('/');
  },

  // GET /health
  getHealth: async (): Promise<{ status: string; timestamp: string }> => {
    return httpClient.get('/health');
  },
};
