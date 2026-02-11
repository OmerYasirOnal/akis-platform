import { Link } from 'react-router-dom';
import { useI18n } from '../../../i18n/useI18n';

export default function ProtoDocsPage() {
  const { t } = useI18n();
  const tx = (key: string) => t(key as never);

  const features = [1, 2, 3].map((n) => ({
    title: tx(`agents.proto.feature${n}.title`),
    description: tx(`agents.proto.feature${n}.description`),
  }));
  const useCases = [1, 2, 3].map((n) => ({
    title: tx(`agents.proto.useCase${n}.title`),
    description: tx(`agents.proto.useCase${n}.description`),
  }));

  return (
    <div className="not-prose space-y-8">
      <section className="rounded-2xl border border-ak-border bg-ak-surface p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ak-text-secondary/70">
              {tx('agents.proto.subtitle')}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-ak-text-primary">{tx('agents.proto.heroTitle')}</h1>
            <p className="mt-2 text-lg text-ak-text-secondary">{tx('agents.proto.heroSubtitle')}</p>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ak-text-secondary">
              {tx('agents.proto.heroDescription')}
            </p>
          </div>
          <img
            src="/brand/akis-a-mark.png"
            alt="AKIS A mark"
            className="h-20 w-20 rounded-xl border border-ak-border bg-ak-bg p-2"
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {features.map((feature) => (
          <article key={feature.title} className="rounded-xl border border-ak-border bg-ak-surface p-4">
            <h2 className="text-base font-semibold text-ak-text-primary">{feature.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ak-text-secondary">{feature.description}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-ak-border bg-ak-surface p-6">
        <h2 className="text-xl font-semibold text-ak-text-primary">{tx('docs.section.useCases')}</h2>
        <div className="mt-4 space-y-3">
          {useCases.map((item) => (
            <div key={item.title} className="rounded-lg border border-ak-border bg-ak-bg p-4">
              <h3 className="text-sm font-semibold text-ak-text-primary">{item.title}</h3>
              <p className="mt-1 text-sm text-ak-text-secondary">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-ak-primary/20 bg-ak-primary/5 p-6">
        <h2 className="text-xl font-semibold text-ak-text-primary">{tx('agents.proto.title')}</h2>
        <p className="mt-2 text-sm text-ak-text-secondary">{tx('agents.proto.description')}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/dashboard/agents"
            className="inline-flex items-center rounded-lg bg-ak-primary px-4 py-2 text-sm font-semibold text-[color:var(--ak-on-primary)] hover:brightness-110"
          >
            {tx('agentsHub.runAgent')}
          </Link>
          <Link
            to="/docs/guides/best-practices"
            className="inline-flex items-center rounded-lg border border-ak-border bg-ak-surface px-4 py-2 text-sm font-semibold text-ak-text-primary hover:border-ak-primary/50"
          >
            {tx('docs.configuration.title')}
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-ak-border bg-ak-surface p-6">
        <h2 className="text-xl font-semibold text-ak-text-primary">{tx('docs.section.references')}</h2>
        <ul className="mt-3 space-y-2 text-sm text-ak-text-secondary">
          <li><Link className="text-ak-primary hover:underline" to="/docs/agents/scribe">{tx('agents.scribe.heroTitle')}</Link></li>
          <li><Link className="text-ak-primary hover:underline" to="/docs/agents/trace">{tx('agents.trace.heroTitle')}</Link></li>
          <li><Link className="text-ak-primary hover:underline" to="/docs/api/rest">{tx('docs.apiReference.title')}</Link></li>
        </ul>
      </section>
    </div>
  );
}
