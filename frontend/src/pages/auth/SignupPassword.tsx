import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';

export default function SignupPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Get signup data from sessionStorage
    const storedData = sessionStorage.getItem('akis_signup_data');
    if (!storedData) {
      // No data found, redirect back to step 1
      navigate('/signup');
      return;
    }
    const data = JSON.parse(storedData);
    setEmail(data.email);
  }, [navigate]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate minimum length
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setSubmitting(true);

    try {
      // TODO: Replace with real API call to /api/auth/signup/password
      // For now, simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Store password in session data
      const storedData = sessionStorage.getItem('akis_signup_data');
      if (storedData) {
        const data = JSON.parse(storedData);
        sessionStorage.setItem(
          'akis_signup_data',
          JSON.stringify({ ...data, password })
        );
      }

      // Navigate to verification step
      navigate('/signup/verify-email');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to set password. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleBack() {
    navigate('/signup');
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

        <h1 className="text-h2 mb-2">Create a password</h1>
        <p className="text-sm text-ak-text-secondary mb-6">
          For <span className="text-ak-text-primary font-medium">{email}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              Password (min. 8 characters)
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
                autoComplete="new-password"
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

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="confirmPassword">
              Confirm password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                className="w-full border border-ak-border bg-ak-surface text-ak-text-primary px-4 py-3 pr-16 rounded-xl focus:border-ak-primary focus:ring-2 focus:ring-ak-primary/70 outline-none transition-colors"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium uppercase tracking-wide text-ak-text-secondary hover:text-ak-primary focus:outline-none focus:ring-2 focus:ring-ak-primary focus:ring-offset-0 px-2 py-1 rounded transition-colors"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? 'HIDE' : 'SHOW'}
              </button>
            </div>
          </div>

          {error ? <p className="text-ak-danger text-sm">{error}</p> : null}

          <Button type="submit" disabled={submitting} className="w-full justify-center">
            {submitting ? 'Setting password...' : 'Continue'}
          </Button>
        </form>
      </div>
    </main>
  );
}

