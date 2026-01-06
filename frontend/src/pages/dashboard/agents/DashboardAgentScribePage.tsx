/**
 * Scribe Single-Page Console
 * 
 * Layout:
 * - Left: Configuration panel (repo/branch/model + Advanced collapsed)
 * - Right: Glass Box live monitoring (console logs + tabs for preview/diff)
 * 
 * Real mode: Connects to backend and submits actual jobs
 */
import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import SearchableSelect, { type SelectOption } from '../../../components/common/SearchableSelect';
import {
  githubDiscoveryApi,
  type GitHubOwner,
  type GitHubRepo,
  type GitHubBranch,
} from '../../../services/api/github-discovery';
import { agentsApi, type JobDetail } from '../../../services/api/agents';
import { integrationsApi } from '../../../services/api/integrations';

type ActiveTab = 'logs' | 'preview' | 'diff';

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'success' | 'error' | 'warning' | 'debug';
  message: string;
}

interface TraceEvent {
  id?: string;
  timestamp: string;
  title?: string;
  detail?: string;
  status?: 'running' | 'completed' | 'failed';
}

interface Artifact {
  preview?: string;
}

const DashboardAgentScribePage = () => {
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
  const [githubError, setGithubError] = useState<string | null>(null);
  const [githubConnected, setGithubConnected] = useState<boolean | null>(null);

  // Job execution state
  const [currentJob, setCurrentJob] = useState<JobDetail | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<number | null>(null);

  // Advanced section
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Glass box panel
  const [activeTab, setActiveTab] = useState<ActiveTab>('logs');
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (activeTab === 'logs' && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, activeTab]);

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
      // Not connected - show error and don't try to load
      setLoadingOwners(false);
      setGithubError('GitHub not connected. Please connect GitHub at /dashboard/integrations to use Scribe.');
      return;
    }

    let active = true;

    const loadOwners = async () => {
      setLoadingOwners(true);
      setGithubError(null);
      try {
        const result = await githubDiscoveryApi.getOwners();
        if (!active) return;

        if (result.owners.length > 0) {
          setOwners(result.owners);
          setOwner((prev) => prev || result.owners[0].login);
        } else {
          setGithubError('No GitHub organizations found. Please check your GitHub connection.');
        }
      } catch (error) {
        if (!active) return;
        setGithubError('Failed to load GitHub organizations. Please try reconnecting at /dashboard/integrations.');
        console.error('Failed to load GitHub owners:', error);
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

      try {
        const result = await githubDiscoveryApi.getRepos(owner);
        if (!active) return;
        setRepos(result.repos);
        setRepo((prev) => prev || result.repos[0]?.name || '');
      } catch (error) {
        if (!active) return;
        console.error('Failed to load repos:', error);
        setRepos([]);
      } finally {
        if (active) setLoadingRepos(false);
      }
    };

    void loadRepos();
    return () => { active = false; };
  }, [owner]);

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

      try {
        const result = await githubDiscoveryApi.getBranches(owner, repo);
        if (!active) return;
        setBranches(result.branches);
        setBaseBranch((prev) => prev || result.defaultBranch || 'main');
      } catch (error) {
        if (!active) return;
        console.error('Failed to load branches:', error);
        setBranches([]);
      } finally {
        if (active) setLoadingBranches(false);
      }
    };

    void loadBranches();
    return () => { active = false; };
  }, [owner, repo]);

  // Poll job status
  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      const job = await agentsApi.getJob(jobId, { include: ['trace', 'artifacts'] });
      setCurrentJob(job);

      // Extract logs from trace events
      if (job.trace && Array.isArray(job.trace)) {
        const newLogs: LogEntry[] = (job.trace as TraceEvent[]).map((event) => ({
          id: event.id || String(Math.random()),
          timestamp: new Date(event.timestamp),
          level: event.status === 'failed' ? 'error' : event.status === 'completed' ? 'success' : 'info',
          message: event.title || event.detail || 'Processing...',
        }));
        setLogs(newLogs);
      }

      // Stop polling if job is in terminal state
      if (job.state === 'completed' || job.state === 'failed') {
        setIsPolling(false);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }

        // Add completion log
        const completionLog: LogEntry = {
          id: `completion-${Date.now()}`,
          timestamp: new Date(),
          level: job.state === 'completed' ? 'success' : 'error',
          message: job.state === 'completed' 
            ? '✓ Scribe workflow completed successfully' 
            : `✗ Scribe workflow failed: ${job.errorMessage || job.error || 'Unknown error'}`,
        };
        setLogs(prev => [...prev, completionLog]);
      }
    } catch (error) {
      console.error('Failed to poll job:', error);
      // Don't stop polling on temporary errors
    }
  }, []);

  // Start polling when job is created
  useEffect(() => {
    if (currentJob && isPolling && (currentJob.state === 'pending' || currentJob.state === 'running')) {
      // Initial immediate poll
      void pollJobStatus(currentJob.id);

      // Set up polling interval
      pollingIntervalRef.current = window.setInterval(() => {
        void pollJobStatus(currentJob.id);
      }, 2000); // Poll every 2 seconds

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    }
  }, [currentJob, isPolling, pollJobStatus]);

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

  const canRun = Boolean(owner.trim()) && Boolean(repo.trim()) && Boolean(baseBranch.trim()) && !isPolling;

  const handleRunScribe = async () => {
    if (!canRun) return;

    // Clear previous state
    setLogs([]);
    setCurrentJob(null);

    // Add initial log
    const initialLog: LogEntry = {
      id: `start-${Date.now()}`,
      timestamp: new Date(),
      level: 'info',
      message: `Starting Scribe workflow for ${owner}/${repo} (${baseBranch})...`,
    };
    setLogs([initialLog]);
    setActiveTab('logs');

    try {
      // Submit job to backend
      const response = await agentsApi.runAgent({
        type: 'scribe',
        payload: {
          owner,
          repo,
          baseBranch,
          targetPath,
          dryRun,
        },
      });

      // Start polling - fetch full job details
      const job = await agentsApi.getJob(response.jobId);
      setCurrentJob(job);
      setIsPolling(true);

      const submittedLog: LogEntry = {
        id: `submitted-${Date.now()}`,
        timestamp: new Date(),
        level: 'success',
        message: `Job submitted: ${response.jobId}`,
      };
      setLogs(prev => [...prev, submittedLog]);
    } catch (error) {
      const errorLog: LogEntry = {
        id: `error-${Date.now()}`,
        timestamp: new Date(),
        level: 'error',
        message: `Failed to start Scribe: ${error instanceof Error ? error.message : String(error)}`,
      };
      setLogs(prev => [...prev, errorLog]);
      console.error('Failed to run Scribe:', error);
    }
  };

  const handleReset = () => {
    setCurrentJob(null);
    setLogs([]);
    setIsPolling(false);
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const getStatusColor = () => {
    if (!currentJob) return 'text-ak-text-secondary';
    switch (currentJob.state) {
      case 'completed': return 'text-green-400';
      case 'failed': return 'text-red-400';
      case 'pending': return 'text-yellow-400';
      case 'running': return 'text-ak-primary';
      default: return 'text-ak-text-secondary';
    }
  };

  const getStatusText = () => {
    if (!currentJob) return 'Ready';
    switch (currentJob.state) {
      case 'pending': return 'Queued';
      case 'running': return 'Running';
      case 'completed': return 'Complete';
      case 'failed': return 'Failed';
      default: return 'Unknown';
    }
  };

  const getLogLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'debug': return 'text-gray-500';
      default: return 'text-ak-text-secondary';
    }
  };

  const isRunning = isPolling && currentJob && (currentJob.state === 'pending' || currentJob.state === 'running');
  const isComplete = currentJob && (currentJob.state === 'completed' || currentJob.state === 'failed');
  const isIdle = !currentJob || !isPolling;

  // Extract preview and diff from job result
  const preview = currentJob?.result && typeof currentJob.result === 'object' && 'preview' in currentJob.result
    ? String((currentJob.result as { preview: string }).preview)
    : null;

  const diff = currentJob?.artifacts && Array.isArray(currentJob.artifacts) && currentJob.artifacts.length > 0
    ? (currentJob.artifacts[0] as Artifact).preview || null
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-ak-text-primary">Scribe Console</h1>
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

            {githubError && (
              <div className="rounded-xl border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                {githubError}
              </div>
            )}

            {/* Repository Selection */}
            <div className="space-y-4">
              <SearchableSelect
                label="Owner"
                placeholder="Select owner"
                options={ownerOptions}
                value={owner}
                onChange={setOwner}
                loading={loadingOwners}
                emptyMessage="No owners available"
                disabled={isRunning || undefined}
              />

              <SearchableSelect
                label="Repository"
                placeholder="Select repository"
                options={repoOptions}
                value={repo}
                onChange={setRepo}
                loading={loadingRepos}
                emptyMessage="No repositories"
                disabled={(!owner || isRunning) || undefined}
              />

              <SearchableSelect
                label="Base Branch"
                placeholder="Select branch"
                options={branchOptions}
                value={baseBranch}
                onChange={setBaseBranch}
                loading={loadingBranches}
                emptyMessage="No branches"
                disabled={(!repo || isRunning) || undefined}
                allowManualInput
              />
            </div>

            {/* Advanced Section */}
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
                      disabled={isRunning || false}
                      className="w-full rounded-lg border border-ak-border bg-ak-surface-2 px-3 py-2 text-sm text-ak-text-primary placeholder-ak-text-secondary/50 focus:border-ak-primary focus:outline-none focus:ring-1 focus:ring-ak-primary disabled:opacity-50"
                      placeholder="docs/"
                    />
                  </div>

                  <label className="flex items-center gap-3 text-sm text-ak-text-secondary">
                    <input
                      type="checkbox"
                      checked={dryRun}
                      onChange={(e) => setDryRun(e.target.checked)}
                      disabled={isRunning || false}
                      className="h-4 w-4 rounded border-ak-border bg-ak-surface-2 text-ak-primary focus:ring-ak-primary"
                    />
                    <span>Dry run (preview only, no commits)</span>
                  </label>
                </div>
              )}
            </div>

            {/* Primary CTA */}
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
                  variant="outline"
                  disabled
                  className="w-full justify-center border-ak-primary/50 text-ak-primary"
                >
                  ⏳ Running...
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
                  {githubError ? 'Connect GitHub to continue' : 'Select a repository and branch to start'}
                </p>
              )}
            </div>
          </Card>

          {/* Status Summary */}
          {!isIdle && currentJob && (
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
                    Job ID
                  </p>
                  <p className="text-xs font-mono text-ak-text-primary">
                    {currentJob.id.substring(0, 8)}...
                  </p>
                </div>
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
                  {logs.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-ak-text-secondary/50">
                      <span className="text-4xl">🤖</span>
                      <p className="mt-2 text-center">
                        Press "Run Scribe" to start documentation analysis
                      </p>
                      <p className="mt-1 text-xs">
                        {githubError ? 'Connect GitHub first' : 'Real backend integration'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {logs.map((log) => (
                        <div key={log.id} className="flex gap-2">
                          <span className="flex-shrink-0 text-ak-text-secondary/50">
                            {log.timestamp.toLocaleTimeString()}
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
                  {preview ? (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap rounded-lg bg-ak-surface-2 p-4 text-sm text-ak-text-primary">
                        {preview}
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
                  {diff ? (
                    <pre className="whitespace-pre-wrap rounded-lg bg-ak-surface-2 p-4 font-mono text-xs">
                      {diff.split('\n').map((line: string, idx: number) => (
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
