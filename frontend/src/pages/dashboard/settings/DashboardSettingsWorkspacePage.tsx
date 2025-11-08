import Card from '../../../components/common/Card';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';

const DashboardSettingsWorkspacePage = () => (
  <div className="space-y-6">
    <header className="space-y-2">
      <h1 className="text-2xl font-semibold text-ak-text-primary">
        Workspace Settings
      </h1>
      <p className="text-sm text-ak-text-secondary">
        Manage workspace metadata and lifecycle controls.
      </p>
    </header>

    <Card className="space-y-4 bg-ak-surface">
      <Input label="Workspace Name" placeholder="AKIS Demo Workspace" />
      <Input
        label="Workspace ID"
        placeholder="ws_demo"
        description="Read-only identifier"
        disabled
      />
      <Button className="justify-center">Save workspace info</Button>
    </Card>

    <Card className="space-y-3 bg-ak-surface">
      <h2 className="text-lg font-semibold text-ak-text-primary">
        Danger Zone
      </h2>
      <p className="text-sm text-ak-text-secondary">
        TODO: confirm destructive actions with modal + RBAC guard.
      </p>
      <Button variant="outline" className="justify-center">
        Delete workspace
      </Button>
    </Card>
  </div>
);

export default DashboardSettingsWorkspacePage;

