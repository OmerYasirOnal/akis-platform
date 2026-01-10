import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../../components/common/Button';

// GitHub icon
const GitHubIcon = () => (
  <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

// Jira icon
const JiraIcon = () => (
  <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.571 11.513H0a5.218 5.218 0 005.232 5.215h2.13v2.057A5.215 5.215 0 0012.575 24V12.486a.972.972 0 00-1.003-.973zM5.275 5.28H16.86a5.218 5.218 0 00-5.232-5.215H9.498V0A5.218 5.218 0 004.272 5.28h.003zm6.296 6.233H24a5.218 5.218 0 00-5.232-5.215h-2.13V4.24a5.218 5.218 0 00-5.213 5.215v11.514a.972.972 0 001.003.973z"/>
  </svg>
);

// Confluence icon
const ConfluenceIcon = () => (
  <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
    <path d="M.87 18.257c-.248.382-.53.875-.763 1.245a.764.764 0 00.255 1.04l4.965 3.054a.764.764 0 001.058-.26c.199-.332.454-.763.733-1.221 1.967-3.247 3.945-2.853 7.508-1.146l4.957 2.377a.764.764 0 001.028-.382l2.36-5.156a.763.763 0 00-.382-1.007c-1.326-.637-3.94-1.902-6.294-3.03-6.194-2.965-11.205-1.878-15.425 4.486zM23.131 5.743c.248-.382.53-.875.762-1.245a.764.764 0 00-.255-1.04L18.673.404a.764.764 0 00-1.058.26c-.199.332-.454.763-.733 1.221-1.967 3.247-3.945 2.853-7.508 1.146L4.417.654a.764.764 0 00-1.028.382L1.03 6.192a.763.763 0 00.382 1.007c1.326.637 3.94 1.902 6.294 3.03 6.194 2.965 11.205 1.878 15.425-4.486z"/>
  </svg>
);

// Link icon
const LinkIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
  </svg>
);

// Check icon
const CheckIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'connected' | 'not_connected' | 'coming_soon';
  features: string[];
  docsUrl?: string;
}

const integrations: Integration[] = [
  {
    id: 'github',
    name: 'GitHub',
    description: 'Connect your GitHub repositories to enable Scribe to analyze commits, generate documentation, and create pull requests.',
    icon: <GitHubIcon />,
    status: 'not_connected', // Will be updated based on OAuth status
    features: [
      'Repository discovery',
      'Branch & commit analysis',
      'Pull request creation',
      'Webhook automation',
    ],
    docsUrl: '/docs/integrations/github',
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Connect Jira to link agent jobs with issues, auto-update ticket status, and sync changelog entries.',
    icon: <JiraIcon />,
    status: 'coming_soon',
    features: [
      'Issue linking',
      'Status synchronization',
      'Changelog integration',
      'Sprint automation',
    ],
    docsUrl: '/docs/integrations/atlassian',
  },
  {
    id: 'confluence',
    name: 'Confluence',
    description: 'Publish generated documentation directly to Confluence spaces and keep technical docs in sync.',
    icon: <ConfluenceIcon />,
    status: 'coming_soon',
    features: [
      'Documentation publishing',
      'Space management',
      'Page version control',
      'Template integration',
    ],
    docsUrl: '/docs/integrations/atlassian',
  },
];

const statusStyles = {
  connected: {
    badge: 'bg-green-500/10 text-green-400 border-green-500/20',
    text: 'Connected',
  },
  not_connected: {
    badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    text: 'Not Connected',
  },
  coming_soon: {
    badge: 'bg-ak-surface-2 text-ak-text-secondary border-ak-border',
    text: 'Coming Soon',
  },
};

