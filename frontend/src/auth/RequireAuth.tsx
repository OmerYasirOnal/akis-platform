import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

type RequireAuthProps = {
  children?: React.ReactNode;
};

export default function RequireAuth({ children }: RequireAuthProps) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
          message: 'Bu AKIS alanı korumalı — devam etmek için lütfen giriş yap.',
        }}
      />
    );
  }

  if (children) {
    return <>{children}</>;
  }

  return <Outlet />;
}

/**
 * TODO(auth): Gerçek yetkilendirme eklendiğinde bu bekçi,
 * token doğrulama ve rol tabanlı kontrollerle güncellenecek.
 */

