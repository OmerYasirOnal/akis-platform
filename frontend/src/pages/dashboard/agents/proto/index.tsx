/**
 * Proto Single-Page Console (S0.5.2-UX-2)
 *
 * Layout matches the Trace/Scribe console structure:
 * - Top: Configuration bar (requirements/goal + optional stack input)
 * - Bottom: Workspace with Logs/Artifacts tabs
 *
 * Route: /dashboard/proto
 */
import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../../../components/common/Card';
import Button from '../../../../components/common/Button';
import AgentRuntimeSettingsDrawer from '../../../../components/agents/AgentRuntimeSettingsDrawer';
import PiriContextSidebar from '../../../../components/agents/PiriContextSidebar';
import LiveAgentCanvas from '../../../../components/agents/LiveAgentCanvas';
import { SectionCard, StatusStrip, EmptyPanel } from '../../../../components/agents/hub';
import { useAgentStatus } from '../../../../hooks/useAgentStatus';
import { usePiriContext } from '../../../../hooks/usePiriContext';
import { useI18n } from '../../../../i18n/useI18n';
import { agentsApi, type JobDetail, type RuntimeOverride } from '../../../../services/api/agents';
import { getMultiProviderStatus, type AIKeyProvider } from '../../../../services/api/ai-keys';
import {
  ProtoQuestionFlow,
} from './components/ProtoQuestionFlow';
import {
  isProtoGuidedFlowComplete,
  type ProtoGuidedAnswers,
} from './components/protoGuidedFlow';
import ProtoExecutionGraph, { type ProtoExecutionEvent } from './components/ProtoExecutionGraph';

type ActiveTab = 'logs' | 'artifacts';

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
  filePath: string;
  content?: string;
}

const toProtoExecutionStatus = (
  status: unknown
): ProtoExecutionEvent['status'] => {
  if (status === 'running' || status === 'completed' || status === 'failed') {
    return status;
  }
  return undefined;
};

