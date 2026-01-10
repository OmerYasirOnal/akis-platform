/**
 * MCP Protocol Documentation
 */
import { Link } from 'react-router-dom';

export default function MCPDocsPage() {
  return (
    <div>
      <h1>Model Context Protocol (MCP)</h1>
      
      <p className="lead">
        AKIS uses the Model Context Protocol for secure communication between AI agents and external services. MCP provides a standardized way to expose tools and data to LLMs.
      </p>

      <h2>What is MCP?</h2>
      <p>
        MCP (Model Context Protocol) is an open protocol that enables AI systems to interact with external tools and services in a secure, standardized way. It acts as a bridge between AI agents and APIs.
      </p>

      <h2>How AKIS Uses MCP</h2>
      <ul>
        <li><strong>GitHub Tools</strong> - Read repos, create branches, open PRs</li>
        <li><strong>Jira Tools</strong> - Read/write issues, manage sprints</li>
        <li><strong>Confluence Tools</strong> - Read/write documentation pages</li>
      </ul>

      <h2>Architecture</h2>
      <pre><code>{`┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  AI Agent   │────▶│ MCP Gateway  │────▶│  External   │
│  (Scribe)   │◀────│   (Server)   │◀────│   Service   │
└─────────────┘     └──────────────┘     └─────────────┘`}</code></pre>

      <h2>Benefits</h2>
      <ul>
        <li><strong>Security</strong> - Credentials never leave the server</li>
        <li><strong>Standardization</strong> - Consistent tool interface</li>
        <li><strong>Observability</strong> - All calls are logged and traceable</li>
        <li><strong>Flexibility</strong> - Easy to add new integrations</li>
      </ul>

      <h2>MCP Gateway</h2>
      <p>
        The AKIS MCP Gateway runs on port 4010 and provides tool endpoints for agents. It handles:
      </p>
      <ul>
        <li>Authentication with external services</li>
        <li>Rate limiting and retry logic</li>
        <li>Response formatting for LLMs</li>
        <li>Error handling and fallbacks</li>
      </ul>

      <h2>Related</h2>
      <ul>
        <li><Link to="/docs/integrations/github">GitHub Integration</Link></li>
        <li><Link to="/docs/integrations/atlassian">Atlassian Integration</Link></li>
        <li><Link to="/docs/security/api-keys">API Keys</Link></li>
      </ul>
    </div>
  );
}
