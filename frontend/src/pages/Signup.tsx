import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { useAuth } from '../auth/AuthContext';

type SignupErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = React.useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
  });
  const [errors, setErrors] = React.useState<SignupErrors>({});
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const validate = React.useCallback(() => {
    const nextErrors: SignupErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = 'İsim gerekli';
    }

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

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = 'Şifreyi doğrulayın';
    } else if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = 'Şifreler eşleşmiyor';
    }

    if (!form.termsAccepted) {
      nextErrors.terms =
        'AKIS kullanım şartlarını kabul etmeden devam edemezsiniz';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [
    form.name,
    form.email,
    form.password,
    form.confirmPassword,
    form.termsAccepted,
  ]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 350));
    login();
    navigate('/jobs', { replace: true });
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center gap-16 px-4 text-left sm:px-6 lg:px-8">
      <div className="flex w-full max-w-lg flex-col gap-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ak-text-secondary/80">
          Hemen katıl
        </p>
        <h1 className="text-3xl font-semibold text-ak-text-primary">
          AKIS hesabını oluştur
        </h1>
        <p className="text-sm text-ak-text-secondary">
          Kapalı beta listesine dahil ol ve platform yolculuğuna başla.
        </p>
      </div>

      <Card className="w-full max-w-lg space-y-6 bg-ak-surface">
        <form className="space-y-6" noValidate onSubmit={handleSubmit}>
          <Input
            label="İsim"
            placeholder="Ad Soyad"
            autoComplete="name"
            value={form.name}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, name: event.target.value }))
            }
            error={errors.name}
          />

          <Input
            label="E-posta"
            type="email"
            placeholder="sen@ekibin.com"
            autoComplete="email"
            value={form.email}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, email: event.target.value }))
            }
            error={errors.email}
          />

          <Input
            label="Şifre"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="new-password"
            value={form.password}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, password: event.target.value }))
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

          <Input
            label="Şifreyi doğrula"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                confirmPassword: event.target.value,
              }))
            }
            error={errors.confirmPassword}
            rightElement={
              <button
                type="button"
                className="text-xs font-medium uppercase tracking-wide text-ak-text-secondary transition-colors hover:text-ak-primary"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
              >
                {showConfirmPassword ? 'Gizle' : 'Göster'}
              </button>
            }
          />

          <div className="space-y-3">
            <label className="flex items-start gap-3 text-sm text-ak-text-secondary">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-ak-border bg-ak-surface text-ak-primary focus:ring-ak-primary"
                checked={form.termsAccepted}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    termsAccepted: event.target.checked,
                  }))
                }
              />
              <span className="text-left">
                <span className="text-ak-text-secondary/90">
                  Kullanım şartlarını ve{' '}
                </span>
                <Link
                  to="#"
                  className="font-medium text-ak-primary transition-colors hover:text-[#0AE0C0]"
                  title="Dokümantasyon yakında yayınlanacak"
                >
                  gizlilik politikasını
                </Link>{' '}
                kabul ediyorum.
              </span>
            </label>
            {errors.terms ? (
              <p className="text-xs text-red-400">{errors.terms}</p>
            ) : null}
          </div>

          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? 'Hesabın hazırlanıyor...' : 'Hesap oluştur'}
          </Button>
        </form>

        <p className="text-sm text-ak-text-secondary">
          Zaten hesabın var mı?{' '}
          <Link
            to="/login"
            className="font-medium text-ak-primary transition-colors hover:text-[#0AE0C0]"
          >
            Hemen giriş yap
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default Signup;

