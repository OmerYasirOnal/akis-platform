import { useI18n } from '../i18n/useI18n';
import ModuleCard from './ModuleCard';

/**
 * Agents Section
 * Showcases the three AKIS agents with glass-morphism cards
 */
export default function ModulesSection() {
  const { t } = useI18n();

  return (
    <section className="relative px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full bg-ak-primary/10 px-4 py-1.5 text-sm font-medium text-ak-primary">
            AI Agents
          </span>
          <h2 className="mb-4 text-[clamp(28px,4vw,40px)] font-bold text-ak-text-primary">
            {t('modules.title')}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-ak-text-secondary">
            {t('modules.subtitle')}
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
