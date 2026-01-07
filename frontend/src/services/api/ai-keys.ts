import { HttpClient } from './HttpClient';

const apiBaseURL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  'http://localhost:3000';

const httpClient = new HttpClient(apiBaseURL);

const withCredentials = {
  credentials: 'include' as const,
};

export type AiProvider = 'openai' | 'openrouter';

export type ProviderKeyStatus = {
  configured: boolean;
  last4: string | null;
  updatedAt: string | null;
};

export type MultiProviderStatus = {
  activeProvider: AiProvider;
  providers: {
    openai: ProviderKeyStatus;
    openrouter: ProviderKeyStatus;
  };
};

// Legacy type for backwards compatibility
export type AiKeyStatus = {
  provider: AiProvider;
  configured: boolean;
  last4: string | null;
  updatedAt: string | null;
};

export const aiKeysApi = {
  /**
   * Get multi-provider status including active provider
   */
  getStatus: async (): Promise<MultiProviderStatus> => {
    return httpClient.get<MultiProviderStatus>(
      '/api/settings/ai-keys/status',
      withCredentials
    );
  },

  /**
   * Save API key for a specific provider
   */
  saveKey: async (provider: AiProvider, apiKey: string): Promise<AiKeyStatus> => {
    return httpClient.put<AiKeyStatus>(
      '/api/settings/ai-keys',
      {
        provider,
        apiKey,
      },
      withCredentials
    );
  },

  /**
   * Set the active AI provider
   */
  setActiveProvider: async (provider: AiProvider): Promise<MultiProviderStatus> => {
    return httpClient.put<MultiProviderStatus>(
      '/api/settings/ai-provider/active',
      { provider },
      withCredentials
    );
  },

  /**
   * Delete API key for a specific provider
   */
  deleteKey: async (provider: AiProvider): Promise<{ ok: boolean }> => {
    return httpClient.delete<{ ok: boolean }>(
      '/api/settings/ai-keys',
      withCredentials,
      { provider }
    );
  },
};
