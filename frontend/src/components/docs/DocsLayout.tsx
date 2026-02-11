/**
 * DocsLayout - Premium documentation layout
 * Dark theme with glassmorphism, glow accents, and AKIS brand identity
 */
import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

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

function Breadcrumb() {
  const location = useLocation();
  const pathParts = location.pathname.split('/').filter(Boolean);

  const items = pathParts.map((part, index) => {
    const href = '/' + pathParts.slice(0, index + 1).join('/');
    const label = part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ');
    return { label, href, isLast: index === pathParts.length - 1 };
  });

  return (
    <nav className="flex items-center gap-2 text-sm mb-8">
      <NavLink to="/" className="text-ak-text-secondary hover:text-ak-primary transition-colors">
        Home
      </NavLink>
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-2">
          <span className="text-ak-border">/</span>
          {item.isLast ? (
            <span className="text-ak-text-primary font-medium">{item.label}</span>
          ) : (
            <NavLink to={item.href} className="text-ak-text-secondary hover:text-ak-primary transition-colors">
              {item.label}
            </NavLink>
          )}
        </span>
      ))}
    </nav>
  );
}

function MobileMenuButton({ isOpen, onClick }: { isOpen: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden flex items-center gap-2 rounded-lg border border-ak-border bg-ak-surface px-3 py-2 text-sm text-ak-text-secondary hover:text-ak-text-primary hover:border-ak-primary/40 transition-colors"
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        {isOpen ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        )}
      </svg>
      <span>Menu</span>
    </button>
  );
}

function SidebarContent({ onItemClick }: { onItemClick?: () => void }) {
  return (
    <nav className="space-y-8">
      {navigation.map((section) => (
        <div key={section.title}>
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-ak-text-secondary/70">
            {section.title}
          </h3>
          <ul className="space-y-0.5">
            {section.items.map((item) => (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  end={item.href === '/docs'}
                  onClick={onItemClick}
                  className={({ isActive }) =>
                    `group flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150 ${
                      isActive
                        ? 'bg-ak-primary/10 text-ak-primary font-medium border-l-2 border-ak-primary -ml-[2px]'
                        : 'text-ak-text-secondary hover:text-ak-text-primary hover:bg-ak-surface-2'
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
  );
}

export default function DocsLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-ak-bg">
      {/* Header with glassmorphism */}
      <header className="sticky top-0 z-40 border-b border-ak-border/60 bg-ak-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <NavLink to="/" className="flex items-center gap-2 text-xl font-bold text-ak-text-primary hover:text-ak-primary transition-colors">
              <svg className="h-6 w-6 text-ak-primary" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              AKIS
            </NavLink>
            <div className="hidden sm:flex items-center">
              <span className="text-ak-border">/</span>
              <span className="ml-2 text-sm font-medium text-ak-text-secondary">Documentation</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <MobileMenuButton
              isOpen={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            />
            <NavLink
              to="/dashboard"
              className="hidden sm:inline-flex items-center gap-2 rounded-full bg-ak-primary px-4 py-2 text-sm font-semibold text-[color:var(--ak-on-primary)] hover:brightness-110 active:brightness-95 transition-colors"
            >
              Dashboard
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </NavLink>
          </div>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div
            className="absolute inset-0 bg-ak-bg/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute left-0 top-16 bottom-0 w-72 overflow-y-auto border-r border-ak-border bg-ak-bg p-6">
            <SidebarContent onItemClick={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="flex gap-0 lg:gap-12 py-8 lg:py-10">
          {/* Desktop sidebar */}
          <aside className="hidden w-56 flex-shrink-0 lg:block">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-4 pb-8 scrollbar-thin">
              <SidebarContent />
            </div>
          </aside>

          {/* Divider */}
          <div className="hidden lg:block w-px bg-ak-border/50 flex-shrink-0" />

          {/* Main content */}
          <main className="min-w-0 flex-1 lg:pl-8">
            <Breadcrumb />
            <article className="prose max-w-none prose-headings:text-ak-text-primary prose-headings:font-semibold prose-p:text-ak-text-secondary prose-p:leading-relaxed prose-a:text-ak-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-ak-text-primary prose-code:text-ak-primary prose-code:bg-ak-surface prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:before:content-none prose-code:after:content-none prose-pre:bg-ak-surface prose-pre:border prose-pre:border-ak-border prose-pre:rounded-xl prose-li:text-ak-text-secondary prose-li:marker:text-ak-primary/50 prose-hr:border-ak-border prose-blockquote:border-ak-primary/30 prose-blockquote:text-ak-text-secondary prose-th:text-ak-text-primary prose-td:text-ak-text-secondary">
              <Outlet />
            </article>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 border-t border-ak-border/50 bg-ak-surface/30">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-ak-text-secondary">
                AKIS Platform
              </span>
              <span className="text-ak-border">|</span>
              <p className="text-sm text-ak-text-secondary/70">
                &copy; 2026 All rights reserved.
              </p>
            </div>
            <div className="flex gap-6">
              <a
                href="https://github.com/OmerYasirOnal/akis-platform-devolopment"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-ak-text-secondary hover:text-ak-primary transition-colors"
              >
                GitHub
              </a>
              <NavLink to="/legal/terms" className="text-sm text-ak-text-secondary hover:text-ak-primary transition-colors">
                Terms
              </NavLink>
              <NavLink to="/legal/privacy" className="text-sm text-ak-text-secondary hover:text-ak-primary transition-colors">
                Privacy
              </NavLink>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
