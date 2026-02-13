import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { label: 'Onboarding', to: '/app/onboarding' },
  { label: 'Jobs', to: '/app/jobs' },
  { label: 'Matches', to: '/app/matches' },
  { label: 'Proposals', to: '/app/proposals' },
];

export default function MarketplaceAppShell() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 rounded-xl border border-ak-border bg-ak-surface p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ak-primary">AKIS Workstream</p>
        <h1 className="mt-2 text-2xl font-semibold text-ak-text-primary">Marketplace App</h1>
        <p className="mt-2 text-sm text-ak-text-secondary">Onboard your talent profile, ingest jobs, run matching, and generate proposals.</p>
      </header>

      <nav className="mb-6 flex flex-wrap gap-2" aria-label="Marketplace navigation">
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

      <main aria-label="Marketplace main content">
        <Outlet />
      </main>
    </div>
  );
}
