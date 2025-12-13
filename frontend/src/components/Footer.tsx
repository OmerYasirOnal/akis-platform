import { Link } from 'react-router-dom';
import Logo from './branding/Logo';

/**
 * Footer Component
 * 3-column adaptive grid with glass styling
 */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--glass-bdr)] bg-[var(--bg)]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {/* Main Footer Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2">
              <Logo size="sm" />
              <span className="text-sm text-[var(--muted)]">Platform</span>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-[var(--muted)]">
              Autonomous AI agents for software development workflows. Save time,
              ship faster.
            </p>
          </div>

          {/* Column 2: Product */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]/70">
              Product
            </h3>
            <ul className="space-y-3">
              <li>
                <FooterLink to="/platform">Platform</FooterLink>
              </li>
              <li>
                <FooterLink to="/agents/scribe">Scribe</FooterLink>
              </li>
              <li>
                <FooterLink to="/agents/trace">Trace</FooterLink>
              </li>
              <li>
                <FooterLink to="/agents/proto">Proto</FooterLink>
              </li>
              <li>
                <FooterLink to="/integrations">Integrations</FooterLink>
              </li>
              <li>
                <FooterLink to="/pricing">Pricing</FooterLink>
              </li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]/70">
              Resources
            </h3>
            <ul className="space-y-3">
              <li>
                <FooterLink to="/docs">Docs</FooterLink>
              </li>
              <li>
                <FooterLink to="/docs/getting-started">Getting Started</FooterLink>
              </li>
              <li>
                <FooterLink to="/docs/api-reference">API Reference</FooterLink>
              </li>
              <li>
                <FooterLink to="/changelog">Changelog</FooterLink>
              </li>
              <li>
                <FooterLink to="/status">Status</FooterLink>
              </li>
            </ul>
          </div>

          {/* Column 4: Company & Legal */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]/70">
              Company
            </h3>
            <ul className="space-y-3">
              <li>
                <FooterLink to="/about">About</FooterLink>
              </li>
              <li>
                <FooterLink to="/contact">Contact</FooterLink>
              </li>
              <li>
                <FooterLink to="/legal/privacy">Privacy</FooterLink>
              </li>
              <li>
                <FooterLink to="/legal/terms">Terms</FooterLink>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--glass-bdr)] pt-8 md:flex-row">
          <p className="text-xs text-[var(--muted)]">
            © {year} AKIS Platform. All rights reserved.
          </p>

          {/* Social links */}
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/akis-platform"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--muted)] transition-colors hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
              aria-label="GitHub"
            >
              <GitHubIcon />
            </a>
            <a
              href="https://twitter.com/akisplatform"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--muted)] transition-colors hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
              aria-label="Twitter"
            >
              <TwitterIcon />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/**
 * Footer Link Component
 */
function FooterLink({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
    >
      {children}
    </Link>
  );
}

/**
 * GitHub Icon
 */
function GitHubIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Twitter/X Icon
 */
function TwitterIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
