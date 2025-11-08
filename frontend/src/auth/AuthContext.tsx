import React from 'react';

export type Role = 'admin' | 'member';

type AuthSession = {
  token: string;
  email: string;
  role: Role;
  displayName?: string;
};

type AuthResult =
  | { success: true; session: AuthSession }
  | { success: false; message: string };

type SignupPayload = {
  email: string;
  name: string;
  password: string;
};

type AuthContextValue = {
  session: AuthSession | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (payload: SignupPayload) => Promise<AuthSession>;
  logout: () => void;
};

const AUTH_STORAGE_KEY = 'akis-auth-state';

const DEMO_USERS: Record<
  string,
  {
    password: string;
    role: Role;
    displayName: string;
  }
> = {
  'admin@example.com': {
    password: 'admin123',
    role: 'admin',
    displayName: 'AKIS Admin',
  },
  'user@example.com': {
    password: 'user123',
    role: 'member',
    displayName: 'AKIS Member',
  },
};

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

const parseStoredSession = (): AuthSession | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AuthSession;
    if (parsed?.email && parsed?.role && parsed?.token) {
      return parsed;
    }
  } catch {
    // ignore parse errors
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  return null;
};

const persistSession = (session: AuthSession | null) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (session) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  } else {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = React.useState<AuthSession | null>(
    () => parseStoredSession()
  );

  React.useEffect(() => {
    persistSession(session);
  }, [session]);

  const login = React.useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const normalizedEmail = email.trim().toLowerCase();
      const record = DEMO_USERS[normalizedEmail];

      await new Promise((resolve) => setTimeout(resolve, 250));

      if (!record || record.password !== password.trim()) {
        return {
          success: false,
          message: 'Invalid email or password.',
        };
      }

      const nextSession: AuthSession = {
        token: `demo-${record.role}-${Date.now()}`,
        email: normalizedEmail,
        role: record.role,
        displayName: record.displayName,
      };

      setSession(nextSession);
      return { success: true, session: nextSession };
    },
    []
  );

  const signup = React.useCallback(
    async ({ email, name }: SignupPayload): Promise<AuthSession> => {
      const normalizedEmail = email.trim().toLowerCase();
      await new Promise((resolve) => setTimeout(resolve, 300));

      const nextSession: AuthSession = {
        token: `demo-member-${Date.now()}`,
        email: normalizedEmail,
        role: 'member',
        displayName: name.trim() || 'New Member',
      };

      setSession(nextSession);
      return nextSession;
    },
    []
  );

  const logout = React.useCallback(() => {
    setSession(null);
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      login,
      signup,
      logout,
    }),
    [session, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

