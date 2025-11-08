import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

const integrationItems = [
  {
    name: 'GitHub',
    status: 'Connected',
    actionLabel: 'View settings',
  },
  {
    name: 'Jira Cloud',
    status: 'Connected',
    actionLabel: 'Refresh token',
  },
  {
    name: 'Confluence',
    status: 'Token expiring soon',
    actionLabel: 'Renew',
  },
  {
    name: 'Slack (Notifications)',
    status: 'Not connected',
    actionLabel: 'Connect',
  },
];

const DashboardIntegrationsPage = () => (
  <div className="space-y-6">
    <header className="space-y-2">
      <h1 className="text-2xl font-semibold text-ak-text-primary">
        Integrations
      </h1>
      <p className="text-sm text-ak-text-secondary">
        Manage connections between AKIS and external systems.
      </p>
    </header>

    <div className="grid gap-4 lg:grid-cols-2">
      {integrationItems.map((integration) => (
        <Card key={integration.name} className="flex h-full flex-col gap-3 bg-ak-surface">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-ak-text-primary">
                {integration.name}
              </h2>
              <p className="text-sm text-ak-text-secondary">
                Status: {integration.status}
              </p>
            </div>
            <Button variant="secondary" className="whitespace-nowrap px-4">
              {integration.actionLabel}
            </Button>
          </div>
          <p className="text-xs text-ak-text-secondary/80">
            TODO: replace with dynamic health checks and webhook statuses.
          </p>
        </Card>
      ))}
    </div>
  </div>
);

export default DashboardIntegrationsPage;

