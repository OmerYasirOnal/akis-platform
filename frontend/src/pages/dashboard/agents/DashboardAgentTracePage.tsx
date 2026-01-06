import { Link } from 'react-router-dom';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';

const DashboardAgentTracePage = () => (
  <div className="space-y-6">
    <header className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ak-text-secondary/70">
        Coming Soon
      </p>
      <h1 className="text-2xl font-semibold text-ak-text-primary">Trace</h1>
      <p className="text-sm text-ak-text-secondary">
        Trace will turn issue trackers into structured test plans. For now, the dashboard
        focuses on Scribe workflows.
      </p>
    </header>

    <Card className="space-y-3 bg-ak-surface">
      <h2 className="text-lg font-semibold text-ak-text-primary">Planned capabilities</h2>
      <ul className="space-y-2 text-sm text-ak-text-secondary">
        <li>1. Jira and Linear issue ingestion.</li>
        <li>2. Automated test case generation with QA review gates.</li>
        <li>3. Export to Cucumber or Playwright suites.</li>
      </ul>
      <p className="text-xs text-ak-text-secondary">
        TODO: Enable Trace once backend workflows are finalized.
      </p>
    </Card>

    <Button as={Link} to="/dashboard/scribe" variant="outline" className="justify-center">
      Go to Scribe Console
    </Button>
  </div>
);

export default DashboardAgentTracePage;
