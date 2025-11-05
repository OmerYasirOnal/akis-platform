import { Link } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link
                to="/jobs"
                className="inline-flex items-center px-2 py-2 text-sm font-medium text-gray-900"
              >
                AKIS Platform
              </Link>
              <Link
                to="/jobs"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Jobs
              </Link>
              <Link
                to="/jobs/new"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                New Job
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
