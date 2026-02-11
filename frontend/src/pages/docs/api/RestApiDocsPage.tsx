import { Link } from 'react-router-dom';
import { useI18n } from '../../../i18n/useI18n';
import { DocsReferenceList } from '../../../components/common/DocsReferenceList';

export default function RestApiDocsPage() {
  const { t } = useI18n();
  const tx = (key: string) => t(key as never);

  return (
    <div>
      <h1>{tx('docs.restApi.title')}</h1>
      <p className="lead">{tx('docs.restApi.lead')}</p>

      <h2>{tx('docs.restApi.baseUrl')}</h2>
      <pre><code>{`/api`}</code></pre>

      <h2>{tx('docs.restApi.authentication')}</h2>
      <p>
        {tx('docs.restApi.authDesc')}{' '}
        <Link to="/docs/api/auth">{tx('docs.auth.title')}</Link>
      </p>

      <h2>{tx('docs.restApi.agents')}</h2>
      <h3>{tx('docs.restApi.runAgent')}</h3>
      <pre><code className="language-http">{`POST /api/agents/jobs
Content-Type: application/json

{
  "type": "scribe",
  "payload": {
    "owner": "username",
    "repo": "repo-name",
    "baseBranch": "main",
    "dryRun": false
  }
}`}</code></pre>

      <h3>{tx('docs.restApi.getJob')}</h3>
      <pre><code className="language-http">{`GET /api/agents/jobs/:id`}</code></pre>

      <h3>{tx('docs.restApi.listJobs')}</h3>
      <pre><code className="language-http">{`GET /api/agents/jobs?limit=10&cursor=job_123`}</code></pre>

      <h2>{tx('docs.restApi.integrations')}</h2>
      <h3>{tx('docs.restApi.githubStatus')}</h3>
      <pre><code className="language-http">{`GET /api/integrations/github/status`}</code></pre>

      <h3>{tx('docs.restApi.startOAuth')}</h3>
      <pre><code className="language-http">{`GET /api/integrations/github/oauth/start`}</code></pre>

      <h3>{tx('docs.restApi.disconnectGithub')}</h3>
      <pre><code className="language-http">{`DELETE /api/integrations/github`}</code></pre>

      <h2>{tx('docs.restApi.settings')}</h2>
      <h3>{tx('docs.restApi.getProfile')}</h3>
      <pre><code className="language-http">{`GET /api/settings/profile`}</code></pre>

      <h3>{tx('docs.restApi.updateProfile')}</h3>
      <pre><code className="language-http">{`PUT /api/settings/profile
Content-Type: application/json

{
  "name": "New Name"
}`}</code></pre>

      <h3>{tx('docs.restApi.aiKeysStatus')}</h3>
      <pre><code className="language-http">{`GET /api/settings/ai-keys/status`}</code></pre>

      <h2>{tx('docs.restApi.errorResponses')}</h2>
      <p>{tx('docs.restApi.errorDesc')}</p>
      <pre><code className="language-json">{`{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {}
  }
}`}</code></pre>

      <h2>{tx('docs.restApi.openApiSpec')}</h2>
      <p>{tx('docs.restApi.openApiDesc')}</p>

      <DocsReferenceList
        title={tx('docs.section.related')}
        items={[
          { label: tx('docs.auth.title'), href: '/docs/api/auth' },
          { label: tx('docs.webhooks.title'), href: '/docs/api/webhooks' },
          { label: 'Scribe Agent', href: '/docs/agents/scribe' },
        ]}
      />
    </div>
  );
}
