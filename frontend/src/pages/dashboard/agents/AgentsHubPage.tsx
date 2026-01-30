import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
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
  requiresInput: boolean;
  inputPlaceholder?: string;
  inputLabel?: string;
}

interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'agent';
  content: string;
  phase?: string;
  timestamp: Date;
  isError?: boolean;
  isSuccess?: boolean;
  jobId?: string;
  artifact?: { path: string; type: string };
}

const MODEL_OPTIONS = [
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini (Budget)', tier: 'budget' },
  { id: 'gpt-5-mini', label: 'GPT-5 Mini (Standard)', tier: 'standard' },
  { id: 'gpt-5.2', label: 'GPT-5.2 (Premium)', tier: 'premium' },
];

const ScribeIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const TraceIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const ProtoIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);

const CoderIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
  </svg>
);

const DeveloperIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const SendIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
  </svg>
);

const builtInAgents: AgentDefinition[] = [
  {
    id: 'scribe',
    name: 'Scribe',
    description: 'Generate docs, changelogs, and release notes from code.',
    icon: <ScribeIcon />,
    capabilities: ['Analyzes commits and PRs', 'Generates Markdown docs', 'Creates PR with changes', 'Multiple doc targets'],
    status: 'available',
    color: 'ak-primary',
    requiresInput: false,
    inputPlaceholder: 'Additional instructions for documentation...',
    inputLabel: 'Extra instructions (optional)',
  },
  {
    id: 'trace',
    name: 'Trace',
    description: 'Generate test plans and coverage from specifications.',
    icon: <TraceIcon />,
    capabilities: ['Parses acceptance criteria', 'Generates test scaffolds', 'Risk-based prioritization', 'Coverage analysis'],
    status: 'available',
    color: 'blue-400',
    requiresInput: true,
    inputPlaceholder: 'Paste your test specification or acceptance criteria here...',
    inputLabel: 'Test Specification',
  },
  {
    id: 'proto',
    name: 'Proto',
    description: 'Bootstrap MVP scaffolds from requirements.',
    icon: <ProtoIcon />,
    capabilities: ['Full-stack scaffolding', 'Built-in testing', 'Deploy-ready configs', 'Iterative refinement'],
    status: 'available',
    color: 'purple-400',
    requiresInput: true,
    inputPlaceholder: 'Describe what you want to build...\n\nExample: "A REST API with user auth, PostgreSQL, and Docker setup"',
    inputLabel: 'Requirements',
  },
  {
    id: 'coder',
    name: 'Coder',
    description: 'Generate code with planning, execution, and reflection.',
    icon: <CoderIcon />,
    capabilities: ['Task-driven generation', 'Language/framework aware', 'Planning + reflection', 'Auditable outputs'],
    status: 'available',
    color: 'amber-400',
    requiresInput: true,
    inputPlaceholder: 'Describe the coding task...\n\nExample: "Create a TypeScript utility for date formatting with unit tests"',
    inputLabel: 'Coding Task',
  },
  {
    id: 'developer',
    name: 'Developer',
    description: 'Full developer workflow with multi-step planning.',
    icon: <DeveloperIcon />,
    capabilities: ['Multi-step execution', 'Constraint-aware planning', 'Stepwise narrative', 'Guardrailed ops'],
    status: 'available',
    color: 'emerald-400',
    requiresInput: true,
    inputPlaceholder: 'Describe your goal or requirements...\n\nExample: "Add user authentication with JWT to the Express API"',
    inputLabel: 'Goal / Requirements',
  },
];

const PHASE_LABELS: Record<string, { icon: string; label: string }> = {
  thinking: { icon: '...', label: 'Thinking' },
  discovery: { icon: '?', label: 'Discovery' },
  reading: { icon: '>', label: 'Reading' },
  creating: { icon: '+', label: 'Creating' },
  reviewing: { icon: '~', label: 'Reviewing' },
  publishing: { icon: '^', label: 'Publishing' },
  done: { icon: 'ok', label: 'Done' },
  error: { icon: '!', label: 'Error' },
};

function getAgentColor(id: string) {
  switch (id) {
    case 'scribe': return { bg: 'bg-ak-primary/10', text: 'text-ak-primary' };
    case 'trace': return { bg: 'bg-blue-500/10', text: 'text-blue-400' };
    case 'proto': return { bg: 'bg-purple-500/10', text: 'text-purple-400' };
    case 'coder': return { bg: 'bg-amber-500/10', text: 'text-amber-400' };
    case 'developer': return { bg: 'bg-emerald-500/10', text: 'text-emerald-400' };
    default: return { bg: 'bg-ak-primary/10', text: 'text-ak-primary' };
  }
}

