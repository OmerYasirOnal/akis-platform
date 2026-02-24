import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/useI18n';
import SystemArchitectureDiagram from '../../components/docs/SystemArchitectureDiagram';
import AgentSequenceDiagram from '../../components/docs/AgentSequenceDiagram';

export default function DocsIndexPage() {
  const { t } = useI18n();
  const tx = (key: string) => t(key as never);

  const agents = [
    { name: 'Scribe', color: 'text-emerald-400', bgColor: 'bg-emerald-400/10', href: '/docs/agents/scribe',
      desc: tx('docs.agents.description') },
    { name: 'Trace', color: 'text-sky-400', bgColor: 'bg-sky-400/10', href: '/docs/agents/trace',
      desc: tx('docs.troubleshooting.description') },
    { name: 'Proto', color: 'text-violet-400', bgColor: 'bg-violet-400/10', href: '/docs/agents/proto',
      desc: tx('docs.configuration.description') },
  ];

  const quickLinks = [
    { label: tx('docs.gettingStarted.title'), desc: tx('docs.gettingStarted.description'), href: '/docs/getting-started' },
    { label: tx('docs.restApi.title'), desc: tx('docs.apiReference.description'), href: '/docs/api/rest' },
    { label: tx('docs.troubleshooting.title'), desc: tx('docs.troubleshooting.description'), href: '/docs/guides/troubleshooting' },
    { label: tx('docs.bestPractices.title'), desc: tx('docs.bestPractices.lead'), href: '/docs/guides/best-practices' },
  ];

  return (
    <div className="not-prose">
      {/* Hero */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-ak-primary/20 bg-ak-primary/5 px-3 py-1 text-xs font-medium text-ak-primary mb-4">
          <span className="h-1.5 w-1.5 rounded-full bg-ak-primary animate-pulse" />
          {tx('docs.index.label')}
        </div>
        <h1 className="text-3xl font-bold text-ak-text-primary sm:text-4xl tracking-tight">
          {tx('docs.index.heroTitle')}
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ak-text-secondary">
          {tx('docs.index.heroDesc')}
        </p>
      </div>

      {/* Agents */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-ak-text-primary mb-5">{tx('docs.index.aiAgents')}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {agents.map((agent) => (
            <Link key={agent.name} to={agent.href}
              className="group relative rounded-xl border border-ak-border bg-ak-surface p-5 transition-all duration-200 hover:border-ak-primary/40 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
              <div className={`inline-flex items-center gap-2 ${agent.color} mb-3`}>
                <div className={`h-8 w-8 rounded-lg ${agent.bgColor} flex items-center justify-center text-sm font-bold`}>
                  {agent.name.charAt(0)}
                </div>
                <span className="font-semibold">{agent.name}</span>
              </div>
              <p className="text-sm text-ak-text-secondary leading-relaxed">{agent.desc}</p>
              <div className="mt-3 flex items-center gap-1 text-xs text-ak-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <span>{tx('docs.index.learnMore')}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-ak-text-primary mb-5">{tx('docs.index.quickLinks')}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {quickLinks.map((link) => (
            <Link key={link.href} to={link.href}
              className="group flex items-center justify-between rounded-lg border border-ak-border/50 bg-ak-surface/50 px-4 py-3 transition-all duration-150 hover:border-ak-primary/30 hover:bg-ak-surface">
              <div>
                <span className="text-sm font-medium text-ak-text-primary group-hover:text-ak-primary transition-colors">
                  {link.label}
                </span>
                <p className="text-xs text-ak-text-secondary mt-0.5">{link.desc}</p>
              </div>
              <svg className="h-4 w-4 flex-shrink-0 text-ak-text-secondary group-hover:text-ak-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          ))}
        </div>
      </div>

      {/* Architecture */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-ak-text-primary mb-5">{tx('docs.index.architecture')}</h2>
        <div className="rounded-xl border border-ak-border bg-ak-surface p-6">
          <p className="text-sm text-ak-text-secondary leading-relaxed mb-6">{tx('docs.index.archDesc')}</p>
          <div className="mb-8 rounded-lg bg-ak-bg/30 p-4">
            <h3 className="text-sm font-semibold text-ak-text-primary mb-3">System components</h3>
            <SystemArchitectureDiagram />
          </div>
          <div className="rounded-lg bg-ak-bg/30 p-4">
            <h3 className="text-sm font-semibold text-ak-text-primary mb-3">Agent execution flow</h3>
            <AgentSequenceDiagram />
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-xl border border-ak-primary/20 bg-gradient-to-r from-ak-primary/5 via-ak-primary/10 to-ak-primary/5 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-ak-text-primary">{tx('docs.index.ctaTitle')}</h3>
            <p className="mt-1 text-sm text-ak-text-secondary">{tx('docs.index.ctaDesc')}</p>
          </div>
          <Link to="/docs/getting-started"
            className="inline-flex items-center gap-2 rounded-full bg-ak-primary px-5 py-2.5 text-sm font-semibold text-[color:var(--ak-on-primary)] hover:brightness-110 active:brightness-95 transition-colors whitespace-nowrap">
            {tx('docs.index.getStarted')}
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
