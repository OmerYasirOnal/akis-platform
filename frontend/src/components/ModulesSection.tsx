import ModuleCard from './ModuleCard';

export default function ModulesSection() {
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-[clamp(32px,4vw,48px)] font-semibold text-[var(--text)]">
            Meet the AKIS Agents
          </h2>
          <p className="mx-auto max-w-2xl text-[clamp(16px,2vw,18px)] text-[var(--muted)]">
            Three powerful agents that automate documentation, testing, and prototyping workflows.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <ModuleCard module="scribe" />
          <ModuleCard module="trace" />
          <ModuleCard module="proto" />
        </div>
      </div>
    </section>
  );
}

