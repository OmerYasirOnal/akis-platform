import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/useI18n';
import Button from '../../components/common/Button';
import { openWaitlist } from '../../utils/waitlist';

const CheckIcon = () => (
  <svg className="h-5 w-5 text-ak-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

export default function PricingPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen">
      <section className="px-4 py-16 text-center sm:px-6 lg:py-24">
        <h1 className="text-4xl font-bold tracking-tight text-ak-text-primary sm:text-5xl lg:text-6xl">
          {t('pricing.page.title')}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-ak-text-secondary">
          {t('pricing.page.subtitle')}
        </p>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="relative rounded-2xl border border-ak-primary bg-ak-surface-2 p-8 shadow-ak-glow">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-ak-primary px-4 py-1 text-sm font-semibold text-[#111418]">
              {t('pricing.pilot.badge')}
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-ak-text-primary">{t('pricing.pilot.name')}</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-bold text-ak-text-primary">{t('pricing.pilot.price')}</span>
                <span className="ml-2 text-ak-text-secondary">/ {t('pricing.pilot.period')}</span>
              </div>
              <p className="mt-4 text-ak-text-secondary">{t('pricing.pilot.description')}</p>
            </div>
            <ul className="mb-8 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-ak-text-secondary">{t(`pricing.pilot.feature${i}`)}</span>
                </li>
              ))}
            </ul>
            <Button
              onClick={() => openWaitlist('website', 'pricing_cta')}
              variant="primary"
              className="block w-full justify-center rounded-xl py-3"
            >
              {t('pricing.pilot.cta')}
            </Button>
          </div>

          <div className="rounded-2xl border border-ak-border bg-ak-surface p-8 transition-all duration-200 hover:-translate-y-1 hover:shadow-ak-elevation-2">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-ak-text-primary">{t('pricing.comingSoon.name')}</h3>
              <p className="mt-4 text-ak-text-secondary">{t('pricing.comingSoon.description')}</p>
            </div>
            <ul className="mb-8 space-y-3">
              {[1, 2, 3].map((i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-ak-text-secondary">{t(`pricing.comingSoon.feature${i}`)}</span>
                </li>
              ))}
            </ul>
            <a
              href="mailto:info@akisflow.com?subject=Pricing Inquiry"
              className="block w-full rounded-xl border border-ak-border bg-ak-surface-2 py-3 text-center font-semibold text-ak-text-primary transition-colors hover:bg-ak-surface"
            >
              {t('pricing.comingSoon.cta')}
            </a>
          </div>
        </div>
      </section>

      <section className="border-t border-ak-border bg-ak-surface px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-ak-text-primary">{t('pricing.faq.title')}</h2>
          <div className="mt-12 space-y-8 text-left">
            <div>
              <h3 className="text-lg font-semibold text-ak-text-primary">{t('pricing.faq.q1')}</h3>
              <p className="mt-2 text-ak-text-secondary">{t('pricing.faq.a1')}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-ak-text-primary">{t('pricing.faq.q3')}</h3>
              <p className="mt-2 text-ak-text-secondary">{t('pricing.faq.a3')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 text-center sm:px-6 lg:py-24">
        <h2 className="text-3xl font-bold text-ak-text-primary">{t('pricing.cta.title')}</h2>
        <p className="mx-auto mt-4 max-w-xl text-ak-text-secondary">{t('pricing.cta.subtitle')}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button as={Link} to="/signup" variant="primary" size="lg">
            {t('pricing.starter.cta')}
          </Button>
          <Button as={Link} to="/docs" variant="outline" size="lg">
            {t('pricing.cta.readDocs')}
          </Button>
        </div>
      </section>
    </div>
  );
}
