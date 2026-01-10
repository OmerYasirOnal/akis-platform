/**
 * AtlassianConnectModal - Reusable modal for connecting Jira or Confluence
 * Uses API token authentication (not OAuth 2.0 3LO)
 */
import { useState } from 'react';
import Button from '../common/Button';
import Input from '../common/Input';

// Close icon
const CloseIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Info icon
const InfoIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
  </svg>
);

// Check icon
const CheckIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

export interface AtlassianConnectModalProps {
  provider: 'jira' | 'confluence';
  isOpen: boolean;
  onClose: () => void;
  onConnect: (data: { siteUrl: string; email: string; apiToken: string }) => Promise<void>;
}

export default function AtlassianConnectModal({
  provider,
  isOpen,
  onClose,
  onConnect,
}: AtlassianConnectModalProps) {
  const [siteUrl, setSiteUrl] = useState('');
  const [email, setEmail] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const providerName = provider === 'jira' ? 'Jira' : 'Confluence';
  const tokenDocUrl = 'https://id.atlassian.com/manage-profile/security/api-tokens';

  const validateForm = (): string | null => {
    if (!siteUrl.trim()) {
      return 'Site URL is required';
    }
    // Basic URL validation
    try {
      const url = new URL(siteUrl.includes('://') ? siteUrl : `https://${siteUrl}`);
      if (!url.hostname.includes('atlassian.net')) {
        return 'Site URL must be an Atlassian Cloud site (e.g., your-domain.atlassian.net)';
      }
    } catch {
      return 'Invalid site URL format';
    }

    if (!email.trim()) {
      return 'Email is required';
    }
    // Basic email validation
    if (!email.includes('@') || !email.includes('.')) {
      return 'Invalid email format';
    }

    if (!apiToken.trim()) {
      return 'API token is required';
    }
    if (apiToken.length < 10) {
      return 'API token seems too short. Please check your token.';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Normalize site URL
    let normalizedUrl = siteUrl.trim();
    if (!normalizedUrl.includes('://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }
    normalizedUrl = normalizedUrl.replace(/\/+$/, ''); // Remove trailing slashes

    setLoading(true);
    try {
      await onConnect({
        siteUrl: normalizedUrl,
        email: email.trim(),
        apiToken: apiToken.trim(),
      });
      setSuccess(true);
      // Close modal after short delay to show success
      setTimeout(() => {
        onClose();
        // Reset form state
        setSiteUrl('');
        setEmail('');
        setApiToken('');
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl border border-ak-border bg-ak-surface p-6 shadow-ak-lg">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-ak-text-primary">
            Connect {providerName}
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-ak-text-secondary hover:text-ak-text-primary disabled:opacity-50"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Info Banner */}
        <div className="mt-4 rounded-xl border border-ak-primary/20 bg-ak-primary/5 p-3">
          <div className="flex gap-2">
            <InfoIcon />
            <p className="text-sm text-ak-text-secondary">
              {providerName} uses API token authentication. Your token is encrypted and
              securely stored. We never have access to your password.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            label="Site URL"
            placeholder="your-domain.atlassian.net"
            value={siteUrl}
            onChange={(e) => setSiteUrl(e.target.value)}
            disabled={loading || success}
            description="Your Atlassian Cloud site URL"
          />

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || success}
            description="The email associated with your Atlassian account"
          />

          <div>
            <Input
              label="API Token"
              type="password"
              placeholder="••••••••••••••••"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              disabled={loading || success}
            />
            <p className="mt-1.5 text-xs text-ak-text-secondary">
              Generate an API token from{' '}
              <a
                href={tokenDocUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ak-primary hover:underline"
              >
                Atlassian Account Settings
              </a>
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-400">
              <CheckIcon />
              {providerName} connected successfully!
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading || success}
            >
              {loading ? 'Connecting...' : success ? 'Connected!' : 'Connect'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
