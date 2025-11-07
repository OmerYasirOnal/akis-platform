import React from 'react';

const AUTH_STORAGE_KEY = 'akis-auth-token';

type AuthContextValue = {
  isAuthenticated: boolean;
  login: (token?: string) => void;
  logout: () => void;
};

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return Boolean(window.localStorage.getItem(AUTH_STORAGE_KEY));
  });

  const login = React.useCallback((token: string = 'placeholder-token') => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(AUTH_STORAGE_KEY, token);
    setIsAuthenticated(true);
  }, []);

  const logout = React.useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    setIsAuthenticated(false);
  }, []);

  const value = React.useMemo(
    () => ({
      isAuthenticated,
      login,
      logout,
    }),
    [isAuthenticated, login, logout]
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

/**
 * TODO(auth): Gerçek OAuth entegrasyonu tamamlandığında AuthContext,
 * token yenileme ve kullanıcı bilgilerini de idare edecek şekilde genişletilecektir.
 */

