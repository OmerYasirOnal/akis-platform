import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import { useI18n } from '../../i18n/useI18n';

const DocsTroubleshootingPage = () => {
  const { t } = useI18n();

  const issues = [
    {
      problem: 'Agent job stuck in "pending" state',
      solution: 'Check if the GitHub App has proper permissions. Reinstall the app and verify repository access.',
    },
    {
      problem: 'Confluence pages not updating',
      solution: 'Verify Confluence OAuth token is not expired. Re-authenticate in Settings → Integrations.',
    },
    {
      problem: 'Test generation produces empty output',
      solution: 'Ensure Jira issues have properly formatted acceptance criteria. Check playbook template configuration.',
    },
    {
      problem: 'Rate limit errors from GitHub',
      solution: 'Upgrade to Pro plan for higher API limits, or reduce agent frequency in playbook settings.',
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
          <span className="text-ak-text-primary">{t('docs.troubleshooting.title')}</span>
        </nav>
        <h1 className="text-3xl font-semibold text-ak-text-primary">
          {t('docs.troubleshooting.title')}
        </h1>
        <p className="text-ak-text-secondary">
          {t('docs.troubleshooting.description')}
        </p>
      </header>

      {/* Introduction */}
      <section>
        <Card className="bg-ak-surface">
          <p className="text-ak-text-secondary leading-relaxed">
            {t('docs.troubleshooting.content')}
          </p>
        </Card>
      </section>

      {/* Common Issues */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-ak-text-primary">Common Issues</h2>
        {issues.map((issue) => (
          <Card key={issue.problem} className="bg-ak-surface">
            <h3 className="font-semibold text-ak-text-primary">{issue.problem}</h3>
            <p className="mt-2 text-sm text-ak-text-secondary">{issue.solution}</p>
          </Card>
        ))}
      </section>

      {/* Contact Support */}
      <section>
        <Card className="bg-ak-surface text-center">
          <h3 className="font-semibold text-ak-text-primary">Still need help?</h3>
          <p className="mt-2 text-sm text-ak-text-secondary">
            Contact our support team at{' '}
            <a href="mailto:support@akis.dev" className="text-ak-primary hover:underline">
              support@akis.dev
            </a>
          </p>
        </Card>
      </section>

      {/* Navigation */}
      <section className="flex justify-between border-t border-ak-border pt-6">
        <Link
          to="/docs/architecture"
          className="text-sm text-ak-text-secondary hover:text-ak-primary"
        >
          ← {t('docs.architecture.title')}
        </Link>
        <Link
          to="/docs"
          className="text-sm text-ak-text-secondary hover:text-ak-primary"
        >
          {t('docs.index.title')} →
        </Link>
      </section>
    </div>
  );
};

export default DocsTroubleshootingPage;
