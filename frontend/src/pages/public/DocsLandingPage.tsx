/**
 * DocsLandingPage - Public docs landing page
 * Premium dark theme with AKIS brand design language
 */
import { Link } from 'react-router-dom';

const RocketIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
  </svg>
);

const CubeIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
  </svg>
);

const LinkIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
  </svg>
);

const KeyIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
  </svg>
);

const CommandLineIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const BookOpenIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
  </svg>
);

interface DocSection {
  icon: React.ReactNode;
  title: string;
  description: string;
  links: { label: string; href: string }[];
  accent: string;
}

const docSections: DocSection[] = [
  {
    icon: <RocketIcon />,
    title: 'Getting Started',
    description: 'Set up your AKIS environment and run your first agent job in under 10 minutes.',
    accent: 'text-ak-primary',
    links: [
      { label: 'Quick Start Guide', href: '/docs/getting-started' },
      { label: 'Introduction', href: '/docs' },
      { label: 'Authentication', href: '/docs/api/auth' },
    ],
  },
  {
    icon: <CubeIcon />,
    title: 'Agents',
    description: 'Scribe, Trace, and Proto — three agents that automate docs, tests, and prototypes.',
    accent: 'text-emerald-400',
    links: [
      { label: 'Scribe Overview', href: '/docs/agents/scribe' },
      { label: 'Trace Overview', href: '/docs/agents/trace' },
      { label: 'Proto Overview', href: '/docs/agents/proto' },
    ],
  },
  {
    icon: <LinkIcon />,
    title: 'Integrations',
    description: 'Connect AKIS to GitHub, Jira, and Confluence via MCP (Model Context Protocol).',
    accent: 'text-sky-400',
    links: [
      { label: 'GitHub Integration', href: '/docs/integrations/github' },
      { label: 'MCP Protocol', href: '/docs/integrations/mcp' },
      { label: 'Atlassian', href: '/docs/integrations/atlassian' },
    ],
  },
  {
    icon: <KeyIcon />,
    title: 'Security',
    description: 'API key encryption, OAuth flows, and data privacy policies.',
    accent: 'text-amber-400',
    links: [
      { label: 'API Key Management', href: '/docs/security/api-keys' },
      { label: 'OAuth Flow', href: '/docs/security/oauth' },
      { label: 'Data Privacy', href: '/docs/security/privacy' },
    ],
  },
  {
    icon: <CommandLineIcon />,
    title: 'API Reference',
    description: 'REST endpoints, authentication, and webhook payloads for developers.',
    accent: 'text-violet-400',
    links: [
      { label: 'REST API', href: '/docs/api/rest' },
      { label: 'Authentication', href: '/docs/api/auth' },
      { label: 'Webhooks', href: '/docs/api/webhooks' },
    ],
  },
  {
    icon: <BookOpenIcon />,
    title: 'Guides',
    description: 'Best practices, troubleshooting tips, and self-hosting instructions.',
    accent: 'text-rose-400',
    links: [
      { label: 'Best Practices', href: '/docs/guides/best-practices' },
      { label: 'Troubleshooting', href: '/docs/guides/troubleshooting' },
      { label: 'Self-Hosting', href: '/docs/guides/self-hosting' },
    ],
  },
];

export default function DocsLandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 text-center sm:px-6 lg:py-28">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-ak-primary/5 via-transparent to-transparent" />

        <div className="relative">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-ak-primary/20 bg-ak-primary/5 px-4 py-1.5 text-sm font-medium text-ak-primary">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            Developer Documentation
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-ak-text-primary sm:text-5xl lg:text-6xl">
            AKIS Documentation
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ak-text-secondary">
            Everything you need to get started with AKIS and make the most of AI-assisted development workflows.
          </p>

          {/* Search */}
          <div className="mx-auto mt-10 max-w-xl">
            <div className="relative group">
              <input
                type="text"
                placeholder="Search documentation..."
                className="w-full rounded-xl border border-ak-border bg-ak-surface px-5 py-3.5 pl-12 text-ak-text-primary placeholder:text-ak-text-secondary/50 transition-all duration-200 focus:border-ak-primary focus:outline-none focus:ring-2 focus:ring-ak-primary/20 focus:bg-ak-surface-2"
              />
              <svg
                className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ak-text-secondary/50 group-focus-within:text-ak-primary transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links Bar */}
      <section className="border-y border-ak-border/50 bg-ak-surface/40 backdrop-blur-sm py-4">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-6 px-4 sm:gap-10 sm:px-6 lg:px-8">
          {[
            { label: 'Quick Start', href: '/docs/getting-started' },
            { label: 'Scribe Agent', href: '/docs/agents/scribe' },
            { label: 'API Reference', href: '/docs/api/rest' },
            { label: 'GitHub', href: 'https://github.com/OmerYasirOnal/akis-platform-devolopment', external: true },
          ].map((link) =>
            'external' in link ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium text-ak-text-secondary hover:text-ak-primary transition-colors"
              >
                {link.label}
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </a>
            ) : (
              <Link
                key={link.label}
                to={link.href}
                className="flex items-center gap-1.5 text-sm font-medium text-ak-text-secondary hover:text-ak-primary transition-colors"
              >
                {link.label}
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            )
          )}
        </div>
      </section>

      {/* Documentation Sections */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {docSections.map((section) => (
            <div
              key={section.title}
              className="group rounded-2xl border border-ak-border bg-ak-surface p-6 transition-all duration-200 hover:border-ak-primary/30 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)]"
            >
              <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-ak-surface-2 ${section.accent} group-hover:scale-110 transition-transform duration-200`}>
                {section.icon}
              </div>
              <h3 className="text-lg font-bold text-ak-text-primary">{section.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ak-text-secondary">{section.description}</p>
              <ul className="mt-4 space-y-2 border-t border-ak-border/30 pt-4">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="group/link flex items-center justify-between text-sm text-ak-text-secondary hover:text-ak-primary transition-colors"
                    >
                      <span>{link.label}</span>
                      <svg className="h-3.5 w-3.5 opacity-0 group-hover/link:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Help Section */}
      <section className="border-t border-ak-border/50 px-4 py-16 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-ak-text-primary">Need Help?</h2>
          <p className="mt-4 text-ak-text-secondary">
            Can&apos;t find what you&apos;re looking for? Our team is here to help.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <a
              href="https://github.com/OmerYasirOnal/akis-platform-devolopment/discussions"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-ak-border bg-ak-surface px-6 py-3 text-sm font-semibold text-ak-text-primary transition-all duration-200 hover:border-ak-primary/40 hover:bg-ak-surface-2"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub Discussions
            </a>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-ak-primary px-6 py-3 text-sm font-semibold text-[#111418] transition-colors hover:brightness-110 active:brightness-95"
            >
              Contact Support
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
