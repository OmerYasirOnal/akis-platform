import { Link } from 'react-router-dom';
import { useI18n } from '../../../i18n/useI18n';
import { DocsReferenceList } from '../../../components/common/DocsReferenceList';

export default function AtlassianDocsPage() {
  const { t } = useI18n();
  const tx = (key: string) => t(key as never);

  return (
    <div>
      <h1>{tx('docs.atlassian.title')}</h1>
      <p className="lead">{tx('docs.atlassian.lead')}</p>

      <h2>{tx('docs.atlassian.jira')}</h2>
      <ul>
        <li>Link agent jobs to Jira issues</li>
        <li>Auto-update ticket status when jobs complete</li>
        <li>Sync changelog entries to release tickets</li>
        <li>Use Trace agent to generate test plans from specs</li>
      </ul>

      <h2>{tx('docs.atlassian.confluence')}</h2>
      <ul>
        <li>Publish generated documentation directly</li>
        <li>Keep technical docs in sync with code</li>
        <li>Create pages in specified spaces</li>
        <li>Update existing pages with new content</li>
      </ul>

      <h2>{tx('docs.atlassian.connecting')}</h2>
      <ol>
        <li>Go to <Link to="/dashboard/integrations">Dashboard → Integrations</Link></li>
        <li>Click &quot;Connect&quot; on Jira or Confluence</li>
        <li>Enter your Atlassian Cloud site URL</li>
        <li>Enter your Atlassian email and API token</li>
      </ol>

      <h2>{tx('docs.atlassian.apiToken')}</h2>
      <ol>
        <li>Go to <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noopener noreferrer">Atlassian API Tokens</a></li>
        <li>Click &quot;Create API token&quot;</li>
        <li>Give it a label (e.g., &quot;AKIS Platform&quot;)</li>
        <li>Copy the token</li>
      </ol>

      <h2>{tx('docs.atlassian.security')}</h2>
      <p>Your API token is encrypted using AES-256-GCM before storage. Only the last 4 characters are displayed. Tokens are never logged or exposed to the frontend.</p>

      <DocsReferenceList
        title={tx('docs.section.related')}
        items={[
          { label: 'Trace Agent', href: '/docs/agents/trace' },
          { label: 'Scribe Agent', href: '/docs/agents/scribe' },
          { label: tx('docs.apiKeys.title'), href: '/docs/security/api-keys' },
        ]}
      />
    </div>
  );
}
