/**
 * Webhooks Documentation
 */
import { Link } from 'react-router-dom';

export default function WebhooksDocsPage() {
  return (
    <div>
      <h1>Webhooks</h1>
      
      <p className="lead">
        AKIS supports event-driven integrations through inbound triggers and structured job events. This page documents the current contract and rollout path.
      </p>

      <div className="not-prose my-6 rounded-xl border border-ak-primary/20 bg-ak-primary/5 p-4">
        <h3 className="text-lg font-semibold text-ak-primary">Current Status</h3>
        <p className="mt-2 text-ak-text-secondary">
          Inbound GitHub triggers are available. Outbound delivery payloads are staged behind feature rollout and follow the payload format below.
        </p>
      </div>

      <h2>Event Types</h2>
      <ul>
        <li><code>job.started</code> - Agent job has started</li>
        <li><code>job.completed</code> - Job finished successfully</li>
        <li><code>job.failed</code> - Job failed with error</li>
        <li><code>job.approval_required</code> - Job awaiting approval</li>
        <li><code>integration.connected</code> - New integration connected</li>
        <li><code>integration.disconnected</code> - Integration removed</li>
      </ul>

      <h2>Payload Format</h2>
      <pre><code className="language-json">{`{
  "event": "job.completed",
  "timestamp": "2025-01-10T12:00:00Z",
  "data": {
    "jobId": "uuid",
    "type": "scribe",
    "state": "completed",
    "result": { ... }
  }
}`}</code></pre>

      <h2>Security</h2>
      <p>
        Webhook requests will include a signature header for verification:
      </p>
      <pre><code>{`X-AKIS-Signature: sha256=...`}</code></pre>

      <h2>Inbound Triggers (GitHub)</h2>
      <p>
        AKIS can receive GitHub webhooks to trigger agent runs automatically. This is useful for running Scribe on PR merge.
      </p>

      <h2>Related</h2>
      <ul>
        <li><Link to="/docs/api/rest">REST API</Link></li>
        <li><Link to="/docs/integrations/github">GitHub Integration</Link></li>
        <li><Link to="/docs/agents/scribe">Scribe Agent</Link></li>
      </ul>
    </div>
  );
}
