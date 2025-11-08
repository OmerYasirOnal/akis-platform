import Card from '../../components/common/Card';

const AgentScribePage = () => (
  <div className="mx-auto max-w-5xl space-y-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
    <header className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ak-text-secondary/80">
        Agent Detail
      </p>
      <h1 className="text-3xl font-semibold text-ak-text-primary sm:text-4xl">
        AKIS Scribe — Documentation Automation
      </h1>
      <p className="max-w-3xl text-base text-ak-text-secondary">
        TODO: expand with full feature copy, demo media, and CTA buttons per
        information architecture.
      </p>
    </header>

    <Card className="bg-ak-surface">
      <h2 className="text-xl font-semibold text-ak-text-primary">
        How It Works
      </h2>
      <ul className="mt-4 space-y-2 text-sm text-ak-text-secondary">
        <li>TODO: PR monitoring and diff analysis workflow.</li>
        <li>TODO: Smart merge with Confluence and wiki targets.</li>
        <li>TODO: Release note generation pipeline.</li>
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

