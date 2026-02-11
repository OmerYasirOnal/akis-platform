import { useI18n } from '../../../i18n/useI18n';
import { DocsReferenceList } from '../../../components/common/DocsReferenceList';

export default function BestPracticesPage() {
  const { t } = useI18n();
  const tx = (key: string) => t(key as never);

  return (
    <div>
      <h1>{tx('docs.bestPractices.title')}</h1>
      <p className="lead">{tx('docs.bestPractices.lead')}</p>

      <h2>{tx('docs.bestPractices.repoSetup')}</h2>
      <ul>
        <li><strong>Use clear commit messages</strong> - Agents analyze commits, so descriptive messages improve documentation quality</li>
        <li><strong>Maintain a clean main branch</strong> - Run agents against stable code</li>
        <li><strong>Use conventional commits</strong> - Format like <code>feat:</code>, <code>fix:</code>, <code>docs:</code></li>
        <li><strong>Include a README</strong> - Gives agents context about the project</li>
      </ul>

      <h2>{tx('docs.bestPractices.runningAgents')}</h2>
      <ul>
        <li><strong>Start with dry run</strong> - Preview changes before applying</li>
        <li><strong>Run on feature branches</strong> - Avoid polluting main branch</li>
        <li><strong>Review generated PRs</strong> - Always review AI output</li>
        <li><strong>Iterate</strong> - Run agents multiple times to refine output</li>
      </ul>

      <h2>{tx('docs.bestPractices.aiKeys')}</h2>
      <ul>
        <li><strong>Use your own keys</strong> - Better rate limits and cost control</li>
        <li><strong>Set usage limits</strong> - Monitor spending in provider dashboard</li>
        <li><strong>Rotate keys periodically</strong> - Security best practice</li>
      </ul>

      <h2>{tx('docs.bestPractices.security')}</h2>
      <ul>
        <li><strong>Use strong passwords</strong> - 12+ characters with mixed case and numbers</li>
        <li><strong>Enable 2FA on GitHub</strong> - Protects your repository access</li>
        <li><strong>Review OAuth permissions</strong> - Only grant necessary access</li>
        <li><strong>Disconnect unused integrations</strong> - Minimize attack surface</li>
      </ul>

      <h2>{tx('docs.bestPractices.docQuality')}</h2>
      <ul>
        <li><strong>Structure code logically</strong> - Well-organized code produces better docs</li>
        <li><strong>Use JSDoc/TSDoc comments</strong> - Agents extract these for API docs</li>
        <li><strong>Include examples</strong> - Helps agents understand usage patterns</li>
        <li><strong>Keep dependencies updated</strong> - Documentation references current versions</li>
      </ul>

      <h2>{tx('docs.bestPractices.troubleshootingJobs')}</h2>
      <ul>
        <li><strong>Check the trace</strong> - Every job has a detailed execution trace</li>
        <li><strong>Verify integrations</strong> - Ensure GitHub/Jira are connected</li>
        <li><strong>Review error messages</strong> - Agents provide specific error codes</li>
        <li><strong>Check rate limits</strong> - AI and GitHub APIs have limits</li>
      </ul>

      <DocsReferenceList
        title={tx('docs.section.related')}
        items={[
          { label: tx('docs.troubleshooting.title'), href: '/docs/guides/troubleshooting' },
          { label: 'Scribe Agent', href: '/docs/agents/scribe' },
          { label: tx('docs.restApi.aiKeysStatus'), href: '/docs/security/api-keys' },
        ]}
      />
    </div>
  );
}
