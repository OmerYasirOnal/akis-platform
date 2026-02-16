/**
 * Trace Single-Page Console (S0.5.2-UX-1)
 *
 * Layout matches the Scribe console structure:
 * - Top: Configuration bar (spec input)
 * - Bottom: Workspace with Logs/Results tabs
 *
 * Placeholder phase — wired to useAgentStatus for live badge.
 * Route guard redirects to /dashboard if agent is disabled (future).
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

type ActiveTab = 'logs' | 'results';
type TraceQuestionKey = 'testDepth' | 'authScope' | 'browserTarget' | 'strictness';

interface TracePreferences {
  testDepth: 'smoke' | 'standard' | 'deep';
  authScope: 'public' | 'authenticated' | 'mixed';
  browserTarget: 'chromium' | 'cross_browser' | 'mobile';
  strictness: 'fast' | 'balanced' | 'strict';
}

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

interface AutomationExecutionSummary {
  runner?: 'playwright';
  targetBaseUrl?: string;
  executedScenarios: number;
  passedScenarios: number;
  failedScenarios: number;
  passRate: number;
  featuresPassed?: number;
  featuresFailed?: number;
  featurePassRate?: number;
  testCasesTotal?: number;
  testCasesPassed?: number;
  testCasesFailed?: number;
  durationMs?: number;
  generatedTestPath?: string;
  artifactPaths?: {
    reportPath?: string;
    traceArtifactPath?: string;
  };
  failures?: Array<{ feature: string; test: string; reason: string }>;
  featuresCovered: number;
  featuresTotal: number;
  featureCoverageRate: number;
  mode: 'syntactic' | 'ai-enhanced' | 'real';
  priorityBreakdown?: Record<string, number>;
  layerBreakdown?: Record<string, number>;
}

interface FlowCoverageSummary {
  totalFlows: number;
  coveredFlows: number;
  coverageRate: number;
  criticalCoverageRate: number;
}

interface EdgeCaseCoverageSummary {
  coveredCategories: number;
  totalCategories: number;
  coverageRate: number;
  missingCategories: string[];
  asvsCoverage?: {
    v2Auth: boolean;
    v3Session: boolean;
    v4AccessControl: boolean;
  };
}

interface RiskWeightedCoverageSummary {
  weightedCoverage: number;
  rawCoverage: number;
}

interface TraceFlakySummary {
  pfsLite: number;
  retryCount: number;
  quarantinedScenarios: string[];
  flakyPassedScenarios: string[];
}

interface JobMetadata {
  scenarioCount?: number;
  totalTestCases?: number;
  priorityBreakdown?: Record<string, number>;
  layerBreakdown?: Record<string, number>;
  repoContext?: { fileCount: number; routes: number; models: number } | null;
  automationSummary?: AutomationExecutionSummary;
  automationExecution?: AutomationExecutionSummary;
  flowCoverage?: FlowCoverageSummary;
  edgeCaseCoverage?: EdgeCaseCoverageSummary;
  riskWeightedCoverage?: RiskWeightedCoverageSummary;
  flaky?: TraceFlakySummary;
}

const DashboardAgentTracePage = () => {
  const { t } = useI18n();
  const { status: agentStatus } = useAgentStatus('trace');

  // Piri Context
  const piri = usePiriContext();
  const [piriOpen, setPiriOpen] = useState(false);
  const piriSelectedCount = piri.entries.filter((e) => e.selected).length;

  // Form state
  const [spec, setSpec] = useState('');
  const [tracePreferences, setTracePreferences] = useState<TracePreferences>({
    testDepth: 'standard',
    authScope: 'mixed',
    browserTarget: 'chromium',
    strictness: 'balanced',
  });
  const [automationMode, setAutomationMode] = useState<'plan_only' | 'generate_and_run'>('plan_only');
  const [targetBaseUrl, setTargetBaseUrl] = useState('https://staging.akisflow.com');

  // Job execution state
  const [currentJob, setCurrentJob] = useState<JobDetail | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<number | null>(null);

  // Glass box panel
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
            ? '✓ Trace workflow completed successfully'
            : `✗ Trace workflow failed: ${job.errorMessage || job.error || 'Unknown error'}`,
        };
        setLogs(prev => [...prev, completionLog]);
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

  const hasValidTargetUrl = (() => {
    if (automationMode !== 'generate_and_run') return true;
    try {
      const url = new URL(targetBaseUrl.trim());
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  })();

  const canRun = spec.trim().length > 0 && !isPolling && hasValidTargetUrl;

  const updatePreference = (key: TraceQuestionKey, value: string) => {
    setTracePreferences((prev) => ({ ...prev, [key]: value } as TracePreferences));
  };

  const questionGroups: Array<{
    key: TraceQuestionKey;
    label: string;
    help: string;
    options: Array<{ value: string; label: string }>;
  }> = [
    {
      key: 'testDepth',
      label: t('traceConsole.questions.testDepth.label'),
      help: t('traceConsole.questions.testDepth.help'),
      options: [
        { value: 'smoke', label: t('traceConsole.questions.testDepth.options.smoke') },
        { value: 'standard', label: t('traceConsole.questions.testDepth.options.standard') },
        { value: 'deep', label: t('traceConsole.questions.testDepth.options.deep') },
      ],
    },
    {
      key: 'authScope',
      label: t('traceConsole.questions.authScope.label'),
      help: t('traceConsole.questions.authScope.help'),
      options: [
        { value: 'public', label: t('traceConsole.questions.authScope.options.public') },
        { value: 'authenticated', label: t('traceConsole.questions.authScope.options.authenticated') },
        { value: 'mixed', label: t('traceConsole.questions.authScope.options.mixed') },
      ],
    },
    {
      key: 'browserTarget',
      label: t('traceConsole.questions.browserTarget.label'),
      help: t('traceConsole.questions.browserTarget.help'),
      options: [
        { value: 'chromium', label: t('traceConsole.questions.browserTarget.options.chromium') },
        { value: 'cross_browser', label: t('traceConsole.questions.browserTarget.options.crossBrowser') },
        { value: 'mobile', label: t('traceConsole.questions.browserTarget.options.mobile') },
      ],
    },
    {
      key: 'strictness',
      label: t('traceConsole.questions.strictness.label'),
      help: t('traceConsole.questions.strictness.help'),
      options: [
        { value: 'fast', label: t('traceConsole.questions.strictness.options.fast') },
        { value: 'balanced', label: t('traceConsole.questions.strictness.options.balanced') },
        { value: 'strict', label: t('traceConsole.questions.strictness.options.strict') },
      ],
    },
  ];

  const handleRunTrace = async () => {
    if (!canRun) return;

    setLogs([]);
    setCurrentJob(null);

    const initialLog: LogEntry = {
      id: `start-${Date.now()}`,
      timestamp: new Date(),
      level: 'info',
      message: t('traceConsole.logs.starting'),
    };
    const preferenceLog: LogEntry = {
      id: `profile-${Date.now()}`,
      timestamp: new Date(),
      level: 'info',
      message: `${t('traceConsole.logs.profilePrefix')}: depth=${tracePreferences.testDepth}, auth=${tracePreferences.authScope}, browser=${tracePreferences.browserTarget}, strictness=${tracePreferences.strictness}, mode=${automationMode}${automationMode === 'generate_and_run' ? `, target=${targetBaseUrl.trim()}` : ''}`,
    };
    setLogs([initialLog, preferenceLog]);
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

      const response = await agentsApi.runAgent({
        type: 'trace',
        payload: {
          spec: spec.trim(),
          automationMode,
          ...(automationMode === 'generate_and_run' && {
            targetBaseUrl: targetBaseUrl.trim(),
          }),
          tracePreferences,
          ...(aiProvider && { aiProvider }),
          ...(piriContext && { additionalContext: piriContext }),
        },
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
        message: `${t('traceConsole.logs.submitted')} ${response.jobId}`,
      };
      setLogs(prev => [...prev, submittedLog]);
    } catch (error) {
      const errorLog: LogEntry = {
        id: `error-${Date.now()}`,
        timestamp: new Date(),
        level: 'error',
        message: `Failed to start Trace: ${error instanceof Error ? error.message : String(error)}`,
      };
      setLogs(prev => [...prev, errorLog]);
      console.error('Failed to run Trace:', error);
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

  // Extract results from job
  const results = currentJob?.result && typeof currentJob.result === 'object'
    ? JSON.stringify(currentJob.result, null, 2)
    : null;
  const jobMetadata: JobMetadata | null = (() => {
    if (!currentJob?.result || typeof currentJob.result !== 'object') return null;
    const metadata = (currentJob.result as { metadata?: unknown }).metadata;
    if (!metadata || typeof metadata !== 'object') return null;
    return metadata as JobMetadata;
  })();

  const automationExecution: AutomationExecutionSummary | null = (() => {
    if (!jobMetadata) return null;
    const raw = jobMetadata.automationSummary ?? jobMetadata.automationExecution;
    if (!raw || typeof raw !== 'object') return null;
    const value = raw as Partial<AutomationExecutionSummary>;
    if (
      typeof value.executedScenarios !== 'number' ||
      typeof value.passedScenarios !== 'number' ||
      typeof value.failedScenarios !== 'number' ||
      typeof value.passRate !== 'number' ||
      typeof value.featuresCovered !== 'number' ||
      typeof value.featuresTotal !== 'number' ||
      typeof value.featureCoverageRate !== 'number' ||
      (value.mode !== 'syntactic' && value.mode !== 'ai-enhanced' && value.mode !== 'real')
    ) {
      return null;
    }
    return value as AutomationExecutionSummary;
  })();
  const flowCoverage = jobMetadata?.flowCoverage ?? null;
  const edgeCaseCoverage = jobMetadata?.edgeCaseCoverage ?? null;
  const riskWeightedCoverage = jobMetadata?.riskWeightedCoverage ?? null;
  const flakySummary = jobMetadata?.flaky ?? null;
  const generatedTestSnippet = (() => {
    if (!currentJob?.result || typeof currentJob.result !== 'object') return null;
    const artifacts = (currentJob.result as { artifacts?: unknown }).artifacts;
    if (!Array.isArray(artifacts)) return null;
    const testArtifact = artifacts.find((item) => {
      if (!item || typeof item !== 'object') return false;
      const path = (item as { filePath?: unknown }).filePath;
      return typeof path === 'string' && path.endsWith('trace-tests.test.ts');
    });
    if (!testArtifact || typeof testArtifact !== 'object') return null;
    const content = (testArtifact as { content?: unknown }).content;
    if (typeof content !== 'string' || !content.trim()) return null;
    return content.split('\n').slice(0, 30).join('\n');
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-ak-text-primary">Trace Console</h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                agentStatus === 'active'
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : 'bg-ak-surface-2 text-ak-text-secondary border border-ak-border'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  agentStatus === 'active' ? 'bg-blue-400 animate-pulse' : 'bg-ak-text-secondary/40'
                }`}
              />
              {agentStatus === 'active' ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-sm text-ak-text-secondary">
            Generate test plans and coverage from specifications.
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
        title="Specification"
        subtitle="Keep the prompt concise, then tune profile questions before execution."
        actions={(
          <Link to="/docs/agents/trace" className="text-xs font-medium text-ak-primary hover:underline">
            Docs
          </Link>
        )}
      >
        <div className="space-y-5">

          {/* Spec Textarea */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-ak-text-primary">
              Test Specification
            </label>
            <textarea
              value={spec}
              onChange={(e) => setSpec(e.target.value)}
              disabled={!!isRunning}
              rows={5}
              className="w-full rounded-lg border border-ak-border bg-ak-surface-2 px-3 py-2 text-sm text-ak-text-primary placeholder-ak-text-secondary/50 focus:border-ak-primary focus:outline-none focus:ring-1 focus:ring-ak-primary disabled:opacity-50 resize-none"
              placeholder="Paste your test specification, acceptance criteria, or user story here..."
            />
            <p className="text-xs text-ak-text-secondary/60">
              Trace analyses structured text to build coverage matrices and test cases.
            </p>
          </div>

          <div className="space-y-3 rounded-lg border border-ak-border bg-ak-surface-2 p-3">
            <div>
              <p className="text-sm font-semibold text-ak-text-primary">
                {t('traceConsole.questions.title')}
              </p>
              <p className="text-xs text-ak-text-secondary">
                {t('traceConsole.questions.subtitle')}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {questionGroups.map((question) => (
                <label key={question.key} className="block space-y-1">
                  <span className="text-xs font-medium text-ak-text-primary">{question.label}</span>
                  <select
                    value={tracePreferences[question.key]}
                    onChange={(event) => updatePreference(question.key, event.target.value)}
                    disabled={!!isRunning}
                    className="w-full rounded-lg border border-ak-border bg-ak-surface px-3 py-2 text-sm text-ak-text-primary focus:border-ak-primary focus:outline-none focus:ring-1 focus:ring-ak-primary disabled:opacity-50"
                  >
                    {question.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-ak-text-secondary">{question.help}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-3 rounded-lg border border-ak-border bg-ak-surface-2 p-3 md:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-xs font-medium text-ak-text-primary">
                {t('traceConsole.automation.modeLabel')}
              </span>
              <select
                value={automationMode}
                onChange={(event) => setAutomationMode(event.target.value as 'plan_only' | 'generate_and_run')}
                disabled={!!isRunning}
                className="w-full rounded-lg border border-ak-border bg-ak-surface px-3 py-2 text-sm text-ak-text-primary focus:border-ak-primary focus:outline-none focus:ring-1 focus:ring-ak-primary disabled:opacity-50"
              >
                <option value="plan_only">{t('traceConsole.automation.modePlanOnly')}</option>
                <option value="generate_and_run">{t('traceConsole.automation.modeGenerateAndRun')}</option>
              </select>
              <span className="text-[11px] text-ak-text-secondary">
                {t('traceConsole.automation.modeHelp')}
              </span>
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-medium text-ak-text-primary">
                {t('traceConsole.automation.targetBaseUrlLabel')}
              </span>
              <input
                type="url"
                value={targetBaseUrl}
                onChange={(event) => setTargetBaseUrl(event.target.value)}
                disabled={!!isRunning || automationMode !== 'generate_and_run'}
                placeholder="https://staging.akisflow.com"
                className="w-full rounded-lg border border-ak-border bg-ak-surface px-3 py-2 text-sm text-ak-text-primary placeholder-ak-text-secondary/50 focus:border-ak-primary focus:outline-none focus:ring-1 focus:ring-ak-primary disabled:opacity-50"
              />
              <span className="text-[11px] text-ak-text-secondary">
                {automationMode === 'generate_and_run'
                  ? t('traceConsole.automation.targetBaseUrlHelp')
                  : t('traceConsole.automation.targetBaseUrlDisabledHelp')}
              </span>
            </label>
          </div>

          {/* Run Button Row */}
          <div className="flex flex-wrap items-center gap-3 border-t border-ak-border pt-4">
            {isIdle ? (
              <Button
                onClick={handleRunTrace}
                disabled={!canRun}
                className="justify-center py-3 text-base font-semibold"
              >
                🧪 Run Trace
              </Button>
            ) : isRunning ? (
              <Button
                variant="outline"
                disabled
                className="justify-center border-blue-400/50 text-blue-400"
              >
                ⏳ Analysing...
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
                {hasValidTargetUrl
                  ? 'Provide a specification to begin analysis'
                  : t('traceConsole.automation.targetUrlRequired')}
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
          {/* Priority & Layer Breakdown */}
          {jobMetadata?.priorityBreakdown && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-ak-border bg-ak-surface p-3">
                <p className="text-[10px] uppercase tracking-wide text-ak-text-secondary/70 mb-2">Priority Distribution</p>
                <div className="flex gap-2">
                  {Object.entries(jobMetadata.priorityBreakdown).map(([priority, count]) => (
                    <div key={priority} className={`flex-1 rounded px-2 py-1 text-center ${
                      priority === 'P0' ? 'bg-red-500/10 border border-red-500/20' :
                      priority === 'P1' ? 'bg-orange-500/10 border border-orange-500/20' :
                      priority === 'P2' ? 'bg-blue-500/10 border border-blue-500/20' :
                      'bg-ak-surface-2 border border-ak-border'
                    }`}>
                      <p className="text-[10px] font-bold text-ak-text-primary">{priority}</p>
                      <p className="text-sm font-semibold text-ak-text-primary">{count}</p>
                    </div>
                  ))}
                </div>
              </div>
              {jobMetadata.layerBreakdown && (
                <div className="rounded-lg border border-ak-border bg-ak-surface p-3">
                  <p className="text-[10px] uppercase tracking-wide text-ak-text-secondary/70 mb-2">Test Layers</p>
                  <div className="flex gap-2">
                    {Object.entries(jobMetadata.layerBreakdown).map(([layer, count]) => (
                      <div key={layer} className="flex-1 rounded bg-ak-surface-2 border border-ak-border px-2 py-1 text-center">
                        <p className="text-[10px] font-bold text-ak-text-primary capitalize">{layer}</p>
                        <p className="text-sm font-semibold text-ak-text-primary">{count}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {automationExecution && (
            <div className="mt-3 space-y-3 rounded-lg border border-ak-border bg-ak-surface p-3 text-xs text-ak-text-secondary">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-ak-text-primary">{t('traceConsole.summary.title')}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    automationExecution.mode === 'real'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : automationExecution.mode === 'ai-enhanced'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'bg-ak-surface-2 text-ak-text-secondary border border-ak-border'
                  }`}>
                    {automationExecution.mode === 'real'
                      ? t('traceConsole.summary.modeReal')
                      : automationExecution.mode === 'ai-enhanced'
                        ? t('traceConsole.summary.modeAiEnhanced')
                        : t('traceConsole.summary.modeSyntactic')}
                  </span>
                </div>
                {automationExecution.targetBaseUrl && (
                  <span className="rounded bg-ak-bg px-2 py-1 text-[11px] text-ak-text-secondary">
                    {automationExecution.targetBaseUrl}
                  </span>
                )}
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded border border-ak-border bg-ak-bg px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-ak-text-secondary/70">{t('traceConsole.summary.featurePassRateLabel')}</p>
                  <p className="text-sm font-semibold text-ak-text-primary">
                    %{typeof automationExecution.featurePassRate === 'number' ? automationExecution.featurePassRate : automationExecution.passRate}
                  </p>
                </div>
                <div className="rounded border border-ak-border bg-ak-bg px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-ak-text-secondary/70">{t('traceConsole.summary.featuresLabel')}</p>
                  <p className="text-sm font-semibold text-ak-text-primary">
                    {automationExecution.featuresPassed ?? automationExecution.featuresCovered}/{automationExecution.featuresTotal}
                  </p>
                </div>
                <div className="rounded border border-ak-border bg-ak-bg px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-ak-text-secondary/70">{t('traceConsole.summary.testCasesLabel')}</p>
                  <p className="text-sm font-semibold text-ak-text-primary">
                    {automationExecution.testCasesPassed ?? 0}/{automationExecution.testCasesTotal ?? 0}
                  </p>
                </div>
                <div className="rounded border border-ak-border bg-ak-bg px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-ak-text-secondary/70">{t('traceConsole.summary.durationLabel')}</p>
                  <p className="text-sm font-semibold text-ak-text-primary">
                    {typeof automationExecution.durationMs === 'number' ? `${Math.max(1, Math.round(automationExecution.durationMs / 1000))}s` : '-'}
                  </p>
                </div>
              </div>
              {(automationExecution.failures?.length ?? 0) > 0 && (
                <div className="rounded border border-red-500/30 bg-red-500/[0.05] p-2">
                  <p className="mb-1 text-[11px] font-semibold text-red-300">{t('traceConsole.summary.failedFeatures')}</p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {automationExecution.failures?.map((failure, index) => (
                      <div key={`${failure.test}-${index}`} className="rounded border border-red-500/20 bg-ak-bg px-2 py-1">
                        <p className="text-[11px] text-ak-text-primary">{failure.feature} · {failure.test}</p>
                        <p className="text-[10px] text-red-300/90">{failure.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {automationExecution.artifactPaths?.traceArtifactPath && (
                <p className="text-[11px] text-ak-text-secondary">
                  {t('traceConsole.summary.traceArtifact')}: {automationExecution.artifactPaths.traceArtifactPath}
                </p>
              )}
            </div>
          )}

          {(flowCoverage || edgeCaseCoverage || riskWeightedCoverage || flakySummary) && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {flowCoverage && (
                <div className="rounded border border-ak-border bg-ak-surface px-3 py-2 text-xs">
                  <p className="text-[10px] uppercase tracking-wide text-ak-text-secondary/70">
                    {t('traceConsole.reliability.flowCoverage')}
                  </p>
                  <p className="text-sm font-semibold text-ak-text-primary">
                    %{Math.round(flowCoverage.coverageRate * 100)}
                  </p>
                  <p className="text-[11px] text-ak-text-secondary">
                    {flowCoverage.coveredFlows}/{flowCoverage.totalFlows}
                  </p>
                </div>
              )}
              {edgeCaseCoverage && (
                <div className="rounded border border-ak-border bg-ak-surface px-3 py-2 text-xs">
                  <p className="text-[10px] uppercase tracking-wide text-ak-text-secondary/70">
                    {t('traceConsole.reliability.edgeCoverage')}
                  </p>
                  <p className="text-sm font-semibold text-ak-text-primary">
                    %{Math.round(edgeCaseCoverage.coverageRate * 100)}
                  </p>
                  <p className="text-[11px] text-ak-text-secondary">
                    {edgeCaseCoverage.coveredCategories}/{edgeCaseCoverage.totalCategories}
                  </p>
                </div>
              )}
              {riskWeightedCoverage && (
                <div className="rounded border border-ak-border bg-ak-surface px-3 py-2 text-xs">
                  <p className="text-[10px] uppercase tracking-wide text-ak-text-secondary/70">
                    {t('traceConsole.reliability.riskWeightedCoverage')}
                  </p>
                  <p className="text-sm font-semibold text-ak-text-primary">
                    %{Math.round(riskWeightedCoverage.weightedCoverage * 100)}
                  </p>
                  <p className="text-[11px] text-ak-text-secondary">
                    {t('traceConsole.reliability.rawCoverage')}: %{Math.round(riskWeightedCoverage.rawCoverage * 100)}
                  </p>
                </div>
              )}
              {flakySummary && (
                <div className="rounded border border-ak-border bg-ak-surface px-3 py-2 text-xs">
                  <p className="text-[10px] uppercase tracking-wide text-ak-text-secondary/70">
                    {t('traceConsole.reliability.pfsLite')}
                  </p>
                  <p className="text-sm font-semibold text-ak-text-primary">
                    {flakySummary.pfsLite.toFixed(2)}
                  </p>
                  <p className="text-[11px] text-ak-text-secondary">
                    {t('traceConsole.reliability.retryCount')}: {flakySummary.retryCount}
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Logs/Results Workspace */}
      <Card className="flex h-[600px] flex-col overflow-hidden bg-ak-surface p-0">
        {/* Tabs Header */}
        <div className="flex items-center justify-between border-b border-ak-border bg-ak-surface-2 px-4">
          <div className="flex">
            {(['logs', 'results'] as ActiveTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'border-blue-400 text-blue-400'
                    : 'border-transparent text-ak-text-secondary hover:text-ak-text-primary'
                }`}
              >
                {tab === 'logs' && '📋 Logs'}
                {tab === 'results' && '📊 Results'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isRunning ? 'animate-pulse bg-blue-400' : isComplete ? 'bg-green-500' : 'bg-ak-text-secondary/30'}`} />
            <span className="text-xs text-ak-text-secondary">
              {spec.trim() ? (spec.trim().length > 40 ? `${spec.trim().substring(0, 40)}...` : spec.trim()) : 'No spec provided'} • {logs.length}
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

          {activeTab === 'results' && (
            <div className="h-full overflow-y-auto bg-ak-bg p-4">
              {results ? (
                <div className="space-y-3">
                  {/* Priority & Layer Summary in Results */}
                  {jobMetadata?.priorityBreakdown && (
                    <div className="rounded-lg border border-ak-border bg-ak-surface-2 p-3 text-xs">
                      <p className="mb-2 text-sm font-semibold text-ak-text-primary">Test Classification</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-ak-text-secondary/70 mb-1">By Priority</p>
                          <div className="space-y-1">
                            {Object.entries(jobMetadata.priorityBreakdown).map(([p, c]) => (
                              <div key={p} className="flex items-center justify-between">
                                <span className={`font-medium ${
                                  p === 'P0' ? 'text-red-400' : p === 'P1' ? 'text-orange-400' : p === 'P2' ? 'text-blue-400' : 'text-ak-text-secondary'
                                }`}>{p} {p === 'P0' ? '(Critical)' : p === 'P1' ? '(High)' : p === 'P2' ? '(Medium)' : '(Low)'}</span>
                                <span className="text-ak-text-primary font-semibold">{c}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {jobMetadata.layerBreakdown && (
                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-ak-text-secondary/70 mb-1">By Layer</p>
                            <div className="space-y-1">
                              {Object.entries(jobMetadata.layerBreakdown).map(([l, c]) => (
                                <div key={l} className="flex items-center justify-between">
                                  <span className="text-ak-text-secondary capitalize">{l}</span>
                                  <span className="text-ak-text-primary font-semibold">{c}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {automationExecution && (
                    <div className="rounded-lg border border-ak-border bg-ak-surface-2 p-3 text-xs text-ak-text-secondary">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-sm font-semibold text-ak-text-primary">{t('traceConsole.summary.automationCoverage')}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          automationExecution.mode === 'real'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : automationExecution.mode === 'ai-enhanced'
                              ? 'bg-purple-500/10 text-purple-400'
                              : 'bg-ak-surface text-ak-text-secondary'
                        }`}>
                          {automationExecution.mode}
                        </span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <p>{t('traceConsole.summary.scenarios')}: {automationExecution.passedScenarios}/{automationExecution.executedScenarios}</p>
                        <p>{t('traceConsole.summary.featureCoverage')}: {automationExecution.featuresCovered}/{automationExecution.featuresTotal} (%{automationExecution.featureCoverageRate})</p>
                        <p>{t('traceConsole.summary.mode')}: {automationExecution.mode}</p>
                        {automationExecution.generatedTestPath && <p>{t('traceConsole.summary.generatedTest')}: {automationExecution.generatedTestPath}</p>}
                      </div>
                    </div>
                  )}
                  {generatedTestSnippet && (
                    <div className="rounded-lg border border-ak-border bg-ak-surface-2 p-3">
                      <p className="mb-2 text-sm font-semibold text-ak-text-primary">{t('traceConsole.summary.generatedTestPreview')}</p>
                      <pre className="overflow-x-auto rounded bg-ak-bg p-2 text-xs text-ak-text-secondary font-mono">{generatedTestSnippet}</pre>
                    </div>
                  )}
                  <details className="rounded-lg border border-ak-border bg-ak-surface-2">
                    <summary className="px-3 py-2 text-sm font-medium text-ak-text-primary cursor-pointer hover:bg-ak-surface-3 rounded-lg">
                      Raw JSON Response
                    </summary>
                    <pre className="whitespace-pre-wrap p-4 text-xs text-ak-text-secondary max-h-96 overflow-y-auto">
                      {results}
                    </pre>
                  </details>
                </div>
              ) : (
                <EmptyPanel
                  icon={<span>📊</span>}
                  title="No results yet"
                  description="Run Trace once to see generated plans, automation summary, and reliability metrics."
                />
              )}
            </div>
          )}
        </div>
      </Card>
      <AgentRuntimeSettingsDrawer
        open={showSettingsDrawer}
        agentType="trace"
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

export default DashboardAgentTracePage;
