import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';

const DashboardSettingsBillingPage = () => (
  <div className="space-y-6">
    <header className="space-y-2">
      <h1 className="text-2xl font-semibold text-ak-text-primary">
        Billing
      </h1>
      <p className="text-sm text-ak-text-secondary">
        Placeholder for billing overview, invoices, and payment method
        management.
      </p>
    </header>

    <Card className="space-y-3 bg-ak-surface">
      <h2 className="text-lg font-semibold text-ak-text-primary">
        Current Plan
      </h2>
      <p className="text-sm text-ak-text-secondary">
        TODO: show plan tier, renewal date, and usage metrics.
      </p>
      <Button variant="secondary" className="justify-center">
        Upgrade plan
      </Button>
    </Card>

    <Card className="space-y-3 bg-ak-surface">
      <h2 className="text-lg font-semibold text-ak-text-primary">
        Payment Method
      </h2>
      <p className="text-sm text-ak-text-secondary">
        TODO: integrate with billing provider for card management.
      </p>
      <Button variant="outline" className="justify-center">
        Update payment method
      </Button>
    </Card>
  </div>
);

export default DashboardSettingsBillingPage;

