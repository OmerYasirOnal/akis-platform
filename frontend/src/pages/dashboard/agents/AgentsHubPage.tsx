import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../../components/common/Button';
import SearchableSelect, { type SelectOption } from '../../../components/common/SearchableSelect';
import { agentsApi, type AgentType, type JobDetail, type RunningJob } from '../../../services/api/agents';
import { agentConfigsApi, type ScribeConfig } from '../../../services/api/agent-configs';
import { githubDiscoveryApi, type GitHubRepo, type GitHubBranch } from '../../../services/api/github-discovery';
import { integrationsApi } from '../../../services/api/integrations';
import { getMultiProviderStatus, type AIKeyProvider } from '../../../services/api/ai-keys';
import { cn } from '../../../utils/cn';

interface AgentDefinition {
  id: AgentType;
  name: string;
  description: string;
  icon: React.ReactNode;
  capabilities: string[];
  status: 'available' | 'coming_soon';
  color: string;
}

const ScribeIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const TraceIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const ProtoIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);

const SearchIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

const PlayIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
  </svg>
);

const builtInAgents: AgentDefinition[] = [
  {
    id: 'scribe',
    name: 'Scribe',
    description: 'Auto-generate documentation, changelogs, and release notes from Git commits.',
    icon: <ScribeIcon />,
    capabilities: [
      'Analyzes commits and PRs',
      'Generates Markdown docs',
      'Creates PR with changes',
      'Supports multiple doc targets',
    ],
    status: 'available',
    color: 'ak-primary',
  },
  {
    id: 'trace',
    name: 'Trace',
    description: 'Generate test plans and coverage matrices from specifications.',
    icon: <TraceIcon />,
    capabilities: [
      'Parses acceptance criteria',
      'Generates test scaffolds',
      'Risk-based prioritization',
      'Coverage analysis',
    ],
    status: 'available',
    color: 'blue-400',
  },
  {
    id: 'proto',
    name: 'Proto',
    description: 'Bootstrap working MVP scaffolds from high-level requirements.',
    icon: <ProtoIcon />,
    capabilities: [
      'Full-stack scaffolding',
      'Built-in testing',
      'Deploy-ready configs',
      'Iterative refinement',
    ],
    status: 'available',
    color: 'purple-400',
  },
];

