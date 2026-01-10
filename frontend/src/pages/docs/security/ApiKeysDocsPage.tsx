/**
 * API Keys Security Documentation
 */
import { Link } from 'react-router-dom';

export default function ApiKeysDocsPage() {
  return (
    <div>
      <h1>API Key Security</h1>
      
      <p className="lead">
        AKIS implements industry-standard encryption for storing API keys and credentials. Your keys are never logged, stored in plaintext, or exposed to the frontend.
      </p>

      <h2>Encryption</h2>
      <p>
        All sensitive credentials are encrypted using <strong>AES-256-GCM</strong> before storage:
      </p>
      <ul>
        <li>256-bit encryption key</li>
        <li>Unique IV (Initialization Vector) per key</li>
        <li>Authentication tag for integrity verification</li>
        <li>Key versioning for rotation support</li>
      </ul>

      <h2>What&apos;s Encrypted</h2>
      <ul>
        <li>AI provider API keys (OpenAI, OpenRouter)</li>
        <li>Atlassian API tokens</li>
        <li>GitHub OAuth tokens</li>
        <li>Any future integration credentials</li>
      </ul>

      <h2>Key Display</h2>
      <p>
        For identification purposes, only the last 4 characters of any key are stored separately and displayed in the UI. The full key is never returned from the API.
      </p>

      <h2>Server-Side Only</h2>
      <p>
        API keys are used exclusively server-side. They are:
      </p>
      <ul>
        <li>Never sent to the browser</li>
        <li>Never included in API responses</li>
        <li>Never logged (even in debug mode)</li>
        <li>Only decrypted when needed for API calls</li>
      </ul>

      <h2>Configuring AI Keys</h2>
      <ol>
        <li>Go to <Link to="/dashboard/settings/ai-keys">Settings → AI Keys</Link></li>
        <li>Select a provider (OpenAI or OpenRouter)</li>
        <li>Enter your API key</li>
        <li>Click &quot;Save&quot;</li>
      </ol>

      <h2>Key Rotation</h2>
      <p>
        To rotate a key, simply save a new key. The old encrypted key is overwritten. AKIS supports key versioning, so even if the encryption key is rotated, old data can still be decrypted.
      </p>

      <h2>Environment Variables</h2>
      <p>
        The encryption key is stored as an environment variable:
      </p>
      <pre><code>{`AI_KEY_ENCRYPTION_KEY=your-32-character-encryption-key`}</code></pre>
      <p>
        This key should be at least 32 characters and kept secure. Never commit it to version control.
      </p>

      <h2>Related</h2>
      <ul>
        <li><Link to="/docs/security/oauth">OAuth Security</Link></li>
        <li><Link to="/docs/security/privacy">Data Privacy</Link></li>
        <li><Link to="/docs/getting-started">Quick Start</Link></li>
      </ul>
    </div>
  );
}
