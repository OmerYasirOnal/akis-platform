import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AuthAPI, type AuthUser } from '../services/api/auth';

type User = (AuthUser & { role: 'member' }) | null;

type AuthContextValue = {
  user: User;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  login: async () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  signup: async () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  const mapUser = useCallback((payload: AuthUser): NonNullable<User> => {
    return {
      ...payload,
      role: 'member',
    };
  }, []);

  useEffect(() => {
    let active = true;

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
  }, [mapUser]);

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

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login,
      signup,
      logout,
    }),
    [user, loading, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
