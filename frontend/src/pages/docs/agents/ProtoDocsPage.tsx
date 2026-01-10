/**
 * Proto Agent Documentation
 */
import { Link } from 'react-router-dom';

export default function ProtoDocsPage() {
  return (
    <div>
      <h1>Proto Agent</h1>
      
      <p className="lead">
        Proto is an AI agent that bootstraps working MVP scaffolds from high-level requirements. It generates full-stack applications with best practices built-in. Currently in development.
      </p>

      <div className="not-prose my-6 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
        <h3 className="text-lg font-semibold text-yellow-400">Coming Soon</h3>
        <p className="mt-2 text-ak-text-secondary">
          Proto is currently under development. The features described below represent our planned capabilities.
        </p>
      </div>

      <h2>Planned Capabilities</h2>
      <ul>
        <li><strong>Full-Stack Scaffolding</strong> - Generate frontend, backend, and database</li>
        <li><strong>Framework Support</strong> - React, Vue, Fastify, Express</li>
        <li><strong>Built-in Testing</strong> - Test files generated alongside code</li>
        <li><strong>Deploy-Ready</strong> - Docker and CI/CD configurations</li>
        <li><strong>Iterative Refinement</strong> - Improve code through conversation</li>
      </ul>

      <h2>Example Use Cases</h2>
      <ul>
        <li>Prototype a new feature quickly</li>
        <li>Generate boilerplate for a new project</li>
        <li>Create proof-of-concept implementations</li>
        <li>Bootstrap microservices from API specs</li>
      </ul>

      <h2>Related</h2>
      <ul>
        <li><Link to="/docs/agents/scribe">Scribe Agent</Link> - Documentation</li>
        <li><Link to="/docs/agents/trace">Trace Agent</Link> - Test generation</li>
      </ul>
    </div>
  );
}
