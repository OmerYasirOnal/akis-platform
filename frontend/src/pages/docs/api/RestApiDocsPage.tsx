/**
 * REST API Documentation
 */
import { Link } from 'react-router-dom';

export default function RestApiDocsPage() {
  return (
    <div>
      <h1>REST API Reference</h1>
      
      <p className="lead">
        The AKIS REST API allows you to programmatically manage agents, jobs, and integrations. All endpoints are served from <code>/api</code>.
      </p>

      <h2>Base URL</h2>
      <pre><code>{`http://localhost:3000/api`}</code></pre>

      <h2>Authentication</h2>
      <p>
        All API requests require authentication via session cookie. See <Link to="/docs/api/auth">Authentication</Link> for details.
      </p>

      <h2>Agents</h2>
      <h3>Run Agent</h3>
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

      <h3>Get Job</h3>
      <pre><code className="language-http">{`GET /api/agents/jobs/:id`}</code></pre>

      <h3>List Jobs</h3>
      <pre><code className="language-http">{`GET /api/agents/jobs?limit=10&offset=0`}</code></pre>

      <h2>Integrations</h2>
      <h3>GitHub Status</h3>
      <pre><code className="language-http">{`GET /api/integrations/github/status`}</code></pre>

      <h3>Start GitHub OAuth</h3>
      <pre><code className="language-http">{`GET /api/integrations/github/oauth/start`}</code></pre>

      <h3>Disconnect GitHub</h3>
      <pre><code className="language-http">{`DELETE /api/integrations/github`}</code></pre>

      <h2>Settings</h2>
      <h3>Get Profile</h3>
      <pre><code className="language-http">{`GET /api/settings/profile`}</code></pre>

      <h3>Update Profile</h3>
      <pre><code className="language-http">{`PUT /api/settings/profile
Content-Type: application/json

{
  "name": "New Name"
}`}</code></pre>

      <h3>AI Keys Status</h3>
      <pre><code className="language-http">{`GET /api/settings/ai-keys/status`}</code></pre>

      <h2>Error Responses</h2>
      <p>Errors follow a consistent format:</p>
      <pre><code className="language-json">{`{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {}
  }
}`}</code></pre>

      <h2>OpenAPI Spec</h2>
      <p>
        The full OpenAPI specification is available at{' '}
        <a href="http://localhost:3000/openapi.json" target="_blank" rel="noopener noreferrer">/openapi.json</a>.
        Interactive documentation is at{' '}
        <a href="http://localhost:3000/docs" target="_blank" rel="noopener noreferrer">/docs</a>.
      </p>

      <h2>Related</h2>
      <ul>
        <li><Link to="/docs/api/auth">Authentication</Link></li>
        <li><Link to="/docs/api/webhooks">Webhooks</Link></li>
        <li><Link to="/docs/agents/scribe">Scribe Agent</Link></li>
      </ul>
    </div>
  );
}
