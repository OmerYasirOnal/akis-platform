import { HttpClient } from './HttpClient';
import { getApiBaseUrl } from './config';

const httpClient = new HttpClient(getApiBaseUrl());

const withCredentials = {
  credentials: 'include' as const,
};

export type ConversationThreadStatus =
  | 'active'
  | 'awaiting_user_input'
  | 'awaiting_plan_selection'
  | 'queued'
  | 'completed'
  | 'failed';

export type ConversationMessageRole = 'system' | 'user' | 'agent';
export type PlanCandidateStatus = 'unbuilt' | 'queued' | 'building' | 'built' | 'failed';

export interface ConversationThread {
  id: string;
  title: string;
  status: ConversationThreadStatus;
  agentType: 'scribe' | 'trace' | 'proto' | 'smart-automations';
  activeRuns: number;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  lastMessagePreview: string | null;
  lastMessageRole: ConversationMessageRole | null;
  messageCount: number;
}

export interface ConversationMessage {
  id: string;
  threadId: string;
  role: ConversationMessageRole;
  agentType: string | null;
  content: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface PlanCandidate {
  id: string;
  threadId: string;
  sourceMessageId: string | null;
  title: string;
  summary: string;
  sourcePrompt: string;
  status: PlanCandidateStatus;
  selected: boolean;
  buildJobId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrustSnapshot {
  id: string;
  threadId: string;
  userId: string;
  jobId: string | null;
  reliability: number;
  hallucinationRisk: number;
  taskSuccess: number;
  toolHealth: number;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export const conversationsApi = {
  createThread: async (body?: {
    id?: string;
    title?: string;
    agentType?: 'scribe' | 'trace' | 'proto' | 'smart-automations';
  }): Promise<{ thread: ConversationThread }> => {
    return httpClient.post('/api/conversations/threads', body ?? {}, withCredentials);
  },

  listThreads: async (): Promise<{ threads: ConversationThread[] }> => {
    return httpClient.get('/api/conversations/threads', withCredentials);
  },

  getThread: async (threadId: string): Promise<{ thread: ConversationThread }> => {
    return httpClient.get(`/api/conversations/threads/${threadId}`, withCredentials);
  },

  createMessage: async (
    threadId: string,
    body: {
      role: ConversationMessageRole;
      content: string;
      agentType?: 'scribe' | 'trace' | 'proto' | 'smart-automations';
      metadata?: Record<string, unknown>;
    }
  ): Promise<{ message: ConversationMessage }> => {
    return httpClient.post(`/api/conversations/threads/${threadId}/messages`, body, withCredentials);
  },

  listMessages: async (
    threadId: string,
    query?: { limit?: number; before?: string }
  ): Promise<{ messages: ConversationMessage[] }> => {
    const params = new URLSearchParams();
    if (typeof query?.limit === 'number') params.set('limit', String(query.limit));
    if (query?.before) params.set('before', query.before);
    const qs = params.toString();
    const url = qs
      ? `/api/conversations/threads/${threadId}/messages?${qs}`
      : `/api/conversations/threads/${threadId}/messages`;
    return httpClient.get(url, withCredentials);
  },

  listPlans: async (threadId: string): Promise<{ candidates: PlanCandidate[] }> => {
    return httpClient.get(`/api/conversations/threads/${threadId}/plans`, withCredentials);
  },

  generatePlans: async (
    threadId: string,
    body: { prompt: string; count?: number; sourceMessageId?: string }
  ): Promise<{ candidates: PlanCandidate[] }> => {
    return httpClient.post(`/api/conversations/threads/${threadId}/plans/generate`, body, withCredentials);
  },

  generateAlternatives: async (
    threadId: string,
    planId: string,
    body?: { count?: number }
  ): Promise<{ candidates: PlanCandidate[] }> => {
    return httpClient.post(
      `/api/conversations/threads/${threadId}/plans/${planId}/generate-alternatives`,
      body ?? {},
      withCredentials
    );
  },

  buildPlan: async (
    threadId: string,
    body: { planId: string; jobId?: string }
  ): Promise<{ status: PlanCandidateStatus; activeRuns?: number; limit?: number; candidate: PlanCandidate }> => {
    return httpClient.post(`/api/conversations/threads/${threadId}/plans/build`, body, withCredentials);
  },

  listTrustSnapshots: async (threadId: string, limit = 50): Promise<{ snapshots: TrustSnapshot[] }> => {
    return httpClient.get(
      `/api/conversations/threads/${threadId}/trust-snapshots?limit=${limit}`,
      withCredentials
    );
  },

  createTrustSnapshot: async (
    threadId: string,
    body: {
      jobId?: string;
      reliability: number;
      hallucinationRisk: number;
      taskSuccess: number;
      toolHealth: number;
      metadata?: Record<string, unknown>;
    }
  ): Promise<{ snapshot: TrustSnapshot }> => {
    return httpClient.post(`/api/conversations/threads/${threadId}/trust-snapshots`, body, withCredentials);
  },
};
