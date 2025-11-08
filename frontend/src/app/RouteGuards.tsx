import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { Role } from '../state/auth/AuthContext';
import { useAuth } from '../state/auth/AuthContext';

const devLoginEnabled =
  String(import.meta.env.VITE_ENABLE_DEV_LOGIN ?? '').toLowerCase() === 'true';
const loginPath = devLoginEnabled ? '/auth/dev-login' : '/login';

type ProtectedRouteProps = {
  children?: ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const { status, isAuthenticated } = useAuth();

  if (status === 'loading') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-ak-text-secondary">
        Yükleniyor...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={loginPath}
        replace
        state={{
          from: location,
          message: 'Devam etmek için lütfen oturum aç.',
        }}
      />
    );
  }

  return children ? <>{children}</> : <Outlet />;
}

type RequireRoleProps = {
  roles: Role[];
  fallbackPath?: string;
  children?: ReactNode;
};

export function RequireRole({ roles, fallbackPath = '/dashboard', children }: RequireRoleProps) {
  const location = useLocation();
  const { status, user, isAuthenticated } = useAuth();

  if (status === 'loading') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-ak-text-secondary">
        Yükleniyor...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to={loginPath}
        replace
        state={{
          from: location,
          message: 'Devam etmek için oturum açmalısınız.',
        }}
      />
    );
  }

  if (!roles.includes(user.role)) {
    return (
      <Navigate
        to={fallbackPath}
        replace
        state={{
          from: location,
          message: 'Bu alan için gerekli yetkilere sahip değilsiniz.',
        }}
      />
    );
  }

  return children ? <>{children}</> : <Outlet />;
}

