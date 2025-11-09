import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { authApi } from '../../services/api/auth';
import type { ApiError } from '../../services/api/HttpClient';

export type Role = 'admin' | 'member';

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
};

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
  loginWithDevEmail: (email: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  devLoginEnabled: boolean;
};

const devLoginEnabled =
  String(import.meta.env.VITE_ENABLE_DEV_LOGIN ?? '').toLowerCase() === 'true';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const mapUser = (user: { id: string; email: string }): AuthUser => ({
  id: user.id,
  email: user.email,
  role: 'member',
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const isMountedRef = useRef(true);
  const hydrationPromiseRef = useRef<Promise<void> | null>(null);
  const initialHydrationRef = useRef(false);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const applyState = useCallback((nextUser: AuthUser | null, nextStatus: AuthStatus) => {
    if (!isMountedRef.current) {
      return;
    }

    setUser(nextUser);
    setStatus(nextStatus);
  }, []);

  const refresh = useCallback(async () => {
    if (hydrationPromiseRef.current) {
      await hydrationPromiseRef.current;
      return;
    }

    const hydrate = (async () => {
      setStatus('loading');

      try {
        const response = await authApi.me();
        if (response.user) {
          applyState(mapUser(response.user), 'authenticated');
        } else {
          applyState(null, 'unauthenticated');
        }
      } catch (error) {
        const apiError = error as Partial<ApiError> | undefined;
        if (apiError?.statusCode === 401 || apiError?.statusCode === 403) {
          applyState(null, 'unauthenticated');
          return;
        }

        console.error('Failed to hydrate auth state', error);
        applyState(null, 'unauthenticated');
      }
    })();

    hydrationPromiseRef.current = hydrate;

    try {
      await hydrate;
    } finally {
      hydrationPromiseRef.current = null;
    }
  }, [applyState]);

  useEffect(() => {
    if (initialHydrationRef.current) {
      return;
    }

    initialHydrationRef.current = true;
    void refresh();
  }, [refresh]);

  const loginWithDevEmail = useCallback(
    async (email: string) => {
      if (!devLoginEnabled) {
        throw new Error('Developer login is disabled.');
      }

      const response = await authApi.devLogin(email);
      const nextUser = mapUser(response.user);
      applyState(nextUser, 'authenticated');
      return nextUser;
    },
    [applyState]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      applyState(null, 'unauthenticated');
    }
  }, [applyState]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      isLoading: status === 'loading',
      isAuthenticated: status === 'authenticated' && Boolean(user),
      refresh,
      loginWithDevEmail,
      logout,
      devLoginEnabled,
    }),
    [status, user, refresh, loginWithDevEmail, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

