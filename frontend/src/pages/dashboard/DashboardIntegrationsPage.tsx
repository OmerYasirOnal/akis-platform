import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { integrationsApi, type GitHubStatus } from '../../services/api/integrations';

const DashboardIntegrationsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [githubStatus, setGitHubStatus] = useState<GitHubStatus | null>(null);
  const [loadingGitHub, setLoadingGitHub] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load GitHub status on mount and handle OAuth callback params
  useEffect(() => {
    loadGitHubStatus();

    // Handle OAuth callback params
    const githubParam = searchParams.get('github');
    if (githubParam === 'connected') {
      setNotification({ type: 'success', message: 'GitHub connected successfully!' });
      // Clear params from URL
      setSearchParams({});
    } else if (githubParam === 'error') {
      const reason = searchParams.get('reason') || 'unknown';
      setNotification({ type: 'error', message: `Failed to connect GitHub: ${reason}` });
      // Clear params from URL
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // Auto-hide notifications after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

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

  const handleConnect = () => {
    // Redirect to OAuth start endpoint
    integrationsApi.startGitHubOAuth();
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect GitHub?')) {
      return;
    }

    setDisconnecting(true);
    try {
      await integrationsApi.disconnectGitHub();
      setNotification({ type: 'success', message: 'GitHub disconnected successfully!' });
      await loadGitHubStatus();
    } catch (err) {
      console.error('Failed to disconnect GitHub:', err);
      setNotification({ type: 'error', message: 'Failed to disconnect GitHub' });
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

      {/* Notification banner */}
      {notification && (
        <div
          className={`rounded-xl border px-4 py-3 ${
            notification.type === 'success'
              ? 'border-green-500/30 bg-green-500/10 text-green-400'
              : 'border-red-500/30 bg-red-500/10 text-red-400'
          }`}
        >
          {notification.message}
        </div>
      )}

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
                    onClick={handleConnect}
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
    </div>
  );
};

export default DashboardIntegrationsPage;

