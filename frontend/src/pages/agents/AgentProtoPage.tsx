import Card from '../../components/common/Card';

const AgentProtoPage = () => (
  <div className="mx-auto max-w-5xl space-y-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
    <header className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ak-text-secondary/80">
        Agent Detail
      </p>
      <h1 className="text-3xl font-semibold text-ak-text-primary sm:text-4xl">
        AKIS Proto — Rapid Prototyping
      </h1>
      <p className="max-w-3xl text-base text-ak-text-secondary">
        TODO: outline Proto&apos;s spec-to-MVP flow, scaffolding outputs, and
        integration hooks.
      </p>
    </header>

    <Card className="bg-ak-surface">
      <h2 className="text-xl font-semibold text-ak-text-primary">
        Prototype Pipeline
      </h2>
      <ul className="mt-4 space-y-2 text-sm text-ak-text-secondary">
        <li>TODO: Requirement ingestion and schema mapping.</li>
        <li>TODO: CRUD + auth scaffolding generation.</li>
        <li>TODO: Smoke test bundle and deployment guides.</li>
      </ul>
    </Card>

    <Card className="bg-ak-surface">
      <h2 className="text-xl font-semibold text-ak-text-primary">
        Playbook Stub
      </h2>
      <pre className="mt-4 overflow-x-auto rounded-xl bg-ak-surface-2 p-4 text-sm text-ak-text-secondary">
        {`proto:
  trigger: manual
  blueprint:
    source: "./docs/specs/mvp.yaml"
  outputs:
    - type: "service"
      target: "./generated"
    - type: "tests"
      include: ["smoke", "auth"]
  review: required`}
      </pre>
    </Card>

    <Card className="bg-ak-surface">
      <h2 className="text-xl font-semibold text-ak-text-primary">
        TODO: Add usage scenarios
      </h2>
      <p className="mt-3 text-sm text-ak-text-secondary">
        Placeholder for launch playbook, team roll-out checklist, and resource
        links.
      </p>
    </Card>
  </div>
);

export default AgentProtoPage;

