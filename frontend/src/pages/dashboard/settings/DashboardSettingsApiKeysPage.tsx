import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';

const mockKeys = [
  {
    name: 'Production Key',
    lastUsed: '2 hours ago',
  },
  {
    name: 'CI/CD Key',
    lastUsed: 'Never',
  },
];

const DashboardSettingsApiKeysPage = () => (
  <div className="space-y-6">
    <header className="space-y-2">
      <h1 className="text-2xl font-semibold text-ak-text-primary">
        API Keys
      </h1>
      <p className="text-sm text-ak-text-secondary">
        Manage programmatic access to AKIS APIs. TODO: connect to secure vault.
      </p>
    </header>

    <Card className="space-y-4 bg-ak-surface">
      <h2 className="text-lg font-semibold text-ak-text-primary">
        Active Keys
      </h2>
      <ul className="space-y-3 text-sm text-ak-text-secondary">
        {mockKeys.map((key) => (
          <li
            key={key.name}
            className="flex items-center justify-between rounded-xl bg-ak-surface-2 px-4 py-3"
          >
            <div>
              <p className="font-medium text-ak-text-primary">{key.name}</p>
              <p className="text-xs text-ak-text-secondary/80">
                Last used: {key.lastUsed}
              </p>
            </div>
            <Button variant="outline">Revoke</Button>
          </li>
        ))}
      </ul>
    </Card>

    <Card className="space-y-4 bg-ak-surface">
      <h2 className="text-lg font-semibold text-ak-text-primary">
        Generate Key
      </h2>
      <Input label="Key Name" placeholder="CI Pipeline" />
      <Input
        label="Expires In"
        placeholder="90 days"
        description="TODO: replace with select input."
      />
      <Button className="justify-center">Generate</Button>
    </Card>
  </div>
);

export default DashboardSettingsApiKeysPage;