export default function AgentsHubPage() {
  const navigate = useNavigate();
  const [selectedAgent, setSelectedAgent] = useState<AgentDefinition>(builtInAgents[0]);
  const [searchQuery, setSearchQuery] = useState('');

  // GitHub state
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubUser, setGithubUser] = useState('');
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);

  // Branch strategy
  const [branchStrategy, setBranchStrategy] = useState<'manual' | 'auto'>('auto');
  const [autoBranchPreview, setAutoBranchPreview] = useState('');

  // Job state
  const [currentJob, setCurrentJob] = useState<JobDetail | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [jobError, setJobError] = useState<string | null>(null);
  const [runningJobs, setRunningJobs] = useState<RunningJob[]>([]);
  const [userConfigs, setUserConfigs] = useState<ScribeConfig[]>([]);

  useEffect(() => {
    const checkGitHub = async () => {
      try {
        const status = await integrationsApi.getGitHubStatus();
        setGithubConnected(status.connected);
        if (status.connected && status.login) {
          setGithubUser(status.login);
        }
      } catch {
        setGithubConnected(false);
      }
    };
    checkGitHub();
  }, []);

  useEffect(() => {
    const fetchRunningJobs = async () => {
      try {
        const result = await agentsApi.getRunningJobs();
        setRunningJobs(result.jobs);
        if (selectedRepo && result.jobs.length > 0) {
          const matchingJob = result.jobs.find(
            (job) => job.payload?.owner === githubUser && job.payload?.repo === selectedRepo
          );
          if (matchingJob && !currentJob) {
            const fullJob = await agentsApi.getJob(matchingJob.id, { include: ['trace'] });
            setCurrentJob(fullJob);
            if (fullJob.state === 'running' || fullJob.state === 'pending') {
              setIsRunning(true);
            }
          }
        }
      } catch { /* silent */ }
    };

    if (githubConnected) fetchRunningJobs();
    const interval = setInterval(() => {
      if (githubConnected) fetchRunningJobs();
    }, 3000);
    return () => clearInterval(interval);
  }, [githubConnected, githubUser, selectedRepo, currentJob]);

  useEffect(() => {
    if (!githubConnected || !githubUser) return;
    const loadRepos = async () => {
      setLoadingRepos(true);
      try {
        const result = await githubDiscoveryApi.getRepos(githubUser);
        setRepos(result.repos);
        if (result.repos.length > 0) setSelectedRepo(result.repos[0].name);
      } catch { setRepos([]); }
      finally { setLoadingRepos(false); }
    };
    loadRepos();
  }, [githubConnected, githubUser]);

  useEffect(() => {
    if (!githubConnected || !githubUser || !selectedRepo) return;
    const loadBranches = async () => {
      setLoadingBranches(true);
      try {
        const result = await githubDiscoveryApi.getBranches(githubUser, selectedRepo);
        setBranches(result.branches);
        setSelectedBranch(result.defaultBranch || 'main');
      } catch { setBranches([]); }
      finally { setLoadingBranches(false); }
    };
    loadBranches();
  }, [githubConnected, githubUser, selectedRepo]);

  useEffect(() => {
    const loadConfigs = async () => {
      try {
        const response = await agentConfigsApi.listConfigs();
        if (response.configs?.length > 0) setUserConfigs(response.configs);
      } catch { /* no configs */ }
    };
    loadConfigs();
  }, []);

  useEffect(() => {
    const generatePreview = () => {
      const now = new Date();
      const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
      setAutoBranchPreview(`${selectedAgent.id}/run-${ts}`);
    };
    generatePreview();
    const interval = setInterval(generatePreview, 1000);
    return () => clearInterval(interval);
  }, [selectedAgent.id]);

  const filteredAgents = useMemo(() => {
    if (!searchQuery.trim()) return builtInAgents;
    const query = searchQuery.toLowerCase();
    return builtInAgents.filter(
      (agent) => agent.name.toLowerCase().includes(query) || agent.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const repoOptions: SelectOption[] = repos.map((r) => ({
    value: r.name,
    label: r.name,
    description: r.private ? 'Private' : 'Public',
  }));

  const branchOptions: SelectOption[] = branches.map((b) => ({
    value: b.name,
    label: b.name,
    description: b.isDefault ? 'Default' : undefined,
  }));

  const handleRunAgent = async () => {
    if (!selectedAgent || selectedAgent.status !== 'available') return;
    if (!githubConnected || !selectedRepo || !selectedBranch) return;

    setIsRunning(true);
    setJobError(null);
    setCurrentJob(null);

    try {
      let aiProvider: AIKeyProvider | undefined;
      try {
        const aiStatus = await getMultiProviderStatus();
        if (aiStatus.activeProvider) aiProvider = aiStatus.activeProvider;
        else if (aiStatus.providers.openai.configured) aiProvider = 'openai';
        else if (aiStatus.providers.openrouter.configured) aiProvider = 'openrouter';
      } catch { /* continue */ }

      const response = await agentsApi.runAgent({
        type: selectedAgent.id,
        payload: {
          owner: githubUser,
          repo: selectedRepo,
          baseBranch: selectedBranch,
          branchStrategy,
          dryRun: false,
          ...(aiProvider && { aiProvider }),
        },
      });

      const pollJob = async () => {
        try {
          const job = await agentsApi.getJob(response.jobId, { include: ['trace'] });
          setCurrentJob(job);
          if (job.state === 'completed' || job.state === 'failed') {
            setIsRunning(false);
            if (job.state === 'failed') setJobError(job.errorMessage || job.error?.toString() || 'Job failed');
            return;
          }
          setTimeout(pollJob, 1000);
        } catch {
          setTimeout(pollJob, 3000);
        }
      };
      pollJob();
    } catch (error) {
      setIsRunning(false);
      setJobError(error instanceof Error ? error.message : 'Failed to run agent');
    }
  };

  const existingRunningJob = runningJobs.find(
    (job) => job.payload?.owner === githubUser && job.payload?.repo === selectedRepo
  );

  const canRun = selectedAgent?.status === 'available' &&
                 githubConnected &&
                 selectedRepo &&
                 selectedBranch &&
                 !isRunning &&
                 !existingRunningJob;

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-6">
      {/* Left Panel - Agent List */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-4 overflow-y-auto">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl bg-ak-surface-2 py-2.5 pl-10 pr-4 text-sm text-ak-text-primary placeholder:text-ak-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-ak-primary/50"
          />
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ak-text-secondary/50">
            <SearchIcon />
          </div>
        </div>

        {/* Built-in Agents */}
        <div>
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-ak-text-secondary/60">
            Built-in Agents
          </p>
          <div className="space-y-1">
            {filteredAgents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-150',
                  selectedAgent?.id === agent.id
                    ? 'bg-ak-surface-2 text-ak-text-primary'
                    : 'text-ak-text-secondary hover:bg-ak-surface-2/50 hover:text-ak-text-primary'
                )}
              >
                <div className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
                  selectedAgent?.id === agent.id
                    ? agent.id === 'scribe' ? 'bg-ak-primary/15 text-ak-primary' :
                      agent.id === 'trace' ? 'bg-blue-500/15 text-blue-400' :
                      'bg-purple-500/15 text-purple-400'
                    : 'bg-ak-surface text-ak-text-secondary'
                )}>
                  {agent.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm">{agent.name}</span>
                  <p className="truncate text-xs text-ak-text-secondary">
                    {agent.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* User Configs */}
        {userConfigs.length > 0 && (
          <div>
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-ak-text-secondary/60">
              Your Configurations
            </p>
            <div className="space-y-1">
              {userConfigs.map((config) => (
                <button
                  key={config.id}
                  onClick={() => navigate('/dashboard/scribe')}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-ak-text-secondary hover:bg-ak-surface-2/50 hover:text-ak-text-primary transition-all"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ak-surface text-ak-text-secondary">
                    <ScribeIcon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm">Scribe Config</span>
                    <p className="truncate text-xs text-ak-text-secondary">
                      {config.repositoryOwner}/{config.repositoryName}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Agent Details & Run */}
      <div className="flex-1 overflow-y-auto space-y-6">
        {/* Agent Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              'flex h-14 w-14 items-center justify-center rounded-2xl',
              selectedAgent.id === 'scribe' ? 'bg-ak-primary/10 text-ak-primary' :
              selectedAgent.id === 'trace' ? 'bg-blue-500/10 text-blue-400' :
              'bg-purple-500/10 text-purple-400'
            )}>
              {selectedAgent.icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ak-text-primary">
                {selectedAgent.name}
              </h1>
              <p className="mt-0.5 text-sm text-ak-text-secondary">
                {selectedAgent.description}
              </p>
            </div>
          </div>
          {selectedAgent.id === 'scribe' && (
            <Link
              to="/dashboard/scribe"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ak-primary hover:bg-ak-primary/10 transition-colors"
            >
              Advanced Console
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          )}
        </div>

        {/* Capabilities */}
        <div className="rounded-2xl bg-ak-surface-2/50 p-5">
          <h3 className="text-sm font-medium text-ak-text-primary mb-3">Capabilities</h3>
          <div className="grid grid-cols-2 gap-2">
            {selectedAgent.capabilities.map((cap) => (
              <div key={cap} className="flex items-center gap-2 text-sm text-ak-text-secondary">
                <svg className={cn(
                  'h-4 w-4 flex-shrink-0',
                  selectedAgent.id === 'scribe' ? 'text-ak-primary' :
                  selectedAgent.id === 'trace' ? 'text-blue-400' : 'text-purple-400'
                )} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {cap}
              </div>
            ))}
          </div>
        </div>

        {/* Run Console */}
        <div className="rounded-2xl bg-ak-surface-2/50 p-5">
          <h3 className="text-lg font-semibold text-ak-text-primary mb-4">Run Agent</h3>

          {!githubConnected ? (
            <div className="rounded-xl bg-yellow-500/5 p-4">
              <p className="text-sm text-yellow-400">
                Connect GitHub to run agents.{' '}
                <Link to="/dashboard/integrations" className="font-medium underline">
                  Go to Integrations
                </Link>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <SearchableSelect
                  label="Repository"
                  placeholder="Select repository"
                  options={repoOptions}
                  value={selectedRepo}
                  onChange={setSelectedRepo}
                  loading={loadingRepos}
                  emptyMessage="No repositories"
                  allowManualInput={false}
                />
                <SearchableSelect
                  label="Base Branch"
                  placeholder="Select base branch"
                  options={branchOptions}
                  value={selectedBranch}
                  onChange={setSelectedBranch}
                  loading={loadingBranches}
                  emptyMessage="No branches"
                  disabled={!selectedRepo}
                  allowManualInput={false}
                />
              </div>

              {/* Branch Strategy */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-ak-text-primary">
                  Feature Branch
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="branchStrategy"
                      value="auto"
                      checked={branchStrategy === 'auto'}
                      onChange={() => setBranchStrategy('auto')}
                      className="w-4 h-4 text-ak-primary focus:ring-ak-primary"
                    />
                    <span className="text-sm text-ak-text-primary">Auto-create</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="branchStrategy"
                      value="manual"
                      checked={branchStrategy === 'manual'}
                      onChange={() => setBranchStrategy('manual')}
                      className="w-4 h-4 text-ak-primary focus:ring-ak-primary"
                    />
                    <span className="text-sm text-ak-text-primary">Manual</span>
                  </label>
                </div>

                {branchStrategy === 'auto' && (
                  <div className="mt-2 rounded-lg bg-ak-bg/50 px-3 py-2">
                    <span className="text-xs text-ak-text-secondary">Preview: </span>
                    <code className="text-sm font-mono text-ak-primary">{autoBranchPreview}</code>
                  </div>
                )}
              </div>

              {/* Running Job Warning */}
              {existingRunningJob && (
                <div className="rounded-xl bg-yellow-500/5 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                      <span className="text-sm text-yellow-400">
                        Agent is already running for this repository
                      </span>
                    </div>
                    <Link
                      to={`/dashboard/jobs/${existingRunningJob.id}`}
                      className="text-sm font-medium text-ak-primary hover:underline"
                    >
                      View Run
                    </Link>
                  </div>
                  {existingRunningJob.latestTrace && (
                    <p className="mt-2 text-xs text-ak-text-secondary">
                      Current step: {existingRunningJob.latestTrace.title}
                    </p>
                  )}
                </div>
              )}

              {/* Run Button */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={handleRunAgent}
                  disabled={!canRun}
                  className="gap-2"
                >
                  <PlayIcon />
                  {isRunning ? 'Running...' : existingRunningJob ? 'Agent Running' : `Run ${selectedAgent.name}`}
                </Button>
                {currentJob && (
                  <Link
                    to={`/dashboard/jobs/${currentJob.id}`}
                    className="text-sm font-medium text-ak-primary hover:underline"
                  >
                    View Job Details
                  </Link>
                )}
              </div>

              {/* Job Status */}
              {currentJob && (
                <div className={cn(
                  'rounded-xl p-4',
                  currentJob.state === 'completed' ? 'bg-green-500/5' :
                  currentJob.state === 'failed' ? 'bg-red-500/5' :
                  'bg-ak-surface'
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'h-2 w-2 rounded-full',
                        currentJob.state === 'completed' ? 'bg-green-400' :
                        currentJob.state === 'failed' ? 'bg-red-400' :
                        'bg-ak-primary animate-pulse'
                      )} />
                      <span className="text-sm font-medium text-ak-text-primary">
                        {currentJob.state === 'completed' ? 'Completed' :
                         currentJob.state === 'failed' ? 'Failed' :
                         currentJob.state === 'running' ? 'Running' : 'Pending'}
                      </span>
                    </div>
                    <span className="text-xs text-ak-text-secondary font-mono">
                      {currentJob.id.substring(0, 8)}
                    </span>
                  </div>

                  {(currentJob.state === 'running' || currentJob.state === 'pending') && currentJob.trace && Array.isArray(currentJob.trace) && currentJob.trace.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {(currentJob.trace as Array<{ title?: string; eventType?: string }>).slice(-5).reverse().map((trace, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-ak-text-secondary">
                          <span>
                            {trace.eventType === 'step_complete' ? '✓' :
                             trace.eventType === 'error' ? '✕' : '▸'}
                          </span>
                          <span className="truncate">{trace.title || trace.eventType}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Error */}
              {jobError && (
                <div className="rounded-xl bg-red-500/5 p-4">
                  <p className="text-sm text-red-400">{jobError}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
