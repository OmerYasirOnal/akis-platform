import type { FormEvent } from 'react';
import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { useAuth } from '../state/auth/AuthContext';

const devLoginEnabled =
  String(import.meta.env.VITE_ENABLE_DEV_LOGIN ?? '').toLowerCase() === 'true';

const Signup: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  if (devLoginEnabled) {
    return <Navigate to="/auth/dev-login" replace />;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-16 bg-ak-bg px-4 py-16 text-left sm:px-6 lg:px-8">
      <div className="flex w-full max-w-lg flex-col gap-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ak-text-secondary/80">
          Bekleme listesi
        </p>
        <h1 className="text-3xl font-semibold text-ak-text-primary">
          AKIS kapalı betasına katıl
        </h1>
        <p className="text-sm text-ak-text-secondary">
          Ekibimiz sana erişim davetini gönderebilmek için birkaç bilgi topluyor. Hazır
          olduğumuzda ilk sen öğren.
        </p>
      </div>

      <Card className="w-full max-w-lg space-y-6">
        {submitted ? (
          <div className="space-y-4 text-sm text-ak-text-secondary">
            <p>
              Teşekkürler! <span className="font-medium text-ak-text-primary">{name || email}</span>{' '}
              kaydını aldık. Kapalı beta genişlediğinde sana davet göndereceğiz.
            </p>
            <Button as={Link} to="/platform" variant="secondary">
              Platformu keşfet
            </Button>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <Input
              label="İsim"
              placeholder="Ad Soyad"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />

            <Input
              label="E-posta"
              type="email"
              placeholder="sen@ekibin.com"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <p className="text-xs text-ak-text-secondary/80">
              Kaydını bırakarak seni bekleme listesine eklememizi kabul etmiş olursun. Güncellemeler
              e-posta üzerinden paylaşılacaktır.
            </p>

            <Button type="submit" size="lg" disabled={!email.trim()}>
              Bekleme listesine katıl
            </Button>
          </form>
        )}

        <p className="text-sm text-ak-text-secondary">
          Destekten mi geliyorsun?{' '}
          <Link
            to="/contact"
            className="font-medium text-ak-primary transition-colors hover:text-ak-text-primary focus:outline-none focus:ring-2 focus:ring-ak-primary focus:ring-offset-2 focus:ring-offset-ak-bg"
          >
            Ekiple iletişime geç
          </Link>
          .
        </p>
      </Card>
    </div>
  );
};

export default Signup;

