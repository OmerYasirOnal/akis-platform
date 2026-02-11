import { useI18n } from '../../../i18n/useI18n';
import { DocsReferenceList } from '../../../components/common/DocsReferenceList';

export default function TroubleshootingPage() {
  const { t } = useI18n();
  const tx = (key: string) => t(key as never);

  return (
    <div>
      <h1>{tx('docs.troubleshooting.title')}</h1>
      <p className="lead">{tx('docs.troubleshooting.description')}</p>

      <h2>{tx('docs.troubleshooting.authIssues')}</h2>
      <h3>&quot;Unauthorized&quot; errors</h3>
      <ul>
        <li>Your session may have expired - try logging in again</li>
        <li>Clear your browser cookies and retry</li>
        <li>Ensure the backend server is running</li>
      </ul>

      <h3>OAuth callback fails</h3>
      <ul>
        <li>Verify the callback URL in GitHub OAuth App settings matches your backend URL</li>
        <li>Ensure your browser allows redirects</li>
      </ul>

      <h2>{tx('docs.troubleshooting.integrationIssues')}</h2>
      <h3>GitHub not showing repositories</h3>
      <ul>
        <li>Check that you granted access to the correct organization</li>
        <li>Verify you have at least read access to the repos</li>
        <li>Try disconnecting and reconnecting GitHub</li>
      </ul>

      <h3>Jira/Confluence connection fails</h3>
      <ul>
        <li>Verify your site URL is correct (e.g., your-domain.atlassian.net)</li>
        <li>Ensure your API token is valid and not expired</li>
        <li>Check that your Atlassian account has the required permissions</li>
      </ul>

      <h2>{tx('docs.troubleshooting.agentJobIssues')}</h2>
      <h3>Job stuck in &quot;pending&quot;</h3>
      <ul>
        <li>Check that the backend server is running</li>
        <li>Verify your AI key is configured in Settings → AI Keys</li>
        <li>Check backend logs for errors</li>
      </ul>

      <h3>Job failed with AI error</h3>
      <ul>
        <li>Verify your AI API key is valid</li>
        <li>Check if you have exceeded rate limits</li>
        <li>Try switching to a different AI provider</li>
      </ul>

      <h2>{tx('docs.troubleshooting.uiIssues')}</h2>
      <h3>&quot;Unexpected token&quot; JSON error</h3>
      <ul>
        <li>This usually means the API returned HTML instead of JSON</li>
        <li>Check that the backend server is running</li>
        <li>Verify the Vite proxy is configured correctly</li>
      </ul>

      <h2>{tx('docs.troubleshooting.dbIssues')}</h2>
      <h3>Migration errors</h3>
      <ul>
        <li>Ensure PostgreSQL is running: <code>docker compose up -d postgres</code></li>
        <li>Check DATABASE_URL in .env matches your database</li>
        <li>Run migrations: <code>pnpm -C backend db:migrate</code></li>
      </ul>

      <h2>{tx('docs.troubleshooting.gettingHelp')}</h2>
      <ul>
        <li><a href="https://github.com/OmerYasirOnal/akis-platform-devolopment/discussions" target="_blank" rel="noopener noreferrer">GitHub Discussions</a></li>
        <li><a href="https://github.com/OmerYasirOnal/akis-platform-devolopment/issues" target="_blank" rel="noopener noreferrer">GitHub Issues</a></li>
      </ul>

      <DocsReferenceList
        title={tx('docs.section.related')}
        items={[
          { label: tx('docs.bestPractices.title'), href: '/docs/guides/best-practices' },
          { label: tx('docs.gettingStarted.title'), href: '/docs/getting-started' },
          { label: tx('docs.selfHosting.title'), href: '/docs/guides/self-hosting' },
        ]}
      />
    </div>
  );
}
