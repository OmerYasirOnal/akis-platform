import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/useI18n';
import Button from './common/Button';
import Logo from './branding/Logo';

/**
 * Hero Section
 * Design system compliant: solid dark bg, typography tokens, official logo
 */
export default function Hero() {
  const { t } = useI18n();

  return (
    <section className="relative flex min-h-[90vh] flex-col items-center justify-center bg-ak-bg px-4 py-24 sm:px-6 lg:px-8">
      {/* Hero Logo */}
      <div className="mb-8">
        <Logo size="hero" linkToHome={false} />
      </div>

      {/* Main Headline */}
      <h1 className="mb-6 max-w-4xl text-center text-[clamp(36px,8vw,56px)] font-bold leading-[1.1] tracking-tight text-ak-text-primary">
        {t('hero.title')}
      </h1>

      {/* Subtitle */}
      <p className="mx-auto mb-12 max-w-2xl text-center text-[clamp(16px,2vw,20px)] leading-relaxed text-ak-text-secondary">
        {t('hero.sub')}
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Button as={Link} to="/signup" variant="primary" size="lg">
          {t('cta.primary')}
        </Button>
        <Button as={Link} to="/login" variant="outline" size="lg">
          {t('cta.secondary')}
        </Button>
      </div>

      {/* Trust signals placeholder */}
      <div className="mt-16 text-center">
        <p className="mb-4 text-xs font-medium uppercase tracking-widest text-ak-text-secondary/60">
          Trusted by development teams
        </p>
        <div className="flex items-center justify-center gap-8 opacity-50 grayscale">
          {/* Placeholder logos */}
          <span className="text-sm text-ak-text-secondary">TechCorp</span>
          <span className="text-sm text-ak-text-secondary">DevTeam Inc</span>
          <span className="text-sm text-ak-text-secondary">BuildFast</span>
          <span className="text-sm text-ak-text-secondary">CodeLabs</span>
        </div>
      </div>
    </section>
  );
}
