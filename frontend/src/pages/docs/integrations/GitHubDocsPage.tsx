/**
 * GitHub Integration Documentation
 */
import { Link } from 'react-router-dom';

export default function GitHubDocsPage() {
  return (
    <div>
      <h1>GitHub Integration</h1>
      
      <p className="lead">
        Connect AKIS to your GitHub repositories to enable agents to analyze code, read commits, and create pull requests.
      </p>

      <h2>What You Can Do</h2>
      <ul>
        <li>Discover repositories you have access to</li>
        <li>Select branches for agent analysis</li>
        <li>Have agents create PRs with their output</li>
        <li>Set up webhook triggers for automation</li>
      </ul>

      <h2>Connecting GitHub</h2>
      <ol>
        <li>Navigate to <Link to="/dashboard/integrations">Dashboard → Integrations</Link></li>
        <li>Click &quot;Connect&quot; on the GitHub card</li>
        <li>You&apos;ll be redirected to GitHub to authorize AKIS</li>
        <li>Grant access to your repositories</li>
        <li>You&apos;ll be redirected back with GitHub connected</li>
      </ol>

      <h2>Required Permissions</h2>
      <p>AKIS requests the following GitHub scopes:</p>
      <ul>
        <li><code>read:user</code> - Access your profile information</li>
        <li><code>user:email</code> - Access your email addresses</li>
        <li><code>repo</code> - Full access to repositories (read/write)</li>
      </ul>

      <h2>How Agents Use GitHub</h2>
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

      <h2>Disconnecting</h2>
      <p>
        To disconnect GitHub:
      </p>
      <ol>
        <li>Go to <Link to="/dashboard/integrations">Integrations</Link></li>
        <li>Click &quot;Disconnect&quot; on the GitHub card</li>
        <li>Optionally, revoke access from <a href="https://github.com/settings/applications" target="_blank" rel="noopener noreferrer">GitHub Settings</a></li>
      </ol>

      <h2>Troubleshooting</h2>
      <h3>OAuth callback error</h3>
      <p>
        If you see an error during the OAuth flow, ensure:
      </p>
      <ul>
        <li>Your browser allows pop-ups from github.com</li>
        <li>You&apos;re logged into the correct GitHub account</li>
        <li>The AKIS backend is running on port 3000</li>
      </ul>

      <h3>Missing repositories</h3>
      <p>
        If you don&apos;t see expected repositories:
      </p>
      <ul>
        <li>Check that you granted access to the organization</li>
        <li>Verify you have at least read access to the repo</li>
        <li>Try disconnecting and reconnecting GitHub</li>
      </ul>

      <h2>Related</h2>
      <ul>
        <li><Link to="/docs/agents/scribe">Scribe Agent</Link> - Uses GitHub for code analysis</li>
        <li><Link to="/docs/integrations/mcp">MCP Protocol</Link> - How integrations work</li>
        <li><Link to="/docs/security/oauth">OAuth Security</Link> - How auth works</li>
      </ul>
    </div>
  );
}
