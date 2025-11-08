import type { FormEvent } from 'react';
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuth } from '../../state/auth/AuthContext';

const devLoginEnabled =
  String(import.meta.env.VITE_ENABLE_DEV_LOGIN ?? '').toLowerCase() === 'true';

type AuthLocationState = {
  from?: {
    pathname?: string;
  };
  message?: string;
};

const DevLogin: React.FC = () => {
  const { isAuthenticated, loginWithDevEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const authState = location.state as AuthLocationState | null;
  const redirectPath = authState?.from?.pathname ?? '/dashboard';

  if (!devLoginEnabled) {
    return <Navigate to="/login" replace />;
  }

  if (isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      setError('Lütfen geçerli bir e-posta adresi girin.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await loginWithDevEmail(email.trim().toLowerCase());
      navigate(redirectPath, { replace: true });
    } catch (err) {
      console.error('Developer login failed', err);
      setError('Giriş başarısız oldu. Lütfen e-posta adresini kontrol et.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-16 bg-ak-bg px-4 py-16 text-left sm:px-6 lg:px-8">
      <div className="flex w-full max-w-lg flex-col gap-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ak-text-secondary/80">
          Geliştirici modu
        </p>
        <h1 className="text-3xl font-semibold text-ak-text-primary">
          Tek tıkla dev oturumu aç
        </h1>
        <p className="text-sm text-ak-text-secondary">
          Bu ekran yalnızca geliştirme ortamında aktiftir. Canlı ortamda SSO veya e-posta tabanlı
          giriş kullanılacaktır.
        </p>
      </div>

      <Card className="w-full max-w-lg space-y-6">
        {authState?.message ? (
          <div className="rounded-xl border border-ak-border bg-ak-surface-2 px-4 py-3 text-sm text-ak-text-primary">
            {authState.message}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-ak-danger/40 bg-ak-danger/10 px-4 py-3 text-sm text-ak-danger">
            {error}
          </div>
        ) : null}

        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <Input
            label="E-posta"
            type="email"
            placeholder="senden@ekibin.dev"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? 'Oturum açılıyor...' : 'Dev login'}
          </Button>
        </form>

        <p className="text-xs text-ak-text-secondary">
          Canlı ortamda bu endpoint devre dışı bırakılır. Daha fazla bilgi için{' '}
          <Link className="font-medium text-ak-primary hover:text-ak-text-primary" to="/docs">
            dokümantasyona göz at
          </Link>
          .
        </p>
      </Card>
    </div>
  );
};

export default DevLogin;


