import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import type { Role } from './AuthContext';
import { useAuth } from './AuthContext';

type RequireRoleProps = {
  roles: Role[];
  fallbackPath?: string;
  children?: React.ReactNode;
};

export default function RequireRole({
  roles,
  fallbackPath = '/dashboard',
  children,
}: RequireRoleProps) {
  const { session } = useAuth();
  const location = useLocation();

  if (!session) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
          message: 'Please sign in to continue',
        }}
      />
    );
  }

  if (!roles.includes(session.role)) {
    return (
      <Navigate
        to={fallbackPath}
        replace
        state={{
          from: location,
          message: 'Access requires elevated permissions',
        }}
      />
    );
  }

  if (children) {
    return <>{children}</>;
  }

  return <Outlet />;
}

