'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, UserIntegration, AuthState } from '@/shared/types/auth';
import { AuthStorage } from "@/shared/lib/auth/storage";

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  refreshIntegrations: () => void;
  addIntegration: (integration: UserIntegration) => void;
  removeIntegration: (provider: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [integrations, setIntegrations] = useState<UserIntegration[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user on mount
  useEffect(() => {
    const savedUser = AuthStorage.getUser();
    if (savedUser) {
      setUser(savedUser);
      setIsAuthenticated(true);
      
      const userIntegrations = AuthStorage.getIntegrations(savedUser.id);
      console.log('AuthContext: Loading integrations on mount:', userIntegrations);
      setIntegrations(userIntegrations);
    }
  }, []);

  // Re-load integrations when user changes
  useEffect(() => {
    if (user) {
      const userIntegrations = AuthStorage.getIntegrations(user.id);
      console.log('AuthContext: Reloading integrations for user:', user.id, userIntegrations);
      setIntegrations(userIntegrations);
    }
  }, [user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    // TODO: Production'da API çağrısı olacak
    // Şimdilik basit mock
    
    // Demo user
    if (email === 'demo@devagents.com' && password === 'demo123') {
      const demoUser: User = {
        id: 'demo-user-1',
        email: 'demo@devagents.com',
        name: 'Demo User',
        createdAt: new Date(),
      };
      
      AuthStorage.setUser(demoUser);
      setUser(demoUser);
      setIsAuthenticated(true);
      
      const userIntegrations = AuthStorage.getIntegrations(demoUser.id);
      setIntegrations(userIntegrations);
      
      return true;
    }
    
    // Kayıtlı kullanıcıları kontrol et (localStorage'dan)
    // Bu kısım production'da database olacak
    return false;
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    // TODO: Production'da API çağrısı olacak
    
    const newUser: User = {
      id: `user-${Date.now()}`,
      email,
      name,
      createdAt: new Date(),
    };
    
    AuthStorage.setUser(newUser);
    setUser(newUser);
    setIsAuthenticated(true);
    setIntegrations([]);
    
    return true;
  };

  const logout = () => {
    AuthStorage.removeUser();
    setUser(null);
    setIsAuthenticated(false);
    setIntegrations([]);
  };

  const refreshIntegrations = useCallback(() => {
    if (!user) return;
    const userIntegrations = AuthStorage.getIntegrations(user.id);
    setIntegrations(userIntegrations);
  }, [user]);

  const addIntegration = useCallback((integration: UserIntegration) => {
    if (!user) return;
    AuthStorage.addIntegration({ ...integration, userId: user.id });
    const userIntegrations = AuthStorage.getIntegrations(user.id);
    setIntegrations(userIntegrations);
  }, [user]);

  const removeIntegration = useCallback((provider: string) => {
    if (!user) return;
    AuthStorage.removeIntegration(user.id, provider);
    const userIntegrations = AuthStorage.getIntegrations(user.id);
    setIntegrations(userIntegrations);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        integrations,
        login,
        logout,
        register,
        refreshIntegrations,
        addIntegration,
        removeIntegration,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

