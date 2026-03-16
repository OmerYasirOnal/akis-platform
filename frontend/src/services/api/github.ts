/**
 * GitHub Integration API — wraps /api/github/* backend endpoints.
 */
import { HttpClient } from './HttpClient';
import { getApiBaseUrl } from './config';

const http = new HttpClient(getApiBaseUrl());

export interface GitHubStatus {
  connected: boolean;
  username?: string;
  avatarUrl?: string;
}

export interface GitHubRepo {
  name: string;
  fullName: string;
  private: boolean;
  url: string;
  updatedAt: string;
}

export const githubApi = {
  /** Check GitHub connection status */
  getStatus: () => http.get<GitHubStatus>('/api/github/status'),

  /** List user's GitHub repos */
  listRepos: () => http.get<{ repos: GitHubRepo[] }>('/api/github/repos'),

  /** Connect GitHub with a PAT */
  connect: (token: string) =>
    http.post<GitHubStatus>('/api/github/connect', { token }),

  /** Disconnect GitHub */
  disconnect: () =>
    http.post<{ connected: false }>('/api/github/disconnect'),

  /** Create a new repo */
  createRepo: (name: string, isPrivate = true) =>
    http.post<{ name: string; fullName: string; url: string; cloneUrl: string }>(
      '/api/github/repos',
      { name, isPrivate },
    ),
};
