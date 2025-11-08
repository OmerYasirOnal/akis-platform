import Card from '../../../components/common/Card';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';

const DashboardAgentTracePage = () => (
  <div className="space-y-6">
    <header className="space-y-2">
      <h1 className="text-2xl font-semibold text-ak-text-primary">
        Trace Configuration
      </h1>
      <p className="text-sm text-ak-text-secondary">
        TODO: Connect to persistence layer. This is a themed placeholder for
        Trace settings.
      </p>
    </header>

    <Card className="space-y-4 bg-ak-surface">
      <h2 className="text-lg font-semibold text-ak-text-primary">
        Jira Connection
      </h2>
      <Input label="Jira Site URL" placeholder="https://yourworkspace.atlassian.net" />
      <Input label="API Token (masked)" placeholder="••••••••••" />
      <Input label="Projects" placeholder="AKIS, PLATFORM" />
      <Button className="justify-center">Save connection</Button>
    </Card>

    <Card className="space-y-4 bg-ak-surface">
      <h2 className="text-lg font-semibold text-ak-text-primary">
        Output Preferences
      </h2>
      <Input
        label="Cucumber Output Path"
        placeholder="./tests/generated"
      />
      <Input
        label="Coverage Report Email"
        placeholder="qa-lead@example.com"
      />
      <Button variant="outline" className="justify-center">
        Generate sample report
      </Button>
    </Card>
  </div>
);

export default DashboardAgentTracePage;

