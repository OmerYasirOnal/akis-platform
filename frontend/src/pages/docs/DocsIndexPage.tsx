/**
 * Docs Index Page - Introduction to AKIS
 */
import { Link } from 'react-router-dom';

export default function DocsIndexPage() {
  return (
    <div>
      <h1>Welcome to AKIS Documentation</h1>
      
      <p className="lead">
        AKIS (AI Knowledge Intelligence System) is an AI-powered platform that automates software development workflows through intelligent agents. Generate documentation, test plans, and working prototypes with natural language.
      </p>

      <h2>What is AKIS?</h2>
      <p>
        AKIS provides three specialized AI agents that help development teams work more efficiently:
      </p>
      <ul>
        <li><strong>Scribe</strong> - Automatically generates and updates documentation from your codebase</li>
        <li><strong>Trace</strong> - Creates test plans and coverage matrices from specifications</li>
        <li><strong>Proto</strong> - Bootstraps working MVP scaffolds from requirements</li>
      </ul>

      <h2>Key Features</h2>
      <div className="not-prose grid gap-4 sm:grid-cols-2 my-6">
        {[
          { title: 'GitHub Integration', desc: 'Connect repos, analyze commits, create PRs automatically', href: '/docs/integrations/github' },
          { title: 'Secure by Design', desc: 'Encrypted credentials, OAuth flows, zero-trust architecture', href: '/docs/security/api-keys' },
          { title: 'MCP Protocol', desc: 'Model Context Protocol for secure service communication', href: '/docs/integrations/mcp' },
          { title: 'Explainable AI', desc: 'See what agents do and why with full trace visibility', href: '/docs/agents/scribe' },
        ].map((feature) => (
          <Link
            key={feature.title}
            to={feature.href}
            className="block rounded-xl border border-ak-border bg-ak-surface p-4 transition-colors hover:border-ak-primary/50"
          >
            <h3 className="text-lg font-semibold text-ak-text-primary">{feature.title}</h3>
            <p className="mt-1 text-sm text-ak-text-secondary">{feature.desc}</p>
          </Link>
        ))}
      </div>

      <h2>Quick Links</h2>
      <ul>
        <li><Link to="/docs/getting-started">Quick Start Guide</Link> - Get up and running in 10 minutes</li>
        <li><Link to="/docs/agents/scribe">Scribe Agent</Link> - Auto-generate documentation</li>
        <li><Link to="/docs/api/rest">REST API Reference</Link> - API endpoints documentation</li>
        <li><Link to="/docs/guides/troubleshooting">Troubleshooting</Link> - Common issues and solutions</li>
      </ul>

      <h2>Architecture Overview</h2>
      <p>
        AKIS follows a modular monolith architecture optimized for cloud deployment. The platform consists of:
      </p>
      <ul>
        <li><strong>Backend</strong> - Fastify + TypeScript API server with PostgreSQL</li>
        <li><strong>Frontend</strong> - React + Vite single-page application</li>
        <li><strong>MCP Gateway</strong> - Model Context Protocol server for tool integration</li>
        <li><strong>AI Services</strong> - OpenAI/OpenRouter for LLM capabilities</li>
      </ul>

      <div className="not-prose mt-8 rounded-xl border border-ak-primary/20 bg-ak-primary/5 p-4">
        <h3 className="text-lg font-semibold text-ak-primary">Ready to get started?</h3>
        <p className="mt-2 text-ak-text-secondary">
          Follow our Quick Start guide to set up AKIS and run your first agent job.
        </p>
        <Link
          to="/docs/getting-started"
          className="mt-4 inline-block rounded-lg bg-ak-primary px-4 py-2 text-sm font-medium text-ak-bg hover:bg-ak-primary/90"
        >
          Get Started →
        </Link>
      </div>
    </div>
  );
}
