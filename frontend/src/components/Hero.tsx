import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/useI18n';
import Button from './common/Button';
import GlassBackdrop from './GlassBackdrop';

/**
 * Hero Section
 * Premium glass morphism with animated background
 */
export default function Hero() {
  const { t } = useI18n();

  return (
    <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
      {/* Glass backdrop effect */}
      <GlassBackdrop />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-5xl text-center">
        {/* Hero Logo */}
        <div className="mb-8 flex justify-center">
          <img
            src="/brand/akis-logo-horizontal.png"
            alt="AKIS"
            className="h-[clamp(72px,12vw,112px)] w-auto"
            onError={(e) => {
              const img = e.currentTarget;
              if (img.src.includes('akis-logo-horizontal.png')) {
                img.src = '/brand/akis-logo.png';
              }
            }}
          />
        </div>

        {/* Main Headline */}
        <h1 className="mb-6 text-balance text-[clamp(40px,8vw,72px)] font-semibold leading-[1.1] tracking-tight text-[var(--text)]">
          {t('hero.title')}
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mb-12 max-w-2xl text-balance text-[clamp(16px,2vw,20px)] leading-relaxed text-[var(--muted)]">
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

        {/* Trust signals */}
        <div className="mt-20 text-center">
          <p className="mb-6 text-xs font-medium uppercase tracking-[0.2em] text-[var(--muted)]/60">
            Trusted by development teams
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-40 grayscale transition-opacity hover:opacity-60">
            <span className="text-sm font-medium text-[var(--muted)]">TechCorp</span>
            <span className="text-sm font-medium text-[var(--muted)]">DevTeam Inc</span>
            <span className="text-sm font-medium text-[var(--muted)]">BuildFast</span>
            <span className="text-sm font-medium text-[var(--muted)]">CodeLabs</span>
          </div>
        </div>
      </div>
    </section>
  );
}
