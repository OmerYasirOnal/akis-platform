import { Link } from 'react-router-dom';

export default function MarketplaceOverviewPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="mb-10">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-ak-primary">AKIS Workstream</p>
        <h1 className="mb-4 text-4xl font-bold text-ak-text-primary">Freelancer Marketplace for Fast Reemployment</h1>
        <p className="max-w-3xl text-base leading-relaxed text-ak-text-secondary">
          AKIS Workstream helps displaced professionals move from onboarding to paid gigs quickly using transparent,
          explainable AI-assisted matching and proposal drafting.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <article className="rounded-xl border border-ak-border bg-ak-surface-2 p-5">
          <h2 className="mb-2 text-lg font-semibold text-ak-text-primary">Human-first matching</h2>
          <p className="text-sm text-ak-text-secondary">Every match includes a machine-readable explanation and clear factor breakdown.</p>
        </article>
        <article className="rounded-xl border border-ak-border bg-ak-surface-2 p-5">
          <h2 className="mb-2 text-lg font-semibold text-ak-text-primary">Trust and verification</h2>
          <p className="text-sm text-ak-text-secondary">Actions are audit-logged for governance and dispute resolution.</p>
        </article>
        <article className="rounded-xl border border-ak-border bg-ak-surface-2 p-5">
          <h2 className="mb-2 text-lg font-semibold text-ak-text-primary">Actionable proposals</h2>
          <p className="text-sm text-ak-text-secondary">Generate proposal drafts from profile + job context with safe defaults.</p>
        </article>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          to="/app/onboarding"
          className="inline-flex items-center rounded-lg bg-ak-primary px-4 py-2 text-sm font-semibold text-[color:var(--ak-on-primary)] hover:brightness-110"
        >
          Open Marketplace App
        </Link>
        <Link
          to="/"
          className="inline-flex items-center rounded-lg border border-ak-border bg-ak-surface px-4 py-2 text-sm font-semibold text-ak-text-primary hover:border-ak-primary/40"
        >
          Back to Landing
        </Link>
      </div>
    </section>
  );
}