export default function AgentsHubPage() {
  const [selectedAgent, setSelectedAgent] = useState<AgentDefinition>(builtInAgents[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [githubConnected, setGithubConnected] = useState(false);
  const [githubUser, setGithubUser] = useState('');
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [branchStrategy, setBranchStrategy] = useState<'manual' | 'auto'>('auto');
  const [selectedModel, setSelectedModel] = useState('gpt-5-mini');

  const [currentJob, setCurrentJob] = useState<JobDetail | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [jobError, setJobError] = useState<string | null>(null);
  const [runningJobs, setRunningJobs] = useState<RunningJob[]>([]);
  const [userConfigs, setUserConfigs] = useState<ScribeConfig[]>([]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [showConfig, setShowConfig] = useState(true);

  const addMessage = useCallback((msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    setChatMessages(prev => [...prev, {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date(),
    }]);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    const checkGitHub = async () => {
      try {
        const status = await integrationsApi.getGitHubStatus();
        setGithubConnected(status.connected);
        if (status.connected && status.login) setGithubUser(status.login);
      } catch { setGithubConnected(false); }
    };
    checkGitHub();
  }, []);

  useEffect(() => {
    const fetchRunningJobs = async () => {
      try {
        const result = await agentsApi.getRunningJobs();
        setRunningJobs(result.jobs);
      } catch { /* silent */ }
    };
    if (githubConnected) fetchRunningJobs();
    const interval = setInterval(() => {
      if (githubConnected) fetchRunningJobs();
    }, 5000);
    return () => clearInterval(interval);
  }, [githubConnected]);

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
    setChatMessages([]);
    setCurrentJob(null);
    setIsRunning(false);
    setJobError(null);
    setUserInput('');
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

  const mapTraceToPhase = (eventType: string): string => {
    if (eventType.includes('plan') || eventType === 'ai_call') return 'thinking';
    if (eventType.includes('doc_read') || eventType.includes('mcp_connect')) return 'discovery';
    if (eventType.includes('tool_call') || eventType.includes('reading')) return 'reading';
    if (eventType.includes('file_created') || eventType.includes('file_modified')) return 'creating';
    if (eventType.includes('mcp_call') || eventType.includes('commit') || eventType.includes('pr')) return 'publishing';
    if (eventType.includes('complete') || eventType.includes('done')) return 'done';
    if (eventType.includes('error') || eventType.includes('fail')) return 'error';
    return 'thinking';
  };

  const handleRunAgent = async (extraInput?: string) => {
    if (!selectedAgent || selectedAgent.status !== 'available') return;
    if (!githubConnected || !selectedRepo || !selectedBranch) return;

    if (selectedAgent.requiresInput && !extraInput?.trim()) {
      setJobError(
        selectedAgent.id === 'trace' ? 'Please provide a test specification' :
        selectedAgent.id === 'coder' ? 'Please describe the coding task' :
        selectedAgent.id === 'developer' ? 'Please describe your goal or requirements' :
        'Please describe your requirements'
      );
      return;
    }

    setIsRunning(true);
    setJobError(null);
    setCurrentJob(null);
    setShowConfig(false);

    addMessage({
      role: 'user',
      content: extraInput?.trim()
        ? extraInput.trim()
        : `Run ${selectedAgent.name} on ${githubUser}/${selectedRepo} (${selectedBranch})`,
    });

    addMessage({
      role: 'agent',
      content: 'Starting agent...',
      phase: 'thinking',
    });

    try {
      let aiProvider: AIKeyProvider | undefined;
      try {
        const aiStatus = await getMultiProviderStatus();
        if (aiStatus.activeProvider) aiProvider = aiStatus.activeProvider;
        else if (aiStatus.providers.openai.configured) aiProvider = 'openai';
        else if (aiStatus.providers.openrouter.configured) aiProvider = 'openrouter';
      } catch { /* continue */ }

      const payload: Record<string, unknown> = {
        owner: githubUser,
        repo: selectedRepo,
        baseBranch: selectedBranch,
        branchStrategy,
        dryRun: false,
        modelId: selectedModel,
        ...(aiProvider && { aiProvider }),
      };

      if (selectedAgent.id === 'trace' && extraInput) {
        payload.spec = extraInput.trim();
      } else if (selectedAgent.id === 'proto' && extraInput) {
        payload.requirements = extraInput.trim();
      } else if (selectedAgent.id === 'scribe' && extraInput?.trim()) {
        payload.taskDescription = extraInput.trim();
      } else if (selectedAgent.id === 'coder' && extraInput) {
        payload.task = extraInput.trim();
      } else if (selectedAgent.id === 'developer' && extraInput) {
        payload.goal = extraInput.trim();
      }

      const response = await agentsApi.runAgent({
        type: selectedAgent.id,
        payload,
      });

      addMessage({
        role: 'agent',
        content: `Job created (${response.jobId.substring(0, 8)}). Initializing...`,
        phase: 'discovery',
        jobId: response.jobId,
      });

      let lastTraceCount = 0;
      const seenMessages = new Set<string>();

      const pollJob = async () => {
        try {
          const job = await agentsApi.getJob(response.jobId, { include: ['trace', 'artifacts'] });
          setCurrentJob(job);

          const traces = (job.trace as Array<{ title?: string; eventType?: string; detail?: string }>) || [];
          if (traces.length > lastTraceCount) {
            const newTraces = traces.slice(lastTraceCount);
            for (const trace of newTraces) {
              const content = trace.title || trace.eventType || 'Processing...';
              const msgKey = `${trace.eventType}-${content}`;
              if (!seenMessages.has(msgKey)) {
                seenMessages.add(msgKey);
                const phase = mapTraceToPhase(trace.eventType || '');
                addMessage({
                  role: 'agent',
                  content,
                  phase,
                });
              }
            }
            lastTraceCount = traces.length;
          }

          // Show artifacts as they appear
          const artifacts = (job.artifacts as Array<{ path?: string; artifactType?: string; preview?: string }>) || [];
          for (const artifact of artifacts) {
            if (artifact.path) {
              const artKey = `artifact-${artifact.path}`;
              if (!seenMessages.has(artKey)) {
                seenMessages.add(artKey);
                addMessage({
                  role: 'agent',
                  content: `File: ${artifact.path}${artifact.preview ? '\n' + artifact.preview.substring(0, 200) + (artifact.preview.length > 200 ? '...' : '') : ''}`,
                  phase: 'creating',
                  artifact: { path: artifact.path, type: artifact.artifactType || 'file' },
                });
              }
            }
          }

          if (job.state === 'completed') {
            setIsRunning(false);
            addMessage({
              role: 'agent',
              content: 'Agent completed successfully!',
              phase: 'done',
              isSuccess: true,
              jobId: response.jobId,
            });
            return;
          }

          if (job.state === 'failed') {
            setIsRunning(false);
            const errMsg = job.errorMessage || job.error?.toString() || 'Job failed';
            setJobError(errMsg);
            addMessage({
              role: 'agent',
              content: `Failed: ${errMsg}`,
              phase: 'error',
              isError: true,
              jobId: response.jobId,
            });
            return;
          }

          setTimeout(pollJob, 2000);
        } catch {
          setTimeout(pollJob, 4000);
        }
      };
      pollJob();
    } catch (error) {
      setIsRunning(false);
      const errMsg = error instanceof Error ? error.message : 'Failed to run agent';
      setJobError(errMsg);
      addMessage({
        role: 'agent',
        content: `Error: ${errMsg}`,
        phase: 'error',
        isError: true,
      });
    }
  };

  const handleSend = () => {
    if (!userInput.trim()) return;
    handleRunAgent(userInput.trim());
    setUserInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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

  const agentColor = getAgentColor(selectedAgent.id);

  return (
    <div className="flex h-full">
      {/* Left Panel - Agent List */}
      <div className="w-56 flex-shrink-0 flex flex-col border-r border-ak-border bg-ak-surface">
        <div className="p-3">
          <input
            type="text"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg bg-ak-bg py-2 pl-3 pr-3 text-sm text-ak-text-primary placeholder:text-ak-text-secondary/40 focus:outline-none focus:ring-1 focus:ring-ak-primary/40 border border-ak-border"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2">
          <p className="mb-1.5 px-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-ak-text-secondary/50">
            Agents
          </p>
          <div className="space-y-0.5">
            {filteredAgents.map((agent) => {
              const color = getAgentColor(agent.id);
              return (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all duration-150',
                    selectedAgent?.id === agent.id
                      ? 'bg-ak-surface-2 text-ak-text-primary'
                      : 'text-ak-text-secondary hover:bg-ak-surface-2/50 hover:text-ak-text-primary'
                  )}
                >
                  <div className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                    selectedAgent?.id === agent.id
                      ? `${color.bg} ${color.text}`
                      : 'bg-ak-bg text-ak-text-secondary'
                  )}>
                    {agent.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-[13px]">{agent.name}</span>
                    <p className="truncate text-[11px] text-ak-text-secondary/70 leading-tight">
                      {agent.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {userConfigs.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-ak-text-secondary/50">
                Configurations
              </p>
              <div className="space-y-0.5">
                {userConfigs.map((config) => (
                  <Link
                    key={config.id}
                    to="/dashboard/scribe"
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-ak-text-secondary hover:bg-ak-surface-2/50 hover:text-ak-text-primary transition-all"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ak-bg text-ak-text-secondary">
                      <ScribeIcon />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-[13px]">Scribe Config</span>
                      <p className="truncate text-[11px] text-ak-text-secondary/70">
                        {config.repositoryOwner}/{config.repositoryName}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Main Panel - Chat-like Run Experience */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-ak-border bg-ak-bg">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-9 w-9 items-center justify-center rounded-xl',
              agentColor.bg, agentColor.text
            )}>
              {selectedAgent.icon}
            </div>
            <div>
              <h1 className="text-base font-semibold text-ak-text-primary">{selectedAgent.name}</h1>
              <p className="text-xs text-ak-text-secondary">{selectedAgent.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Model Selector */}
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="rounded-lg border border-ak-border bg-ak-surface px-2.5 py-1.5 text-xs text-ak-text-primary focus:outline-none focus:ring-1 focus:ring-ak-primary/40"
            >
              {MODEL_OPTIONS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>

            {selectedAgent.id === 'scribe' && (
              <Link
                to="/dashboard/scribe"
                className="text-xs font-medium text-ak-text-secondary hover:text-ak-primary transition-colors px-2 py-1 rounded hover:bg-ak-surface-2"
              >
                Advanced Console
              </Link>
            )}
            {currentJob && (
              <Link
                to={`/dashboard/jobs/${currentJob.id}`}
                className="flex items-center gap-1 text-xs font-medium text-ak-primary hover:text-ak-primary/80 transition-colors px-2.5 py-1.5 rounded-lg bg-ak-primary/10 hover:bg-ak-primary/15"
              >
                View Results
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {/* Config Panel (collapsible) */}
          {showConfig && (
            <div className="rounded-xl border border-ak-border bg-ak-surface p-4 mb-4">
              {!githubConnected ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/[0.08] border border-amber-500/20">
                  <span className="text-amber-400 text-sm font-medium">!</span>
                  <div>
                    <p className="text-sm font-medium text-amber-300">GitHub not connected</p>
                    <p className="text-xs text-ak-text-secondary mt-0.5">
                      <Link to="/dashboard/integrations" className="text-ak-primary hover:underline">
                        Connect GitHub
                      </Link>{' '}to run agents on your repositories.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
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
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer text-ak-text-secondary">
                        <input
                          type="radio"
                          name="branchStrategy"
                          value="auto"
                          checked={branchStrategy === 'auto'}
                          onChange={() => setBranchStrategy('auto')}
                          className="w-3.5 h-3.5 text-ak-primary focus:ring-ak-primary/50"
                        />
                        Auto branch
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-ak-text-secondary">
                        <input
                          type="radio"
                          name="branchStrategy"
                          value="manual"
                          checked={branchStrategy === 'manual'}
                          onChange={() => setBranchStrategy('manual')}
                          className="w-3.5 h-3.5 text-ak-primary focus:ring-ak-primary/50"
                        />
                        Manual
                      </label>
                    </div>
                    {selectedRepo && selectedBranch && (
                      <span className="text-[11px] text-ak-text-secondary/60">
                        {githubUser}/{selectedRepo} · {selectedBranch}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {existingRunningJob && (
                <div className="mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/[0.06] border border-amber-500/15">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-xs text-amber-300">Agent already running for this repo</span>
                  <Link
                    to={`/dashboard/jobs/${existingRunningJob.id}`}
                    className="ml-auto text-xs font-medium text-ak-primary hover:underline"
                  >
                    View
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Chat Messages */}
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex gap-3',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {msg.role === 'agent' && (
                <div className={cn(
                  'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-[10px] font-mono font-bold mt-0.5',
                  agentColor.bg, agentColor.text
                )}>
                  {msg.phase && PHASE_LABELS[msg.phase] ? PHASE_LABELS[msg.phase].icon : '>'}
                </div>
              )}
              <div className={cn(
                'max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm',
                msg.role === 'user'
                  ? 'bg-ak-primary/15 text-ak-text-primary'
                  : msg.isError
                    ? 'bg-red-500/[0.08] border border-red-500/20 text-red-300'
                    : msg.isSuccess
                      ? 'bg-emerald-500/[0.08] border border-emerald-500/20 text-emerald-300'
                      : msg.artifact
                        ? 'bg-ak-surface border border-ak-border text-ak-text-primary font-mono text-xs'
                        : 'bg-ak-surface border border-ak-border text-ak-text-primary'
              )}>
                {msg.phase && PHASE_LABELS[msg.phase] && !msg.isError && !msg.isSuccess && (
                  <span className="text-[10px] font-medium uppercase tracking-wider text-ak-text-secondary/60 block mb-0.5">
                    {PHASE_LABELS[msg.phase].label}
                  </span>
                )}
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                {msg.jobId && msg.isSuccess && (
                  <Link
                    to={`/dashboard/jobs/${msg.jobId}`}
                    className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-ak-primary hover:text-ak-primary/80 transition-colors"
                  >
                    View Full Results
                  </Link>
                )}
                <span className="block mt-1 text-[10px] text-ak-text-secondary/40">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {chatMessages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
              <div className={cn(
                'h-16 w-16 rounded-2xl flex items-center justify-center mb-4',
                agentColor.bg, agentColor.text
              )}>
                <div className="scale-150">{selectedAgent.icon}</div>
              </div>
              <h3 className="text-lg font-semibold text-ak-text-primary mb-1">{selectedAgent.name}</h3>
              <p className="text-sm text-ak-text-secondary max-w-md mb-6">{selectedAgent.description}</p>
              <div className="flex flex-wrap justify-center gap-2">
                {selectedAgent.capabilities.map((cap) => (
                  <span key={cap} className="px-2.5 py-1 rounded-full border border-ak-border bg-ak-surface text-xs text-ak-text-secondary">
                    {cap}
                  </span>
                ))}
              </div>
              {!selectedAgent.requiresInput && githubConnected && selectedRepo && (
                <Button
                  onClick={() => handleRunAgent()}
                  disabled={!canRun}
                  className="mt-6 gap-2"
                >
                  Run {selectedAgent.name}
                </Button>
              )}
            </div>
          )}

          {isRunning && (
            <div className="flex items-center gap-2 py-2 text-xs text-ak-text-secondary/60">
              <div className="flex gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-ak-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="h-1.5 w-1.5 rounded-full bg-ak-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="h-1.5 w-1.5 rounded-full bg-ak-primary animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span>{selectedAgent.name} is working...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-ak-border bg-ak-bg p-3">
          {jobError && (
            <div className="mb-2 px-3 py-2 rounded-lg bg-red-500/[0.08] border border-red-500/20 text-xs text-red-300">
              {jobError}
            </div>
          )}
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  !githubConnected ? 'Connect GitHub first...' :
                  selectedAgent.inputPlaceholder || `Message ${selectedAgent.name}...`
                }
                disabled={!githubConnected || !selectedRepo || isRunning}
                rows={1}
                className="w-full resize-none rounded-xl border border-ak-border bg-ak-surface py-2.5 pl-3.5 pr-12 text-sm text-ak-text-primary placeholder:text-ak-text-secondary/40 focus:outline-none focus:ring-1 focus:ring-ak-primary/40 focus:border-ak-primary/40 disabled:opacity-40 min-h-[40px] max-h-[120px]"
                style={{ height: 'auto', overflow: 'hidden' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                }}
              />
              <button
                onClick={handleSend}
                disabled={!canRun && !selectedAgent.requiresInput}
                className={cn(
                  'absolute right-2 bottom-2 p-1.5 rounded-lg transition-colors',
                  canRun || (selectedAgent.requiresInput && userInput.trim())
                    ? 'text-ak-primary hover:bg-ak-primary/10'
                    : 'text-ak-text-secondary/30 cursor-not-allowed'
                )}
              >
                <SendIcon />
              </button>
            </div>
            {!selectedAgent.requiresInput && (
              <Button
                onClick={() => handleRunAgent(userInput.trim() || undefined)}
                disabled={!canRun}
                className="gap-1.5 whitespace-nowrap h-[40px]"
                size="sm"
              >
                Run
              </Button>
            )}
          </div>
          <div className="flex items-center justify-between mt-1.5 px-1">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="text-[11px] text-ak-text-secondary/50 hover:text-ak-text-secondary transition-colors"
            >
              {showConfig ? 'Hide' : 'Show'} configuration
            </button>
            <div className="flex items-center gap-3 text-[11px] text-ak-text-secondary/40">
              {selectedRepo && <span>{githubUser}/{selectedRepo}</span>}
              {isRunning && (
                <button
                  onClick={() => {
                    if (currentJob) {
                      agentsApi.cancelJob(currentJob.id).catch(() => {});
                    }
                    setIsRunning(false);
                  }}
                  className="text-red-400/60 hover:text-red-400 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
