import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import { useI18n } from '../../i18n/useI18n';

const DocsIntegrationsPage = () => {
  const { t } = useI18n();

  const integrations = [
    {
      name: 'GitHub',
      description: 'Connect via GitHub App OAuth flow. Required scopes: repo, pull_request, issues.',
      status: 'Supported',
    },
    {
      name: 'Jira Cloud',
      description: 'OAuth 2.0 integration with Atlassian Cloud. Required scopes: read:jira-work, write:jira-work.',
      status: 'Supported',
    },
    {
      name: 'Confluence',
      description: 'Publish documentation directly to Confluence spaces. Supports page creation and updates.',
      status: 'Supported',
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-12 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="space-y-4">
        <nav className="text-sm text-ak-text-secondary">
          <Link to="/docs" className="hover:text-ak-primary">
            {t('docs.index.label')}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ak-text-primary">{t('docs.integrations.title')}</span>
        </nav>
        <h1 className="text-3xl font-semibold text-ak-text-primary">
          {t('docs.integrations.title')}
        </h1>
        <p className="text-ak-text-secondary">
          {t('docs.integrations.description')}
        </p>
      </header>

      {/* Introduction */}
      <section>
        <Card className="bg-ak-surface">
          <p className="text-ak-text-secondary leading-relaxed">
            {t('docs.integrations.content')}
          </p>
        </Card>
      </section>

      {/* Integrations */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-ak-text-primary">Available Integrations</h2>
        {integrations.map((integration) => (
          <Card key={integration.name} className="bg-ak-surface">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-ak-text-primary">{integration.name}</h3>
              <span className="rounded-full bg-ak-primary/10 px-3 py-1 text-xs font-medium text-ak-primary">
                {integration.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-ak-text-secondary">{integration.description}</p>
          </Card>
        ))}
      </section>

      {/* Navigation */}
      <section className="flex justify-between border-t border-ak-border pt-6">
        <Link
          to="/docs/configuration"
          className="text-sm text-ak-text-secondary hover:text-ak-primary"
        >
          ← {t('docs.configuration.title')}
        </Link>
        <Link
          to="/docs/api-reference"
          className="text-sm text-ak-text-secondary hover:text-ak-primary"
        >
          {t('docs.apiReference.title')} →
        </Link>
      </section>
    </div>
  );
};

export default DocsIntegrationsPage;