export default function IntegrationsHubPage() {
  const [githubStatus, setGithubStatus] = useState<'connected' | 'not_connected'>('not_connected');
  const [loading, setLoading] = useState(true);

  // Check GitHub OAuth status
  useEffect(() => {
    async function checkGithubStatus() {
      try {
        const response = await fetch('/api/integrations/github/status', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setGithubStatus(data.connected ? 'connected' : 'not_connected');
        }
      } catch {
        // API might not exist yet, default to not_connected
        setGithubStatus('not_connected');
      } finally {
        setLoading(false);
      }
    }
    checkGithubStatus();
  }, []);

  // Update integrations with actual GitHub status
  const integrationsWithStatus = integrations.map((integration) => ({
    ...integration,
    status: integration.id === 'github' ? githubStatus : integration.status,
  }));

  const handleGitHubConnect = () => {
    // Redirect to GitHub OAuth flow
    window.location.href = '/api/auth/github';
  };

  const handleGitHubDisconnect = async () => {
    try {
      const response = await fetch('/api/integrations/github/disconnect', {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        setGithubStatus('not_connected');
      }
    } catch (error) {
      console.error('Failed to disconnect GitHub:', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ak-text-primary">Integrations</h1>
        <p className="mt-2 text-ak-text-secondary">
          Connect AKIS to your development tools. All integrations use{' '}
          <a
            href="/docs/integrations/mcp"
            className="text-ak-primary hover:underline"
          >
            MCP (Model Context Protocol)
          </a>{' '}
          for secure, credential-free communication.
        </p>
      </div>

      {/* Info Callout */}
      <div className="rounded-xl border border-ak-primary/20 bg-ak-primary/5 p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-ak-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-ak-primary">MCP-Backed Integrations</h3>
            <p className="mt-1 text-sm text-ak-text-secondary">
              AKIS uses Model Context Protocol to interact with external services. Your credentials are never stored - MCP handles authentication securely through your configured gateways.
            </p>
          </div>
        </div>
      </div>

      {/* Integration Cards */}
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {integrationsWithStatus.map((integration) => (
          <div
            key={integration.id}
            className="flex flex-col rounded-2xl border border-ak-border bg-ak-surface-2 p-6 transition-all duration-base hover:shadow-ak-lg"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-ak-surface text-ak-text-primary">
                  {integration.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-ak-text-primary">
                    {integration.name}
                  </h3>
                  <span
                    className={`inline-block mt-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      statusStyles[integration.status].badge
                    }`}
                  >
                    {statusStyles[integration.status].text}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="mt-4 flex-1 text-sm text-ak-text-secondary">
              {integration.description}
            </p>

            {/* Features */}
            <ul className="mt-4 space-y-2">
              {integration.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-ak-text-secondary">
                  <CheckIcon />
                  {feature}
                </li>
              ))}
            </ul>

            {/* Actions */}
            <div className="mt-6 flex items-center gap-3">
              {integration.status === 'coming_soon' ? (
                <Button variant="outline" disabled className="flex-1">
                  Coming Soon
                </Button>
              ) : integration.status === 'connected' ? (
                <>
                  <Button
                    variant="outline"
                    onClick={integration.id === 'github' ? handleGitHubDisconnect : undefined}
                    className="flex-1"
                  >
                    Disconnect
                  </Button>
                  <Link
                    to={`/dashboard/integrations/${integration.id}`}
                    className="flex items-center gap-1 text-sm font-medium text-ak-primary hover:underline"
                  >
                    Manage <LinkIcon />
                  </Link>
                </>
              ) : (
                <Button
                  variant="primary"
                  onClick={integration.id === 'github' ? handleGitHubConnect : undefined}
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Connect'}
                </Button>
              )}

              {integration.docsUrl && (
                <Link
                  to={integration.docsUrl}
                  className="flex items-center gap-1 text-sm text-ak-text-secondary hover:text-ak-primary"
                >
                  Docs <LinkIcon />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Request Integration */}
      <div className="rounded-2xl border border-dashed border-ak-border bg-ak-surface p-8 text-center">
        <h3 className="text-lg font-bold text-ak-text-primary">
          Need a Different Integration?
        </h3>
        <p className="mt-2 text-ak-text-secondary">
          We're always adding new integrations. Let us know what tools you use.
        </p>
        <a
          href="https://github.com/akis-platform/akis/discussions"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-ak-primary hover:underline"
        >
          Request an Integration →
        </a>
      </div>
    </div>
  );
}
