/**
 * Scribe Single-Page Console
 * 
 * Layout:
 * - Top: Horizontal configuration bar (full width)
 * - Bottom: Workspace with Logs/Preview/Diff tabs
 * 
 * Real mode: Connects to backend and submits actual jobs
 * MCP-aligned: GitHub operations go through MCP Gateway
 */
import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import AgentRuntimeSettingsDrawer from '../../../components/agents/AgentRuntimeSettingsDrawer';
import PiriContextSidebar from '../../../components/agents/PiriContextSidebar';
import LiveAgentCanvas from '../../../components/agents/LiveAgentCanvas';
import { SectionCard, StatusStrip, EmptyPanel } from '../../../components/agents/hub';
import { useI18n } from '../../../i18n/useI18n';
import { usePiriContext } from '../../../hooks/usePiriContext';
import SearchableSelect, { type SelectOption } from '../../../components/common/SearchableSelect';
import {
  githubDiscoveryApi,
  type GitHubRepo,
  type GitHubBranch,
} from '../../../services/api/github-discovery';
import { agentsApi, type JobDetail, type RuntimeOverride } from '../../../services/api/agents';
import { integrationsApi } from '../../../services/api/integrations';
import { getMultiProviderStatus, type AIKeyProvider } from '../../../services/api/ai-keys';
import type { DocPack, DocDepth, DocTarget } from '../../../services/api/types';

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
  const { t: _t } = useI18n();
  const t = useCallback((key: string) => _t(key as never), [_t]);

  // Piri Context
  const piri = usePiriContext();
  const [piriOpen, setPiriOpen] = useState(false);
  const piriSelectedCount = piri.entries.filter((e) => e.selected).length;

  // GitHub OAuth user (read-only owner)
  const [connectedGitHubUser, setConnectedGitHubUser] = useState<string>('');
  
  // GitHub discovery state
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [repo, setRepo] = useState('');
  const [baseBranch, setBaseBranch] = useState('');
  const [targetPath, setTargetPath] = useState('docs/');
  const [dryRun, setDryRun] = useState(false);

  // Auto-branch name preview
  const [autoBranchName, setAutoBranchName] = useState<string>('');

  // Loading states
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);
  // Track if GitHub is connected (used internally, no need to expose in render)
  const githubConnectedRef = useRef<boolean | null>(null);

  // Job execution state
  const [currentJob, setCurrentJob] = useState<JobDetail | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<number | null>(null);

  // Doc Pack Generator state (empty string = auto-detect)
  const [docPack, setDocPack] = useState<DocPack | ''>('');
  const [docDepth, setDocDepth] = useState<DocDepth>('standard');
  const [outputTargets, setOutputTargets] = useState<DocTarget[]>(['README', 'ARCHITECTURE', 'API', 'DEVELOPMENT']);

  // Commit/PR analysis
  const [analyzeCommits, setAnalyzeCommits] = useState<number | null>(null);

  // Advanced section
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [runtimeOverride, setRuntimeOverride] = useState<RuntimeOverride | undefined>(undefined);

  // Glass box panel
  const [activeTab, setActiveTab] = useState<ActiveTab>('logs');
  const [isLogsExpanded, setIsLogsExpanded] = useState(false);

  // Close expanded logs on Escape
  useEffect(() => {
    if (!isLogsExpanded) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLogsExpanded(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isLogsExpanded]);

  // Check GitHub connection status and get username
  useEffect(() => {
    let active = true;

    const checkGitHubStatus = async () => {
      try {
        const status = await integrationsApi.getGitHubStatus();
        if (!active) return;
        
        githubConnectedRef.current = status.connected;
        
        if (status.connected && status.login) {
          setConnectedGitHubUser(status.login);
        } else if (status.connected) {
          // Connected but no login field - try to load from owners
          try {
            const ownersResult = await githubDiscoveryApi.getOwners();
            if (!active) return;
            if (ownersResult.owners.length > 0) {
              // Use first owner (the user) as the connected user
              const userOwner = ownersResult.owners.find(o => o.type === 'User');
              setConnectedGitHubUser(userOwner?.login || ownersResult.owners[0].login);
            }
          } catch {
            // Fallback: use empty string, will show error
            setGithubError('Could not determine GitHub username.');
          }
        }
      } catch {
        if (!active) return;
        githubConnectedRef.current = false;
        setGithubError('GitHub not connected. Please connect at /dashboard/integrations.');
      }
    };

    void checkGitHubStatus();
    return () => { active = false; };
  }, []);

  // Load repos when GitHub is connected
  useEffect(() => {
    if (!connectedGitHubUser) {
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
        const result = await githubDiscoveryApi.getRepos(connectedGitHubUser);
        if (!active) return;
        setRepos(result.repos);
        if (result.repos.length > 0) {
          setRepo(result.repos[0].name);
        }
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
  }, [connectedGitHubUser]);

  // Load branches when repo changes
  useEffect(() => {
    if (!connectedGitHubUser || !repo) {
      setBranches([]);
      setBaseBranch('');
      return;
    }

    let active = true;

    const loadBranches = async () => {
      setLoadingBranches(true);
      setBranches([]);

      try {
        const result = await githubDiscoveryApi.getBranches(connectedGitHubUser, repo);
        if (!active) return;
        setBranches(result.branches);
        setBaseBranch(result.defaultBranch || 'main');
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
  }, [connectedGitHubUser, repo]);

  // Auto-generate branch name preview
  useEffect(() => {
    if (repo && baseBranch) {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const HH = String(now.getHours()).padStart(2, '0');
      const MM = String(now.getMinutes()).padStart(2, '0');
      const SS = String(now.getSeconds()).padStart(2, '0');
      setAutoBranchName(`scribe/docs-${yyyy}${mm}${dd}-${HH}${MM}${SS}`);
    } else {
      setAutoBranchName('');
    }
  }, [repo, baseBranch]);

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

  const canRun = Boolean(connectedGitHubUser) && Boolean(repo.trim()) && Boolean(baseBranch.trim()) && !isPolling;

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
      message: `Starting Scribe workflow for ${connectedGitHubUser}/${repo} (${baseBranch})...`,
    };
    setLogs([initialLog]);
    setActiveTab('logs');

    try {
      // Fetch user's active AI provider to ensure job uses correct provider
      let aiProvider: AIKeyProvider | undefined;
      let providerSource: 'explicit' | 'account-default' | 'auto-select' = 'account-default';
      
      try {
        const aiStatus = await getMultiProviderStatus();
        
        // AI status resolved
        
        if (aiStatus.activeProvider === null) {
          // No provider explicitly set - auto-select based on configured USER keys (not ENV)
          // Prefer openai over openrouter when both have user keys
          providerSource = 'auto-select';
          
          const openaiHasUserKey = aiStatus.providers.openai.configured;
          const openrouterHasUserKey = aiStatus.providers.openrouter.configured;
          
          // Auto-selected provider based on user keys
          
          if (openaiHasUserKey) {
            aiProvider = 'openai';
          } else if (openrouterHasUserKey) {
            aiProvider = 'openrouter';
          } else {
            throw new Error('No AI provider configured. Please add an API key in Settings > API Keys.');
          }
          
          // No active provider set, auto-selected
        } else {
          // Use explicitly set active provider
          aiProvider = aiStatus.activeProvider;
          providerSource = 'account-default';
          // Using account active provider
        }
        
        // Provider resolved
        
      } catch (aiError) {
        // Show user-friendly error instead of silent fallback
        const errorLog: LogEntry = {
          id: `ai-error-${Date.now()}`,
          timestamp: new Date(),
          level: 'error',
          message: aiError instanceof Error ? aiError.message : 'Failed to determine AI provider. Configure one in Settings > API Keys.',
        };
        setLogs(prev => [...prev, errorLog]);
        return; // Don't submit job without valid provider
      }

      // Build payload - only include aiProvider when we have a definitive selection
      const jobPayload: Record<string, unknown> = {
        owner: connectedGitHubUser,
        repo,
        baseBranch,
        targetPath,
        dryRun,
        ...(docPack ? { docPack } : {}),
        docDepth,
        ...(docPack ? { outputTargets } : {}),
        ...(analyzeCommits ? { analyzeLastNCommits: analyzeCommits } : {}),
      };
      
      // Always include aiProvider for deterministic backend resolution
      if (aiProvider) {
        jobPayload.aiProvider = aiProvider;
        jobPayload.aiProviderSource = providerSource; // For debugging
      }
      
      // Job payload prepared

      // Inject Piri context if available
      const piriContext = piri.getSelectedContext();
      if (piriContext) {
        jobPayload.additionalContext = piriContext;
      }

      // Submit job to backend
      const response = await agentsApi.runAgent({
        type: 'scribe',
        payload: jobPayload,
        runtimeOverride,
      });

      // Start polling - fetch full job details
      const job = await agentsApi.getJob(response.jobId);
      setCurrentJob(job);
      setIsPolling(true);

      // Notify global RunBar
      window.dispatchEvent(new CustomEvent('akis-job-started', {
        detail: { id: job.id, type: job.type, state: job.state, createdAt: job.createdAt, updatedAt: job.updatedAt },
      }));

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

  const getStatusTone = (): 'idle' | 'running' | 'success' | 'error' => {
    if (!currentJob) return 'idle';
    switch (currentJob.state) {
      case 'pending':
      case 'running':
        return 'running';
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      default:
        return 'idle';
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
    <>
      <div className="space-y-6">
      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-ak-text-primary">Scribe Console</h1>
            <p className="text-sm text-ak-text-secondary">
              Configure and run Scribe documentation agent.
            </p>
          </div>
          <Button variant="secondary" onClick={() => setShowSettingsDrawer(true)}>
            Settings
          </Button>
        </div>
      </header>

      {/* Horizontal Configuration Bar */}
      <SectionCard
        title="Configuration"
        subtitle="Select repository context first, then tune doc scope and optional advanced settings."
        actions={(
          <Link to="/dashboard/integrations" className="text-xs font-medium text-ak-primary hover:underline">
            Integrations →
          </Link>
        )}
      >
        <div className="space-y-5">

          {githubError && (
            <div className="rounded-xl border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {githubError}
            </div>
          )}

          {/* Main Config Row */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Owner - Read Only */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-ak-text-primary">Owner</label>
              <input
                type="text"
                value={connectedGitHubUser ? `@${connectedGitHubUser}` : 'Not connected'}
                readOnly
                disabled={!connectedGitHubUser}
                className="w-full rounded-lg border border-ak-border bg-ak-surface-2 px-3 py-2 text-sm text-ak-text-primary disabled:opacity-50 cursor-not-allowed"
              />
            </div>

            {/* Repository Dropdown */}
            <SearchableSelect
              label="Repository"
              placeholder="Select repository"
              options={repoOptions}
              value={repo}
              onChange={setRepo}
              loading={loadingRepos}
              emptyMessage="No repositories"
              disabled={(!connectedGitHubUser || isRunning) || undefined}
            />

            {/* Base Branch Dropdown (NO allowManualInput) */}
            <SearchableSelect
              label="Base Branch"
              placeholder="Select branch"
              options={branchOptions}
              value={baseBranch}
              onChange={setBaseBranch}
              loading={loadingBranches}
              emptyMessage="No branches"
              disabled={(!repo || isRunning) || undefined}
            />
          </div>

          {/* Branch Preview */}
          {autoBranchName && (
            <div className="rounded-lg bg-ak-surface-2 px-3 py-2 text-xs text-ak-text-secondary">
              Branch will be created: <code className="text-ak-primary">{autoBranchName}</code>
            </div>
          )}

          {/* Doc Pack Configuration */}
          <div className="border-t border-ak-border pt-4">
            <h3 className="mb-3 text-sm font-semibold text-ak-text-primary">{t('agents.scribe.docScope.label')}</h3>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Doc Pack Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-ak-text-secondary">{t('agents.scribe.docScope.label')}</label>
                <select
                  value={docPack}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setDocPack('');
                      setOutputTargets(['README', 'ARCHITECTURE', 'API', 'DEVELOPMENT']);
                    } else {
                      const pack = val as DocPack;
                      setDocPack(pack);
                      const defaultTargets: Record<DocPack, DocTarget[]> = {
                        readme: ['README'],
                        standard: ['README', 'ARCHITECTURE', 'API', 'DEVELOPMENT'],
                        full: ['README', 'ARCHITECTURE', 'API', 'DEVELOPMENT', 'DEPLOYMENT', 'CONTRIBUTING', 'FAQ', 'CHANGELOG'],
                      };
                      setOutputTargets(defaultTargets[pack]);
                    }
                  }}
                  disabled={!!isRunning}
                  className="w-full rounded-lg border border-ak-border bg-ak-surface-2 px-3 py-2 text-sm text-ak-text-primary focus:border-ak-primary focus:outline-none focus:ring-1 focus:ring-ak-primary disabled:opacity-50"
                >
                  <option value="">{t('agents.scribe.docScope.auto')}</option>
                  <option value="readme">{t('agents.scribe.docScope.readme')}</option>
                  <option value="standard">{t('agents.scribe.docScope.standard')}</option>
                  <option value="full">{t('agents.scribe.docScope.full')}</option>
                </select>
              </div>

              {/* Depth Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-ak-text-secondary">{t('agents.scribe.docDepth.label')}</label>
                <div className="flex gap-2">
                  {(['lite', 'standard', 'deep'] as DocDepth[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDocDepth(d)}
                      disabled={!!isRunning}
                      className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                        docDepth === d
                          ? 'border-ak-primary bg-ak-primary/10 text-ak-primary'
                          : 'border-ak-border bg-ak-surface-2 text-ak-text-secondary hover:text-ak-text-primary'
                      } disabled:opacity-50`}
                    >
                      {t(`agents.scribe.docDepth.${d}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget Indicator */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-ak-text-secondary">Budget</label>
                <div className="rounded-lg border border-ak-border bg-ak-surface-2 px-3 py-2 text-sm text-ak-text-primary">
                  <span className="font-mono">
                    {docDepth === 'lite' ? '~4K' : docDepth === 'standard' ? '~16K' : '~64K'}
                  </span>
                  <span className="ml-1 text-xs text-ak-text-secondary">tokens</span>
                  {(docPack === 'full' || docDepth === 'deep') && (
                    <span className="ml-2 rounded bg-ak-primary/20 px-1.5 py-0.5 text-xs text-ak-primary">2-pass</span>
                  )}
                </div>
              </div>
            </div>

            {/* Output Targets Checklist — hidden in auto-detect mode */}
            {docPack && <div className="mt-4 space-y-2">
              <label className="block text-xs font-medium text-ak-text-secondary">Output Targets</label>
              <div className="flex flex-wrap gap-2">
                {(['README', 'ARCHITECTURE', 'API', 'DEVELOPMENT', 'DEPLOYMENT', 'CONTRIBUTING', 'FAQ', 'CHANGELOG'] as DocTarget[]).map((target) => (
                  <label
                    key={target}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      outputTargets.includes(target)
                        ? 'border-ak-primary/50 bg-ak-primary/10 text-ak-primary'
                        : 'border-ak-border bg-ak-surface-2 text-ak-text-secondary hover:text-ak-text-primary'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={outputTargets.includes(target)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setOutputTargets([...outputTargets, target]);
                        } else {
                          setOutputTargets(outputTargets.filter(t => t !== target));
                        }
                      }}
                      disabled={!!isRunning}
                      className="sr-only"
                    />
                    {target}
                  </label>
                ))}
              </div>
            </div>}

            {/* Auto-detect hint */}
            {!docPack && (
              <div className="mt-3 rounded-lg bg-ak-primary/5 px-3 py-2 text-xs text-ak-text-secondary">
                {t('agents.scribe.docScope.autoHint')}
              </div>
            )}
          </div>

          {/* Advanced Options */}
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

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-ak-text-primary">
                    Analyze Last N Commits (optional)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={analyzeCommits ?? ''}
                    onChange={(e) => setAnalyzeCommits(e.target.value ? Number(e.target.value) : null)}
                    disabled={isRunning || false}
                    className="w-full rounded-lg border border-ak-border bg-ak-surface-2 px-3 py-2 text-sm text-ak-text-primary placeholder-ak-text-secondary/50 focus:border-ak-primary focus:outline-none focus:ring-1 focus:ring-ak-primary disabled:opacity-50"
                    placeholder="Leave empty to skip"
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

          {/* Run Button Row */}
          <div className="flex flex-wrap items-center gap-3 border-t border-ak-border pt-4">
            {isIdle ? (
              <Button
                onClick={handleRunScribe}
                disabled={!canRun}
                className="justify-center py-3 text-base font-semibold"
              >
                🚀 Run Scribe
              </Button>
            ) : isRunning ? (
              <Button
                variant="outline"
                disabled
                className="justify-center border-ak-primary/50 text-ak-primary"
              >
                ⏳ Running...
              </Button>
            ) : (
              <Button
                onClick={handleReset}
                variant="outline"
                className="justify-center"
              >
                ↺ Reset Console
              </Button>
            )}

            {!canRun && isIdle && (
              <p className="text-xs text-ak-text-secondary">
                {githubError ? 'Connect GitHub to continue' : 'Select repository and branch'}
              </p>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Status Summary (if job running/complete) */}
      {!isIdle && currentJob && (
        <Card className="bg-ak-surface-2 p-4">
          <StatusStrip
            label="Status"
            value={getStatusText()}
            secondaryLabel="Job ID"
            secondaryValue={`${currentJob.id.substring(0, 8)}...`}
            tone={getStatusTone()}
          />
        </Card>
      )}

      {/* Logs/Preview/Diff Workspace */}
      {isLogsExpanded && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setIsLogsExpanded(false)} />
      )}
      <Card className={`flex flex-col overflow-hidden bg-ak-surface p-0 transition-all duration-300 ${
        isLogsExpanded
          ? 'fixed inset-4 z-50 shadow-2xl'
          : 'min-h-[500px] max-h-[70vh]'
      }`}>
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

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${isRunning ? 'animate-pulse bg-ak-primary' : isComplete ? 'bg-green-500' : 'bg-ak-text-secondary/30'}`} />
              <span className="text-xs text-ak-text-secondary">
                {connectedGitHubUser && repo ? `${connectedGitHubUser}/${repo}` : 'No repo selected'} • {logs.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsLogsExpanded(!isLogsExpanded)}
              className="rounded p-1.5 text-ak-text-secondary transition-colors hover:bg-ak-surface hover:text-ak-text-primary"
              title={isLogsExpanded ? t('agentCanvas.collapse') : t('agentCanvas.expand')}
            >
              {isLogsExpanded ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'logs' && (
            <div className="h-full overflow-y-auto bg-ak-bg p-4">
              <LiveAgentCanvas
                jobId={currentJob?.id ?? null}
                isRunning={Boolean(isRunning)}
                isCompleted={currentJob?.state === 'completed'}
                isFailed={currentJob?.state === 'failed'}
                qualityScore={currentJob?.qualityScore ?? null}
                startedAt={currentJob?.createdAt ? new Date(currentJob.createdAt).getTime() : undefined}
              />
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
                <EmptyPanel
                  icon={<span>📄</span>}
                  title="No preview yet"
                  description="Run Scribe to inspect generated documentation output in this panel."
                />
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
                <EmptyPanel
                  icon={<span>📝</span>}
                  title="No diff yet"
                  description="Diff details will appear after Scribe completes repository analysis."
                />
              )}
            </div>
          )}
        </div>
      </Card>
      </div>
      <AgentRuntimeSettingsDrawer
        open={showSettingsDrawer}
        agentType="scribe"
        onClose={() => setShowSettingsDrawer(false)}
        onSaved={(next) =>
          setRuntimeOverride({
            runtimeProfile: next.runtimeProfile,
            temperatureValue: next.temperatureValue,
            commandLevel: next.commandLevel,
          })
        }
      />
      <PiriContextSidebar
        open={piriOpen}
        onToggle={() => setPiriOpen((v) => !v)}
        entries={piri.entries}
        isLoading={piri.isLoading}
        error={piri.error}
        isHealthy={piri.isHealthy}
        onAsk={piri.askPiri}
        onSearch={piri.searchPiri}
        onToggleEntry={piri.toggleEntry}
        onRemoveEntry={piri.removeEntry}
        onClear={piri.clearEntries}
        selectedCount={piriSelectedCount}
      />
    </>
  );
};

export default DashboardAgentScribePage;
