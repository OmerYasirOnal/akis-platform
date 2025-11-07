import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { useAuth } from '../auth/AuthContext';

type LoginErrors = {
  email?: string;
  password?: string;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [form, setForm] = React.useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = React.useState<LoginErrors>({});
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  type AuthLocationState = {
    from?: {
      pathname?: string;
    };
    message?: string;
  };

  const authState = location.state as AuthLocationState | null;
  const redirectPath = authState?.from?.pathname ?? '/jobs';
  const alertMessage = authState?.message ?? null;

  const validate = React.useCallback(() => {
    const nextErrors: LoginErrors = {};

    if (!form.email.trim()) {
      nextErrors.email = 'E-posta adresi gerekli';
    } else if (!emailRegex.test(form.email)) {
      nextErrors.email = 'Geçerli bir e-posta adresi girin';
    }

    if (!form.password) {
      nextErrors.password = 'Şifre gerekli';
    } else if (form.password.length < 8) {
      nextErrors.password = 'Şifre en az 8 karakter olmalı';
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }, [form.email, form.password]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    // UI-only placeholder: backend is not called.
    await new Promise((resolve) => setTimeout(resolve, 300));
    login();
    navigate(redirectPath, { replace: true });
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center gap-16 px-4 text-left sm:px-6 lg:px-8">
      <div className="flex w-full max-w-lg flex-col gap-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ak-text-secondary/80">
          Hoş geldin
        </p>
        <h1 className="text-3xl font-semibold text-ak-text-primary">
          Hesabına giriş yap
        </h1>
        <p className="text-sm text-ak-text-secondary">
          Korunan AKIS iş akışlarına erişebilmek için oturum aç.
        </p>
      </div>

      <Card className="w-full max-w-lg space-y-6 bg-ak-surface">
        {alertMessage ? (
          <div className="rounded-xl border border-ak-border/70 bg-ak-surface-2 px-4 py-3 text-sm text-ak-text-primary">
            {alertMessage}
          </div>
        ) : null}
        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <Input
            label="E-posta"
            type="email"
            placeholder="sen@ekibin.com"
            autoComplete="email"
            value={form.email}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                email: event.target.value,
              }))
            }
            error={errors.email}
          />

          <Input
            label="Şifre"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="current-password"
            value={form.password}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                password: event.target.value,
              }))
            }
            error={errors.password}
            rightElement={
              <button
                type="button"
                className="text-xs font-medium uppercase tracking-wide text-ak-text-secondary transition-colors hover:text-ak-primary"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? 'Gizle' : 'Göster'}
              </button>
            }
          />

          <div className="flex items-center justify-between text-sm">
            <Link
              to="#"
              className="text-ak-text-secondary transition-colors hover:text-ak-primary"
              title="Yakında aktif olacak"
            >
              Şifreni mi unuttun?
            </Link>
          </div>

          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? 'Giriş yapılıyor...' : 'Giriş yap'}
          </Button>
        </form>

        <p className="text-sm text-ak-text-secondary">
          AKIS’e yeni misin?{' '}
          <Link
            to="/signup"
            className="font-medium text-ak-primary transition-colors hover:text-[#0AE0C0]"
          >
            Hemen hesap oluştur
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default Login;

