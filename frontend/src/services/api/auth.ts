import { apiHttpClient } from './HttpClient';
import { getApiBaseUrlWithPrefix } from '../../config/api';

const httpClient = apiHttpClient;
const apiBaseUrl = getApiBaseUrlWithPrefix();

const withCredentials = {
  credentials: 'include' as const,
};

export interface AuthUser {
  id: string;
  email: string;
  username?: string | null;
  role: 'admin' | 'member';
  providers?: {
    github?: string[];
  };
}

export interface AuthResponse {
  user: AuthUser;
}

export const authApi = {
  me: async (): Promise<{ user: AuthUser | null }> => {
    return httpClient.get<{ user: AuthUser | null }>('/auth/me', withCredentials);
  },

  signup: async (payload: { email: string; username: string; password: string }): Promise<AuthResponse> => {
    return httpClient.post<AuthResponse>('/auth/signup', payload, withCredentials);
  },

  login: async (payload: { email: string; password: string }): Promise<AuthResponse> => {
    return httpClient.post<AuthResponse>('/auth/login', payload, withCredentials);
  },

  logout: async (): Promise<{ ok: boolean }> => {
    return httpClient.post<{ ok: boolean }>('/auth/logout', undefined, withCredentials);
  },

  devLogin: async (email: string): Promise<AuthResponse> => {
    return httpClient.post<AuthResponse>('/auth/dev-login', { email }, withCredentials);
  },

  githubOAuthUrl: (redirect?: string) => {
    const url = new URL('/auth/github/start', apiBaseUrl);
    if (redirect) {
      url.searchParams.set('redirect', redirect);
    }
    return url.toString();
  },
};

