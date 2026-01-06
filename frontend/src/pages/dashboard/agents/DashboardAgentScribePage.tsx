/**
 * Scribe Single-Page Console
 * 
 * Layout:
 * - Left: Configuration panel (repo/branch/model + Advanced collapsed)
 * - Right: Glass Box live monitoring (console logs + tabs for preview/diff)
 * 
 * Demo mode: Works without backend, uses deterministic simulation
 */
import { useEffect, useMemo, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import SearchableSelect, { type SelectOption } from '../../../components/common/SearchableSelect';
import {
  githubDiscoveryApi,
  type GitHubOwner,
  type GitHubRepo,
  type GitHubBranch,
} from '../../../services/api/github-discovery';
import { integrationsApi } from '../../../services/api/integrations';
import { useDemoScribeRunner } from '../../../services/agents/scribe';
import type { ScribeLogEntry } from '../../../services/agents/scribe';

// Fallback data for demo when GitHub is not connected
const FALLBACK_OWNERS: GitHubOwner[] = [
  { login: 'akis-platform', type: 'Organization', avatarUrl: '' },
  { login: 'demo-team', type: 'Organization', avatarUrl: '' },
];

const FALLBACK_REPOS: Record<string, GitHubRepo[]> = {
  'akis-platform': [
    { name: 'docs-hub', fullName: 'akis-platform/docs-hub', defaultBranch: 'main', private: true, description: 'Documentation workspace' },
    { name: 'scribe-playground', fullName: 'akis-platform/scribe-playground', defaultBranch: 'main', private: false, description: 'Demo repository' },
  ],
  'demo-team': [
    { name: 'product-notes', fullName: 'demo-team/product-notes', defaultBranch: 'main', private: true, description: 'Product documentation' },
  ],
};

const FALLBACK_BRANCHES: GitHubBranch[] = [
  { name: 'main', isDefault: true },
  { name: 'develop', isDefault: false },
  { name: 'docs', isDefault: false },
];

type ActiveTab = 'logs' | 'preview' | 'diff';

const DashboardAgentScribePage = () => {
  const navigate = useNavigate();

  // GitHub discovery state
  const [owners, setOwners] = useState<GitHubOwner[]>([]);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [baseBranch, setBaseBranch] = useState('');
  const [targetPath, setTargetPath] = useState('docs/');
  const [dryRun, setDryRun] = useState(true);

  // Loading states
  const [loadingOwners, setLoadingOwners] = useState(true);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [githubConnected, setGithubConnected] = useState<boolean | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const [githubNotice, setGithubNotice] = useState<string | null>(null);

  // Advanced section
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Glass box panel
  const [activeTab, setActiveTab] = useState<ActiveTab>('logs');
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Demo runner
  const { state: runState, start, cancel, reset, isRunning, isComplete, isIdle } = useDemoScribeRunner();

  // Auto-scroll logs
  useEffect(() => {
    if (activeTab === 'logs' && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [runState.logs, activeTab]);

  // Check GitHub connection status first
  useEffect(() => {
    let active = true;

    const checkGitHubStatus = async () => {
      try {
        const status = await integrationsApi.getGitHubStatus();
        if (!active) return;
        setGithubConnected(status.connected);
      } catch {
        if (!active) return;
        setGithubConnected(false);
      }
    };

    void checkGitHubStatus();
    return () => { active = false; };
  }, []);

  // Load owners on mount (only if GitHub is connected)
  useEffect(() => {
    if (githubConnected === null) {
      // Still checking status
      return;
    }

    if (!githubConnected) {
      // Not connected - don't try to load owners
      setLoadingOwners(false);
      setOwners([]);
      setGithubNotice(null);
      return;
    }

    let active = true;

    const loadOwners = async () => {
      setLoadingOwners(true);
      try {
        const result = await githubDiscoveryApi.getOwners();
        if (!active) return;

        if (result.owners.length > 0) {
          setOwners(result.owners);
          setOwner((prev) => prev || result.owners[0].login);
          setUsingMockData(false);
          setGithubNotice(null);
          return;
        }

        setUsingMockData(true);
        setGithubNotice('Demo mode: Using mock repositories. Connect GitHub for real data.');
        setOwners(FALLBACK_OWNERS);
        setOwner((prev) => prev || FALLBACK_OWNERS[0].login);
      } catch (err: unknown) {
        if (!active) return;

        // Check if it's a 412 GITHUB_NOT_CONNECTED error
        if (err && typeof err === 'object' && 'code' in err && err.code === 'GITHUB_NOT_CONNECTED') {
          setGithubConnected(false);
          setOwners([]);
          setGithubNotice(null);
          return;
        }

        setUsingMockData(true);
        setGithubNotice('Demo mode: GitHub error. Using mock data.');
        setOwners(FALLBACK_OWNERS);
        setOwner((prev) => prev || FALLBACK_OWNERS[0].login);
      } finally {
        if (active) setLoadingOwners(false);
      }
    };

    void loadOwners();
    return () => { active = false; };
  }, [githubConnected]);

  // Load repos when owner changes
  useEffect(() => {
    if (!owner) {
      setRepos([]);
      setRepo('');
      return;
    }

    let active = true;

    const loadRepos = async () => {
      setLoadingRepos(true);
      setRepo('');
      setRepos([]);
      setBranches([]);
      setBaseBranch('');

      if (usingMockData) {
        const fallbackRepos = FALLBACK_REPOS[owner] ?? [];
        setRepos(fallbackRepos);
        setRepo(fallbackRepos[0]?.name ?? '');
        setLoadingRepos(false);
        return;
      }

      try {
        const result = await githubDiscoveryApi.getRepos(owner);
        if (!active) return;
        setRepos(result.repos);
        setRepo((prev) => prev || result.repos[0]?.name || '');
      } catch {
        if (!active) return;
        setUsingMockData(true);
        setGithubNotice('Demo mode: Repository list mocked.');
        const fallbackRepos = FALLBACK_REPOS[owner] ?? [];
        setRepos(fallbackRepos);
        setRepo((prev) => prev || fallbackRepos[0]?.name || '');
      } finally {
        if (active) setLoadingRepos(false);
      }
    };

    void loadRepos();
    return () => { active = false; };
  }, [owner, usingMockData]);

  // Load branches when repo changes
  useEffect(() => {
    if (!owner || !repo) {
      setBranches([]);
      setBaseBranch('');
      return;
    }

    let active = true;

    const loadBranches = async () => {
      setLoadingBranches(true);
      setBranches([]);

      if (usingMockData) {
        setBranches(FALLBACK_BRANCHES);
        setBaseBranch((prev) => prev || 'main');
        setLoadingBranches(false);
        return;
      }

      try {
        const result = await githubDiscoveryApi.getBranches(owner, repo);
        if (!active) return;
        setBranches(result.branches);
        setBaseBranch((prev) => prev || result.defaultBranch || 'main');
      } catch {
        if (!active) return;
        setUsingMockData(true);
        setGithubNotice('Demo mode: Branch list mocked.');
        setBranches(FALLBACK_BRANCHES);
        setBaseBranch((prev) => prev || 'main');
      } finally {
        if (active) setLoadingBranches(false);
      }
    };

    void loadBranches();
    return () => { active = false; };
  }, [owner, repo, usingMockData]);

  // Memoized options
  const ownerOptions = useMemo<SelectOption[]>(
    () => owners.map((item) => ({
      value: item.login,
      label: item.login,
      description: item.type,
      icon: item.avatarUrl ? (
        <img src={item.avatarUrl} alt={item.login} className="h-5 w-5 rounded-full" />
      ) : undefined,
    })),
    [owners]
  );

  const repoOptions = useMemo<SelectOption[]>(
    () => repos.map((item) => ({
      value: item.name,
      label: item.name,
      description: item.description || (item.private ? 'Private' : 'Public'),
    })),
    [repos]
  );

  const branchOptions = useMemo<SelectOption[]>(
    () => branches.map((item) => ({
      value: item.name,
      label: item.name,
      description: item.isDefault ? 'Default' : undefined,
    })),
    [branches]
  );

  const canRun = githubConnected && Boolean(owner.trim()) && Boolean(repo.trim()) && Boolean(baseBranch.trim());

  const handleRunScribe = () => {
    if (!canRun) return;
    start({
      owner,
      repo,
      baseBranch,
      targetPath,
      dryRun,
    });
    setActiveTab('logs');
  };

  const handleGoToIntegrations = () => {
    navigate('/dashboard/integrations');
  };

  const handleCancel = () => {
    cancel();
  };

  const handleReset = () => {
    reset();
  };

  const getStatusColor = () => {
    switch (runState.status) {
      case 'complete': return 'text-green-400';
      case 'error':
      case 'cancelled': return 'text-red-400';
      case 'idle': return 'text-ak-text-secondary';
      default: return 'text-ak-primary';
    }
  };

  const getStatusText = () => {
    switch (runState.status) {
      case 'idle': return 'Ready';
      case 'scanning': return 'Scanning...';
      case 'analyzing': return 'Analyzing...';
      case 'drafting': return 'Drafting...';
      case 'reviewing': return 'Reviewing...';
      case 'finalizing': return 'Finalizing...';
      case 'complete': return 'Complete';
      case 'cancelled': return 'Cancelled';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  const getLogLevelColor = (level: ScribeLogEntry['level']) => {
    switch (level) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'debug': return 'text-gray-500';
      default: return 'text-ak-text-secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-ak-text-primary">Scribe Console</h1>
          {usingMockData && (
            <span className="rounded-full border border-ak-border bg-ak-surface-2 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-ak-text-secondary">
              Demo Mode
            </span>
          )}
        </div>
        <p className="text-sm text-ak-text-secondary">
          Configure and run Scribe documentation agent from a single workspace.
        </p>
      </header>

      {/* Main Grid: Left Config + Right Glass Box */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Panel: Configuration */}
        <div className="space-y-4 lg:col-span-4">
          <Card className="space-y-5 bg-ak-surface">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ak-text-primary">Configuration</h2>
              <Link to="/dashboard/integrations" className="text-xs font-medium text-ak-primary hover:underline">
                Integrations →
              </Link>
            </div>

            {githubNotice && (
              <div className="rounded-xl border border-ak-border bg-ak-surface-2 px-3 py-2 text-xs text-ak-text-secondary">
                {githubNotice}
              </div>
            )}

            {/* GitHub Not Connected Gate */}
            {githubConnected === false && (
              <div className="space-y-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-ak-text-primary">
                      GitHub Not Connected
                    </h3>
                    <p className="mt-1 text-sm text-ak-text-secondary">
                      Scribe requires GitHub access to read repositories and create documentation PRs.
                      Please connect your GitHub account to continue.
                    </p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  className="w-full justify-center"
                  onClick={handleGoToIntegrations}
                >
                  Go to Integrations
                </Button>
              </div>
            )}

            {/* Repository Selection */}
            {githubConnected && (
              <div className="space-y-4">
                <SearchableSelect
                  label="Owner"
                  placeholder="Select owner"
                  options={ownerOptions}
                  value={owner}
                  onChange={setOwner}
                  loading={loadingOwners}
                  emptyMessage="No owners available"
                  disabled={isRunning}
                />

              <SearchableSelect
                label="Repository"
                placeholder="Select repository"
                options={repoOptions}
                value={repo}
                onChange={setRepo}
                loading={loadingRepos}
                emptyMessage="No repositories"
                disabled={!owner || isRunning}
              />

                <SearchableSelect
                  label="Base Branch"
                  placeholder="Select branch"
                  options={branchOptions}
                  value={baseBranch}
                  onChange={setBaseBranch}
                  loading={loadingBranches}
                  emptyMessage="No branches"
                  disabled={!repo || isRunning}
                  allowManualInput
                />
              </div>
            )}

            {/* Advanced Section */}
            {githubConnected && (
              <div className="border-t border-ak-border pt-4">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex w-full items-center justify-between text-sm font-medium text-ak-text-secondary hover:text-ak-text-primary"
              >
                <span>Advanced Options</span>
                <span className="text-xs">{showAdvanced ? '▲' : '▼'}</span>
              </button>

              {showAdvanced && (
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-ak-text-primary">
                      Target Path
                    </label>
                    <input
                      type="text"
                      value={targetPath}
                      onChange={(e) => setTargetPath(e.target.value)}
                      disabled={isRunning}
                      className="w-full rounded-lg border border-ak-border bg-ak-surface-2 px-3 py-2 text-sm text-ak-text-primary placeholder-ak-text-secondary/50 focus:border-ak-primary focus:outline-none focus:ring-1 focus:ring-ak-primary disabled:opacity-50"
                      placeholder="docs/"
                    />
                  </div>

                  <label className="flex items-center gap-3 text-sm text-ak-text-secondary">
                    <input
                      type="checkbox"
                      checked={dryRun}
                      onChange={(e) => setDryRun(e.target.checked)}
                      disabled={isRunning}
                      className="h-4 w-4 rounded border-ak-border bg-ak-surface-2 text-ak-primary focus:ring-ak-primary"
                    />
                    <span>Dry run (preview only, no commits)</span>
                  </label>
                  </div>
                )}
              </div>
            )}

            {/* Primary CTA */}
            {githubConnected && (
              <div className="space-y-3 border-t border-ak-border pt-4">
              {isIdle ? (
                <Button
                  onClick={handleRunScribe}
                  disabled={!canRun}
                  className="w-full justify-center py-3 text-base font-semibold"
                >
                  🚀 Run Scribe
                </Button>
              ) : isRunning ? (
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="w-full justify-center border-red-500/50 text-red-400 hover:bg-red-500/10"
                >
                  ⏹ Cancel Run
                </Button>
              ) : (
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full justify-center"
                >
                  ↺ Reset Console
                </Button>
              )}

                {!canRun && isIdle && (
                  <p className="text-center text-xs text-ak-text-secondary">
                    Select a repository and branch to start
                  </p>
                )}
              </div>
            )}
          </Card>

          {/* Status Summary */}
          {!isIdle && (
            <Card className="bg-ak-surface-2 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-ak-text-secondary">
                    Status
                  </p>
                  <p className={`text-lg font-semibold ${getStatusColor()}`}>
                    {getStatusText()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium uppercase tracking-wider text-ak-text-secondary">
                    Progress
                  </p>
                  <p className="text-lg font-semibold text-ak-text-primary">
                    {runState.progress}%
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-ak-bg">
                <div
                  className={`h-full transition-all duration-500 ${
                    runState.status === 'complete'
                      ? 'bg-green-500'
                      : runState.status === 'error' || runState.status === 'cancelled'
                        ? 'bg-red-500'
                        : 'bg-ak-primary'
                  }`}
                  style={{ width: `${runState.progress}%` }}
                />
              </div>
            </Card>
          )}
        </div>

        {/* Right Panel: Glass Box Console */}
        <div className="lg:col-span-8">
          <Card className="flex h-[600px] flex-col overflow-hidden bg-ak-surface p-0">
            {/* Tabs Header */}
            <div className="flex items-center justify-between border-b border-ak-border bg-ak-surface-2 px-4">
              <div className="flex">
                {(['logs', 'preview', 'diff'] as ActiveTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? 'border-ak-primary text-ak-primary'
                        : 'border-transparent text-ak-text-secondary hover:text-ak-text-primary'
                    }`}
                  >
                    {tab === 'logs' && '📋 Logs'}
                    {tab === 'preview' && '📄 Preview'}
                    {tab === 'diff' && '📝 Diff'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${isRunning ? 'animate-pulse bg-ak-primary' : isComplete ? 'bg-green-500' : 'bg-ak-text-secondary/30'}`} />
                <span className="text-xs text-ak-text-secondary">
                  {owner && repo ? `${owner}/${repo}` : 'No repo selected'}
                </span>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'logs' && (
                <div className="h-full overflow-y-auto bg-ak-bg p-4 font-mono text-sm">
                  {runState.logs.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-ak-text-secondary/50">
                      <span className="text-4xl">🤖</span>
                      <p className="mt-2 text-center">
                        Press "Run Scribe" to start documentation analysis
                      </p>
                      <p className="mt-1 text-xs">
                        {usingMockData ? 'Demo mode active' : 'Connected to GitHub'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {runState.logs.map((log) => (
                        <div key={log.id} className="flex gap-2">
                          <span className="flex-shrink-0 text-ak-text-secondary/50">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <span className={getLogLevelColor(log.level)}>
                            {log.message}
                          </span>
                        </div>
                      ))}
                      <div ref={logsEndRef} />
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'preview' && (
                <div className="h-full overflow-y-auto bg-ak-bg p-4">
                  {runState.preview ? (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap rounded-lg bg-ak-surface-2 p-4 text-sm text-ak-text-primary">
                        {runState.preview}
                      </pre>
                    </div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-ak-text-secondary/50">
                      <span className="text-4xl">📄</span>
                      <p className="mt-2">Documentation preview will appear here</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'diff' && (
                <div className="h-full overflow-y-auto bg-ak-bg p-4">
                  {runState.diff ? (
                    <pre className="whitespace-pre-wrap rounded-lg bg-ak-surface-2 p-4 font-mono text-xs">
                      {runState.diff.split('\n').map((line, idx) => (
                        <div
                          key={idx}
                          className={
                            line.startsWith('+')
                              ? 'text-green-400'
                              : line.startsWith('-')
                                ? 'text-red-400'
                                : line.startsWith('@@')
                                  ? 'text-cyan-400'
                                  : 'text-ak-text-secondary'
                          }
                        >
                          {line}
                        </div>
                      ))}
                    </pre>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-ak-text-secondary/50">
                      <span className="text-4xl">📝</span>
                      <p className="mt-2">Diff preview will appear after analysis</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardAgentScribePage;
