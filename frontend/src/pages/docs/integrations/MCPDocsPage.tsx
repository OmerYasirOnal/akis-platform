import { useI18n } from '../../../i18n/useI18n';
import { DocsReferenceList } from '../../../components/common/DocsReferenceList';

export default function MCPDocsPage() {
  const { t } = useI18n();
  const tx = (key: string) => t(key as never);

  return (
    <div>
      <h1>{tx('docs.mcp.title')}</h1>
      <p className="lead">{tx('docs.mcp.lead')}</p>

      <h2>{tx('docs.mcp.whatIsMcp')}</h2>
      <p>
        MCP (Model Context Protocol) is an open protocol that enables AI systems to interact with external tools and services in a secure, standardized way.
      </p>

      <h2>{tx('docs.mcp.howAkisUses')}</h2>
      <ul>
        <li><strong>GitHub Tools</strong> - Read repos, create branches, open PRs</li>
        <li><strong>Jira Tools</strong> - Read/write issues, manage sprints</li>
        <li><strong>Confluence Tools</strong> - Read/write documentation pages</li>
      </ul>

      <h2>{tx('docs.mcp.architecture')}</h2>
      <pre><code>{`┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  AI Agent   │────▶│ MCP Gateway  │────▶│  External   │
│  (Scribe)   │◀────│   (Server)   │◀────│   Service   │
└─────────────┘     └──────────────┘     └─────────────┘`}</code></pre>

      <h2>{tx('docs.mcp.benefits')}</h2>
      <ul>
        <li><strong>Security</strong> - Credentials never leave the server</li>
        <li><strong>Standardization</strong> - Consistent tool interface</li>
        <li><strong>Observability</strong> - All calls are logged and traceable</li>
        <li><strong>Flexibility</strong> - Easy to add new integrations</li>
      </ul>

      <h2>{tx('docs.mcp.gateway')}</h2>
      <p>The AKIS MCP Gateway runs on port 4010 and provides tool endpoints for agents.</p>
      <ul>
        <li>Authentication with external services</li>
        <li>Rate limiting and retry logic</li>
        <li>Response formatting for LLMs</li>
        <li>Error handling and fallbacks</li>
      </ul>

      <DocsReferenceList
        title={tx('docs.section.related')}
        items={[
          { label: tx('docs.github.title'), href: '/docs/integrations/github' },
          { label: tx('docs.atlassian.title'), href: '/docs/integrations/atlassian' },
          { label: tx('docs.apiKeys.title'), href: '/docs/security/api-keys' },
        ]}
      />
    </div>
  );
}
