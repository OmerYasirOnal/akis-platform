import { Link } from 'react-router-dom';

// Icons
const BookOpenIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
  </svg>
);

const RocketIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
  </svg>
);

const CubeIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
  </svg>
);

const KeyIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
  </svg>
);

const LinkIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
  </svg>
);

const CommandLineIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

interface DocSection {
  icon: React.ReactNode;
  title: string;
  description: string;
  links: { label: string; href: string }[];
}

const docSections: DocSection[] = [
  {
    icon: <RocketIcon />,
    title: 'Getting Started',
    description: 'Set up your AKIS environment and run your first agent job in under 10 minutes.',
    links: [
      { label: 'Quick Start Guide', href: '/docs/getting-started' },
      { label: 'Introduction', href: '/docs' },
      { label: 'Authentication', href: '/docs/api/auth' },
    ],
  },
  {
    icon: <CubeIcon />,
    title: 'Agents',
    description: 'Scribe, Trace, and Proto - three agents that automate docs, tests, and prototypes.',
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
      <section className="px-4 py-16 text-center sm:px-6 lg:py-24">
        <h1 className="text-4xl font-bold tracking-tight text-ak-text-primary sm:text-5xl">
          AKIS Documentation
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-ak-text-secondary">
          Everything you need to get started with AKIS and make the most of AI-assisted development.
        </p>
        
        {/* Search (placeholder) */}
        <div className="mx-auto mt-8 max-w-xl">
          <div className="relative">
            <input
              type="text"
              placeholder="Search documentation..."
              className="w-full rounded-xl border border-ak-border bg-ak-surface-2 px-4 py-3 pl-12 text-ak-text-primary placeholder:text-ak-text-secondary focus:border-ak-primary focus:outline-none focus:ring-2 focus:ring-ak-primary/20"
            />
            <svg
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ak-text-secondary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="border-y border-ak-border bg-ak-surface py-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-4 px-4 sm:gap-8 sm:px-6 lg:px-8">
          <Link
            to="/docs/getting-started"
            className="text-sm font-medium text-ak-primary hover:underline"
          >
            Quick Start →
          </Link>
          <Link
            to="/docs/agents/scribe"
            className="text-sm font-medium text-ak-primary hover:underline"
          >
            Scribe Agent →
          </Link>
          <Link
            to="/docs/api/rest"
            className="text-sm font-medium text-ak-primary hover:underline"
          >
            API Reference →
          </Link>
          <a
            href="https://github.com/OmerYasirOnal/akis-platform-devolopment"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-ak-primary hover:underline"
          >
            GitHub →
          </a>
        </div>
      </section>

      {/* Documentation Sections */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {docSections.map((section) => (
            <div
              key={section.title}
              className="rounded-2xl border border-ak-border bg-ak-surface p-6 transition-all duration-base hover:-translate-y-1 hover:shadow-ak-lg"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-ak-primary/10 text-ak-primary">
                {section.icon}
              </div>
              <h3 className="text-xl font-bold text-ak-text-primary">{section.title}</h3>
              <p className="mt-2 text-ak-text-secondary">{section.description}</p>
              <ul className="mt-4 space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-sm text-ak-primary hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Help Section */}
      <section className="border-t border-ak-border bg-ak-surface px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-ak-text-primary">Need Help?</h2>
          <p className="mt-4 text-ak-text-secondary">
            Can't find what you're looking for? Our team is here to help.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <a
              href="https://github.com/OmerYasirOnal/akis-platform-devolopment/discussions"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-ak-border bg-ak-surface-2 px-6 py-3 font-semibold text-ak-text-primary transition-colors hover:bg-ak-surface"
            >
              GitHub Discussions
            </a>
            <a
              href="mailto:support@akis.dev"
              className="rounded-xl bg-ak-primary px-6 py-3 font-semibold text-ak-bg transition-colors hover:bg-ak-primary/90"
            >
              Contact Support
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
