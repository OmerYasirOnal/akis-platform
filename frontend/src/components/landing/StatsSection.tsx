import { useI18n } from '../../i18n/useI18n';

interface CapabilityCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function CapabilityCard({ icon, title, description }: CapabilityCardProps) {
  return (
    <div className="group relative flex flex-col items-center rounded-2xl border border-ak-border bg-ak-surface-2/50 p-6 text-center backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-ak-primary/40 hover:shadow-ak-elevation-2">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-ak-primary/10 text-ak-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-ak-primary/20">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-ak-text-primary">
        {title}
      </h3>
      <p className="text-sm text-ak-text-secondary">
        {description}
      </p>
    </div>
  );
}

export default function StatsSection() {
  const { t } = useI18n();

  const capabilities: CapabilityCardProps[] = [
    {
      title: t('landing.capabilities.agents.title'),
      description: t('landing.capabilities.agents.desc'),
      icon: (
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 14.5M14.25 3.104c.251.023.501.05.75.082M19.8 14.5l-2.641 2.641a2.25 2.25 0 01-2.455.494l-.862-.345a2.25 2.25 0 00-1.684 0l-.862.345a2.25 2.25 0 01-2.455-.494L6.2 14.5" />
        </svg>
      ),
    },
    {
      title: t('landing.capabilities.orchestrator.title'),
      description: t('landing.capabilities.orchestrator.desc'),
      icon: (
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z" />
        </svg>
      ),
    },
    {
      title: t('landing.capabilities.quality.title'),
      description: t('landing.capabilities.quality.desc'),
      icon: (
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      ),
    },
    {
      title: t('landing.capabilities.mcp.title'),
      description: t('landing.capabilities.mcp.desc'),
      icon: (
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
        </svg>
      ),
    },
  ];

  return (
    <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="absolute inset-0 bg-gradient-to-b from-ak-primary/5 via-transparent to-transparent" />

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <span className="mb-4 inline-block rounded-full bg-ak-primary/10 px-4 py-1.5 text-sm font-medium text-ak-primary">
            {t('landing.capabilities.label')}
          </span>
          <h2 className="mb-4 text-[clamp(28px,4vw,40px)] font-bold text-ak-text-primary">
            {t('landing.capabilities.title')}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-ak-text-secondary">
            {t('landing.capabilities.subtitle')}
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {capabilities.map((cap, index) => (
            <CapabilityCard key={index} {...cap} />
          ))}
        </div>
      </div>
    </section>
  );
}
