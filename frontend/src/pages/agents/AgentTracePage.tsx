import Card from '../../components/common/Card';

const AgentTracePage = () => (
  <div className="mx-auto max-w-5xl space-y-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
    <header className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ak-text-secondary/80">
        Agent Detail
      </p>
      <h1 className="text-3xl font-semibold text-ak-text-primary sm:text-4xl">
        AKIS Trace — Test Intelligence
      </h1>
      <p className="max-w-3xl text-base text-ak-text-secondary">
        TODO: describe Trace value proposition, test generation pipeline, and
        flaky detection outcomes.
      </p>
    </header>

    <Card className="bg-ak-surface">
      <h2 className="text-xl font-semibold text-ak-text-primary">
        Core Capabilities
      </h2>
      <ul className="mt-4 space-y-2 text-sm text-ak-text-secondary">
        <li>TODO: Jira ticket parsing & acceptance criteria extraction.</li>
        <li>TODO: Test coverage hints & flaky area reports.</li>
        <li>TODO: Integration with CI feedback loops.</li>
      </ul>
    </Card>

    <Card className="bg-ak-surface">
      <h2 className="text-xl font-semibold text-ak-text-primary">
        Configuration Skeleton
      </h2>
      <pre className="mt-4 overflow-x-auto rounded-xl bg-ak-surface-2 p-4 text-sm text-ak-text-secondary">
        {`trace:
  trigger: on_sprint_commit
  inputs:
    - jira_project: "AKIS"
      include_labels: ["beta", "critical"]
  outputs:
    cucumber: true
    flaky_report: true`}
      </pre>
    </Card>

    <Card className="bg-ak-surface">
      <h2 className="text-xl font-semibold text-ak-text-primary">Next Steps</h2>
      <p className="mt-3 text-sm text-ak-text-secondary">
        Placeholder for walkthrough videos, reference architectures, and CTA
        buttons.
      </p>
    </Card>
  </div>
);

export default AgentTracePage;

