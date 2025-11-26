import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/useI18n';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../utils/cn';
import { useRouteChangeIndicator } from './RouteChangeIndicator';

interface HeaderProps {
  className?: string;
}

/**
 * Homepage Header with sticky behavior and blur on scroll
 * Logo fallback policy:
 * 1. /brand/akis-logo-horizontal.png
 * 2. /brand/akis-logo.png
 * 3. src/assets/branding/akis-logo.svg (if exists)
 */
export default function Header({ className }: HeaderProps) {
  const { t, locale, setLocale } = useI18n();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isNavigating = useRouteChangeIndicator();
  const isAuthenticated = Boolean(user);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 24);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Logo fallback logic
  const getLogoSource = () => {
    // Try horizontal logo first
    const horizontalPng = '/brand/akis-logo-horizontal.png';
    return horizontalPng; // We'll handle fallback via onError
  };

  const handleLogoError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.src.includes('akis-logo-horizontal.png')) {
      img.src = '/brand/akis-logo.png';
    } else if (img.src.includes('akis-logo.png')) {
      // Final fallback - hide or use text
      img.style.display = 'none';
    }
  };

  const handleGetStarted = () => {
    navigate('/signup');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleGoDashboard = () => {
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        scrolled
          ? 'bg-[var(--bg)]/80 backdrop-blur-xl border-b border-[var(--glass-bdr)]'
          : 'bg-transparent',
        className
      )}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img
            src={getLogoSource()}
            alt="AKIS Platform"
            width={140}
            height={40}
            className={cn(
              'h-10 w-auto transition-transform duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
              isNavigating && !prefersReducedMotion && 'rotate-[360deg]'
            )}
            onError={handleLogoError}
            loading="eager"
            style={{
              transform: isNavigating && !prefersReducedMotion ? 'rotate(360deg)' : 'rotate(0deg)',
              willChange: isNavigating && !prefersReducedMotion ? 'transform' : 'auto',
            }}
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            to="/agents"
            className="text-sm font-medium text-[var(--text)]/70 transition-colors hover:text-[var(--accent)]"
          >
            {t('header.nav.products')}
          </Link>
          <Link
            to="/docs"
            className="text-sm font-medium text-[var(--text)]/70 transition-colors hover:text-[var(--accent)]"
          >
            {t('header.nav.docs')}
          </Link>
          <Link
            to="/pricing"
            className="text-sm font-medium text-[var(--text)]/70 transition-colors hover:text-[var(--accent)]"
          >
            {t('header.nav.pricing')}
          </Link>
          <Link
            to="/contact"
            className="text-sm font-medium text-[var(--text)]/70 transition-colors hover:text-[var(--accent)]"
          >
            {t('header.nav.contact')}
          </Link>
          <Link
            to="/about"
            className="text-sm font-medium text-[var(--text)]/70 transition-colors hover:text-[var(--accent)]"
          >
            {t('header.nav.about')}
          </Link>

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

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <button
                  onClick={handleGoDashboard}
                  className="rounded-full border border-transparent px-4 py-2 text-sm font-medium text-[var(--text)] transition-colors hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
                >
                  Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="rounded-full border border-[var(--glass-bdr)] bg-[var(--glass-top)] px-4 py-2 text-sm font-medium text-[var(--text)] transition-all hover:bg-[var(--glass-mid)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:opacity-60"
                >
                  {isLoggingOut ? 'Çıkış...' : 'Logout'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleLogin}
                  className="rounded-full border border-[var(--glass-bdr)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--text)] transition-all hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
                >
                  Login
                </button>
                <button
                  onClick={handleGetStarted}
                  className="rounded-[var(--radius-md)] bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-[var(--bg)] transition-all hover:shadow-[var(--shadow-glow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
                >
                  {t('header.cta')}
                </button>
              </>
            )}
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-3 md:hidden">
          <div className="flex items-center gap-1.5 rounded-full border border-[var(--glass-bdr)] bg-[var(--glass-top)] px-2 py-1">
            <button
              onClick={() => setLocale('en')}
              className={cn(
                'text-xs font-medium',
                locale === 'en' ? 'text-[var(--accent)]' : 'text-[var(--muted)]'
              )}
            >
              EN
            </button>
            <span className="text-[var(--muted)]">/</span>
            <button
              onClick={() => setLocale('tr')}
              className={cn(
                'text-xs font-medium',
                locale === 'tr' ? 'text-[var(--accent)]' : 'text-[var(--muted)]'
              )}
            >
              TR
            </button>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <button
                  onClick={handleGoDashboard}
                  className="rounded-full border border-[var(--glass-bdr)] bg-[var(--glass-top)] px-3 py-1.5 text-xs font-semibold text-[var(--text)]"
                >
                  Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-[var(--bg)] disabled:opacity-60"
                >
                  {isLoggingOut ? '...' : 'Logout'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleLogin}
                  className="rounded-full border border-[var(--glass-bdr)] bg-[var(--glass-top)] px-3 py-1.5 text-xs font-semibold text-[var(--text)]"
                >
                  Login
                </button>
                <button
                  onClick={handleGetStarted}
                  className="rounded-[var(--radius-md)] bg-[var(--accent)] px-4 py-2 text-xs font-medium text-[var(--bg)]"
                >
                  {t('header.cta')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}