import { HttpClient } from './HttpClient';
import { getApiBaseUrl } from './config';

const http = new HttpClient(getApiBaseUrl());

export interface AgentActivityEntry {
  id: string;
  pipelineId: string;
  agent: 'scribe' | 'proto' | 'trace';
  action: string;
  reasoning?: string;
  inputTokens: number;
  outputTokens: number;
  confidence?: number;
  filesGenerated?: number;
  testsPassed?: number;
  testsFailed?: number;
  specCompliance?: number;
  assumptions?: string[];
  responseTimeMs?: number;
  model?: string;
  createdAt: string;
}

export interface AgentAggregateMetrics {
  agent: string;
  totalRuns: number;
  avgConfidence: number | null;
  avgResponseTimeMs: number | null;
  totalInputTokens: number;
  totalOutputTokens: number;
}

export const agentActivitiesApi = {
  list: async (limit = 100): Promise<AgentActivityEntry[]> => {
    const res = await http.get<{ activities: AgentActivityEntry[] }>(`/api/agent-activities?limit=${limit}`);
    return res.activities ?? [];
  },

  getByPipeline: async (pipelineId: string): Promise<AgentActivityEntry[]> => {
    const res = await http.get<{ activities: AgentActivityEntry[] }>(`/api/agent-activities/${pipelineId}`);
    return res.activities ?? [];
  },
};
