/**
 * Atlassian Integration Documentation
 */
import { Link } from 'react-router-dom';

export default function AtlassianDocsPage() {
  return (
    <div>
      <h1>Atlassian Integration</h1>
      
      <p className="lead">
        Connect AKIS to Jira and Confluence to enable issue linking, documentation publishing, and workflow automation.
      </p>

      <h2>Jira Integration</h2>
      <p>Connect Jira to:</p>
      <ul>
        <li>Link agent jobs to Jira issues</li>
        <li>Auto-update ticket status when jobs complete</li>
        <li>Sync changelog entries to release tickets</li>
        <li>Use Trace agent to generate test plans from specs</li>
      </ul>

      <h2>Confluence Integration</h2>
      <p>Connect Confluence to:</p>
      <ul>
        <li>Publish generated documentation directly</li>
        <li>Keep technical docs in sync with code</li>
        <li>Create pages in specified spaces</li>
        <li>Update existing pages with new content</li>
      </ul>

      <h2>Connecting Atlassian</h2>
      <ol>
        <li>Go to <Link to="/dashboard/integrations">Dashboard → Integrations</Link></li>
        <li>Click &quot;Connect&quot; on Jira or Confluence</li>
        <li>Enter your Atlassian Cloud site URL (e.g., your-domain.atlassian.net)</li>
        <li>Enter your Atlassian email</li>
        <li>Generate and enter an API token from <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noopener noreferrer">Atlassian Account Settings</a></li>
        <li>Click &quot;Connect&quot; to save</li>
      </ol>

      <h2>API Token</h2>
      <p>
        AKIS uses Atlassian API tokens for authentication. To create one:
      </p>
      <ol>
        <li>Go to <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noopener noreferrer">Atlassian API Tokens</a></li>
        <li>Click &quot;Create API token&quot;</li>
        <li>Give it a label (e.g., &quot;AKIS Platform&quot;)</li>
        <li>Copy the token (you won&apos;t see it again)</li>
      </ol>

      <h2>Security</h2>
      <p>
        Your API token is encrypted using AES-256-GCM before storage. Only the last 4 characters are displayed for identification. Tokens are never logged or exposed to the frontend.
      </p>

      <h2>Related</h2>
      <ul>
        <li><Link to="/docs/agents/trace">Trace Agent</Link> - Test plan generation</li>
        <li><Link to="/docs/agents/scribe">Scribe Agent</Link> - Documentation</li>
        <li><Link to="/docs/security/api-keys">API Key Security</Link></li>
      </ul>
    </div>
  );
}
