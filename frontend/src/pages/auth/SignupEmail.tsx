import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Logo from '../../components/branding/Logo';
import { useI18n } from '../../i18n/useI18n';

/**
 * Get the base URL for OAuth redirects.
 * OAuth endpoints are at /auth/oauth/:provider (no /api prefix).
 * In production, we use same origin. In development, backend may be on different port.
 */
function getOAuthBaseUrl(): string {
  // VITE_BACKEND_URL is the explicit backend origin (e.g., http://localhost:3000)
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  // In production/staging, frontend and backend share the same origin
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  // Fallback for development
  return 'http://localhost:3000';
}

export default function SignupEmail() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const { AuthAPI } = await import('../../services/api/auth');
      const response = await AuthAPI.signupStart({
        firstName,
        lastName,
        email,
      });

      // Store signup data for next step
      sessionStorage.setItem(
        'akis_signup_data',
        JSON.stringify({
          userId: response.userId,
          firstName,
          lastName,
          email: response.email,
        })
      );

      // Navigate to password step
      navigate('/signup/password');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unable to create account. Please try again.';
      
      // Try to parse error JSON for better messages
      try {
        const errorData = JSON.parse(errorMessage);
        setError(errorData.error || errorData.message || errorMessage);
      } catch {
        setError(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleOAuthSignup(provider: 'github' | 'google') {
    // Full-page redirect to backend OAuth endpoint
    // Same endpoints used for both login and signup - backend handles user creation
    // OAuth routes are at /auth/oauth/:provider (no /api prefix)
    window.location.href = `${getOAuthBaseUrl()}/auth/oauth/${provider}`;
  }

  return (
    <main className="min-h-screen bg-ak-bg text-ak-text-primary flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-ak-surface-2 border border-ak-border rounded-2xl p-8 shadow-ak-md">
        <div className="mb-6 flex justify-center">
          <Logo size="sm" linkToHome={false} />
        </div>

        <h1 className="text-h2 mb-2">{t('auth.signup.title')}</h1>
        <p className="text-sm text-ak-text-secondary mb-6">
          {t('auth.signup.subtitle')}
        </p>

        {/* OAuth Buttons */}
        <div className="space-y-3 mb-6">
          <button
            type="button"
            onClick={() => handleOAuthSignup('google')}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-ak-border rounded-xl bg-ak-surface hover:bg-ak-surface-2 text-ak-text-primary transition-colors disabled:opacity-60"
            aria-label={t('auth.oauth.google')}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="font-medium">{t('auth.oauth.google')}</span>
          </button>

          <button
            type="button"
            onClick={() => handleOAuthSignup('github')}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-ak-border rounded-xl bg-ak-surface hover:bg-ak-surface-2 text-ak-text-primary transition-colors disabled:opacity-60"
            aria-label={t('auth.oauth.github')}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            <span className="font-medium">{t('auth.oauth.github')}</span>
          </button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-ak-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-ak-surface-2 text-ak-text-secondary">{t('auth.oauth.or')}</span>
          </div>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="firstName">
              {t('auth.firstName.label')}
            </label>
            <input
              id="firstName"
              className="w-full border border-ak-border bg-ak-surface text-ak-text-primary px-4 py-3 rounded-xl focus:border-ak-primary focus:ring-2 focus:ring-ak-primary/70 outline-none transition-colors"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              autoComplete="given-name"
              placeholder={t('auth.firstName.placeholder')}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="lastName">
              {t('auth.lastName.label')}
            </label>
            <input
              id="lastName"
              className="w-full border border-ak-border bg-ak-surface text-ak-text-primary px-4 py-3 rounded-xl focus:border-ak-primary focus:ring-2 focus:ring-ak-primary/70 outline-none transition-colors"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              autoComplete="family-name"
              placeholder={t('auth.lastName.placeholder')}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              {t('auth.email.label')}
            </label>
            <input
              id="email"
              className="w-full border border-ak-border bg-ak-surface text-ak-text-primary px-4 py-3 rounded-xl focus:border-ak-primary focus:ring-2 focus:ring-ak-primary/70 outline-none transition-colors"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder={t('auth.email.placeholder')}
            />
          </div>

          {error ? <p className="text-ak-danger text-sm">{error}</p> : null}

          <Button type="submit" disabled={submitting} className="w-full justify-center">
            {submitting ? t('auth.signup.creating') : t('auth.signup.continue')}
          </Button>
        </form>

        <p className="mt-6 text-ak-text-secondary text-sm text-center">
          {t('auth.signup.hasAccount')}{' '}
          <Link className="text-ak-primary hover:underline font-medium" to="/login">
            {t('auth.signup.signIn')}
          </Link>
        </p>
      </div>
    </main>
  );
}
