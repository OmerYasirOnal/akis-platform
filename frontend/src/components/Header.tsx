import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/useI18n';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../theme/useTheme';
import { cn } from '../utils/cn';
import Button from './common/Button';
import Logo from './branding/Logo';

// Theme toggle icon component
function ThemeToggleIcon({ isDark }: { isDark: boolean }) {
  return isDark ? (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  ) : (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  );
}

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
  const { isDark, toggleTheme } = useTheme();
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

  // Navigation links — pipeline-focused (scope-out pages removed)
  const primaryLinks = [
    { to: '/pipeline', label: 'Pipeline' },
    { to: '/docs', label: t('header.nav.docs') },
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
        <Logo size="nav" />

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

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center rounded-full border border-[var(--glass-bdr)] bg-[var(--glass-top)] p-2 text-[var(--muted)] transition-colors hover:text-[var(--accent)]"
            aria-label={isDark ? t('header.theme.light') : t('header.theme.dark')}
          >
            <ThemeToggleIcon isDark={isDark} />
          </button>
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <Button as={Link} to="/pipeline" variant="ghost">
                Pipeline
              </Button>
              <Button
                onClick={handleLogout}
                disabled={isLoggingOut}
                variant="outline"
              >
                {isLoggingOut ? t('header.loggingOut') : t('header.logout')}
              </Button>
            </>
          ) : (
            <Button as={Link} to="/login" variant="outline">
              {t('header.login')}
            </Button>
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
          {mobileOpen ? t('header.close') : t('header.menu')}
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
              {t('header.navigation')}
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

          {/* Locale & Theme Switcher (Mobile) */}
          <div className="flex items-center justify-between gap-3 px-4 py-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]/70">
                {t('header.language')}
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

            {/* Theme Toggle (Mobile) */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center rounded-full border border-[var(--glass-bdr)] bg-[var(--glass-top)] p-2 text-[var(--muted)] transition-colors hover:text-[var(--accent)]"
              aria-label={isDark ? t('header.theme.light') : t('header.theme.dark')}
            >
              <ThemeToggleIcon isDark={isDark} />
            </button>
          </div>

          {/* Auth Buttons (Mobile) */}
          <div className="flex flex-col gap-3 border-t border-[var(--glass-bdr)] pt-4">
            {isAuthenticated ? (
              <>
                <Button as={Link} to="/pipeline" variant="outline" onClick={closeMobileMenu}>
                  Pipeline
                </Button>
                <Button
                  onClick={() => {
                    handleLogout();
                    closeMobileMenu();
                  }}
                  disabled={isLoggingOut}
                  variant="secondary"
                >
                  {isLoggingOut ? t('header.loggingOut') : t('header.logout')}
                </Button>
              </>
            ) : (
              <Button as={Link} to="/login" variant="outline" onClick={closeMobileMenu}>
                {t('header.login')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
