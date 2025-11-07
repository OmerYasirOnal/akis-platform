import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from '../branding/Logo';
import Button from './Button';
import { useAuth } from '../../auth/AuthContext';
import { cn } from '../../utils/cn';

const productLinks = [
  { label: 'Scribe', hash: '#scribe' },
  { label: 'Trace', hash: '#trace' },
  { label: 'Proto', hash: '#proto' },
];

const Header: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [productsOpen, setProductsOpen] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    setProductsOpen(false);
    setMobileOpen(false);
  }, [location]);

  const handleLogout = React.useCallback(() => {
    logout();
    navigate('/');
  }, [logout, navigate]);

  return (
    <header className="sticky top-0 z-40 border-b border-ak-border/80 bg-ak-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Logo size="default" />
        </div>

        <nav className="hidden items-center gap-2 text-sm font-medium text-ak-text-secondary md:flex">
          <div className="relative">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-ak-text-primary transition-colors hover:text-ak-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ak-primary"
              onClick={() => setProductsOpen((state) => !state)}
              aria-expanded={productsOpen}
              aria-haspopup="true"
            >
              Products
              <svg
                className={cn(
                  'h-3 w-3 transition-transform duration-150',
                  productsOpen ? 'rotate-180' : 'rotate-0'
                )}
                viewBox="0 0 12 12"
                aria-hidden="true"
              >
                <path
                  d="M2.2 4.5 6 8.3l3.8-3.8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </button>
            {productsOpen ? (
              <div className="absolute right-0 mt-2 w-44 rounded-2xl border border-ak-border/70 bg-ak-surface/95 p-3 shadow-lg">
                <ul className="flex flex-col gap-1">
                  {productLinks.map((product) => (
                    <li key={product.hash}>
                      <Link
                        to={{ pathname: '/', hash: product.hash }}
                        className="block rounded-xl px-3 py-2 text-sm text-ak-text-primary transition-colors hover:bg-ak-surface-2 hover:text-ak-primary"
                      >
                        {product.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <span
            className="rounded-full px-4 py-2 text-ak-text-secondary/70"
            aria-disabled
            title="Yakında yayında"
          >
            Docs
          </span>

          <Link
            to={{ pathname: '/', hash: '#pricing' }}
            className="rounded-full px-4 py-2 text-ak-text-secondary transition-colors hover:text-ak-primary"
          >
            Pricing
          </Link>

          {isAuthenticated ? (
            <>
              <Button as={Link} to="/jobs" variant="ghost">
                Jobs
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
          mobileOpen ? 'block border-t border-ak-border/80 bg-ak-bg/95' : 'hidden'
        )}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ak-text-secondary/70">
              Products
            </span>
            <div className="flex flex-col gap-2">
              {productLinks.map((product) => (
                <Link
                  key={product.hash}
                  to={{ pathname: '/', hash: product.hash }}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-ak-text-primary transition-colors hover:bg-ak-surface-2 hover:text-ak-primary"
                >
                  {product.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ak-text-secondary/70">
              Learn
            </span>
            <span
              className="rounded-xl px-4 py-3 text-sm text-ak-text-secondary/70"
              aria-disabled
              title="Yakında yayında"
            >
              Docs
            </span>
            <Link
              to={{ pathname: '/', hash: '#pricing' }}
              className="rounded-xl px-4 py-3 text-sm font-medium text-ak-text-primary transition-colors hover:bg-ak-surface-2 hover:text-ak-primary"
            >
              Pricing
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            {isAuthenticated ? (
              <>
                <Button as={Link} to="/jobs" variant="secondary">
                  Jobs
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
        </div>
      </div>
    </header>
  );
};

export default Header;

