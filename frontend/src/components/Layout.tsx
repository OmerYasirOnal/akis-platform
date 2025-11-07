import { Link } from 'react-router-dom';
import Logo from './branding/Logo';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-ak-bg">
      <nav className="bg-ak-surface border-b border-ak-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-6">
              <Logo size="default" />
              <Link
                to="/jobs"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-ak-text-primary hover:text-ak-primary transition-colors"
              >
                Jobs
              </Link>
              <Link
                to="/jobs/new"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-ak-text-primary hover:text-ak-primary transition-colors"
              >
                New Job
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 text-ak-text-primary">{children}</main>
    </div>
  );
}
