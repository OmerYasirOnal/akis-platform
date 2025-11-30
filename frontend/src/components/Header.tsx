import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/useI18n';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../utils/cn';
import Button from './common/Button';

interface HeaderProps {
  className?: string;
}

/**
 * Main Header with Navigation
 * Frosted glass effect on scroll with smooth transitions
 * Includes mobile drawer pattern
 */
export default function Header({ className }: HeaderProps) {
  const { t, locale, setLocale } = useI18n();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isAuthenticated = Boolean(user);

  // Track scroll for frosted glass effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 24);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const closeMobileMenu = () => setMobileOpen(false);

  // Navigation links
  const primaryLinks = [
    { to: '/agents', label: t('header.nav.products') },
    { to: '/docs', label: t('header.nav.docs') },
    { to: '/pricing', label: t('header.nav.pricing') },
    { to: '/contact', label: t('header.nav.contact') },
    { to: '/about', label: t('header.nav.about') },
  ];

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        scrolled
          ? 'border-b border-[var(--glass-bdr)] bg-[var(--bg)]/80 backdrop-blur-xl'
          : 'bg-transparent',
        className
      )}
    >
      <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img
            src="/brand/akis-logo-horizontal.png"
            alt="AKIS Platform"
            className="h-7 w-auto object-contain"
            onError={(e) => {
              const img = e.currentTarget;
              if (img.src.includes('akis-logo-horizontal.png')) {
                img.src = '/brand/akis-logo.png';
              }
            }}
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-3 text-sm font-medium md:flex">
          {primaryLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'rounded-full px-4 py-2 transition-colors duration-200',
                  isActive
                    ? 'bg-[var(--glass-top)] text-[var(--text)]'
                    : 'text-[var(--muted)] hover:text-[var(--accent)]'
                )
              }
            >
              {link.label}
            </NavLink>
          ))}

          {/* Locale Switcher */}
          <div className="flex items-center gap-2 rounded-full border border-[var(--glass-bdr)] bg-[var(--glass-top)] px-3 py-1.5">
            <button
              onClick={() => setLocale('en')}
              className={cn(
                'text-xs font-medium transition-colors',
                locale === 'en'
                  ? 'text-[var(--accent)]'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              )}
              aria-label="Switch to English"
            >
              EN
            </button>
            <span className="text-[var(--muted)]">/</span>
            <button
              onClick={() => setLocale('tr')}
              className={cn(
                'text-xs font-medium transition-colors',
                locale === 'tr'
                  ? 'text-[var(--accent)]'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              )}
              aria-label="Switch to Turkish"
            >
              TR
            </button>
          </div>
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <Button as={Link} to="/dashboard" variant="ghost">
                Dashboard
              </Button>
              <Button
                onClick={handleLogout}
                disabled={isLoggingOut}
                variant="outline"
              >
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </Button>
            </>
          ) : (
            <>
              <Button as={Link} to="/login" variant="outline">
                Login
              </Button>
              <Button as={Link} to="/signup" variant="primary">
                {t('header.cta')}
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="secondary"
          size="md"
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation"
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
        >
          {mobileOpen ? 'Close' : 'Menu'}
        </Button>
      </div>

      {/* Mobile Navigation Drawer */}
      <div
        id="mobile-nav"
        className={cn(
          'md:hidden',
          mobileOpen
            ? 'block border-t border-[var(--glass-bdr)] bg-[var(--bg)]/95 backdrop-blur-xl'
            : 'hidden'
        )}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6">
          {/* Navigation Links */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]/70">
              Navigation
            </span>
            {primaryLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  cn(
                    'rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[var(--glass-top)] text-[var(--text)]'
                      : 'text-[var(--muted)] hover:bg-[var(--glass-mid)] hover:text-[var(--accent)]'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Locale Switcher (Mobile) */}
          <div className="flex items-center gap-3 px-4 py-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]/70">
              Language
            </span>
            <div className="flex items-center gap-2 rounded-full border border-[var(--glass-bdr)] bg-[var(--glass-top)] px-3 py-1.5">
              <button
                onClick={() => setLocale('en')}
                className={cn(
                  'text-xs font-medium transition-colors',
                  locale === 'en'
                    ? 'text-[var(--accent)]'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                )}
              >
                EN
              </button>
              <span className="text-[var(--muted)]">/</span>
              <button
                onClick={() => setLocale('tr')}
                className={cn(
                  'text-xs font-medium transition-colors',
                  locale === 'tr'
                    ? 'text-[var(--accent)]'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                )}
              >
                TR
              </button>
            </div>
          </div>

          {/* Auth Buttons (Mobile) */}
          <div className="flex flex-col gap-3 border-t border-[var(--glass-bdr)] pt-4">
            {isAuthenticated ? (
              <>
                <Button as={Link} to="/dashboard" variant="outline" onClick={closeMobileMenu}>
                  Dashboard
                </Button>
                <Button
                  onClick={() => {
                    handleLogout();
                    closeMobileMenu();
                  }}
                  disabled={isLoggingOut}
                  variant="secondary"
                >
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </Button>
              </>
            ) : (
              <>
                <Button as={Link} to="/login" variant="outline" onClick={closeMobileMenu}>
                  Login
                </Button>
                <Button as={Link} to="/signup" variant="primary" onClick={closeMobileMenu}>
                  {t('header.cta')}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
