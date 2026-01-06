import Card from '../../../components/common/Card';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';

const DashboardAgentProtoPage = () => (
  <div className="space-y-6">
    <header className="space-y-2">
      <h1 className="text-2xl font-semibold text-ak-text-primary">
        Proto Configuration
      </h1>
      <p className="text-sm text-ak-text-secondary">
        TODO: add spec upload, review gates, and deployment targets once APIs
        are available.
      </p>
    </header>

    <Card className="space-y-4 bg-ak-surface">
      <h2 className="text-lg font-semibold text-ak-text-primary">
        Blueprint Inputs
      </h2>
      <Input label="Spec Repository Path" placeholder="docs/specs/mvp.yaml" />
      <Input label="Default Framework" placeholder="Vite + Fastify" />
      <Input label="Database Target" placeholder="PostgreSQL" />
    </Card>

    <Card className="space-y-3 bg-ak-surface">
      <h2 className="text-lg font-semibold text-ak-text-primary">
        Deployment Targets
      </h2>
      <p className="text-sm text-ak-text-secondary">
        TODO: let teams pick OCI, AWS, or custom runners.
      </p>
      <Button className="justify-center">Add deployment target</Button>
    </Card>
  </div>
);

export default DashboardAgentProtoPage;

