import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/cn';
import Button from '../common/Button';
import DashboardSidebar from './DashboardSidebar';
import LiquidNeonBackground from '../backgrounds/LiquidNeonBackground';
import Logo from '../branding/Logo';

// Menu icon
const MenuIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

// Close icon
const CloseIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

/**
 * Dashboard Layout (Cursor-inspired)
 * 
 * Features:
 * - Fixed left sidebar with grouped navigation (desktop)
 * - Mobile slide-over drawer
 * - Optional Liquid Neon background
 * - Top header with user actions
 * - Card-based content area
 */
export function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const isMountedRef = useRef(true);

  // Check reduced motion preference
  useEffect(() => {
    const stored = localStorage.getItem('akis-reduced-motion');
    if (stored !== null) {
      setReducedMotion(stored === 'true');
    } else {
      setReducedMotion(
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      );
    }
  }, []);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/');
    } finally {
      if (isMountedRef.current) {
        setIsLoggingOut(false);
      }
    }
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="relative flex min-h-screen bg-ak-bg text-ak-text-primary">
      {/* Liquid Neon Background (optional, subtle) */}
      <LiquidNeonBackground
        enabled={!reducedMotion}
        intensity="subtle"
        respectReducedMotion={true}
      />

      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-ak-border bg-ak-surface/95 backdrop-blur-sm lg:block">
        <DashboardSidebar
          userEmail={user?.email}
          workspaceName={user?.name || 'AKIS Workspace'}
        />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-ak-bg/80 backdrop-blur-sm lg:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 transform border-r border-ak-border bg-ak-surface transition-transform duration-slow lg:hidden',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <DashboardSidebar
          userEmail={user?.email}
          workspaceName={user?.name || 'AKIS Workspace'}
          onNavClick={closeMobileMenu}
        />
        {/* Close button */}
        <button
          className="absolute right-4 top-4 rounded-lg p-2 text-ak-text-secondary hover:bg-ak-surface-2 hover:text-ak-text-primary"
          onClick={closeMobileMenu}
          aria-label="Close menu"
        >
          <CloseIcon />
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col lg:pl-72">
        {/* Top Header */}
        <header className="sticky top-0 z-20 border-b border-ak-border bg-ak-bg/80 backdrop-blur-backdrop">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Mobile menu button + Logo */}
            <div className="flex items-center gap-4 lg:hidden">
              <button
                className="rounded-lg p-2 text-ak-text-secondary hover:bg-ak-surface hover:text-ak-text-primary"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <MenuIcon />
              </button>
              <Logo size="nav" />
            </div>

            {/* Desktop: Empty left side */}
            <div className="hidden lg:block" />

            {/* Right side: User actions */}
            <div className="flex items-center gap-3">
              {/* User info */}
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-ak-text-primary">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-ak-text-secondary">{user?.email}</p>
              </div>

              {/* Logout button */}
              <Button
                variant="outline"
                size="md"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
