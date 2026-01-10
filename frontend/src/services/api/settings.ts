/**
 * Settings API Client - Profile and Workspace management
 */
import { HttpClient } from './HttpClient';

const apiBaseURL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  'http://localhost:3000';

const httpClient = new HttpClient(apiBaseURL);

// Types
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  status: string;
  createdAt: string;
}

export interface UpdateProfileRequest {
  name: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface Workspace {
  id: string;
  name: string;
  ownerEmail: string;
  createdAt: string;
  plan: string;
}

export interface UpdateWorkspaceRequest {
  name: string;
}

export interface DeleteWorkspaceRequest {
  confirmation: 'DELETE MY ACCOUNT';
  password?: string;
}

/**
 * Settings API
 */
export const settingsApi = {
  // =========================================================================
  // Profile
  // =========================================================================

  /**
   * Get current user profile
   */
  async getProfile(): Promise<UserProfile> {
    return httpClient.get<UserProfile>('/api/settings/profile');
  },

  /**
   * Update profile (name)
   */
  async updateProfile(data: UpdateProfileRequest): Promise<{ success: boolean; name: string }> {
    return httpClient.put<{ success: boolean; name: string }>('/api/settings/profile', data);
  },

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordRequest): Promise<{ success: boolean }> {
    return httpClient.put<{ success: boolean }>('/api/settings/profile/password', data);
  },

  // =========================================================================
  // Workspace
  // =========================================================================

  /**
   * Get workspace info
   */
  async getWorkspace(): Promise<Workspace> {
    return httpClient.get<Workspace>('/api/settings/workspace');
  },

  /**
   * Update workspace name
   */
  async updateWorkspace(data: UpdateWorkspaceRequest): Promise<{ success: boolean; name: string }> {
    return httpClient.put<{ success: boolean; name: string }>('/api/settings/workspace', data);
  },

  /**
   * Delete workspace (account)
   */
  async deleteWorkspace(data: DeleteWorkspaceRequest): Promise<{ success: boolean; message: string }> {
    return httpClient.delete<{ success: boolean; message: string }>('/api/settings/workspace', {}, data);
  },
};
