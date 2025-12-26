/**
 * GitHub Discovery API Client - S0.4.6
 * For repository/branch selection in Scribe configuration
 */
import { HttpClient } from './HttpClient';

const apiBaseURL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  'http://localhost:3000';

const httpClient = new HttpClient(apiBaseURL);

const withCredentials = {
  credentials: 'include' as const,
};

// Types
export interface GitHubOwner {
  login: string;
  type: 'User' | 'Organization';
  avatarUrl: string;
}

export interface GitHubRepo {
  name: string;
  fullName: string;
  defaultBranch: string;
  private: boolean;
  description: string | null;
}

export interface GitHubBranch {
  name: string;
  isDefault: boolean;
}

export interface OwnersResponse {
  owners: GitHubOwner[];
}

export interface ReposResponse {
  repos: GitHubRepo[];
}

export interface BranchesResponse {
  branches: GitHubBranch[];
  defaultBranch: string;
}

// NOTE: This file returns data models for GitHub discovery endpoints.
// Canonical client error contract is `ApiError` from `./HttpClient` (re-exported via `services/api/index.ts`).
export interface GitHubDiscoveryErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

/**
 * GitHub Discovery API
 */
export const githubDiscoveryApi = {
  /**
   * Get available repository owners (user + organizations)
   */
  async getOwners(): Promise<OwnersResponse> {
    return httpClient.get<OwnersResponse>(
      '/api/integrations/github/owners',
      withCredentials
    );
  },

  /**
   * Get repositories for an owner
   */
  async getRepos(owner: string): Promise<ReposResponse> {
    return httpClient.get<ReposResponse>(
      `/api/integrations/github/repos?owner=${encodeURIComponent(owner)}`,
      withCredentials
    );
  },

  /**
   * Get branches for a repository
   */
  async getBranches(owner: string, repo: string): Promise<BranchesResponse> {
    return httpClient.get<BranchesResponse>(
      `/api/integrations/github/branches?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`,
      withCredentials
    );
  },
};

