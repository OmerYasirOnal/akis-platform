import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import { useI18n } from '../../i18n/useI18n';

const DocsArchitecturePage = () => {
  const { t } = useI18n();

  const components = [
    {
      name: 'API Gateway',
      description: 'Fastify-based REST API handling authentication, routing, and rate limiting.',
    },
    {
      name: 'Agent Orchestrator',
      description: 'Manages agent lifecycle, job scheduling, and state transitions.',
    },
    {
      name: 'Integration Hub',
      description: 'OAuth-based connections to GitHub, Jira, and Confluence.',
    },
    {
      name: 'Job Executor',
      description: 'Runs agent playbooks with transparent logging and guardrails.',
    },
    {
      name: 'PostgreSQL',
      description: 'Primary data store using Drizzle ORM for type-safe queries.',
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
          <span className="text-ak-text-primary">{t('docs.architecture.title')}</span>
        </nav>
        <h1 className="text-3xl font-semibold text-ak-text-primary">
          {t('docs.architecture.title')}
        </h1>
        <p className="text-ak-text-secondary">
          {t('docs.architecture.description')}
        </p>
      </header>

      {/* Introduction */}
      <section>
        <Card className="bg-ak-surface">
          <p className="text-ak-text-secondary leading-relaxed">
            {t('docs.architecture.content')}
          </p>
        </Card>
      </section>

      {/* Architecture Diagram */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-ak-text-primary">System Overview</h2>
        <Card className="bg-ak-surface-2 p-8">
          <div className="flex flex-col items-center gap-4 text-center text-sm text-ak-text-secondary">
            <div className="rounded border border-ak-primary/50 bg-ak-primary/10 px-6 py-3">
              React Frontend
            </div>
            <div className="h-6 w-px bg-ak-border" />
            <div className="rounded border border-ak-border bg-ak-surface px-6 py-3">
              Fastify API Gateway
            </div>
            <div className="h-6 w-px bg-ak-border" />
            <div className="flex gap-4">
              <div className="rounded border border-ak-border bg-ak-surface px-4 py-2">
                Orchestrator
              </div>
              <div className="rounded border border-ak-border bg-ak-surface px-4 py-2">
                Job Executor
              </div>
            </div>
            <div className="h-6 w-px bg-ak-border" />
            <div className="rounded border border-ak-border bg-ak-surface px-6 py-3">
              PostgreSQL + Drizzle
            </div>
          </div>
        </Card>
      </section>

      {/* Components */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-ak-text-primary">Core Components</h2>
        {components.map((component) => (
          <Card key={component.name} className="bg-ak-surface">
            <h3 className="font-semibold text-ak-text-primary">{component.name}</h3>
            <p className="mt-1 text-sm text-ak-text-secondary">{component.description}</p>
          </Card>
        ))}
      </section>

      {/* Navigation */}
      <section className="flex justify-between border-t border-ak-border pt-6">
        <Link
          to="/docs/api-reference"
          className="text-sm text-ak-text-secondary hover:text-ak-primary"
        >
          ← {t('docs.apiReference.title')}
        </Link>
        <Link
          to="/docs/troubleshooting"
          className="text-sm text-ak-text-secondary hover:text-ak-primary"
        >
          {t('docs.troubleshooting.title')} →
        </Link>
      </section>
    </div>
  );
};

export default DocsArchitecturePage;
