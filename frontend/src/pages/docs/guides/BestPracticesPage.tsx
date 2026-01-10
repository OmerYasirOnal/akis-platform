/**
 * Best Practices Guide
 */
import { Link } from 'react-router-dom';

export default function BestPracticesPage() {
  return (
    <div>
      <h1>Best Practices</h1>
      
      <p className="lead">
        Follow these best practices to get the most out of AKIS agents and ensure smooth operation.
      </p>

      <h2>Repository Setup</h2>
      <ul>
        <li><strong>Use clear commit messages</strong> - Agents analyze commits, so descriptive messages improve documentation quality</li>
        <li><strong>Maintain a clean main branch</strong> - Run agents against stable code</li>
        <li><strong>Use conventional commits</strong> - Format like <code>feat:</code>, <code>fix:</code>, <code>docs:</code></li>
        <li><strong>Include a README</strong> - Gives agents context about the project</li>
      </ul>

      <h2>Running Agents</h2>
      <ul>
        <li><strong>Start with dry run</strong> - Preview changes before applying</li>
        <li><strong>Run on feature branches</strong> - Avoid polluting main branch</li>
        <li><strong>Review generated PRs</strong> - Always review AI output</li>
        <li><strong>Iterate</strong> - Run agents multiple times to refine output</li>
      </ul>

      <h2>AI Keys</h2>
      <ul>
        <li><strong>Use your own keys</strong> - Better rate limits and cost control</li>
        <li><strong>Set usage limits</strong> - Monitor spending in provider dashboard</li>
        <li><strong>Rotate keys periodically</strong> - Security best practice</li>
      </ul>

      <h2>Security</h2>
      <ul>
        <li><strong>Use strong passwords</strong> - 12+ characters with mixed case and numbers</li>
        <li><strong>Enable 2FA on GitHub</strong> - Protects your repository access</li>
        <li><strong>Review OAuth permissions</strong> - Only grant necessary access</li>
        <li><strong>Disconnect unused integrations</strong> - Minimize attack surface</li>
      </ul>

      <h2>Documentation Quality</h2>
      <ul>
        <li><strong>Structure code logically</strong> - Well-organized code produces better docs</li>
        <li><strong>Use JSDoc/TSDoc comments</strong> - Agents extract these for API docs</li>
        <li><strong>Include examples</strong> - Helps agents understand usage patterns</li>
        <li><strong>Keep dependencies updated</strong> - Documentation references current versions</li>
      </ul>

      <h2>Troubleshooting Jobs</h2>
      <ul>
        <li><strong>Check the trace</strong> - Every job has a detailed execution trace</li>
        <li><strong>Verify integrations</strong> - Ensure GitHub/Jira are connected</li>
        <li><strong>Review error messages</strong> - Agents provide specific error codes</li>
        <li><strong>Check rate limits</strong> - AI and GitHub APIs have limits</li>
      </ul>

      <h2>Related</h2>
      <ul>
        <li><Link to="/docs/guides/troubleshooting">Troubleshooting</Link></li>
        <li><Link to="/docs/agents/scribe">Scribe Agent</Link></li>
        <li><Link to="/docs/security/api-keys">API Key Security</Link></li>
      </ul>
    </div>
  );
}
