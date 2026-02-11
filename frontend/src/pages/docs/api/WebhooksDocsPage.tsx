import { useI18n } from '../../../i18n/useI18n';
import { DocsReferenceList } from '../../../components/common/DocsReferenceList';

export default function WebhooksDocsPage() {
  const { t } = useI18n();
  const tx = (key: string) => t(key as never);

  return (
    <div>
      <h1>{tx('docs.webhooks.title')}</h1>
      <p className="lead">{tx('docs.webhooks.lead')}</p>

      <div className="not-prose my-6 rounded-xl border border-ak-primary/20 bg-ak-primary/5 p-4">
        <h3 className="text-lg font-semibold text-ak-primary">{tx('docs.webhooks.currentStatus')}</h3>
        <p className="mt-2 text-ak-text-secondary">{tx('docs.webhooks.statusDesc')}</p>
      </div>

      <h2>{tx('docs.webhooks.eventTypes')}</h2>
      <ul>
        <li><code>job.started</code> - Agent job has started</li>
        <li><code>job.completed</code> - Job finished successfully</li>
        <li><code>job.failed</code> - Job failed with error</li>
        <li><code>job.approval_required</code> - Job awaiting approval</li>
        <li><code>integration.connected</code> - New integration connected</li>
        <li><code>integration.disconnected</code> - Integration removed</li>
      </ul>

      <h2>{tx('docs.webhooks.payloadFormat')}</h2>
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

      <h2>{tx('docs.webhooks.security')}</h2>
      <p>{tx('docs.webhooks.securityDesc')}</p>
      <pre><code className="language-http">{`X-AKIS-Signature: sha256=...`}</code></pre>

      <h2>{tx('docs.webhooks.inboundTriggers')}</h2>
      <p>{tx('docs.webhooks.inboundDesc')}</p>

      <DocsReferenceList
        title={tx('docs.section.related')}
        items={[
          { label: tx('docs.restApi.title'), href: '/docs/api/rest' },
          { label: 'GitHub Integration', href: '/docs/integrations/github' },
          { label: 'Scribe Agent', href: '/docs/agents/scribe' },
        ]}
      />
    </div>
  );
}
