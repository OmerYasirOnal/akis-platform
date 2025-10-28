/**
 * Authentication Types
 */

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface UserIntegration {
  userId: string;
  provider: 'github' | 'jira' | 'confluence';
  connected: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
  connectedAt?: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  integrations: UserIntegration[];
}

