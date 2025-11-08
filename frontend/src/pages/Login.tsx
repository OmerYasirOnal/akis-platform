import { Link, Navigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useAuth } from '../state/auth/AuthContext';

const devLoginEnabled =
  String(import.meta.env.VITE_ENABLE_DEV_LOGIN ?? '').toLowerCase() === 'true';

const Login: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (devLoginEnabled) {
    return <Navigate to="/auth/dev-login" replace />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-16 bg-ak-bg px-4 py-16 text-left sm:px-6 lg:px-8">
      <div className="flex w-full max-w-lg flex-col gap-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ak-text-secondary/80">
          Hoş geldin
        </p>
        <h1 className="text-3xl font-semibold text-ak-text-primary">
          Giriş yakında açılıyor
        </h1>
        <p className="text-sm text-ak-text-secondary">
          Kurumsal kimlikle giriş yeteneklerimizi geliştiriyoruz. Beta erişimi için ekibimizle
          iletişime geçebilirsin.
        </p>
      </div>

      <Card className="w-full max-w-lg space-y-6">
        <div className="space-y-4 text-sm text-ak-text-secondary">
          <p>
            AKIS’in kapalı betası şu an sınırlı kullanıcılarla ilerliyor. Giriş bağlantıların
            hazırlandığında sana haber vereceğiz.
          </p>
          <p>
            Betaya katılmak istiyorsan{' '}
            <Link className="font-medium text-ak-primary hover:text-ak-text-primary" to="/contact">
              bizimle iletişime geç
            </Link>{' '}
            ya da{' '}
            <Link className="font-medium text-ak-primary hover:text-ak-text-primary" to="/signup">
              bekleme listesine kaydol
            </Link>
            .
          </p>
        </div>
        <Button as={Link} to="/platform" variant="secondary">
          Platformu keşfet
        </Button>
      </Card>
    </div>
  );
};

export default Login;

