import { Link } from 'react-router-dom';
import { useI18n } from '../../../i18n/useI18n';
import { DocsReferenceList } from '../../../components/common/DocsReferenceList';

export default function GitHubDocsPage() {
  const { t } = useI18n();
  const tx = (key: string) => t(key as never);

  return (
    <div>
      <h1>{tx('docs.github.title')}</h1>
      <p className="lead">{tx('docs.github.lead')}</p>

      <h2>{tx('docs.github.whatYouCanDo')}</h2>
      <ul>
        <li>Discover repositories you have access to</li>
        <li>Select branches for agent analysis</li>
        <li>Have agents create PRs with their output</li>
        <li>Set up webhook triggers for automation</li>
      </ul>

      <h2>{tx('docs.github.connecting')}</h2>
      <ol>
        <li>Navigate to <Link to="/dashboard/integrations">Dashboard → Integrations</Link></li>
        <li>Click &quot;Connect&quot; on the GitHub card</li>
        <li>Authorize AKIS on GitHub</li>
        <li>Grant access to your repositories</li>
      </ol>

      <h2>{tx('docs.github.permissions')}</h2>
      <ul>
        <li><code>read:user</code> - Access your profile information</li>
        <li><code>user:email</code> - Access your email addresses</li>
        <li><code>repo</code> - Full access to repositories (read/write)</li>
      </ul>

      <h2>{tx('docs.github.howAgentsUse')}</h2>
      <h3>Scribe</h3>
      <ul>
        <li>Reads recent commits to understand changes</li>
        <li>Analyzes file contents for documentation</li>
        <li>Creates branches for documentation updates</li>
        <li>Opens PRs with generated documentation</li>
      </ul>
      <h3>Trace</h3>
      <ul>
        <li>Reads repository and ticket context for test planning</li>
        <li>Generates traceable test matrix artifacts</li>
      </ul>

      <h2>{tx('docs.github.disconnecting')}</h2>
      <ol>
        <li>Go to <Link to="/dashboard/integrations">Integrations</Link></li>
        <li>Click &quot;Disconnect&quot; on the GitHub card</li>
      </ol>

      <h2>{tx('docs.github.troubleshooting')}</h2>
      <h3>OAuth callback error</h3>
      <ul>
        <li>Your browser allows pop-ups from github.com</li>
        <li>You are logged into the correct GitHub account</li>
        <li>The AKIS backend is running</li>
      </ul>

      <DocsReferenceList
        title={tx('docs.section.related')}
        items={[
          { label: 'Scribe Agent', href: '/docs/agents/scribe' },
          { label: tx('docs.mcp.title'), href: '/docs/integrations/mcp' },
          { label: tx('docs.oauth.title'), href: '/docs/security/oauth' },
        ]}
      />
    </div>
  );
}
