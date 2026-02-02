import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/useI18n';
import Button from './common/Button';
import Logo from './branding/Logo';
import { openWaitlist } from '../utils/waitlist';

/**
 * Hero Section
 * Premium glass morphism with animated background
 */
export default function Hero() {
  const { t } = useI18n();

  return (
    <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
      {/* Content */}
      <div className="relative mx-auto max-w-5xl text-center">
        {/* Hero Logo */}
        <div className="mb-8 flex justify-center">
          <Logo size="hero" linkToHome={false} />
        </div>

        {/* Main Headline */}
        <h1 className="mb-6 text-balance text-[clamp(40px,8vw,72px)] font-semibold leading-[1.1] tracking-tight text-ak-text-primary">
          {t('hero.title')}
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mb-12 max-w-2xl text-balance text-[clamp(16px,2vw,20px)] leading-relaxed text-ak-text-secondary">
          {t('hero.sub')}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            onClick={() => openWaitlist('website', 'hero_cta')}
            variant="primary"
            size="lg"
          >
            {t('waitlist.cta')}
          </Button>
          <Button as={Link} to="/login" variant="outline" size="lg">
            {t('cta.secondary')}
          </Button>
        </div>

        {/* Trust signals */}
        <div className="mt-20 text-center">
          <p className="mb-6 text-xs font-medium uppercase tracking-[0.2em] text-ak-text-secondary">
            {t('hero.trusted')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 opacity-50 transition-opacity hover:opacity-70">
            {/* Company logos as stylized placeholders */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-ak-surface-2" />
              <span className="text-base font-semibold text-ak-text-secondary">TechCorp</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-ak-surface-2" />
              <span className="text-base font-semibold text-ak-text-secondary">BuildFast</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-ak-surface-2" />
              <span className="text-base font-semibold text-ak-text-secondary">CodeLabs</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-ak-surface-2" />
              <span className="text-base font-semibold text-ak-text-secondary">AgileFlow</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
