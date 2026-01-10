/**
 * OAuth Security Documentation
 */
import { Link } from 'react-router-dom';

export default function OAuthDocsPage() {
  return (
    <div>
      <h1>OAuth Security</h1>
      
      <p className="lead">
        AKIS uses OAuth 2.0 for secure authentication with GitHub and other providers. This document explains how the OAuth flow works and the security measures in place.
      </p>

      <h2>OAuth Flow</h2>
      <ol>
        <li>User clicks &quot;Connect&quot; in AKIS</li>
        <li>AKIS generates a cryptographic state token (CSRF protection)</li>
        <li>User is redirected to the provider&apos;s authorization page</li>
        <li>User grants permission</li>
        <li>Provider redirects back to AKIS with an authorization code</li>
        <li>AKIS exchanges the code for access tokens (server-side)</li>
        <li>Tokens are encrypted and stored</li>
      </ol>

      <h2>CSRF Protection</h2>
      <p>
        AKIS uses the &quot;state&quot; parameter to prevent CSRF attacks:
      </p>
      <ul>
        <li>32-byte cryptographic random state generated per request</li>
        <li>State stored in HTTP-only cookie (not in URL)</li>
        <li>State validated on callback before accepting code</li>
        <li>State expires after 10 minutes</li>
        <li>Single-use: state is consumed immediately</li>
      </ul>

      <h2>Token Storage</h2>
      <p>
        OAuth access tokens are stored securely:
      </p>
      <ul>
        <li>Encrypted at rest using AES-256-GCM</li>
        <li>Never exposed to the frontend</li>
        <li>Never logged</li>
        <li>Refresh tokens stored when available</li>
      </ul>

      <h2>Session Management</h2>
      <p>
        AKIS user sessions use JWT tokens:
      </p>
      <ul>
        <li>Stored in HTTP-only cookies</li>
        <li>SameSite=Lax for CSRF protection</li>
        <li>Secure flag in production</li>
        <li>7-day expiration by default</li>
      </ul>

      <h2>Supported Providers</h2>
      <ul>
        <li><strong>GitHub</strong> - Repository access and PR creation</li>
        <li><strong>Google</strong> - User authentication (optional)</li>
      </ul>

      <h2>Related</h2>
      <ul>
        <li><Link to="/docs/integrations/github">GitHub Integration</Link></li>
        <li><Link to="/docs/security/api-keys">API Key Security</Link></li>
        <li><Link to="/docs/security/privacy">Data Privacy</Link></li>
      </ul>
    </div>
  );
}
