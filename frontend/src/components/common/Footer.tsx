import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../branding/Logo';
import { useAuth } from '../../auth/AuthContext';

const footerProducts = [
  { label: 'Scribe', hash: '#scribe' },
  { label: 'Trace', hash: '#trace' },
  { label: 'Proto', hash: '#proto' },
];

const Footer: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-ak-border/60 bg-ak-bg/90">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <Logo size="sm" />
            <p className="mt-2 max-w-sm text-sm text-ak-text-secondary">
              Yazılım geliştirme süreçlerinin yeni merkezi. Daha hızlı teslim,
              daha güçlü ekipler.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm text-ak-text-secondary">
            {footerProducts.map((product) => (
              <Link
                key={product.hash}
                to={{ pathname: '/', hash: product.hash }}
                className="transition-colors hover:text-ak-primary"
              >
                {product.label}
              </Link>
            ))}
            <span className="cursor-not-allowed text-ak-text-secondary/70">
              Docs
            </span>
            <Link
              to={{ pathname: '/', hash: '#pricing' }}
              className="transition-colors hover:text-ak-primary"
            >
              Pricing
            </Link>
            {isAuthenticated ? (
              <Link
                to="/jobs"
                className="transition-colors hover:text-ak-primary"
              >
                Jobs
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="transition-colors hover:text-ak-primary"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="transition-colors hover:text-ak-primary"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="border-t border-ak-border/50 pt-6 text-xs text-ak-text-secondary/70">
          © {year} AKIS Platform. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;

