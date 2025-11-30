import ModuleCard from './ModuleCard';

/**
 * Agents Section
 * Design system: py-16 → py-24 spacing, typography tokens
 */
export default function ModulesSection() {
  return (
    <section className="bg-ak-bg px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-[clamp(28px,4vw,40px)] font-bold text-ak-text-primary">
            Meet the AKIS Agents
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-ak-text-secondary">
            Three powerful agents that automate documentation, testing, and
            prototyping workflows.
          </p>
        </div>

        {/* Agent cards grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <ModuleCard module="scribe" />
          <ModuleCard module="trace" />
          <ModuleCard module="proto" />
        </div>
      </div>
    </section>
  );
}
