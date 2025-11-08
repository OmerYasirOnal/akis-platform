import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

const dashboardAgents = [
  {
    name: 'Scribe',
    description: 'Keeps documentation in sync with your repos.',
    managePath: '/dashboard/agents/scribe',
  },
  {
    name: 'Trace',
    description: 'Transforms Jira work into actionable test suites.',
    managePath: '/dashboard/agents/trace',
  },
  {
    name: 'Proto',
    description: 'Bootstraps MVP scaffolds from product specs.',
    managePath: '/dashboard/agents/proto',
  },
];

const DashboardAgentsIndexPage = () => (
  <div className="space-y-6">
    <header className="space-y-2">
      <h1 className="text-2xl font-semibold text-ak-text-primary">Agents</h1>
      <p className="text-sm text-ak-text-secondary">
        Configure behaviors, triggers, and outputs for each AKIS agent.
      </p>
    </header>

    <div className="grid gap-4 lg:grid-cols-3">
      {dashboardAgents.map((agent) => (
        <Card key={agent.name} className="flex h-full flex-col gap-4 bg-ak-surface">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-ak-text-primary">
              {agent.name}
            </h2>
            <p className="text-sm text-ak-text-secondary">
              {agent.description}
            </p>
          </div>
          <Button
            as={Link}
            to={agent.managePath}
            variant="secondary"
            className="justify-center"
          >
            Manage {agent.name}
          </Button>
        </Card>
      ))}
    </div>
  </div>
);

export default DashboardAgentsIndexPage;

