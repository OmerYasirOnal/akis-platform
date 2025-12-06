import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button';

export default function LoginPassword() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Get email from sessionStorage (set in LoginEmail step)
    const storedEmail = sessionStorage.getItem('akis_login_email');
    if (!storedEmail) {
      // No email found, redirect back to step 1
      navigate('/login');
      return;
    }
    setEmail(storedEmail);
  }, [navigate]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Use existing login function (which calls the legacy /api/auth/login endpoint)
      // In future, this should call /api/auth/login/complete
      await login(email, password);

      // Clear stored email
      sessionStorage.removeItem('akis_login_email');

      // Navigate to dashboard
      navigate('/dashboard');
    } catch {
      setError('Incorrect password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleBack() {
    navigate('/login');
  }

  if (!email) {
    return null; // Will redirect in useEffect
  }

  return (
    <main className="min-h-screen bg-ak-bg text-ak-text-primary flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-ak-surface-2 border border-ak-border rounded-2xl p-8 shadow-ak-md">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-ak-text-secondary hover:text-ak-primary mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <h1 className="text-h2 mb-2">Enter your password</h1>
        <p className="text-sm text-ak-text-secondary mb-6">
          Signing in as <span className="text-ak-text-primary font-medium">{email}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                className="w-full border border-ak-border bg-ak-surface text-ak-text-primary px-4 py-3 pr-16 rounded-xl focus:border-ak-primary focus:ring-2 focus:ring-ak-primary/70 outline-none transition-colors"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="current-password"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium uppercase tracking-wide text-ak-text-secondary hover:text-ak-primary focus:outline-none focus:ring-2 focus:ring-ak-primary focus:ring-offset-0 px-2 py-1 rounded transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'HIDE' : 'SHOW'}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Link
              to="/auth/reset-password"
              className="text-sm text-ak-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {error ? <p className="text-ak-danger text-sm">{error}</p> : null}

          <Button type="submit" disabled={submitting} className="w-full justify-center">
            {submitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </div>
    </main>
  );
}

