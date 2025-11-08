import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../branding/Logo';
import { useAuth } from '../../auth/AuthContext';

const productLinks = [
  { label: 'Platform', to: '/platform' },
  { label: 'Agents', to: '/agents' },
  { label: 'Solutions', to: '/solutions' },
  { label: 'Pricing', to: '/pricing' },
];

const resourceLinks = [
  { label: 'Docs', to: '/docs' },
  { label: 'Changelog', to: '/changelog' },
  { label: 'Status', to: '/status' },
  { label: 'Integrations', to: '/integrations' },
];

const companyLinks = [
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

const legalLinks = [
  { label: 'Terms', to: '/legal/terms' },
  { label: 'Privacy', to: '/legal/privacy' },
];

const Footer: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-ak-border bg-ak-bg">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-3">
            <Logo size="sm" />
            <p className="text-sm text-ak-text-secondary">
              Software development’s new center. Ship faster with confident,
              autonomous workflows.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ak-text-secondary/70">
              Product
            </p>
            <ul className="mt-3 space-y-2 text-sm text-ak-text-secondary">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link className="transition-colors hover:text-ak-primary" to={link.to}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ak-text-secondary/70">
              Resources
            </p>
            <ul className="mt-3 space-y-2 text-sm text-ak-text-secondary">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <Link className="transition-colors hover:text-ak-primary" to={link.to}>
                    {link.label}
                  </Link>
                </li>
              ))}
              {isAuthenticated ? (
                <li>
                  <Link
                    className="transition-colors hover:text-ak-primary"
                    to="/dashboard"
                  >
                    Dashboard
                  </Link>
                </li>
              ) : (
                <>
                  <li>
                    <Link className="transition-colors hover:text-ak-primary" to="/login">
                      Login
                    </Link>
                  </li>
                  <li>
                    <Link className="transition-colors hover:text-ak-primary" to="/signup">
                      Sign up
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ak-text-secondary/70">
                Company
              </p>
              <ul className="mt-3 space-y-2 text-sm text-ak-text-secondary">
                {companyLinks.map((link) => (
                  <li key={link.label}>
                    <Link className="transition-colors hover:text-ak-primary" to={link.to}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ak-text-secondary/70">
                Legal
              </p>
              <ul className="mt-3 space-y-2 text-sm text-ak-text-secondary">
                {legalLinks.map((link) => (
                  <li key={link.label}>
                    <Link className="transition-colors hover:text-ak-primary" to={link.to}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-ak-border pt-6 text-xs text-ak-text-secondary/70">
          © {year} AKIS Platform. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;

