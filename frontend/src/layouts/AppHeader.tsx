import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { useScreenshotMode } from '../hooks/useScreenshotMode';
import Logo from '../components/branding/Logo';
import Button from '../components/common/Button';
import ThemeToggle from '../components/ThemeToggle';
import { cn } from '../utils/cn';

const primaryLinks = [
  { label: 'Platform', to: '/platform' },
  { label: 'Agents', to: '/agents' },
  { label: 'Integrations', to: '/integrations' },
  { label: 'Solutions', to: '/solutions' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Docs', to: '/docs' },
  { label: 'Changelog', to: '/changelog' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

const AppHeader = () => {
  const { user, logout } = useAuth();
  const shotMode = useScreenshotMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isMountedRef = useRef(true);
  const isAuthenticated = Boolean(user);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/');
    } finally {
      if (isMountedRef.current) {
        setIsLoggingOut(false);
      }
    }
  }, [logout, navigate]);

  return (
    <header className="sticky top-0 z-40 border-b border-ak-border bg-ak-bg/95 backdrop-blur supports-[backdrop-filter]:bg-ak-bg/75">
      <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Logo size="nav" />
        </div>

        <div className="hidden items-center gap-6 md:flex">
          <nav className="flex items-center gap-3 text-sm font-medium">
            {primaryLinks.map((link) => (
              <NavLink
                key={link.label}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    "rounded-full px-4 py-2 transition-colors",
                    isActive
                      ? "bg-ak-surface-2 text-ak-text-primary"
                      : "text-ak-text-secondary hover:text-ak-primary"
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                <Button as={Link} to="/dashboard" variant="ghost">
                  Dashboard
                </Button>
                {user ? (
                  <span className="rounded-full border border-ak-border bg-ak-surface-2 px-3 py-1 text-xs text-ak-text-secondary">
                    {shotMode ? 'user@example.com' : user.email}
                  </span>
                ) : null}
                <Button variant="outline" onClick={handleLogout} disabled={isLoggingOut}>
                  {isLoggingOut ? 'Çıkış yapılıyor...' : 'Logout'}
                </Button>
              </>
            ) : (
              <>
                <Button as={Link} to="/login" variant="outline">
                  Login
                </Button>
                <Button as={Link} to="/signup">
                  Sign up
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle size="sm" />
          <Button
            variant="secondary"
            size="md"
            onClick={() => setMobileOpen((state) => !state)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
          >
            Menu
          </Button>
        </div>
      </div>

      <div
        id="mobile-nav"
        className={cn(
          "md:hidden",
          mobileOpen ? "block border-t border-ak-border bg-ak-bg" : "hidden"
        )}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ak-text-secondary/70">
              Navigation
            </span>
            <div className="flex flex-col gap-2">
              {primaryLinks.map((link) => (
                <NavLink
                  key={link.label}
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      "rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-ak-surface-2 text-ak-text-primary"
                        : "text-ak-text-secondary hover:bg-ak-surface hover:text-ak-primary"
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </div>

            {isAuthenticated ? (
              <>
                <Button as={Link} to="/dashboard" variant="secondary">
                  Dashboard
                </Button>
                <Button variant="outline" onClick={handleLogout} disabled={isLoggingOut}>
                  {isLoggingOut ? 'Çıkış yapılıyor...' : 'Logout'}
                </Button>
              </>
            ) : (
              <>
                <Button as={Link} to="/login" variant="outline">
                  Login
                </Button>
                <Button as={Link} to="/signup">
                  Sign up
                </Button>
              </>
            )}
          </div>

          {user ? (
            <div className="rounded-xl border border-ak-border bg-ak-surface px-4 py-3 text-xs text-ak-text-secondary">
              Signed in as <span className="text-ak-text-primary">{shotMode ? 'user@example.com' : user.email}</span>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;

