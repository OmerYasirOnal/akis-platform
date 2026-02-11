import { Link } from 'react-router-dom';
import { useI18n } from '../../../i18n/useI18n';
import { DocsReferenceList } from '../../../components/common/DocsReferenceList';

export default function PrivacyDocsPage() {
  const { t } = useI18n();
  const tx = (key: string) => t(key as never);

  return (
    <div>
      <h1>{tx('docs.privacy.title')}</h1>
      <p className="lead">{tx('docs.privacy.lead')}</p>

      <h2>{tx('docs.privacy.whatWeCollect')}</h2>
      <ul>
        <li><strong>Account Information</strong> - Email, name (required for authentication)</li>
        <li><strong>Job Data</strong> - Agent job history and results</li>
        <li><strong>Integration Tokens</strong> - Encrypted OAuth tokens</li>
        <li><strong>Configuration</strong> - Agent settings and preferences</li>
      </ul>

      <h2>{tx('docs.privacy.whatWeDontStore')}</h2>
      <ul>
        <li>Your source code (only analyzed temporarily)</li>
        <li>Git commit contents (only metadata)</li>
        <li>Plaintext API keys or passwords</li>
        <li>AI conversation history beyond job context</li>
      </ul>

      <h2>{tx('docs.privacy.retention')}</h2>
      <p>Job history and traces are retained for 90 days by default. You can request deletion at any time through account settings.</p>

      <h2>{tx('docs.privacy.thirdParty')}</h2>
      <ul>
        <li><strong>AI Providers</strong> - Code snippets sent for analysis (OpenAI/OpenRouter)</li>
        <li><strong>GitHub</strong> - Repository operations via OAuth</li>
        <li><strong>Atlassian</strong> - Issue/page operations via API</li>
      </ul>

      <h2>{tx('docs.privacy.yourRights')}</h2>
      <ul>
        <li><strong>Access</strong> - Export your data</li>
        <li><strong>Deletion</strong> - Delete your account and all data</li>
        <li><strong>Correction</strong> - Update your profile information</li>
      </ul>

      <h2>{tx('docs.privacy.accountDeletion')}</h2>
      <ol>
        <li>Go to <Link to="/dashboard/settings/workspace">Settings → Workspace</Link></li>
        <li>Click &quot;Delete Account&quot;</li>
        <li>Confirm deletion</li>
        <li>All data will be permanently removed</li>
      </ol>

      <DocsReferenceList
        title={tx('docs.section.related')}
        items={[
          { label: tx('docs.apiKeys.title'), href: '/docs/security/api-keys' },
          { label: 'Privacy Policy', href: '/legal/privacy' },
          { label: 'Terms of Service', href: '/legal/terms' },
        ]}
      />
    </div>
  );
}
