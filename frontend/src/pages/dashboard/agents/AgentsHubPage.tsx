/**
 * Agents Hub Page - Cursor-like agent browser
 * 
 * Layout:
 * - Left panel: Agent list (built-in + user configs) with search
 * - Right panel: Selected agent details, quick actions, run console
 */
import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import SearchableSelect, { type SelectOption } from '../../../components/common/SearchableSelect';
import { agentsApi, type AgentType, type JobDetail } from '../../../services/api/agents';
import { agentConfigsApi, type ScribeConfig } from '../../../services/api/agent-configs';
import { githubDiscoveryApi, type GitHubRepo, type GitHubBranch } from '../../../services/api/github-discovery';
import { integrationsApi } from '../../../services/api/integrations';
import { getMultiProviderStatus, type AIKeyProvider } from '../../../services/api/ai-keys';

// Agent definition for display
interface AgentDefinition {
  id: AgentType;
  name: string;
  description: string;
  icon: React.ReactNode;
  capabilities: string[];
  status: 'available' | 'coming_soon';
}

// Quick action definition
interface QuickAction {
  id: string;
  label: string;
  description: string;
  agentType: AgentType;
  icon: React.ReactNode;
}

// Icons
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

const DocsIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
  </svg>
);

const TestIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 15.5m14.8-.2l-.893.893A9.056 9.056 0 0012 18.75a9.056 9.056 0 00-6.906-2.557L5 15.5" />
  </svg>
);

const CodeIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
  </svg>
);

// Built-in agents
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
  },
  {
    id: 'trace',
    name: 'Trace',
    description: 'Generate test plans and coverage matrices from Jira specs.',
    icon: <TraceIcon />,
    capabilities: [
      'Parses acceptance criteria',
      'Generates test scaffolds',
      'Risk-based prioritization',
      'Coverage analysis',
    ],
    status: 'coming_soon',
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
    status: 'coming_soon',
  },
];

// Quick actions
const quickActions: QuickAction[] = [
  {
    id: 'improve-docs',
    label: 'Improve Documentation',
    description: 'Generate or update README, API docs, and guides',
    agentType: 'scribe',
    icon: <DocsIcon />,
  },
  {
    id: 'generate-changelog',
    label: 'Generate Changelog',
    description: 'Create changelog from recent commits',
    agentType: 'scribe',
    icon: <ScribeIcon />,
  },
  {
    id: 'security-audit',
    label: 'Security Audit',
    description: 'Analyze code for security vulnerabilities',
    agentType: 'trace',
    icon: <TestIcon />,
  },
  {
    id: 'solve-todos',
    label: 'Solve TODOs',
    description: 'Find and implement TODO comments in code',
    agentType: 'proto',
    icon: <CodeIcon />,
  },
];

