import { Link } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useI18n } from '../i18n/useI18n';

const IntegrationsPage = () => {
  const { t } = useI18n();

  const liveIntegrations = [
    {
      name: t('integrations.github.title'),
      description: t('integrations.github.description'),
      status: t('integrations.github.status'),
      isLive: true,
      logo: (
        <svg className="h-10 w-10" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
      ),
    },
    {
      name: t('integrations.jira.title'),
      description: t('integrations.jira.description'),
      status: t('integrations.jira.status'),
      isLive: true,
      logo: (
        <svg className="h-10 w-10" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.758a1.001 1.001 0 0 0-1.001-1.001zM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24 12.483V1.005A1.001 1.001 0 0 0 23.013 0z" />
        </svg>
      ),
    },
    {
      name: t('integrations.confluence.title'),
      description: t('integrations.confluence.description'),
      status: t('integrations.confluence.status'),
      isLive: true,
      logo: (
        <svg className="h-10 w-10" viewBox="0 0 24 24" fill="currentColor">
          <path d="M.87 18.257c-.248.382-.53.875-.763 1.245a.764.764 0 0 0 .255 1.04l4.965 3.054a.764.764 0 0 0 1.058-.26c.199-.332.454-.763.733-1.221 1.967-3.247 3.945-2.853 7.508-1.146l4.957 2.375a.764.764 0 0 0 1.028-.382l2.36-5.023a.764.764 0 0 0-.382-1.028c-.852-.4-2.47-1.168-3.944-1.893-5.252-2.585-9.22-2.85-13.775 3.24zM23.131 5.743c.248-.382.53-.875.763-1.246a.764.764 0 0 0-.256-1.04L18.673.404a.764.764 0 0 0-1.058.26c-.199.332-.454.763-.733 1.221-1.967 3.247-3.944 2.853-7.508 1.146L4.42.656a.764.764 0 0 0-1.028.382L1.032 6.06a.764.764 0 0 0 .382 1.028c.852.4 2.47 1.168 3.944 1.893 5.251 2.585 9.22 2.85 13.774-3.239z" />
        </svg>
      ),
    },
  ];

  const comingSoon = [
    {
      name: t('integrations.gitlab.title'),
      description: t('integrations.gitlab.description'),
      status: t('integrations.gitlab.status'),
    },
    {
      name: t('integrations.azure.title'),
      description: t('integrations.azure.description'),
      status: t('integrations.azure.status'),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="space-y-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ak-text-secondary/80">
          {t('integrations.label')}
        </p>
        <h1 className="text-3xl font-semibold text-ak-text-primary sm:text-4xl">
          {t('integrations.title')}
        </h1>
        <p className="mx-auto max-w-2xl text-base text-ak-text-secondary">
          {t('integrations.description')}
        </p>
      </header>

      {/* Live Integrations */}
      <section className="grid gap-6 md:grid-cols-3">
        {liveIntegrations.map((integration) => (
          <Card key={integration.name} className="flex flex-col bg-ak-surface p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-ak-text-primary">{integration.logo}</div>
              <span className="rounded-full bg-ak-primary/10 px-3 py-1 text-xs font-medium text-ak-primary">
                {integration.status}
              </span>
            </div>
            <h2 className="mb-2 text-lg font-semibold text-ak-text-primary">
              {integration.name}
            </h2>
            <p className="flex-1 text-sm text-ak-text-secondary">
              {integration.description}
            </p>
          </Card>
        ))}
      </section>

      {/* Coming Soon */}
      <section className="space-y-6">
        <h2 className="text-center text-xl font-semibold text-ak-text-primary">
          {t('integrations.gitlab.status')}
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {comingSoon.map((integration) => (
            <Card key={integration.name} className="bg-ak-surface/50 p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-ak-text-primary">{integration.name}</h3>
                <span className="rounded-full bg-ak-text-secondary/10 px-3 py-1 text-xs font-medium text-ak-text-secondary">
                  {integration.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-ak-text-secondary">
                {integration.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Request Integration */}
      <section className="text-center">
        <Card className="mx-auto max-w-lg bg-ak-surface p-8">
          <h2 className="mb-2 text-lg font-semibold text-ak-text-primary">
            {t('integrations.request.title')}
          </h2>
          <p className="mb-6 text-sm text-ak-text-secondary">
            {t('integrations.request.description')}
          </p>
          <Button as={Link} to="/contact" variant="outline">
            {t('integrations.request.cta')}
          </Button>
        </Card>
      </section>
    </div>
  );
};

export default IntegrationsPage;
