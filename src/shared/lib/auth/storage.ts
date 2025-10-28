/**
 * Client-side Auth Storage
 * NOT: Şimdilik localStorage kullanıyoruz, production'da database olacak
 */

import { User, UserIntegration } from '@/shared/types/auth';

const STORAGE_KEYS = {
  USER: 'devagents_user',
  INTEGRATIONS: 'devagents_integrations',
};

export const AuthStorage = {
  // User operations
  getUser(): User | null {
    if (typeof window === 'undefined') return null;
    
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    if (!userStr) return null;
    
    try {
      const user = JSON.parse(userStr);
      user.createdAt = new Date(user.createdAt);
      return user;
    } catch {
      return null;
    }
  },

  setUser(user: User): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  removeUser(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  // Integration operations
  getIntegrations(userId: string): UserIntegration[] {
    if (typeof window === 'undefined') return [];
    
    const integrationsStr = localStorage.getItem(STORAGE_KEYS.INTEGRATIONS);
    if (!integrationsStr) return [];
    
    try {
      const allIntegrations: UserIntegration[] = JSON.parse(integrationsStr);
      return allIntegrations.filter(int => int.userId === userId);
    } catch {
      return [];
    }
  },

  addIntegration(integration: UserIntegration): void {
    if (typeof window === 'undefined') return;
    
    const existingIntegrations = this.getAllIntegrations();
    
    // Aynı user + provider varsa güncelle
    const index = existingIntegrations.findIndex(
      int => int.userId === integration.userId && int.provider === integration.provider
    );
    
    if (index >= 0) {
      existingIntegrations[index] = integration;
    } else {
      existingIntegrations.push(integration);
    }
    
    localStorage.setItem(STORAGE_KEYS.INTEGRATIONS, JSON.stringify(existingIntegrations));
  },

  removeIntegration(userId: string, provider: string): void {
    if (typeof window === 'undefined') return;
    
    const existingIntegrations = this.getAllIntegrations();
    const filtered = existingIntegrations.filter(
      int => !(int.userId === userId && int.provider === provider)
    );
    
    localStorage.setItem(STORAGE_KEYS.INTEGRATIONS, JSON.stringify(filtered));
  },

  getAllIntegrations(): UserIntegration[] {
    if (typeof window === 'undefined') return [];
    
    const integrationsStr = localStorage.getItem(STORAGE_KEYS.INTEGRATIONS);
    if (!integrationsStr) return [];
    
    try {
      return JSON.parse(integrationsStr);
    } catch {
      return [];
    }
  },

  clearAll(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.INTEGRATIONS);
  },
};

