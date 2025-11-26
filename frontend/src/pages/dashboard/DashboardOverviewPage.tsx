import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import HealthPanel from '../../components/health/HealthPanel';

const DashboardOverviewPage = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold text-ak-text-primary">
        Overview
      </h1>
      <p className="text-sm text-ak-text-secondary">
        Snapshot of recent jobs, time saved, and active automations.
      </p>
    </div>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {['Jobs This Week', 'Time Saved', 'Success Rate', 'Active Agents'].map(
        (metric) => (
          <Card key={metric} className="bg-ak-surface">
            <p className="text-xs uppercase tracking-[0.25em] text-ak-text-secondary/70">
              {metric}
            </p>
            <p className="mt-3 text-2xl font-semibold text-ak-text-primary">
              —
            </p>
          </Card>
        )
      )}
    </div>

    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="bg-ak-surface lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-ak-text-primary">
              Quick Actions
            </h2>
            <p className="text-sm text-ak-text-secondary">
              Launch an agent or configure integrations in seconds.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button as={Link} to="/dashboard/agents/scribe/run" variant="primary">
              Run Scribe
            </Button>
            <Button as={Link} to="/dashboard/agents/trace" variant="secondary">
              Run Trace
            </Button>
            <Button as={Link} to="/dashboard/jobs/new" variant="outline">
              Create Job
            </Button>
          </div>
        </div>
      </Card>

      {/* System Status Panel */}
      <div className="lg:col-span-1">
        <HealthPanel />
      </div>
    </div>

    <Card className="bg-ak-surface">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-ak-text-primary">
          Recent Jobs
        </h2>
        <Link
          to="/dashboard/jobs"
          className="text-sm text-ak-primary hover:text-ak-text-primary transition-colors"
        >
          View all →
        </Link>
      </div>
      <p className="text-sm text-ak-text-secondary">
        Latest job activity will appear here.
      </p>
    </Card>
  </div>
);

export default DashboardOverviewPage;