export default function AgentsHubPage() {
  const navigate = useNavigate();
  
  // Selection state
  const [selectedAgent, setSelectedAgent] = useState<AgentDefinition | null>(builtInAgents[0]);
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
  
  // Job state
  const [currentJob, setCurrentJob] = useState<JobDetail | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [jobError, setJobError] = useState<string | null>(null);
  
  // User configs
  const [userConfigs, setUserConfigs] = useState<ScribeConfig[]>([]);

  // Check GitHub connection
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

  // Load repos when GitHub is connected
  useEffect(() => {
    if (!githubConnected || !githubUser) return;
    
    const loadRepos = async () => {
      setLoadingRepos(true);
      try {
        const result = await githubDiscoveryApi.getRepos(githubUser);
        setRepos(result.repos);
        if (result.repos.length > 0) {
          setSelectedRepo(result.repos[0].name);
        }
      } catch {
        setRepos([]);
      } finally {
        setLoadingRepos(false);
      }
    };
    loadRepos();
  }, [githubConnected, githubUser]);

  // Load branches when repo changes
  useEffect(() => {
    if (!githubConnected || !githubUser || !selectedRepo) return;
    
    const loadBranches = async () => {
      setLoadingBranches(true);
      try {
        const result = await githubDiscoveryApi.getBranches(githubUser, selectedRepo);
        setBranches(result.branches);
        setSelectedBranch(result.defaultBranch || 'main');
      } catch {
        setBranches([]);
      } finally {
        setLoadingBranches(false);
      }
    };
    loadBranches();
  }, [githubConnected, githubUser, selectedRepo]);

  // Load user agent configs
  useEffect(() => {
    const loadConfigs = async () => {
      try {
        const response = await agentConfigsApi.listConfigs();
        if (response.configs && response.configs.length > 0) {
          setUserConfigs(response.configs);
        }
      } catch {
        // No configs yet
      }
    };
    loadConfigs();
  }, []);

  // Filtered agents based on search
  const filteredAgents = useMemo(() => {
    if (!searchQuery.trim()) return builtInAgents;
    const query = searchQuery.toLowerCase();
    return builtInAgents.filter(
      (agent) =>
        agent.name.toLowerCase().includes(query) ||
        agent.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Options for selects
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

  // Run agent
  const handleRunAgent = async () => {
    if (!selectedAgent || selectedAgent.status !== 'available') return;
    if (!githubConnected || !selectedRepo || !selectedBranch) return;

    setIsRunning(true);
    setJobError(null);
    setCurrentJob(null);

    try {
      // Get AI provider
      let aiProvider: AIKeyProvider | undefined;
      try {
        const aiStatus = await getMultiProviderStatus();
        if (aiStatus.activeProvider) {
          aiProvider = aiStatus.activeProvider;
        } else if (aiStatus.providers.openai.configured) {
          aiProvider = 'openai';
        } else if (aiStatus.providers.openrouter.configured) {
          aiProvider = 'openrouter';
        }
      } catch {
        // Continue without explicit provider
      }

      const response = await agentsApi.runAgent({
        type: selectedAgent.id,
        payload: {
          owner: githubUser,
          repo: selectedRepo,
          baseBranch: selectedBranch,
          dryRun: true,
          ...(aiProvider && { aiProvider }),
        },
      });

      // Poll for job status
      const pollJob = async () => {
        const job = await agentsApi.getJob(response.jobId, { include: ['trace'] });
        setCurrentJob(job);
        
        if (job.state === 'completed' || job.state === 'failed') {
          setIsRunning(false);
          if (job.state === 'failed') {
            setJobError(job.errorMessage || job.error?.toString() || 'Job failed');
          }
          return;
        }
        
        // Continue polling
        setTimeout(pollJob, 2000);
      };
      
      pollJob();
    } catch (error) {
      setIsRunning(false);
      setJobError(error instanceof Error ? error.message : 'Failed to run agent');
    }
  };

  // Handle quick action click
  const handleQuickAction = (action: QuickAction) => {
    const agent = builtInAgents.find((a) => a.id === action.agentType);
    if (agent) {
      setSelectedAgent(agent);
    }
  };

  const canRun = selectedAgent?.status === 'available' && githubConnected && selectedRepo && selectedBranch && !isRunning;

  return (
    <div className="flex h-full gap-6">
      {/* Left Panel - Agent List */}
      <div className="w-80 flex-shrink-0 space-y-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-ak-border bg-ak-surface-2 py-2.5 pl-10 pr-4 text-sm text-ak-text-primary placeholder:text-ak-text-secondary focus:border-ak-primary focus:outline-none focus:ring-1 focus:ring-ak-primary"
          />
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ak-text-secondary">
            <SearchIcon />
          </div>
        </div>

        {/* Built-in Agents */}
        <div className="space-y-2">
          <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-ak-text-secondary">
            Built-in Agents
          </h3>
          <div className="space-y-1">
            {filteredAgents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all ${
                  selectedAgent?.id === agent.id
                    ? 'bg-ak-surface-2 text-ak-text-primary shadow-ak-sm'
                    : 'text-ak-text-secondary hover:bg-ak-surface hover:text-ak-text-primary'
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  selectedAgent?.id === agent.id ? 'bg-ak-primary/10 text-ak-primary' : 'bg-ak-surface-2 text-ak-text-secondary'
                }`}>
                  {agent.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{agent.name}</span>
                    {agent.status === 'coming_soon' && (
                      <span className="rounded-full bg-ak-surface-2 px-2 py-0.5 text-[10px] font-medium text-ak-text-secondary">
                        Soon
                      </span>
                    )}
                  </div>
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
          <div className="space-y-2">
            <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-ak-text-secondary">
              Your Configurations
            </h3>
            <div className="space-y-1">
              {userConfigs.map((config) => (
                <button
                  key={config.id}
                  onClick={() => navigate('/dashboard/scribe')}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-ak-text-secondary hover:bg-ak-surface hover:text-ak-text-primary transition-all"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ak-surface-2 text-ak-text-secondary">
                    <ScribeIcon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">Scribe Config</span>
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

      {/* Right Panel - Agent Details */}
      <div className="flex-1 space-y-6">
        {selectedAgent ? (
          <>
            {/* Agent Header */}
            <Card className="bg-ak-surface p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-ak-primary/10 text-ak-primary">
                    {selectedAgent.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-bold text-ak-text-primary">
                        {selectedAgent.name}
                      </h1>
                      {selectedAgent.status === 'coming_soon' && (
                        <span className="rounded-full bg-yellow-500/10 px-2.5 py-0.5 text-xs font-medium text-yellow-400">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-ak-text-secondary">
                      {selectedAgent.description}
                    </p>
                  </div>
                </div>
                {selectedAgent.id === 'scribe' && (
                  <Link
                    to="/dashboard/scribe"
                    className="text-sm font-medium text-ak-primary hover:underline"
                  >
                    Advanced Console →
                  </Link>
                )}
              </div>

              {/* Capabilities */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-ak-text-primary mb-3">Capabilities</h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedAgent.capabilities.map((cap) => (
                    <div key={cap} className="flex items-center gap-2 text-sm text-ak-text-secondary">
                      <svg className="h-4 w-4 text-ak-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {cap}
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-ak-text-primary">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                {quickActions
                  .filter((action) => action.agentType === selectedAgent.id)
                  .map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action)}
                      disabled={selectedAgent.status !== 'available'}
                      className="flex items-center gap-3 rounded-xl border border-ak-border bg-ak-surface p-4 text-left transition-all hover:border-ak-primary/50 hover:bg-ak-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ak-primary/10 text-ak-primary">
                        {action.icon}
                      </div>
                      <div>
                        <span className="font-medium text-ak-text-primary">{action.label}</span>
                        <p className="text-xs text-ak-text-secondary">{action.description}</p>
                      </div>
                    </button>
                  ))}
              </div>
            </div>

            {/* Run Console */}
            {selectedAgent.status === 'available' && (
              <Card className="bg-ak-surface p-6">
                <h3 className="text-lg font-semibold text-ak-text-primary mb-4">Run Agent</h3>

                {!githubConnected ? (
                  <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
                    <p className="text-sm text-yellow-400">
                      Connect GitHub to run agents.{' '}
                      <Link to="/dashboard/integrations" className="font-medium underline">
                        Go to Integrations →
                      </Link>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Repo Selection - Symmetric Grid Layout */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="w-full">
                        <SearchableSelect
                          label="Repository"
                          placeholder="Select repository"
                          options={repoOptions}
                          value={selectedRepo}
                          onChange={setSelectedRepo}
                          loading={loadingRepos}
                          emptyMessage="No repositories"
                        />
                      </div>
                      <div className="w-full">
                        <SearchableSelect
                          label="Branch"
                          placeholder="Select branch"
                          options={branchOptions}
                          value={selectedBranch}
                          onChange={setSelectedBranch}
                          loading={loadingBranches}
                          emptyMessage="No branches"
                          disabled={!selectedRepo}
                          allowManualInput={false}
                        />
                      </div>
                    </div>

                    {/* Run Button */}
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={handleRunAgent}
                        disabled={!canRun}
                        className="gap-2"
                      >
                        <PlayIcon />
                        {isRunning ? 'Running...' : 'Run Agent'}
                      </Button>
                      {currentJob && (
                        <Link
                          to={`/dashboard/jobs/${currentJob.id}`}
                          className="text-sm font-medium text-ak-primary hover:underline"
                        >
                          View Job Details →
                        </Link>
                      )}
                    </div>

                    {/* Status */}
                    {currentJob && (
                      <div className={`rounded-xl p-4 ${
                        currentJob.state === 'completed' ? 'bg-green-500/10 border border-green-500/30' :
                        currentJob.state === 'failed' ? 'bg-red-500/10 border border-red-500/30' :
                        'bg-ak-surface-2'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${
                              currentJob.state === 'completed' ? 'bg-green-500' :
                              currentJob.state === 'failed' ? 'bg-red-500' :
                              'bg-yellow-500 animate-pulse'
                            }`} />
                            <span className="text-sm font-medium text-ak-text-primary">
                              {currentJob.state === 'completed' ? 'Completed' :
                               currentJob.state === 'failed' ? 'Failed' :
                               currentJob.state === 'running' ? 'Running' : 'Pending'}
                            </span>
                          </div>
                          <span className="text-xs text-ak-text-secondary font-mono">
                            {currentJob.id.substring(0, 8)}...
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Error */}
                    {jobError && (
                      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                        <p className="text-sm text-red-400">{jobError}</p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-ak-text-secondary">
            Select an agent from the list
          </div>
        )}
      </div>
    </div>
  );
}
