import { Link } from 'react-router-dom';

import { useI18n } from '../../i18n/useI18n';
import { usePageMeta } from '../../hooks/usePageMeta';

export default function MarketplaceOverviewPage() {
  const { t } = useI18n();

  usePageMeta({
    title: t('marketplace.overview.meta.title'),
    description: t('marketplace.overview.meta.description'),
    ogTitle: t('marketplace.overview.meta.ogTitle'),
    ogDescription: t('marketplace.overview.meta.ogDescription'),
    twitterTitle: t('marketplace.overview.meta.twitterTitle'),
    twitterDescription: t('marketplace.overview.meta.twitterDescription'),
  });

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8" aria-label={t('marketplace.overview.sectionAria')}>
      <header className="mb-10">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-ak-primary">{t('marketplace.overview.kicker')}</p>
        <h1 className="mb-4 text-4xl font-bold text-ak-text-primary">{t('marketplace.overview.title')}</h1>
        <p className="max-w-3xl text-base leading-relaxed text-ak-text-secondary">
          {t('marketplace.overview.description')}
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <article className="rounded-xl border border-ak-border bg-ak-surface-2 p-5">
          <h2 className="mb-2 text-lg font-semibold text-ak-text-primary">{t('marketplace.overview.cards.matching.title')}</h2>
          <p className="text-sm text-ak-text-secondary">{t('marketplace.overview.cards.matching.body')}</p>
        </article>
        <article className="rounded-xl border border-ak-border bg-ak-surface-2 p-5">
          <h2 className="mb-2 text-lg font-semibold text-ak-text-primary">{t('marketplace.overview.cards.trust.title')}</h2>
          <p className="text-sm text-ak-text-secondary">{t('marketplace.overview.cards.trust.body')}</p>
        </article>
        <article className="rounded-xl border border-ak-border bg-ak-surface-2 p-5">
          <h2 className="mb-2 text-lg font-semibold text-ak-text-primary">{t('marketplace.overview.cards.proposal.title')}</h2>
          <p className="text-sm text-ak-text-secondary">{t('marketplace.overview.cards.proposal.body')}</p>
        </article>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          to="/app/onboarding"
          className="inline-flex items-center rounded-lg bg-ak-primary px-4 py-2 text-sm font-semibold text-[color:var(--ak-on-primary)] hover:brightness-110"
        >
          {t('marketplace.overview.cta.openApp')}
        </Link>
        <Link
          to="/"
          className="inline-flex items-center rounded-lg border border-ak-border bg-ak-surface px-4 py-2 text-sm font-semibold text-ak-text-primary hover:border-ak-primary/40"
        >
          {t('marketplace.overview.cta.backLanding')}
        </Link>
      </div>
    </section>
  );
}
