import React from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import Logo from '../branding/Logo';
import Button from './Button';
import { useAuth } from '../../auth/AuthContext';
import { cn } from '../../utils/cn';

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

const Header: React.FC = () => {
  const { session, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const handleLogout = React.useCallback(() => {
    logout();
    navigate('/');
  }, [logout, navigate]);

  return (
    <header className="sticky top-0 z-40 border-b border-ak-border bg-ak-bg">
      <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Logo size="default" />
        </div>

        <nav className="hidden items-center gap-3 text-sm font-medium md:flex">
          {primaryLinks.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'rounded-full px-4 py-2 transition-colors',
                  isActive
                    ? 'bg-ak-surface-2 text-ak-text-primary'
                    : 'text-ak-text-secondary hover:text-ak-primary'
                )
              }
            >
              {link.label}
            </NavLink>
          ))}

          {isAuthenticated ? (
            <>
              <Button as={Link} to="/dashboard" variant="ghost">
                Dashboard
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                Logout
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
        </nav>

        <div className="flex items-center gap-2 md:hidden">
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
          'md:hidden',
          mobileOpen ? 'block border-t border-ak-border bg-ak-bg' : 'hidden'
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
                      'rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-ak-surface-2 text-ak-text-primary'
                        : 'text-ak-text-secondary hover:bg-ak-surface hover:text-ak-primary'
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
                <Button variant="outline" onClick={handleLogout}>
                  Logout
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

          {session ? (
            <div className="rounded-xl border border-ak-border bg-ak-surface px-4 py-3 text-xs text-ak-text-secondary">
              Signed in as{' '}
              <span className="text-ak-text-primary">{session.displayName}</span>{' '}
              ({session.role})
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default Header;

