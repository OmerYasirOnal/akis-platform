import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--glass-bdr)] bg-[var(--bg)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <img
              src="/brand/akis-logo.png"
              alt="AKIS"
              width={120}
              height={32}
              className="h-8 w-auto"
              onError={(e) => {
                const img = e.currentTarget;
                img.src = '/brand/akis-icon.png';
              }}
            />
            <span className="text-sm text-[var(--muted)]">Platform</span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--muted)]">
            <Link
              to="/docs"
              className="transition-colors hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
            >
              Docs
            </Link>
            <Link
              to="/pricing"
              className="transition-colors hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
            >
              Pricing
            </Link>
            <Link
              to="/contact"
              className="transition-colors hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
            >
              Contact
            </Link>
            <Link
              to="/legal/privacy"
              className="transition-colors hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
            >
              Privacy
            </Link>
            <Link
              to="/legal/terms"
              className="transition-colors hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
            >
              Terms
            </Link>
          </nav>

          {/* Copyright */}
          <div className="text-xs text-[var(--muted)]">
            © {year} AKIS Platform. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}

