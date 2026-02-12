import { getApiBaseUrl } from './config';

const BASE = () => `${getApiBaseUrl()}/api/agents/crew`;

function authHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json' };
}

export interface CrewRunInput {
  goal: string;
  workerRoles: Array<{
    role: string;
    agentType: 'scribe' | 'trace' | 'proto' | 'worker';
    taskDescription: string;
    color?: string;
    contextOverrides?: Record<string, unknown>;
  }>;
  mergeStrategy?: 'concatenate' | 'synthesize' | 'structured';
  failureStrategy?: 'fail_fast' | 'best_effort';
  autoApprove?: boolean;
  repo?: string;
  branch?: string;
}

export interface CrewRunDetail {
  id: string;
  userId: string;
  status: 'planning' | 'spawning' | 'running' | 'merging' | 'completed' | 'failed';
  goal: string;
  workerRoles: Array<{ role: string; agentType: string; taskDescription: string; color: string }>;
  coordinatorJobId: string | null;
  mergedOutput: unknown;
  mergeStrategy: string;
  failureStrategy: string;
  autoApprove: boolean;
  totalWorkers: number;
  completedWorkers: number;
  failedWorkers: number;
  totalTokens: number | null;
  totalCostUsd: string | null;
  createdAt: string;
  updatedAt: string;
  workers: Array<{
    id: string;
    type: string;
    state: string;
    workerRole: string | null;
    workerIndex: number | null;
    workerColor: string | null;
    aiTotalTokens: number | null;
    aiEstimatedCostUsd: string | null;
    result: unknown;
    error: string | null;
    createdAt: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    assignedTo: string | null;
    priority: number;
  }>;
  messages: Array<CrewMessage>;
}

export interface CrewMessage {
  id: string;
  crewRunId: string;
  fromJobId: string | null;
  toJobId: string | null;
  fromRole: string;
  toRole: string | null;
  content: string;
  messageType: string;
  createdAt: string;
}

export const crewApi = {
  async startCrewRun(input: CrewRunInput): Promise<CrewRunDetail> {
    const res = await fetch(BASE(), {
      method: 'POST',
      headers: authHeaders(),
      credentials: 'include',
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(`Failed to start crew run: ${res.status}`);
    const json = await res.json();
    return json.data;
  },

  async listCrewRuns(): Promise<CrewRunDetail[]> {
    const res = await fetch(BASE(), {
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`Failed to list crew runs: ${res.status}`);
    const json = await res.json();
    return json.data;
  },

  async getCrewRun(id: string): Promise<CrewRunDetail> {
    const res = await fetch(`${BASE()}/${id}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`Failed to get crew run: ${res.status}`);
    const json = await res.json();
    return json.data;
  },

  async sendMessage(crewRunId: string, toJobId: string, content: string): Promise<CrewMessage> {
    const res = await fetch(`${BASE()}/${crewRunId}/messages`, {
      method: 'POST',
      headers: authHeaders(),
      credentials: 'include',
      body: JSON.stringify({ toJobId, content }),
    });
    if (!res.ok) throw new Error(`Failed to send message: ${res.status}`);
    const json = await res.json();
    return json.data;
  },

  async broadcast(crewRunId: string, content: string): Promise<CrewMessage> {
    const res = await fetch(`${BASE()}/${crewRunId}/broadcast`, {
      method: 'POST',
      headers: authHeaders(),
      credentials: 'include',
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error(`Failed to broadcast: ${res.status}`);
    const json = await res.json();
    return json.data;
  },

  async getMessages(crewRunId: string, forJobId?: string): Promise<CrewMessage[]> {
    const params = new URLSearchParams();
    if (forJobId) params.set('forJobId', forJobId);
    const res = await fetch(`${BASE()}/${crewRunId}/messages?${params}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`Failed to get messages: ${res.status}`);
    const json = await res.json();
    return json.data;
  },

  async getTasks(crewRunId: string) {
    const res = await fetch(`${BASE()}/${crewRunId}/tasks`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`Failed to get tasks: ${res.status}`);
    const json = await res.json();
    return json.data;
  },

  async cancelCrewRun(crewRunId: string) {
    const res = await fetch(`${BASE()}/${crewRunId}/cancel`, {
      method: 'POST',
      headers: authHeaders(),
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`Failed to cancel: ${res.status}`);
    const json = await res.json();
    return json.data;
  },
};
