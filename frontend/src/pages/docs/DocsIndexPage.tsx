/**
 * Docs Index Page - Introduction to AKIS
 * Modern dark theme with AKIS brand design language
 */
import { Link } from 'react-router-dom';

const features = [
  {
    title: 'GitHub Integration',
    desc: 'Connect repos, analyze commits, create PRs automatically',
    href: '/docs/integrations/github',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
      </svg>
    ),
  },
  {
    title: 'Secure by Design',
    desc: 'Encrypted credentials, OAuth flows, zero-trust architecture',
    href: '/docs/security/api-keys',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    title: 'MCP Protocol',
    desc: 'Model Context Protocol for secure service communication',
    href: '/docs/integrations/mcp',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
  {
    title: 'Explainable AI',
    desc: 'See what agents do and why with full trace visibility',
    href: '/docs/agents/scribe',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const agents = [
  {
    name: 'Scribe',
    desc: 'Automatically generates and updates documentation from your codebase',
    href: '/docs/agents/scribe',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
  },
  {
    name: 'Trace',
    desc: 'Creates test plans and coverage matrices from specifications',
    href: '/docs/agents/trace',
    color: 'text-sky-400',
    bgColor: 'bg-sky-400/10',
  },
  {
    name: 'Proto',
    desc: 'Bootstraps working MVP scaffolds from requirements',
    href: '/docs/agents/proto',
    color: 'text-violet-400',
    bgColor: 'bg-violet-400/10',
  },
];

const quickLinks = [
  { label: 'Quick Start Guide', desc: 'Get up and running in 10 minutes', href: '/docs/getting-started' },
  { label: 'REST API Reference', desc: 'API endpoints documentation', href: '/docs/api/rest' },
  { label: 'Troubleshooting', desc: 'Common issues and solutions', href: '/docs/guides/troubleshooting' },
  { label: 'Best Practices', desc: 'Recommended patterns and tips', href: '/docs/guides/best-practices' },
];

export default function DocsIndexPage() {
  return (
    <div className="not-prose">
      {/* Hero */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-ak-primary/20 bg-ak-primary/5 px-3 py-1 text-xs font-medium text-ak-primary mb-4">
          <span className="h-1.5 w-1.5 rounded-full bg-ak-primary animate-pulse" />
          Documentation
        </div>
        <h1 className="text-3xl font-bold text-ak-text-primary sm:text-4xl tracking-tight">
          Welcome to AKIS
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ak-text-secondary">
          AKIS (AI Knowledge Intelligence System) is an AI-powered platform that automates 
          software development workflows through intelligent agents.
        </p>
      </div>

      {/* Agents section */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-ak-text-primary mb-5">AI Agents</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {agents.map((agent) => (
            <Link
              key={agent.name}
              to={agent.href}
              className="group relative rounded-xl border border-ak-border bg-ak-surface p-5 transition-all duration-200 hover:border-ak-primary/40 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]"
            >
              <div className={`inline-flex items-center gap-2 ${agent.color} mb-3`}>
                <div className={`h-8 w-8 rounded-lg ${agent.bgColor} flex items-center justify-center text-sm font-bold`}>
                  {agent.name.charAt(0)}
                </div>
                <span className="font-semibold">{agent.name}</span>
              </div>
              <p className="text-sm text-ak-text-secondary leading-relaxed">{agent.desc}</p>
              <div className="mt-3 flex items-center gap-1 text-xs text-ak-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Learn more</span>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Key Features */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-ak-text-primary mb-5">Key Features</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((feature) => (
            <Link
              key={feature.title}
              to={feature.href}
              className="group flex items-start gap-4 rounded-xl border border-ak-border bg-ak-surface p-5 transition-all duration-200 hover:border-ak-primary/30 hover:bg-ak-surface-2"
            >
              <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-ak-primary/10 text-ak-primary group-hover:bg-ak-primary/20 transition-colors">
                {feature.icon}
              </div>
              <div>
                <h3 className="font-semibold text-ak-text-primary group-hover:text-ak-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="mt-1 text-sm text-ak-text-secondary">{feature.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-ak-text-primary mb-5">Quick Links</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="group flex items-center justify-between rounded-lg border border-ak-border/50 bg-ak-surface/50 px-4 py-3 transition-all duration-150 hover:border-ak-primary/30 hover:bg-ak-surface"
            >
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

      {/* Architecture Overview */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-ak-text-primary mb-5">Architecture</h2>
        <div className="rounded-xl border border-ak-border bg-ak-surface p-6">
          <p className="text-sm text-ak-text-secondary leading-relaxed mb-5">
            AKIS follows a modular monolith architecture optimized for cloud deployment.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: 'Backend', tech: 'Fastify + TypeScript + PostgreSQL', icon: '⚡' },
              { label: 'Frontend', tech: 'React + Vite SPA', icon: '🎨' },
              { label: 'MCP Gateway', tech: 'Model Context Protocol', icon: '🔗' },
              { label: 'AI Services', tech: 'OpenAI / OpenRouter', icon: '🧠' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-lg bg-ak-bg/50 px-4 py-3 border border-ak-border/30">
                <span className="text-lg">{item.icon}</span>
                <div>
                  <span className="text-sm font-medium text-ak-text-primary">{item.label}</span>
                  <p className="text-xs text-ak-text-secondary">{item.tech}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-xl border border-ak-primary/20 bg-gradient-to-r from-ak-primary/5 via-ak-primary/10 to-ak-primary/5 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-ak-text-primary">Ready to get started?</h3>
            <p className="mt-1 text-sm text-ak-text-secondary">
              Follow our Quick Start guide to set up AKIS and run your first agent job.
            </p>
          </div>
          <Link
            to="/docs/getting-started"
            className="inline-flex items-center gap-2 rounded-full bg-ak-primary px-5 py-2.5 text-sm font-semibold text-[#111418] hover:brightness-110 active:brightness-95 transition-colors whitespace-nowrap"
          >
            Get Started
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
