import { Link } from 'react-router-dom';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';

const DashboardAgentProtoPage = () => (
  <div className="space-y-6">
    <header className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ak-text-secondary/70">
        Coming Soon
      </p>
      <h1 className="text-2xl font-semibold text-ak-text-primary">Proto</h1>
      <p className="text-sm text-ak-text-secondary">
        Proto will bootstrap MVP scaffolds from product specs. For now, this space is
        reserved while Scribe takes priority.
      </p>
    </header>

    <Card className="space-y-3 bg-ak-surface">
      <h2 className="text-lg font-semibold text-ak-text-primary">Planned capabilities</h2>
      <ul className="space-y-2 text-sm text-ak-text-secondary">
        <li>1. Spec ingestion and architecture recommendations.</li>
        <li>2. Environment-aware scaffolding and repo bootstraps.</li>
        <li>3. Deploy previews with review checkpoints.</li>
      </ul>
      <p className="text-xs text-ak-text-secondary">
        TODO: Enable Proto once platform templates are production ready.
      </p>
    </Card>

    <Button as={Link} to="/dashboard/scribe" variant="outline" className="justify-center">
      Go to Scribe Console
    </Button>
  </div>
);

export default DashboardAgentProtoPage;
