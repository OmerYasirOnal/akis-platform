import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

const DashboardOverviewPage = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold text-ak-text-primary">
        Overview
      </h1>
      <p className="text-sm text-ak-text-secondary">
        Snapshot of recent jobs, time saved, and active automations. TODO: wire
        metrics once backend endpoints are available.
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
              TODO
            </p>
          </Card>
        )
      )}
    </div>

    <Card className="bg-ak-surface">
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
          <Button variant="primary">Run Scribe</Button>
          <Button variant="secondary">Run Trace</Button>
          <Button variant="outline">Create Job</Button>
        </div>
      </div>
    </Card>

    <Card className="bg-ak-surface">
      <h2 className="text-lg font-semibold text-ak-text-primary">
        Recent Jobs
      </h2>
      <p className="mt-3 text-sm text-ak-text-secondary">
        TODO: render responsive table / card list using jobs data from API.
      </p>
    </Card>
  </div>
);

export default DashboardOverviewPage;

