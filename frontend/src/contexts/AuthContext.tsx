import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import { AuthAPI, type AuthUser } from '../services/api/auth';

type User = (AuthUser & { role: 'member' }) | null;

type AuthContextValue = {
  user: User;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  setUser: () => {},
});

const AUTH_REQUIRED_PREFIXES = ['/dashboard', '/agents'];

function requiresAuthResolve(pathname: string): boolean {
  return AUTH_REQUIRED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const mapUser = useCallback((payload: AuthUser): NonNullable<User> => {
    return {
      ...payload,
      role: 'member',
    };
  }, []);

  useEffect(() => {
    if (!requiresAuthResolve(location.pathname)) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    AuthAPI.me()
      .then((currentUser) => {
        if (active) {
          setUser(mapUser(currentUser));
        }
      })
      .catch(() => {
        if (active) {
          setUser(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [location.pathname, mapUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const nextUser = await AuthAPI.login({ email, password });
      setUser(mapUser(nextUser));
    },
    [mapUser]
  );

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      const nextUser = await AuthAPI.signup({ name, email, password });
      setUser(mapUser(nextUser));
    },
    [mapUser]
  );

  const logout = useCallback(async () => {
    await AuthAPI.logout();
    setUser(null);
  }, []);

  const setUserWrapped = useCallback((nextUser: AuthUser | null) => {
    setUser(nextUser ? mapUser(nextUser) : null);
  }, [mapUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login,
      signup,
      logout,
      setUser: setUserWrapped,
    }),
    [user, loading, login, signup, logout, setUserWrapped]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
