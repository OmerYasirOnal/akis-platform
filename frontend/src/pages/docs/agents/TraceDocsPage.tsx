/**
 * Trace Agent Documentation
 */
import { Link } from 'react-router-dom';

export default function TraceDocsPage() {
  return (
    <div>
      <h1>Trace Agent</h1>
      
      <p className="lead">
        Trace is an AI agent that generates test plans, coverage matrices, and test scaffolds from specifications and acceptance criteria. Currently in development.
      </p>

      <div className="not-prose my-6 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
        <h3 className="text-lg font-semibold text-yellow-400">Coming Soon</h3>
        <p className="mt-2 text-ak-text-secondary">
          Trace is currently under development. The features described below represent our planned capabilities.
        </p>
      </div>

      <h2>Planned Capabilities</h2>
      <ul>
        <li><strong>Spec Parsing</strong> - Extract requirements from Jira tickets</li>
        <li><strong>Test Plan Generation</strong> - Create structured test plans</li>
        <li><strong>Coverage Matrix</strong> - Map tests to requirements</li>
        <li><strong>Test Scaffolding</strong> - Generate test file templates</li>
        <li><strong>Risk Analysis</strong> - Identify high-risk areas</li>
      </ul>

      <h2>How It Will Work</h2>
      <ol>
        <li><strong>Input</strong> - Provide a Jira issue key or specification document</li>
        <li><strong>Analyze</strong> - Trace parses acceptance criteria and requirements</li>
        <li><strong>Generate</strong> - Test plan with scenarios, edge cases, and priorities</li>
        <li><strong>Output</strong> - Structured test matrix and optional code scaffolds</li>
      </ol>

      <h2>Integration with Jira</h2>
      <p>
        Trace will integrate directly with Jira to:
      </p>
      <ul>
        <li>Read issue descriptions and acceptance criteria</li>
        <li>Link test plans back to source issues</li>
        <li>Update issue status when tests are generated</li>
        <li>Create sub-tasks for test implementation</li>
      </ul>

      <h2>Output Formats</h2>
      <ul>
        <li><strong>Test Plan Document</strong> - Markdown or Confluence page</li>
        <li><strong>Coverage Matrix</strong> - CSV or Excel compatible</li>
        <li><strong>Test Scaffolds</strong> - Jest, Vitest, or Playwright files</li>
        <li><strong>BDD Scenarios</strong> - Gherkin/Cucumber format</li>
      </ul>

      <h2>Related</h2>
      <ul>
        <li><Link to="/docs/agents/scribe">Scribe Agent</Link> - Documentation generation</li>
        <li><Link to="/docs/integrations/atlassian">Atlassian Integration</Link> - Jira connection</li>
        <li><Link to="/docs/agents/proto">Proto Agent</Link> - Code scaffolding</li>
      </ul>
    </div>
  );
}
