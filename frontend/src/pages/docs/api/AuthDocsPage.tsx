import { useI18n } from '../../../i18n/useI18n';
import { DocsReferenceList } from '../../../components/common/DocsReferenceList';

export default function AuthDocsPage() {
  const { t } = useI18n();
  const tx = (key: string) => t(key as never);

  return (
    <div>
      <h1>{tx('docs.auth.title')}</h1>
      <p className="lead">{tx('docs.auth.lead')}</p>

      <h2>{tx('docs.auth.sessionCookie')}</h2>
      <p>{tx('docs.auth.sessionDesc')}</p>
      <ul>
        <li>{tx('docs.auth.httpOnly')}</li>
        <li>{tx('docs.auth.sameSite')}</li>
        <li>{tx('docs.auth.secure')}</li>
        <li>{tx('docs.auth.valid7d')}</li>
      </ul>

      <h2>{tx('docs.auth.loginFlow')}</h2>
      <h3>{tx('docs.auth.emailPassword')}</h3>
      <pre><code className="language-http">{`POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}`}</code></pre>

      <h3>{tx('docs.auth.oauthGithub')}</h3>
      <pre><code className="language-http">{`GET /auth/oauth/github`}</code></pre>
      <p>{tx('docs.auth.oauthRedirects')}</p>

      <h2>{tx('docs.auth.makingRequests')}</h2>
      <p>{tx('docs.auth.includeCredentials')}</p>
      <pre><code className="language-javascript">{`const response = await fetch('/api/settings/profile', {
  credentials: 'include', // Important!
});

const profile = await response.json();`}</code></pre>

      <h2>{tx('docs.auth.sessionValidation')}</h2>
      <pre><code className="language-http">{`GET /auth/me`}</code></pre>
      <p>{tx('docs.auth.sessionValidationDesc')}</p>

      <h2>{tx('docs.auth.logout')}</h2>
      <pre><code className="language-http">{`POST /auth/logout`}</code></pre>
      <p>{tx('docs.auth.logoutDesc')}</p>

      <h2>{tx('docs.auth.errorHandling')}</h2>
      <p>{tx('docs.auth.errorDesc')}</p>
      <pre><code className="language-json">{`{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}`}</code></pre>

      <DocsReferenceList
        title={tx('docs.section.related')}
        items={[
          { label: tx('docs.restApi.title'), href: '/docs/api/rest' },
          { label: 'OAuth Security', href: '/docs/security/oauth' },
          { label: tx('docs.restApi.aiKeysStatus'), href: '/docs/security/api-keys' },
        ]}
      />
    </div>
  );
}
