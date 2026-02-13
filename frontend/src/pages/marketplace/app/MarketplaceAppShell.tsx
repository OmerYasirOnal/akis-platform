import { NavLink, Outlet } from 'react-router-dom';

import { useI18n } from '../../../i18n/useI18n';

export default function MarketplaceAppShell() {
  const { t } = useI18n();

  const navItems = [
    { label: t('marketplace.app.nav.onboarding'), to: '/app/onboarding' },
    { label: t('marketplace.app.nav.jobs'), to: '/app/jobs' },
    { label: t('marketplace.app.nav.matches'), to: '/app/matches' },
    { label: t('marketplace.app.nav.proposals'), to: '/app/proposals' },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 rounded-xl border border-ak-border bg-ak-surface p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ak-primary">{t('marketplace.app.kicker')}</p>
        <h1 className="mt-2 text-2xl font-semibold text-ak-text-primary">{t('marketplace.app.title')}</h1>
        <p className="mt-2 text-sm text-ak-text-secondary">{t('marketplace.app.description')}</p>
      </header>

      <nav className="mb-6 flex flex-wrap gap-2" aria-label={t('marketplace.app.nav.aria')}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-ak-primary text-[color:var(--ak-on-primary)]'
                  : 'border border-ak-border bg-ak-surface text-ak-text-secondary hover:text-ak-text-primary'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <main aria-label={t('marketplace.app.mainAria')}>
        <Outlet />
      </main>
    </div>
  );
}
