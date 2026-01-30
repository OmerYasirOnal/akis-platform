import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import { ChangelogWidget } from '../../components/dashboard/ChangelogWidget';
import { UsageWidget } from '../../components/dashboard/UsageWidget';

const ScribeIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const JobsIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122" />
  </svg>
);

const IntegrationsIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const AgentsIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

const DashboardOverviewPage = () => {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Main Content */}
      <div className="lg:col-span-8 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-ak-text-primary">Overview</h1>
          <p className="text-sm text-ak-text-secondary">
            Your workspace at a glance. Jump into Agents Hub to run a documentation pass.
          </p>
        </header>

        {/* Primary CTA */}
        <div className="relative overflow-hidden rounded-2xl bg-ak-surface-2 p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-ak-primary/5 via-transparent to-transparent pointer-events-none" />
          <div className="relative flex flex-col gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ak-primary/10 text-ak-primary">
                  <AgentsIcon />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ak-text-secondary/60">
                    Get Started
                  </p>
                  <h2 className="text-xl font-semibold text-ak-text-primary">
                    Agents Hub
                  </h2>
                </div>
              </div>
              <p className="text-sm text-ak-text-secondary max-w-md">
                Browse available agents, select your repository and branch, and start generating documentation with Scribe.
              </p>
            </div>
            <Button
              as={Link}
              to="/dashboard/agents"
              className="w-full justify-center sm:w-fit gap-2"
            >
              Open Agents Hub
              <ArrowRightIcon />
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { to: '/dashboard/agents', icon: <AgentsIcon />, label: 'Agents' },
            { to: '/dashboard/scribe', icon: <ScribeIcon />, label: 'Scribe' },
            { to: '/dashboard/jobs', icon: <JobsIcon />, label: 'Jobs' },
            { to: '/dashboard/integrations', icon: <IntegrationsIcon />, label: 'Integrations' },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center gap-2 rounded-xl bg-ak-surface-2/50 p-4 text-center transition-all hover:bg-ak-surface-2 group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ak-primary/10 text-ak-primary group-hover:bg-ak-primary/15 transition-colors">
                {item.icon}
              </div>
              <span className="text-sm font-medium text-ak-text-primary">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Activity Feed */}
        <div className="rounded-2xl bg-ak-surface-2/50 p-5">
          <h2 className="text-base font-semibold text-ak-text-primary mb-3">Activity Feed</h2>
          <div className="rounded-xl bg-ak-bg/30 px-4 py-8 text-center">
            <p className="text-sm text-ak-text-secondary">
              No recent activity yet. Start a Scribe run to populate this feed.
            </p>
            <Link
              to="/dashboard/agents"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-ak-primary hover:underline"
            >
              Run your first agent
              <ArrowRightIcon />
            </Link>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-4 space-y-6">
        <UsageWidget />
        <ChangelogWidget />
      </div>
    </div>
  );
};

export default DashboardOverviewPage;
