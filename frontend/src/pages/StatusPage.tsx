import Card from '../components/common/Card';
import { useI18n } from '../i18n/useI18n';

const StatusPage = () => {
  const { t } = useI18n();

  const services = [
    { name: t('status.services.api'), status: 'operational' },
    { name: t('status.services.agents'), status: 'operational' },
    { name: t('status.services.integrations'), status: 'operational' },
    { name: t('status.services.dashboard'), status: 'operational' },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-12 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="space-y-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ak-text-secondary/80">
          {t('status.label')}
        </p>
        <h1 className="text-3xl font-semibold text-ak-text-primary sm:text-4xl">
          {t('status.title')}
        </h1>
        <p className="mx-auto max-w-2xl text-base text-ak-text-secondary">
          {t('status.description')}
        </p>
      </header>

      {/* Overall Status */}
      <section className="text-center">
        <Card className="bg-ak-primary/5 border-ak-primary/20">
          <div className="flex items-center justify-center gap-3">
            <span className="flex h-4 w-4 items-center justify-center">
              <span className="absolute h-3 w-3 animate-ping rounded-full bg-ak-primary opacity-75" />
              <span className="relative h-3 w-3 rounded-full bg-ak-primary" />
            </span>
            <span className="text-lg font-semibold text-ak-primary">
              {t('status.operational')}
            </span>
          </div>
        </Card>
      </section>

      {/* Services */}
      <section className="space-y-4">
        {services.map((service) => (
          <Card key={service.name} className="bg-ak-surface">
            <div className="flex items-center justify-between">
              <span className="font-medium text-ak-text-primary">{service.name}</span>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-ak-primary" />
                <span className="text-sm text-ak-primary">Operational</span>
              </div>
            </div>
          </Card>
        ))}
      </section>

      {/* Uptime */}
      <section className="text-center">
        <p className="text-sm text-ak-text-secondary">{t('status.uptime')}</p>
      </section>

      {/* Incidents */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-ak-text-primary">
          {t('status.incidents.title')}
        </h2>
        <Card className="bg-ak-surface">
          <p className="text-center text-sm text-ak-text-secondary">
            {t('status.incidents.none')}
          </p>
        </Card>
      </section>

      {/* Subscribe */}
      <section className="text-center">
        <Card className="bg-ak-surface p-6">
          <p className="mb-4 text-sm text-ak-text-secondary">
            {t('status.subscribe')}
          </p>
          <div className="mx-auto flex max-w-md gap-2">
            <input
              type="email"
              placeholder="email@example.com"
              className="flex-1 rounded-xl border border-ak-border bg-ak-surface-2 px-4 py-2 text-sm text-ak-text-primary placeholder:text-ak-text-secondary/50 focus:border-ak-primary focus:outline-none focus:ring-2 focus:ring-ak-primary/50"
            />
            <button className="rounded-xl bg-ak-primary px-6 py-2 text-sm font-medium text-ak-bg transition-colors hover:bg-ak-primary/90">
              Subscribe
            </button>
          </div>
        </Card>
      </section>
    </div>
  );
};

export default StatusPage;
