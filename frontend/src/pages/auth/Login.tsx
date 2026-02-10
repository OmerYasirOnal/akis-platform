import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../../components/branding/Logo';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      setError('Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-ak-bg text-ak-text-primary flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-ak-surface border border-ak-border rounded-2xl p-8 shadow-ak-elevation-2">
        <div className="mb-6 flex justify-center">
          <Logo size="sm" linkToHome={false} />
        </div>

        <h1 className="text-h2 mb-6">Sign in</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="w-full border border-ak-border bg-ak-surface-2 text-ak-text-primary px-4 py-3 rounded-xl focus:border-ak-primary focus:ring-2 focus:ring-ak-primary/40 focus:ring-offset-1 focus:ring-offset-ak-bg outline-none transition-colors"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="w-full border border-ak-border bg-ak-surface-2 text-ak-text-primary px-4 py-3 rounded-xl focus:border-ak-primary focus:ring-2 focus:ring-ak-primary/40 focus:ring-offset-1 focus:ring-offset-ak-bg outline-none transition-colors"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {error ? <p className="text-ak-error text-sm">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-ak-primary text-[#111418] font-semibold py-3 hover:brightness-110 active:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ak-primary disabled:opacity-60"
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p className="mt-4 text-ak-text-secondary text-sm">
          Don’t have an account?{' '}
          <Link className="text-ak-primary hover:underline" to="/signup">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
