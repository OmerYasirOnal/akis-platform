import { HttpClient } from './HttpClient';

const apiBaseURL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  'http://localhost:3000';

const httpClient = new HttpClient(apiBaseURL);

const withCredentials = {
  credentials: 'include' as const,
};

export interface AuthUser {
  id: string;
  email: string;
}

export const authApi = {
  me: async (): Promise<{ user: AuthUser | null }> => {
    return httpClient.get<{ user: AuthUser | null }>('/auth/me', withCredentials);
  },

  devLogin: async (email: string): Promise<{ user: AuthUser }> => {
    return httpClient.post<{ user: AuthUser }>('/auth/dev-login', { email }, withCredentials);
  },

  logout: async (): Promise<{ ok: boolean }> => {
    return httpClient.post<{ ok: boolean }>('/auth/logout', undefined, withCredentials);
  },

  /**
   * Get started flow - checks if user is authenticated
   * Returns user if authenticated, null otherwise
   * Safe mock if backend route unavailable
   */
  getStarted: async (): Promise<{ user: AuthUser | null }> => {
    try {
      return await authApi.me();
    } catch (error) {
      // Safe fallback - assume not authenticated
      console.warn('getStarted: auth check failed, assuming not authenticated', error);
      return { user: null };
    }
  },
};


