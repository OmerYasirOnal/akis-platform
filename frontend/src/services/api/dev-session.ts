/**
 * Dev Session API client — post-pipeline development chat.
 */
import { HttpClient } from './HttpClient';
import { getApiBaseUrl } from './config';

const http = new HttpClient(getApiBaseUrl());

export interface DevFileChange {
  action: 'create' | 'modify' | 'delete';
  path: string;
  content?: string;
}

export interface DevChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  fileChanges?: DevFileChange[];
  changeStatus?: 'pending' | 'approved' | 'pushed' | 'rejected';
  commitSha?: string;
  createdAt: string;
}

interface StartSessionResponse {
  sessionId: string;
  fileTree: unknown[];
  messages: DevChatMessage[];
}

interface GetSessionResponse {
  session: {
    id: string;
    repoOwner: string;
    repoName: string;
    branch: string;
    status: string;
    totalCommits: number;
    createdAt: string;
  };
  messages: DevChatMessage[];
}

interface PushResponse {
  commitSha: string;
  commitUrl: string;
}

export const devSessionApi = {
  startSession: (pipelineId: string): Promise<StartSessionResponse> =>
    http.post(`/api/pipelines/${pipelineId}/dev/start`),

  getSession: (pipelineId: string): Promise<GetSessionResponse> =>
    http.get(`/api/pipelines/${pipelineId}/dev/session`),

  chat: async (pipelineId: string, sessionId: string, message: string): Promise<Response> => {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/pipelines/${pipelineId}/dev/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ sessionId, message }),
    });
    return response;
  },

  pushChanges: (pipelineId: string, sessionId: string, messageId: string): Promise<PushResponse> =>
    http.post(`/api/pipelines/${pipelineId}/dev/push`, { sessionId, messageId }),

  rejectChanges: (pipelineId: string, sessionId: string, messageId: string): Promise<{ ok: boolean }> =>
    http.post(`/api/pipelines/${pipelineId}/dev/reject`, { sessionId, messageId }),
};
