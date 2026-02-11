import { useI18n } from '../../../i18n/useI18n';
import { DocsReferenceList } from '../../../components/common/DocsReferenceList';

export default function OAuthDocsPage() {
  const { t } = useI18n();
  const tx = (key: string) => t(key as never);

  return (
    <div>
      <h1>{tx('docs.oauth.title')}</h1>
      <p className="lead">{tx('docs.oauth.lead')}</p>

      <h2>{tx('docs.oauth.flow')}</h2>
      <ol>
        <li>User clicks &quot;Connect&quot; in AKIS</li>
        <li>AKIS generates a cryptographic state token (CSRF protection)</li>
        <li>User is redirected to the provider authorization page</li>
        <li>User grants permission</li>
        <li>Provider redirects back with an authorization code</li>
        <li>AKIS exchanges the code for access tokens (server-side)</li>
        <li>Tokens are encrypted and stored</li>
      </ol>

      <h2>{tx('docs.oauth.csrf')}</h2>
      <ul>
        <li>32-byte cryptographic random state generated per request</li>
        <li>State stored in HTTP-only cookie (not in URL)</li>
        <li>State validated on callback before accepting code</li>
        <li>State expires after 10 minutes</li>
        <li>Single-use: state is consumed immediately</li>
      </ul>

      <h2>{tx('docs.oauth.tokenStorage')}</h2>
      <ul>
        <li>Encrypted at rest using AES-256-GCM</li>
        <li>Never exposed to the frontend</li>
        <li>Never logged</li>
        <li>Refresh tokens stored when available</li>
      </ul>

      <h2>{tx('docs.oauth.sessionMgmt')}</h2>
      <ul>
        <li>Stored in HTTP-only cookies</li>
        <li>SameSite=Lax for CSRF protection</li>
        <li>Secure flag in production</li>
        <li>7-day expiration by default</li>
      </ul>

      <h2>{tx('docs.oauth.providers')}</h2>
      <ul>
        <li><strong>GitHub</strong> - Repository access and PR creation</li>
        <li><strong>Google</strong> - User authentication (optional)</li>
      </ul>

      <DocsReferenceList
        title={tx('docs.section.related')}
        items={[
          { label: tx('docs.github.title'), href: '/docs/integrations/github' },
          { label: tx('docs.apiKeys.title'), href: '/docs/security/api-keys' },
          { label: tx('docs.privacy.title'), href: '/docs/security/privacy' },
        ]}
      />
    </div>
  );
}
