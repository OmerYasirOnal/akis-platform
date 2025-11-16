import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

type Role = 'admin' | 'member';

type ProtectedRouteProps = {
  children?: ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const { user, loading } = useAuth();
  const isAuthenticated = Boolean(user);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-ak-text-secondary">
        Yükleniyor...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
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
  const { user, loading } = useAuth();
  const isAuthenticated = Boolean(user);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-ak-text-secondary">
        Yükleniyor...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
          message: 'Devam etmek için oturum açmalısınız.',
        }}
      />
    );
  }

  const role = user.role ?? 'member';

  if (!roles.includes(role)) {
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
