import { useEffect, useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { integrationsApi, type GitHubStatus } from '../../services/api/integrations';

const DashboardIntegrationsPage = () => {
  const [githubStatus, setGitHubStatus] = useState<GitHubStatus | null>(null);
  const [loadingGitHub, setLoadingGitHub] = useState(true);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [submittingToken, setSubmittingToken] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Load GitHub status on mount
  useEffect(() => {
    loadGitHubStatus();
  }, []);

  const loadGitHubStatus = async () => {
    setLoadingGitHub(true);
    try {
      const status = await integrationsApi.getGitHubStatus();
      setGitHubStatus(status);
    } catch (err) {
      console.error('Failed to load GitHub status:', err);
      setGitHubStatus({ connected: false, error: 'Failed to load status' });
    } finally {
      setLoadingGitHub(false);
    }
  };

  const handleConnectToken = async () => {
    if (!tokenInput.trim()) {
      setTokenError('Token is required');
      return;
    }

    setSubmittingToken(true);
    setTokenError(null);

    try {
      await integrationsApi.connectGitHubToken(tokenInput.trim());
      setShowTokenModal(false);
      setTokenInput('');
      await loadGitHubStatus();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setTokenError(err.message || 'Failed to connect GitHub');
      } else {
        setTokenError('Failed to connect GitHub');
      }
    } finally {
      setSubmittingToken(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect GitHub?')) {
      return;
    }

    setDisconnecting(true);
    try {
      await integrationsApi.disconnectGitHub();
      await loadGitHubStatus();
    } catch (err) {
      console.error('Failed to disconnect GitHub:', err);
      alert('Failed to disconnect GitHub');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-ak-text-primary">
          Integrations
        </h1>
        <p className="text-sm text-ak-text-secondary">
          Manage connections between AKIS and external systems.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* GitHub Integration */}
        <Card className="flex h-full flex-col gap-3 bg-ak-surface">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-ak-text-primary">
                GitHub
              </h2>
              {loadingGitHub ? (
                <p className="text-sm text-ak-text-secondary">Loading...</p>
              ) : (
                <>
                  <p className="text-sm text-ak-text-secondary">
                    Status: {githubStatus?.connected ? (
                      <span className="text-green-400">Connected</span>
                    ) : (
                      <span className="text-ak-text-secondary">Not connected</span>
                    )}
                  </p>
                  {githubStatus?.login && (
                    <p className="mt-1 text-xs text-ak-text-secondary">
                      Connected as: {githubStatus.login}
                    </p>
                  )}
                </>
              )}
            </div>
            {!loadingGitHub && (
              <div className="flex gap-2">
                {githubStatus?.connected ? (
                  <Button
                    variant="secondary"
                    className="whitespace-nowrap px-4"
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                  >
                    {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    className="whitespace-nowrap px-4"
                    onClick={() => setShowTokenModal(true)}
                  >
                    Connect
                  </Button>
                )}
              </div>
            )}
          </div>
          <div className="text-xs text-ak-text-secondary/80">
            {githubStatus?.connected ? (
              <p>GitHub is connected. Scribe can access your repositories.</p>
            ) : (
              <p>Connect GitHub to enable Scribe documentation agent.</p>
            )}
          </div>
        </Card>

        {/* Placeholder integrations */}
        <Card className="flex h-full flex-col gap-3 bg-ak-surface opacity-50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-ak-text-primary">
                Jira Cloud
              </h2>
              <p className="text-sm text-ak-text-secondary">
                Status: Coming soon
              </p>
            </div>
            <Button variant="secondary" className="whitespace-nowrap px-4" disabled>
              Coming soon
            </Button>
          </div>
          <p className="text-xs text-ak-text-secondary/80">
            Jira integration is not yet available.
          </p>
        </Card>

        <Card className="flex h-full flex-col gap-3 bg-ak-surface opacity-50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-ak-text-primary">
                Confluence
              </h2>
              <p className="text-sm text-ak-text-secondary">
                Status: Coming soon
              </p>
            </div>
            <Button variant="secondary" className="whitespace-nowrap px-4" disabled>
              Coming soon
            </Button>
          </div>
          <p className="text-xs text-ak-text-secondary/80">
            Confluence integration is not yet available.
          </p>
        </Card>

        <Card className="flex h-full flex-col gap-3 bg-ak-surface opacity-50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-ak-text-primary">
                Slack (Notifications)
              </h2>
              <p className="text-sm text-ak-text-secondary">
                Status: Coming soon
              </p>
            </div>
            <Button variant="secondary" className="whitespace-nowrap px-4" disabled>
              Coming soon
            </Button>
          </div>
          <p className="text-xs text-ak-text-secondary/80">
            Slack notifications are not yet available.
          </p>
        </Card>
      </div>

      {/* Token Modal */}
      {showTokenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-ak-surface p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-semibold text-ak-text-primary">
              Connect GitHub
            </h2>
            <p className="mb-4 text-sm text-ak-text-secondary">
              Enter your GitHub Personal Access Token. The token needs the following scopes:
            </p>
            <ul className="mb-4 list-inside list-disc space-y-1 text-xs text-ak-text-secondary">
              <li>read:user - Read user profile</li>
              <li>user:email - Read user email</li>
              <li>repo - Full access to repositories (for reading and creating PRs)</li>
            </ul>
            <p className="mb-4 text-xs text-ak-text-secondary">
              Create a token at:{' '}
              <a
                href="https://github.com/settings/tokens/new"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ak-primary hover:underline"
              >
                github.com/settings/tokens/new
              </a>
            </p>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-ak-text-primary">
                  Personal Access Token
                </label>
                <input
                  type="password"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full rounded-lg border border-ak-border bg-ak-surface-2 px-3 py-2 text-sm text-ak-text-primary placeholder-ak-text-secondary/50 focus:border-ak-primary focus:outline-none focus:ring-1 focus:ring-ak-primary"
                />
                {tokenError && (
                  <p className="mt-1 text-xs text-red-400">{tokenError}</p>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleConnectToken}
                  disabled={submittingToken}
                >
                  {submittingToken ? 'Connecting...' : 'Connect'}
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setShowTokenModal(false);
                    setTokenInput('');
                    setTokenError(null);
                  }}
                  disabled={submittingToken}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardIntegrationsPage;

