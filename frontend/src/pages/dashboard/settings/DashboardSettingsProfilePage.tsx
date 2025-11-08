import Card from '../../../components/common/Card';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';

const DashboardSettingsProfilePage = () => (
  <div className="space-y-6">
    <header className="space-y-2">
      <h1 className="text-2xl font-semibold text-ak-text-primary">
        Profile Settings
      </h1>
      <p className="text-sm text-ak-text-secondary">
        Update personal information and credentials. TODO: wire to real profile
        API.
      </p>
    </header>

    <Card className="space-y-4 bg-ak-surface">
      <Input label="Full Name" placeholder="AKIS Member" />
      <Input label="Email" placeholder="user@example.com" />
      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        description="TODO: add password strength validation."
      />
      <Button className="justify-center">Save profile</Button>
    </Card>
  </div>
);

export default DashboardSettingsProfilePage;

