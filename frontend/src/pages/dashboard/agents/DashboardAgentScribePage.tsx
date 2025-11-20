import { Link } from 'react-router-dom';
import Card from '../../../components/common/Card';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';

const DashboardAgentScribePage = () => (
  <div className="space-y-6">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-ak-text-primary">
          Scribe Configuration
        </h1>
        <p className="text-sm text-ak-text-secondary">
          Configuration editor coming soon. Current Scribe runs are configured by default templates.
        </p>
      </div>
      <div className="flex-shrink-0">
        <Button as={Link} to="/dashboard/agents/scribe/run">
          Run Scribe Now
        </Button>
      </div>
    </header>

    <Card className="space-y-4 bg-ak-surface">
      <h2 className="text-lg font-semibold text-ak-text-primary">
        Targets & Templates
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Confluence Space" placeholder="ENGDOCS" />
        <Input label="Template Key" placeholder="feature_spec" />
      </div>
      <Input
        label="Include Paths"
        placeholder="src/**, docs/**"
        description="Comma-separated glob patterns"
      />
      <Input
        label="Exclude Paths"
        placeholder="*.test.ts"
        description="Optional glob patterns to exclude"
      />
      <Button className="justify-center">Save changes</Button>
    </Card>

    <Card className="space-y-3 bg-ak-surface">
      <h2 className="text-lg font-semibold text-ak-text-primary">
        Playbook Preview
      </h2>
      <pre className="overflow-x-auto rounded-xl bg-ak-surface-2 p-4 text-sm text-ak-text-secondary">
        {`scribe:
  trigger: on_pr_merge
  review: auto_approve
  targets:
    - confluence_space: "ENGDOCS"
      template: "feature_spec"`}
      </pre>
      <p className="text-xs text-ak-text-secondary/80">
        TODO: Replace with YAML editor component.
      </p>
    </Card>
  </div>
);

export default DashboardAgentScribePage;

