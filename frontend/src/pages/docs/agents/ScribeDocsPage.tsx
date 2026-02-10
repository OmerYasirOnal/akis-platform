/**
 * Scribe Agent Documentation
 */
import { Link } from 'react-router-dom';

export default function ScribeDocsPage() {
  return (
    <div>
      <h1>Scribe Agent</h1>
      
      <p className="lead">
        Scribe is an AI agent that automatically generates and updates documentation from your Git repository. It analyzes commits, understands code changes, and produces human-readable documentation.
      </p>

      <h2>Capabilities</h2>
      <ul>
        <li><strong>Commit Analysis</strong> - Understands what changed and why</li>
        <li><strong>Documentation Generation</strong> - Creates README, changelogs, API docs</li>
        <li><strong>Pull Request Creation</strong> - Submits changes via PR for review</li>
        <li><strong>Multi-target Support</strong> - Output to GitHub, Confluence, or local files</li>
      </ul>

      <h2>How It Works</h2>
      <ol>
        <li><strong>Connect</strong> - Link your GitHub repository</li>
        <li><strong>Configure</strong> - Set target paths, templates, and triggers</li>
        <li><strong>Run</strong> - Scribe analyzes recent commits</li>
        <li><strong>Review</strong> - A PR is created with the generated docs</li>
        <li><strong>Merge</strong> - Approve and merge the documentation updates</li>
      </ol>

      <h2>Configuration Options</h2>
      <table>
        <thead>
          <tr>
            <th>Option</th>
            <th>Description</th>
            <th>Default</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>baseBranch</code></td>
            <td>Branch to analyze and create PRs against</td>
            <td><code>main</code></td>
          </tr>
          <tr>
            <td><code>targetPlatform</code></td>
            <td>Where to publish docs</td>
            <td><code>github_repo</code></td>
          </tr>
          <tr>
            <td><code>includeGlobs</code></td>
            <td>Files to include in analysis</td>
            <td><code>**/*</code></td>
          </tr>
          <tr>
            <td><code>excludeGlobs</code></td>
            <td>Files to exclude from analysis</td>
            <td><code>node_modules/**</code></td>
          </tr>
          <tr>
            <td><code>triggerMode</code></td>
            <td>When to run: manual, on_pr_merge, scheduled</td>
            <td><code>manual</code></td>
          </tr>
        </tbody>
      </table>

      <h2>Example Usage</h2>
      <pre><code className="language-typescript">{`// Run Scribe via API
const response = await fetch('/api/agents/jobs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'scribe',
    payload: {
      owner: 'your-username',
      repo: 'your-repo',
      baseBranch: 'main',
      dryRun: false,
    },
  }),
});

const { jobId } = await response.json();
// Poll /api/agents/jobs/:jobId for status`}</code></pre>

      <h2>Output Formats</h2>
      <p>Scribe can generate documentation in multiple formats:</p>
      <ul>
        <li><strong>Markdown</strong> - README.md, CHANGELOG.md</li>
        <li><strong>API Documentation</strong> - OpenAPI/Swagger compatible</li>
        <li><strong>Confluence Pages</strong> - Direct publish to Atlassian</li>
        <li><strong>GitHub Wiki</strong> - Wiki page generation</li>
      </ul>

      <h2>Plan-Only Mode</h2>
      <p>
        For safety, Scribe supports a &quot;plan-only&quot; mode where it generates a plan document without making any changes. This is useful for:
      </p>
      <ul>
        <li>Reviewing what changes will be made before execution</li>
        <li>Approval workflows in enterprise settings</li>
        <li>Understanding the agent&apos;s reasoning</li>
      </ul>

      <h2>Explainability</h2>
      <p>
        Every Scribe job includes a detailed trace showing:
      </p>
      <ul>
        <li>Files analyzed and changes detected</li>
        <li>AI reasoning for each decision</li>
        <li>Tool calls made (GitHub API, MCP tools)</li>
        <li>Output artifacts generated</li>
      </ul>

      <div className="not-prose mt-8 rounded-xl border border-ak-primary/20 bg-ak-primary/5 p-4">
        <h3 className="text-lg font-semibold text-ak-primary">Try Scribe Now</h3>
        <p className="mt-2 text-ak-text-secondary">
          Connect your GitHub repository and run Scribe to see it in action.
        </p>
        <Link
          to="/dashboard/agents"
          className="mt-4 inline-block rounded-lg bg-ak-primary px-4 py-2 text-sm font-semibold text-[#111418] hover:brightness-110 active:brightness-95"
        >
          Go to Agents Hub →
        </Link>
      </div>

      <h2>Related</h2>
      <ul>
        <li><Link to="/docs/agents/trace">Trace Agent</Link> - Generate test plans</li>
        <li><Link to="/docs/integrations/github">GitHub Integration</Link> - Repository connection</li>
        <li><Link to="/docs/api/rest">REST API</Link> - Programmatic access</li>
      </ul>
    </div>
  );
}
