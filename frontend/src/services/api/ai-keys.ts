import { HttpClient } from './HttpClient';

const apiBaseURL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  'http://localhost:3000';

const httpClient = new HttpClient(apiBaseURL);

const withCredentials = {
  credentials: 'include' as const,
};

export type AiKeyStatus = {
  provider: 'openai';
  configured: boolean;
  last4: string | null;
  updatedAt: string | null;
};

export const aiKeysApi = {
  getStatus: async (): Promise<AiKeyStatus> => {
    return httpClient.get<AiKeyStatus>(
      '/api/settings/ai-keys/status',
      withCredentials
    );
  },

  saveKey: async (apiKey: string): Promise<AiKeyStatus> => {
    return httpClient.put<AiKeyStatus>(
      '/api/settings/ai-keys',
      {
        provider: 'openai',
        apiKey,
      },
      withCredentials
    );
  },

  deleteKey: async (): Promise<{ ok: boolean }> => {
    return httpClient.delete<{ ok: boolean }>(
      '/api/settings/ai-keys',
      withCredentials
    );
  },
};
