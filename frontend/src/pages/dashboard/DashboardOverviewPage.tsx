import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { ChangelogWidget } from '../../components/dashboard/ChangelogWidget';

const DashboardOverviewPage = () => {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="lg:col-span-8 space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-ak-text-primary">Overview</h1>
          <p className="text-sm text-ak-text-secondary">
            Your workspace at a glance. Jump into Scribe when you&apos;re ready to run a doc pass.
          </p>
        </header>

        <Card className="bg-ak-surface">
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ak-text-secondary/70">
                Primary Workflow
              </p>
              <h2 className="text-xl font-semibold text-ak-text-primary">
                Scribe Console
              </h2>
              <p className="text-sm text-ak-text-secondary">
                Pick a repository, choose your branch strategy, and start a Scribe conversation in one place.
              </p>
            </div>
            <Button as={Link} to="/dashboard/scribe" className="w-full justify-center sm:w-fit">
              Open Scribe Console
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Button
            as={Link}
            to="/dashboard/scribe"
            variant="outline"
            size="md"
            className="h-auto flex flex-col items-center justify-center gap-1 py-3 text-center"
          >
            <span className="text-lg">✍️</span>
            <span className="text-xs font-medium">Scribe</span>
          </Button>
          <Button
            as={Link}
            to="/dashboard/jobs"
            variant="outline"
            size="md"
            className="h-auto flex flex-col items-center justify-center gap-1 py-3 text-center"
          >
            <span className="text-lg">📚</span>
            <span className="text-xs font-medium">Jobs</span>
          </Button>
          <Button
            as={Link}
            to="/dashboard/integrations"
            variant="outline"
            size="md"
            className="h-auto flex flex-col items-center justify-center gap-1 py-3 text-center"
          >
            <span className="text-lg">🔌</span>
            <span className="text-xs font-medium">Integrations</span>
          </Button>
          <Button
            as={Link}
            to="/dashboard/settings/ai-providers"
            variant="outline"
            size="md"
            className="h-auto flex flex-col items-center justify-center gap-1 py-3 text-center"
          >
            <span className="text-lg">⚙️</span>
            <span className="text-xs font-medium">AI Providers</span>
          </Button>
        </div>

        <Card className="bg-ak-surface">
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-ak-text-primary">Activity Feed</h2>
            <div className="rounded-xl border border-dashed border-ak-border bg-ak-surface-2 px-4 py-6 text-sm text-ak-text-secondary">
              No recent activity yet. Start a Scribe run to populate this feed.
            </div>
          </div>
        </Card>
      </div>

      <div className="hidden lg:block lg:col-span-4">
        <ChangelogWidget />
      </div>
    </div>
  );
};

export default DashboardOverviewPage;
