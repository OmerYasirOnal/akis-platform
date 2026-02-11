import { Link } from 'react-router-dom';
import { useI18n } from '../../../i18n/useI18n';
import { DocsReferenceList } from '../../../components/common/DocsReferenceList';

export default function ApiKeysDocsPage() {
  const { t } = useI18n();
  const tx = (key: string) => t(key as never);

  return (
    <div>
      <h1>{tx('docs.apiKeys.title')}</h1>
      <p className="lead">{tx('docs.apiKeys.lead')}</p>

      <h2>{tx('docs.apiKeys.encryption')}</h2>
      <p>All sensitive credentials are encrypted using <strong>AES-256-GCM</strong> before storage:</p>
      <ul>
        <li>256-bit encryption key</li>
        <li>Unique IV (Initialization Vector) per key</li>
        <li>Authentication tag for integrity verification</li>
        <li>Key versioning for rotation support</li>
      </ul>

      <h2>{tx('docs.apiKeys.whatsEncrypted')}</h2>
      <ul>
        <li>AI provider API keys (OpenAI, OpenRouter)</li>
        <li>Atlassian API tokens</li>
        <li>GitHub OAuth tokens</li>
        <li>Any future integration credentials</li>
      </ul>

      <h2>{tx('docs.apiKeys.keyDisplay')}</h2>
      <p>Only the last 4 characters of any key are displayed in the UI. The full key is never returned from the API.</p>

      <h2>{tx('docs.apiKeys.serverSideOnly')}</h2>
      <ul>
        <li>Never sent to the browser</li>
        <li>Never included in API responses</li>
        <li>Never logged (even in debug mode)</li>
        <li>Only decrypted when needed for API calls</li>
      </ul>

      <h2>{tx('docs.apiKeys.configuring')}</h2>
      <ol>
        <li>Go to <Link to="/dashboard/settings/ai-keys">Settings → AI Keys</Link></li>
        <li>Select a provider (OpenAI or OpenRouter)</li>
        <li>Enter your API key</li>
        <li>Click &quot;Save&quot;</li>
      </ol>

      <h2>{tx('docs.apiKeys.rotation')}</h2>
      <p>To rotate a key, simply save a new key. The old encrypted key is overwritten.</p>

      <h2>{tx('docs.apiKeys.envVars')}</h2>
      <pre><code>{`AI_KEY_ENCRYPTION_KEY=your-32-character-encryption-key`}</code></pre>
      <p>This key should be at least 32 characters. Never commit it to version control.</p>

      <DocsReferenceList
        title={tx('docs.section.related')}
        items={[
          { label: tx('docs.oauth.title'), href: '/docs/security/oauth' },
          { label: tx('docs.privacy.title'), href: '/docs/security/privacy' },
          { label: tx('docs.gettingStarted.title'), href: '/docs/getting-started' },
        ]}
      />
    </div>
  );
}
