/**
 * Data Privacy Documentation
 */
import { Link } from 'react-router-dom';

export default function PrivacyDocsPage() {
  return (
    <div>
      <h1>Data Privacy</h1>
      
      <p className="lead">
        AKIS is designed with privacy as a core principle. We minimize data collection and give you control over your information.
      </p>

      <h2>What We Collect</h2>
      <ul>
        <li><strong>Account Information</strong> - Email, name (required for authentication)</li>
        <li><strong>Job Data</strong> - Agent job history and results</li>
        <li><strong>Integration Tokens</strong> - Encrypted OAuth tokens</li>
        <li><strong>Configuration</strong> - Agent settings and preferences</li>
      </ul>

      <h2>What We Don&apos;t Store</h2>
      <ul>
        <li>Your source code (only analyzed temporarily)</li>
        <li>Git commit contents (only metadata)</li>
        <li>Plaintext API keys or passwords</li>
        <li>AI conversation history beyond job context</li>
      </ul>

      <h2>Data Retention</h2>
      <p>
        Job history and traces are retained for 90 days by default. You can request deletion at any time through account settings.
      </p>

      <h2>Third-Party Services</h2>
      <p>AKIS may share data with:</p>
      <ul>
        <li><strong>AI Providers</strong> - Code snippets sent for analysis (OpenAI/OpenRouter)</li>
        <li><strong>GitHub</strong> - Repository operations via OAuth</li>
        <li><strong>Atlassian</strong> - Issue/page operations via API</li>
      </ul>

      <h2>Your Rights</h2>
      <ul>
        <li><strong>Access</strong> - Export your data</li>
        <li><strong>Deletion</strong> - Delete your account and all data</li>
        <li><strong>Correction</strong> - Update your profile information</li>
      </ul>

      <h2>Account Deletion</h2>
      <p>
        To delete your account and all associated data:
      </p>
      <ol>
        <li>Go to <Link to="/dashboard/settings/workspace">Settings → Workspace</Link></li>
        <li>Click &quot;Delete Account&quot;</li>
        <li>Confirm by typing &quot;DELETE MY ACCOUNT&quot;</li>
        <li>All data will be permanently removed</li>
      </ol>

      <h2>Related</h2>
      <ul>
        <li><Link to="/docs/security/api-keys">API Key Security</Link></li>
        <li><Link to="/legal/privacy">Privacy Policy</Link></li>
        <li><Link to="/legal/terms">Terms of Service</Link></li>
      </ul>
    </div>
  );
}
