import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import { useI18n } from '../../i18n/useI18n';

const DocsApiReferencePage = () => {
  const { t } = useI18n();

  const endpoints = [
    {
      method: 'POST',
      path: '/api/jobs',
      description: 'Create a new agent job',
    },
    {
      method: 'GET',
      path: '/api/jobs/:id',
      description: 'Get job status and results',
    },
    {
      method: 'GET',
      path: '/api/jobs',
      description: 'List all jobs for the workspace',
    },
    {
      method: 'DELETE',
      path: '/api/jobs/:id',
      description: 'Cancel a running job',
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
          <span className="text-ak-text-primary">{t('docs.apiReference.title')}</span>
        </nav>
        <h1 className="text-3xl font-semibold text-ak-text-primary">
          {t('docs.apiReference.title')}
        </h1>
        <p className="text-ak-text-secondary">
          {t('docs.apiReference.description')}
        </p>
      </header>

      {/* Introduction */}
      <section>
        <Card className="bg-ak-surface">
          <p className="text-ak-text-secondary leading-relaxed">
            {t('docs.apiReference.content')}
          </p>
        </Card>
      </section>

      {/* Base URL */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-ak-text-primary">Base URL</h2>
        <Card className="bg-ak-surface-2">
          <code className="text-sm text-ak-primary">https://api.akis.dev/v1</code>
        </Card>
      </section>

      {/* Endpoints */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-ak-text-primary">Endpoints</h2>
        <Card className="bg-ak-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ak-border text-left">
                <th className="pb-2 font-medium text-ak-text-primary">Method</th>
                <th className="pb-2 font-medium text-ak-text-primary">Path</th>
                <th className="pb-2 font-medium text-ak-text-primary">Description</th>
              </tr>
            </thead>
            <tbody className="text-ak-text-secondary">
              {endpoints.map((endpoint, index) => (
                <tr
                  key={endpoint.path}
                  className={index < endpoints.length - 1 ? 'border-b border-ak-border/50' : ''}
                >
                  <td className="py-2">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        endpoint.method === 'POST'
                          ? 'bg-green-500/10 text-green-400'
                          : endpoint.method === 'DELETE'
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-blue-500/10 text-blue-400'
                      }`}
                    >
                      {endpoint.method}
                    </span>
                  </td>
                  <td className="py-2 font-mono text-xs">{endpoint.path}</td>
                  <td className="py-2">{endpoint.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      {/* Authentication */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-ak-text-primary">Authentication</h2>
        <Card className="bg-ak-surface">
          <p className="text-sm text-ak-text-secondary">
            All API requests require a Bearer token in the Authorization header:
          </p>
          <Card className="mt-4 bg-ak-surface-2">
            <code className="text-sm text-ak-text-secondary">
              Authorization: Bearer YOUR_API_KEY
            </code>
          </Card>
        </Card>
      </section>

      {/* Navigation */}
      <section className="flex justify-between border-t border-ak-border pt-6">
        <Link
          to="/docs/integrations"
          className="text-sm text-ak-text-secondary hover:text-ak-primary"
        >
          ← {t('docs.integrations.title')}
        </Link>
        <Link
          to="/docs/architecture"
          className="text-sm text-ak-text-secondary hover:text-ak-primary"
        >
          {t('docs.architecture.title')} →
        </Link>
      </section>
    </div>
  );
};

export default DocsApiReferencePage;