const DashboardAgentProtoPage = () => {
  const { t } = useI18n();
  const { status: agentStatus } = useAgentStatus('proto');

  // Piri Context
  const piri = usePiriContext();
  const [piriOpen, setPiriOpen] = useState(false);
  const piriSelectedCount = piri.entries.filter((e) => e.selected).length;

  // Form state
  const [requirements, setRequirements] = useState('');
  const [stack, setStack] = useState('');
  const [guidedAnswers, setGuidedAnswers] = useState<ProtoGuidedAnswers>({
    productType: '',
    authModel: '',
    dataLayer: '',
    deploymentTarget: '',
  });

  // Job execution state
  const [currentJob, setCurrentJob] = useState<JobDetail | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<number | null>(null);

  // Workspace panel
  const [activeTab, setActiveTab] = useState<ActiveTab>('logs');
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [runtimeOverride, setRuntimeOverride] = useState<RuntimeOverride | undefined>(undefined);

  // Poll job status
  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      const job = await agentsApi.getJob(jobId, { include: ['trace', 'artifacts'] });
      setCurrentJob(job);

      if (job.trace && Array.isArray(job.trace)) {
        const traceLogs: LogEntry[] = (job.trace as TraceEvent[]).map((event) => ({
          id: event.id || String(Math.random()),
          timestamp: new Date(event.timestamp),
          level: event.status === 'failed' ? 'error' : event.status === 'completed' ? 'success' : 'info',
          message: event.title || event.detail || 'Processing...',
        }));
        // Preserve manually-added logs (start/submit) and append trace events
        setLogs((prev) => {
          const manualLogs = prev.filter((l) => l.id.startsWith('start-') || l.id.startsWith('submitted-'));
          return [...manualLogs, ...traceLogs];
        });
      }

      if (job.state === 'completed' || job.state === 'failed') {
        setIsPolling(false);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }

        const completionLog: LogEntry = {
          id: `completion-${Date.now()}`,
          timestamp: new Date(),
          level: job.state === 'completed' ? 'success' : 'error',
          message: job.state === 'completed'
            ? '✓ Proto scaffold generated successfully'
            : `✗ Proto workflow failed: ${job.errorMessage || job.error || 'Unknown error'}`,
        };
        setLogs(prev => [...prev, completionLog]);

        if (job.state === 'completed') {
          setActiveTab('artifacts');
        }
      }
    } catch (error) {
      console.error('Failed to poll job:', error);
    }
  }, []);

  // Start polling when job is created
  useEffect(() => {
    if (currentJob && isPolling && (currentJob.state === 'pending' || currentJob.state === 'running')) {
      void pollJobStatus(currentJob.id);

      pollingIntervalRef.current = window.setInterval(() => {
        void pollJobStatus(currentJob.id);
      }, 2000);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    }
  }, [currentJob, isPolling, pollJobStatus]);

  const hasValidRequirements = requirements.trim().length >= 20;
  const guidedFlowReady = isProtoGuidedFlowComplete(guidedAnswers);
  const canRun = hasValidRequirements && guidedFlowReady && !isPolling;

  const handleRunProto = async () => {
    if (!canRun) return;

    setLogs([]);
    setCurrentJob(null);

    const initialLog: LogEntry = {
      id: `start-${Date.now()}`,
      timestamp: new Date(),
      level: 'info',
      message: 'Starting Proto workflow — scaffolding MVP...',
    };
    setLogs([initialLog]);
    setActiveTab('logs');

    try {
      let aiProvider: AIKeyProvider | undefined;
      try {
        const aiStatus = await getMultiProviderStatus();
        if (aiStatus.activeProvider) {
          aiProvider = aiStatus.activeProvider;
        } else {
          const openaiOk = aiStatus.providers.openai.configured;
          const openrouterOk = aiStatus.providers.openrouter.configured;
          if (openaiOk) aiProvider = 'openai';
          else if (openrouterOk) aiProvider = 'openrouter';
          else throw new Error('No AI provider configured. Add an API key in Settings > AI Keys.');
        }
      } catch (aiError) {
        const errorLog: LogEntry = {
          id: `ai-error-${Date.now()}`,
          timestamp: new Date(),
          level: 'error',
          message: aiError instanceof Error ? aiError.message : 'Failed to determine AI provider.',
        };
        setLogs(prev => [...prev, errorLog]);
        return;
      }

      // Inject Piri context if available
      const piriContext = piri.getSelectedContext();

      const payload: Record<string, unknown> = {
        requirements: requirements.trim(),
        ...(stack.trim() && { stack: stack.trim() }),
        protoGuidedBrief: guidedAnswers,
        ...(aiProvider && { aiProvider }),
        ...(piriContext && { additionalContext: piriContext }),
      };

      const response = await agentsApi.runAgent({
        type: 'proto',
        payload,
        runtimeOverride,
      });

      const job = await agentsApi.getJob(response.jobId);
      setCurrentJob(job);
      setIsPolling(true);

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
        message: `Failed to start Proto: ${error instanceof Error ? error.message : String(error)}`,
      };
      setLogs(prev => [...prev, errorLog]);
      console.error('Failed to run Proto:', error);
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
      case 'running': return 'Scaffolding';
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

  // Extract artifacts from job result
  const artifacts: Artifact[] = (() => {
    if (!currentJob?.result || typeof currentJob.result !== 'object') return [];
    const result = currentJob.result as Record<string, unknown>;
    if (Array.isArray(result.artifacts)) {
      return result.artifacts as Artifact[];
    }
    return [];
  })();

  const executionEvents: ProtoExecutionEvent[] = (() => {
    if (!Array.isArray(currentJob?.trace)) return [];
    return (currentJob.trace as Array<Record<string, unknown>>)
      .map((event, index) => ({
        id: typeof event.id === 'string' ? event.id : `trace-${index}`,
        stepId: typeof event.stepId === 'string' ? event.stepId : undefined,
        title: typeof event.title === 'string' ? event.title : undefined,
        timestamp: typeof event.timestamp === 'string' ? event.timestamp : new Date().toISOString(),
        status: toProtoExecutionStatus(event.status),
      }))
      .slice(0, 50);
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-ak-text-primary">Proto Console</h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                agentStatus === 'active'
                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                  : 'bg-ak-surface-2 text-ak-text-secondary border border-ak-border'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  agentStatus === 'active' ? 'bg-purple-400 animate-pulse' : 'bg-ak-text-secondary/40'
                }`}
              />
              {agentStatus === 'active' ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-sm text-ak-text-secondary">
            Bootstrap working MVP scaffolds from requirements or goals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/agents"
            className="text-xs font-medium text-ak-text-secondary hover:text-ak-primary transition-colors"
          >
            All Agents
          </Link>
          <Button variant="secondary" onClick={() => setShowSettingsDrawer(true)}>
            Settings
          </Button>
        </div>
      </header>

      {/* Configuration Bar */}
      <SectionCard
        title="Requirements"
        subtitle="Describe scope, answer quick architecture questions, then run Proto."
        actions={(
          <Link to="/docs/agents/proto" className="text-xs font-medium text-ak-primary hover:underline">
            Docs
          </Link>
        )}
      >
        <div className="space-y-5">

          {/* Requirements Textarea */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-ak-text-primary">
              Project Requirements or Goal
            </label>
            <textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              disabled={!!isRunning}
              rows={5}
              className="w-full rounded-lg border border-ak-border bg-ak-surface-2 px-3 py-2 text-sm text-ak-text-primary placeholder-ak-text-secondary/50 focus:border-ak-primary focus:outline-none focus:ring-1 focus:ring-ak-primary disabled:opacity-50 resize-none"
              placeholder="Describe your project requirements, feature goals, or MVP scope..."
            />
            <p className="text-xs text-ak-text-secondary/60">
              Proto generates a working project scaffold with files, configs, and boilerplate.
            </p>
          </div>

          {/* Stack Hint (optional) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-ak-text-primary">
              Tech Stack <span className="text-ak-text-secondary font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={stack}
              onChange={(e) => setStack(e.target.value)}
              disabled={!!isRunning}
              className="w-full rounded-lg border border-ak-border bg-ak-surface-2 px-3 py-2 text-sm text-ak-text-primary placeholder-ak-text-secondary/50 focus:border-ak-primary focus:outline-none focus:ring-1 focus:ring-ak-primary disabled:opacity-50"
              placeholder="e.g. React + TypeScript + Tailwind, Node.js + Express..."
            />
          </div>

          <ProtoQuestionFlow
            value={guidedAnswers}
            disabled={Boolean(isRunning)}
            onChange={setGuidedAnswers}
          />

          {/* Run Button Row */}
          <div className="flex flex-wrap items-center gap-3 border-t border-ak-border pt-4">
            {isIdle ? (
              <Button
                onClick={handleRunProto}
                disabled={!canRun}
                className="justify-center py-3 text-base font-semibold"
              >
                🚀 Run Proto
              </Button>
            ) : isRunning ? (
              <Button
                variant="outline"
                disabled
                className="justify-center border-purple-400/50 text-purple-400"
              >
                ⏳ Scaffolding...
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
                {!hasValidRequirements
                  ? t('protoConsole.guided.requirementsHint' as never)
                  : t('protoConsole.guided.completeHint' as never)}
              </p>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Status Summary */}
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

      {/* Logs/Artifacts Workspace */}
      <Card className="flex h-[600px] flex-col overflow-hidden bg-ak-surface p-0">
        {/* Tabs Header */}
        <div className="flex items-center justify-between border-b border-ak-border bg-ak-surface-2 px-4">
          <div className="flex">
            {(['logs', 'artifacts'] as ActiveTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'border-purple-400 text-purple-400'
                    : 'border-transparent text-ak-text-secondary hover:text-ak-text-primary'
                }`}
              >
                {tab === 'logs' && '📋 Logs'}
                {tab === 'artifacts' && '📁 Artifacts'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isRunning ? 'animate-pulse bg-purple-400' : isComplete ? 'bg-green-500' : 'bg-ak-text-secondary/30'}`} />
            <span className="text-xs text-ak-text-secondary">
              {artifacts.length > 0
                ? `${artifacts.length} file${artifacts.length === 1 ? '' : 's'} generated`
                : requirements.trim()
                  ? `${requirements.trim().substring(0, 40)}...`
                  : 'No requirements provided'} • {logs.length}
            </span>
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

          {activeTab === 'artifacts' && (
            <div className="h-full overflow-y-auto bg-ak-bg p-4">
              <div className="mb-3">
                <ProtoExecutionGraph events={executionEvents} isRunning={Boolean(isRunning)} />
              </div>
              {artifacts.length > 0 ? (
                <div className="space-y-3">
                  {artifacts.map((artifact, idx) => (
                    <div
                      key={artifact.filePath || idx}
                      className="rounded-lg border border-ak-border bg-ak-surface-2 overflow-hidden"
                    >
                      <div className="flex items-center justify-between border-b border-ak-border bg-ak-surface px-4 py-2">
                        <span className="text-sm font-medium font-mono text-ak-text-primary">
                          {artifact.filePath}
                        </span>
                        {artifact.content && (
                          <span className="text-xs text-ak-text-secondary">
                            {artifact.content.split('\n').length} lines
                          </span>
                        )}
                      </div>
                      {artifact.content && (
                        <pre className="overflow-x-auto p-4 text-xs text-ak-text-primary whitespace-pre-wrap max-h-64">
                          {artifact.content}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyPanel
                  icon={<span>📁</span>}
                  title="No artifacts yet"
                  description="Generated scaffold files will appear after Proto completes execution."
                />
              )}
            </div>
          )}
        </div>
      </Card>
      <AgentRuntimeSettingsDrawer
        open={showSettingsDrawer}
        agentType="proto"
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
    </div>
  );
};

export default DashboardAgentProtoPage;
