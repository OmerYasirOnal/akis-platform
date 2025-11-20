import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

const AgentScribePage = () => (
  <div className="mx-auto max-w-5xl space-y-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
    <header className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ak-text-secondary/80">
        Agent Detail
      </p>
      <h1 className="text-3xl font-semibold text-ak-text-primary sm:text-4xl">
        AKIS Scribe — Documentation Automation
      </h1>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <p className="max-w-3xl text-base text-ak-text-secondary">
          Automate your software documentation workflow. AKIS Scribe monitors your changes, generates comprehensive documentation, and syncs it with Confluence and GitHub.
        </p>
        <div className="flex-shrink-0">
          <Button as={Link} to="/dashboard/agents/scribe/run">
            Run Scribe in Dashboard
          </Button>
        </div>
      </div>
    </header>

    <Card className="bg-ak-surface">
      <h2 className="text-xl font-semibold text-ak-text-primary">
        How It Works
      </h2>
      <ul className="mt-4 space-y-2 text-sm text-ak-text-secondary">
        <li>• Automated PR analysis and documentation generation.</li>
        <li>• Seamless integration with GitHub and Confluence.</li>
        <li>• Consistent, up-to-date technical specifications.</li>
      </ul>
    </Card>

    <Card className="bg-ak-surface">
      <h2 className="text-xl font-semibold text-ak-text-primary">
        Configuration Example
      </h2>
      <pre className="mt-4 overflow-x-auto rounded-xl bg-ak-surface-2 p-4 text-sm text-ak-text-secondary">
        {`scribe:
  trigger: on_pr_merge
  targets:
    - confluence_space: "ENGDOCS"
      template: "feature_spec"
  review: auto_approve
  filters:
    include_paths:
      - "src/**"
      - "docs/**"`}
      </pre>
    </Card>

    <Card className="bg-ak-surface">
      <h2 className="text-xl font-semibold text-ak-text-primary">
        TODO: Add testimonials & case studies
      </h2>
      <p className="mt-3 text-sm text-ak-text-secondary">
        Placeholder for customer quotes, time-saved metrics, and CTA links to
        docs and onboarding.
      </p>
    </Card>
  </div>
);

export default AgentScribePage;

