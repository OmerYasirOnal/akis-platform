/**
 * DocsLayout - Layout component for documentation pages
 * Provides sidebar navigation and content area
 */
import { NavLink, Outlet, useLocation } from 'react-router-dom';

// Navigation structure
interface NavSection {
  title: string;
  items: { label: string; href: string }[];
}

const navigation: NavSection[] = [
  {
    title: 'Getting Started',
    items: [
      { label: 'Introduction', href: '/docs' },
      { label: 'Quick Start', href: '/docs/getting-started' },
    ],
  },
  {
    title: 'Agents',
    items: [
      { label: 'Scribe', href: '/docs/agents/scribe' },
      { label: 'Trace', href: '/docs/agents/trace' },
      { label: 'Proto', href: '/docs/agents/proto' },
    ],
  },
  {
    title: 'Integrations',
    items: [
      { label: 'GitHub', href: '/docs/integrations/github' },
      { label: 'MCP Protocol', href: '/docs/integrations/mcp' },
      { label: 'Atlassian', href: '/docs/integrations/atlassian' },
    ],
  },
  {
    title: 'Security',
    items: [
      { label: 'API Keys', href: '/docs/security/api-keys' },
      { label: 'OAuth', href: '/docs/security/oauth' },
      { label: 'Data Privacy', href: '/docs/security/privacy' },
    ],
  },
  {
    title: 'API Reference',
    items: [
      { label: 'REST API', href: '/docs/api/rest' },
      { label: 'Authentication', href: '/docs/api/auth' },
      { label: 'Webhooks', href: '/docs/api/webhooks' },
    ],
  },
  {
    title: 'Guides',
    items: [
      { label: 'Best Practices', href: '/docs/guides/best-practices' },
      { label: 'Troubleshooting', href: '/docs/guides/troubleshooting' },
      { label: 'Self-Hosting', href: '/docs/guides/self-hosting' },
    ],
  },
];

// Breadcrumb component
function Breadcrumb() {
  const location = useLocation();
  const pathParts = location.pathname.split('/').filter(Boolean);

  // Build breadcrumb items
  const items = pathParts.map((part, index) => {
    const href = '/' + pathParts.slice(0, index + 1).join('/');
    const label = part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ');
    return { label, href, isLast: index === pathParts.length - 1 };
  });

  return (
    <nav className="flex items-center gap-2 text-sm text-ak-text-secondary mb-6">
      <NavLink to="/" className="hover:text-ak-primary">
        Home
      </NavLink>
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-2">
          <span>/</span>
          {item.isLast ? (
            <span className="text-ak-text-primary">{item.label}</span>
          ) : (
            <NavLink to={item.href} className="hover:text-ak-primary">
              {item.label}
            </NavLink>
          )}
        </span>
      ))}
    </nav>
  );
}

export default function DocsLayout() {
  return (
    <div className="min-h-screen bg-ak-bg">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-ak-border bg-ak-surface/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <NavLink to="/" className="text-xl font-bold text-ak-text-primary">
            AKIS
          </NavLink>
          <div className="flex items-center gap-4">
            <NavLink
              to="/docs"
              className="text-sm font-medium text-ak-primary"
            >
              Docs
            </NavLink>
            <NavLink
              to="/dashboard"
              className="rounded-lg bg-ak-primary px-4 py-2 text-sm font-medium text-ak-bg hover:bg-ak-primary/90"
            >
              Dashboard
            </NavLink>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex gap-8 py-8">
          {/* Sidebar */}
          <aside className="hidden w-64 flex-shrink-0 lg:block">
            <nav className="sticky top-24 space-y-6">
              {navigation.map((section) => (
                <div key={section.title}>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ak-text-secondary">
                    {section.title}
                  </h3>
                  <ul className="space-y-1">
                    {section.items.map((item) => (
                      <li key={item.href}>
                        <NavLink
                          to={item.href}
                          end={item.href === '/docs'}
                          className={({ isActive }) =>
                            `block rounded-lg px-3 py-2 text-sm transition-colors ${
                              isActive
                                ? 'bg-ak-primary/10 font-medium text-ak-primary'
                                : 'text-ak-text-secondary hover:bg-ak-surface hover:text-ak-text-primary'
                            }`
                          }
                        >
                          {item.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <main className="min-w-0 flex-1">
            <Breadcrumb />
            <article className="prose prose-invert max-w-none prose-headings:text-ak-text-primary prose-p:text-ak-text-secondary prose-a:text-ak-primary prose-code:text-ak-primary prose-pre:bg-ak-surface prose-pre:border prose-pre:border-ak-border">
              <Outlet />
            </article>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-ak-border bg-ak-surface py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-ak-text-secondary">
              © 2025 AKIS Platform. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="https://github.com/OmerYasirOnal/akis-platform-devolopment" target="_blank" rel="noopener noreferrer" className="text-sm text-ak-text-secondary hover:text-ak-primary">
                GitHub
              </a>
              <NavLink to="/legal/terms" className="text-sm text-ak-text-secondary hover:text-ak-primary">
                Terms
              </NavLink>
              <NavLink to="/legal/privacy" className="text-sm text-ak-text-secondary hover:text-ak-primary">
                Privacy
              </NavLink>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
