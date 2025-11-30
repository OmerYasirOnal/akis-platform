import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import { useI18n } from '../../i18n/useI18n';

const DocsAgentsPage = () => {
  const { t } = useI18n();

  const agents = [
    {
      name: 'Scribe',
      title: t('about.lineup.scribe.title'),
      subtitle: t('about.lineup.scribe.subtitle'),
      description: t('agents.scribe.heroDescription'),
      link: '/agents/scribe',
    },
    {
      name: 'Trace',
      title: t('about.lineup.trace.title'),
      subtitle: t('about.lineup.trace.subtitle'),
      description: t('agents.trace.heroDescription'),
      link: '/agents/trace',
    },
    {
      name: 'Proto',
      title: t('about.lineup.proto.title'),
      subtitle: t('about.lineup.proto.subtitle'),
      description: t('agents.proto.heroDescription'),
      link: '/agents/proto',
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
          <span className="text-ak-text-primary">{t('docs.agents.title')}</span>
        </nav>
        <h1 className="text-3xl font-semibold text-ak-text-primary">
          {t('docs.agents.title')}
        </h1>
        <p className="text-ak-text-secondary">
          {t('docs.agents.description')}
        </p>
      </header>

      {/* Introduction */}
      <section>
        <Card className="bg-ak-surface">
          <p className="text-ak-text-secondary leading-relaxed">
            {t('docs.agents.content')}
          </p>
        </Card>
      </section>

      {/* Agents */}
      <section className="space-y-6">
        {agents.map((agent) => (
          <Link key={agent.name} to={agent.link} className="block group">
            <Card className="bg-ak-surface transition-all hover:-translate-y-1 hover:border-ak-primary/50">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-ak-text-primary group-hover:text-ak-primary">
                    {agent.title}
                  </h2>
                  <p className="text-sm text-ak-primary">{agent.subtitle}</p>
                </div>
                <span className="text-ak-text-secondary group-hover:text-ak-primary">→</span>
              </div>
              <p className="mt-3 text-sm text-ak-text-secondary">
                {agent.description}
              </p>
            </Card>
          </Link>
        ))}
      </section>

      {/* Navigation */}
      <section className="flex justify-between border-t border-ak-border pt-6">
        <Link
          to="/docs/getting-started"
          className="text-sm text-ak-text-secondary hover:text-ak-primary"
        >
          ← {t('docs.gettingStarted.title')}
        </Link>
        <Link
          to="/docs/configuration"
          className="text-sm text-ak-text-secondary hover:text-ak-primary"
        >
          {t('docs.configuration.title')} →
        </Link>
      </section>
    </div>
  );
};

export default DocsAgentsPage;
