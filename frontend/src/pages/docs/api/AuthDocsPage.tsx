/**
 * API Authentication Documentation
 */
import { Link } from 'react-router-dom';

export default function AuthDocsPage() {
  return (
    <div>
      <h1>API Authentication</h1>
      
      <p className="lead">
        AKIS uses cookie-based session authentication for API requests. All API endpoints require an authenticated session.
      </p>

      <h2>Session Cookie</h2>
      <p>
        After logging in, a session cookie named <code>akis_sid</code> is set. This cookie is:
      </p>
      <ul>
        <li>HTTP-only (not accessible via JavaScript)</li>
        <li>SameSite=Lax (CSRF protection)</li>
        <li>Secure in production (HTTPS only)</li>
        <li>Valid for 7 days by default</li>
      </ul>

      <h2>Login Flow</h2>
      <h3>Email/Password</h3>
      <pre><code className="language-http">{`POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}`}</code></pre>

      <h3>OAuth (GitHub/Google)</h3>
      <pre><code className="language-http">{`GET /auth/oauth/github`}</code></pre>
      <p>Redirects to GitHub for authentication, then back to AKIS.</p>

      <h2>Making Authenticated Requests</h2>
      <p>Include credentials in fetch requests:</p>
      <pre><code className="language-javascript">{`const response = await fetch('/api/settings/profile', {
  credentials: 'include', // Important!
});

const profile = await response.json();`}</code></pre>

      <h2>Session Validation</h2>
      <pre><code className="language-http">{`GET /auth/me`}</code></pre>
      <p>Returns current user info if authenticated, 401 otherwise.</p>

      <h2>Logout</h2>
      <pre><code className="language-http">{`POST /auth/logout`}</code></pre>
      <p>Clears the session cookie.</p>

      <h2>Error Handling</h2>
      <p>Unauthenticated requests return:</p>
      <pre><code className="language-json">{`{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}`}</code></pre>

      <h2>Related</h2>
      <ul>
        <li><Link to="/docs/api/rest">REST API Reference</Link></li>
        <li><Link to="/docs/security/oauth">OAuth Security</Link></li>
        <li><Link to="/docs/security/api-keys">API Keys</Link></li>
      </ul>
    </div>
  );
}
