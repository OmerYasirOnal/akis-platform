import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import { useI18n } from '../../i18n/useI18n';

const DocsConfigurationPage = () => {
  const { t } = useI18n();

  return (
    <div className="mx-auto max-w-4xl space-y-12 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="space-y-4">
        <nav className="text-sm text-ak-text-secondary">
          <Link to="/docs" className="hover:text-ak-primary">
            {t('docs.index.label')}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ak-text-primary">{t('docs.configuration.title')}</span>
        </nav>
        <h1 className="text-3xl font-semibold text-ak-text-primary">
          {t('docs.configuration.title')}
        </h1>
        <p className="text-ak-text-secondary">
          {t('docs.configuration.description')}
        </p>
      </header>

      {/* Introduction */}
      <section>
        <Card className="bg-ak-surface">
          <p className="text-ak-text-secondary leading-relaxed">
            {t('docs.configuration.content')}
          </p>
        </Card>
      </section>

      {/* Example Playbook */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-ak-text-primary">Example Playbook</h2>
        <Card className="bg-ak-surface-2">
          <pre className="overflow-x-auto text-sm text-ak-text-secondary">
            <code>{`# scribe-playbook.yaml
scribe:
  trigger: on_pr_merge
  targets:
    - confluence_space: "ENGDOCS"
      template: "feature_spec"
  review: auto_approve
  filters:
    include_paths: ["src/**", "docs/**"]
    exclude_paths: ["*.test.js"]`}</code>
          </pre>
        </Card>
      </section>

      {/* Environment Variables */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-ak-text-primary">Environment Variables</h2>
        <Card className="bg-ak-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ak-border text-left">
                <th className="pb-2 font-medium text-ak-text-primary">Variable</th>
                <th className="pb-2 font-medium text-ak-text-primary">Required</th>
                <th className="pb-2 font-medium text-ak-text-primary">Description</th>
              </tr>
            </thead>
            <tbody className="text-ak-text-secondary">
              <tr className="border-b border-ak-border/50">
                <td className="py-2 font-mono text-xs">GITHUB_TOKEN</td>
                <td className="py-2">Yes</td>
                <td className="py-2">GitHub App installation token</td>
              </tr>
              <tr className="border-b border-ak-border/50">
                <td className="py-2 font-mono text-xs">JIRA_API_TOKEN</td>
                <td className="py-2">Optional</td>
                <td className="py-2">Jira Cloud API token for Trace agent</td>
              </tr>
              <tr>
                <td className="py-2 font-mono text-xs">CONFLUENCE_SPACE</td>
                <td className="py-2">Optional</td>
                <td className="py-2">Default Confluence space for Scribe output</td>
              </tr>
            </tbody>
          </table>
        </Card>
      </section>

      {/* Navigation */}
      <section className="flex justify-between border-t border-ak-border pt-6">
        <Link
          to="/docs/agents"
          className="text-sm text-ak-text-secondary hover:text-ak-primary"
        >
          ← {t('docs.agents.title')}
        </Link>
        <Link
          to="/docs/integrations"
          className="text-sm text-ak-text-secondary hover:text-ak-primary"
        >
          {t('docs.integrations.title')} →
        </Link>
      </section>
    </div>
  );
};

export default DocsConfigurationPage;
