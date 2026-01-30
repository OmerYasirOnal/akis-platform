import { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/cn';
import DashboardSidebar from './DashboardSidebar';
import { ProfileMenu } from './ProfileMenu';
import { RunBar } from './RunBar';
import Logo from '../branding/Logo';

const MenuIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

const CloseIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export function DashboardLayout() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  useEffect(() => {
    setMobileMenuOpen(false);
  }, []);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="relative flex min-h-screen bg-ak-bg text-ak-text-primary">
      <LiquidNeonBackground
        enabled={!reducedMotion}
        intensity="subtle"
        respectReducedMotion={true}
      />

      {/* Desktop Sidebar - no border, use shadow for separation */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-ak-surface/80 backdrop-blur-sm shadow-[1px_0_0_0_rgba(26,38,44,0.5)] lg:block">
        <DashboardSidebar
          workspaceName={user?.name || 'AKIS Workspace'}
        />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200 lg:hidden',
          mobileMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={closeMobileMenu}
        aria-hidden="true"
      />

      {/* Mobile Sidebar Drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform bg-ak-surface shadow-ak-elevation-3 transition-transform duration-300 lg:hidden',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <DashboardSidebar
          workspaceName={user?.name || 'AKIS Workspace'}
          onNavClick={closeMobileMenu}
        />
        <button
          className="absolute right-3 top-4 rounded-lg p-2 text-ak-text-secondary hover:bg-ak-surface-2 hover:text-ak-text-primary"
          onClick={closeMobileMenu}
          aria-label="Close menu"
        >
          <CloseIcon />
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Top Header - subtle, no heavy border */}
        <header className="sticky top-0 z-20 bg-ak-bg/70 backdrop-blur-backdrop">
          <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Mobile menu button + Logo */}
            <div className="flex items-center gap-4 lg:hidden">
              <button
                className="rounded-lg p-1.5 text-ak-text-secondary hover:bg-ak-surface hover:text-ak-text-primary"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <MenuIcon />
              </button>
              <Logo size="nav" />
            </div>

            <div className="hidden lg:block" />

            {/* Right: Agents link + Profile */}
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-ak-text-primary">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-ak-text-secondary">{user?.email}</p>
              </div>

              <Button
                variant="ghost"
                size="md"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                </svg>
                Agents
              </Link>
              <ProfileMenu />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 pb-16 sm:p-6 sm:pb-16 lg:p-8 lg:pb-16">
          <Outlet />
        </main>
      </div>

      <RunBar />
    </div>
  );
}

export default DashboardLayout;
