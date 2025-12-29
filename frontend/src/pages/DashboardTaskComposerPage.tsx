import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { JobStatus } from '../components/agents/JobStatus';
import type { AgentType, ModelConfig } from '../services/api/agents';
import { AgentSettingsRegistry } from '../components/agents/AgentSettingsRegistry';
import { useAgentRunner } from './agents/useAgentRunner';

type LogLevel = 'info' | 'success' | 'error';

type ComposerLog = {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: string;
};

type ModelPickerState = {
  providerId: string;
  modelId: string;
  temperature: string;
  maxOutputTokens: string;
};

const formatTime = (value: string) => new Date(value).toLocaleTimeString();

export default function DashboardTaskComposerPage() {
  const navigate = useNavigate();
  const [selectedAgent, setSelectedAgent] = useState<AgentType>('scribe');
  const [taskPrompt, setTaskPrompt] = useState('');
  const [modelPicker, setModelPicker] = useState<ModelPickerState>({
    providerId: '',
    modelId: '',
    temperature: '',
    maxOutputTokens: '',
  });
  const [agentSettings, setAgentSettings] = useState<Record<string, unknown>>(
    AgentSettingsRegistry.getDefaultSettings('scribe')
  );
  const [agentErrors, setAgentErrors] = useState<Record<string, string>>({});
  const [showValidation, setShowValidation] = useState(false);
  const [logs, setLogs] = useState<ComposerLog[]>([]);
  const [lastJobState, setLastJobState] = useState<string | null>(null);

  const { runAgent, job, error, isSubmitting, isPolling, reset } = useAgentRunner(selectedAgent);

  const agentDefinition = AgentSettingsRegistry.getDefinition(selectedAgent);

  useEffect(() => {
    // Reset settings when agent changes
    setAgentSettings(AgentSettingsRegistry.getDefaultSettings(selectedAgent));
    setAgentErrors({});
    setShowValidation(false);
  }, [selectedAgent]);

  useEffect(() => {
    if (showValidation) {
      setAgentErrors(agentValidation.errors);
    }
  }, [agentValidation.errors, showValidation]);

  useEffect(() => {
    if (!job?.state || job.state === lastJobState) return;
    setLastJobState(job.state);

    const nextLog: ComposerLog = {
      id: `${job.id}-${job.state}`,
      level: job.state === 'failed' ? 'error' : job.state === 'completed' ? 'success' : 'info',
      message: `Job ${job.state}`,
      timestamp: new Date().toISOString(),
    };
    setLogs((prev) => [...prev, nextLog]);
  }, [job, lastJobState]);

  useEffect(() => {
    if (error) {
      setLogs((prev) => [
        ...prev,
        {
          id: `error-${prev.length}`,
          level: 'error',
          message: error,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, [error]);

  const modelConfig = useMemo((): ModelConfig | null => {
    if (!modelPicker.providerId.trim() || !modelPicker.modelId.trim()) {
      return null;
    }

    const optionalNonSecretTuning: Record<string, number | string> = {};
    if (modelPicker.temperature.trim() !== '') {
      const parsed = Number(modelPicker.temperature);
      if (!Number.isNaN(parsed)) optionalNonSecretTuning.temperature = parsed;
    }
    if (modelPicker.maxOutputTokens.trim() !== '') {
      const parsed = Number(modelPicker.maxOutputTokens);
      if (!Number.isNaN(parsed)) optionalNonSecretTuning.maxOutputTokens = parsed;
    }

    return {
      providerId: modelPicker.providerId.trim(),
      modelId: modelPicker.modelId.trim(),
      optionalNonSecretTuning:
        Object.keys(optionalNonSecretTuning).length > 0 ? optionalNonSecretTuning : undefined,
    };
  }, [modelPicker]);

  const agentValidation = useMemo(
    () => agentDefinition.validate(agentSettings, modelConfig ?? undefined),
    [agentDefinition, agentSettings, modelConfig]
  );

  const isReady =
    agentDefinition.enabled &&
    taskPrompt.trim().length > 0 &&
    Boolean(modelConfig) &&
    agentValidation.isValid;

  const addLog = (level: LogLevel, message: string) => {
    setLogs((prev) => [
      ...prev,
      { id: `${level}-${prev.length}`, level, message, timestamp: new Date().toISOString() },
    ]);
  };

  const handleRun = async () => {
    setShowValidation(true);

    if (!agentDefinition.enabled) {
      addLog('error', 'Selected agent is disabled.');
      return;
    }

    if (!modelConfig) {
      addLog('error', 'Model provider and model ID are required.');
      return;
    }

    if (!agentValidation.isValid) {
      setAgentErrors(agentValidation.errors);
      addLog('error', 'Please complete required fields for the selected agent.');
      return;
    }

    if (!taskPrompt.trim()) {
      addLog('error', 'Task prompt is required.');
      return;
    }

    setAgentErrors(agentValidation.errors);
    addLog('info', `Submitting ${selectedAgent} task with ${modelConfig.providerId}/${modelConfig.modelId}`);

    await runAgent(
      { taskDescription: taskPrompt.trim(), agentType: selectedAgent },
      {
        agentType: selectedAgent,
        agentConfig: agentValidation.normalizedConfig,
        modelConfig,
      }
    );
  };

  const resetForm = () => {
    setTaskPrompt('');
    setModelPicker({ providerId: '', modelId: '', temperature: '', maxOutputTokens: '' });
    setAgentSettings(AgentSettingsRegistry.getDefaultSettings(selectedAgent));
    setAgentErrors({});
    setShowValidation(false);
    setLogs([]);
    setLastJobState(null);
    reset();
  };

  const renderAgentCard = (agent: AgentType, label: string, description: string, enabled: boolean, badge?: string) => {
    const isActive = selectedAgent === agent;
    return (
      <button
        type="button"
        onClick={() => enabled && setSelectedAgent(agent)}
        className={`w-full rounded-2xl border px-4 py-4 text-left transition-all ${
          isActive
            ? 'border-ak-primary bg-ak-surface-2 shadow-lg'
            : 'border-ak-border bg-ak-surface hover:border-ak-primary/60'
        } ${enabled ? '' : 'opacity-60 cursor-not-allowed'}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-ak-text-primary">{label}</p>
            <p className="text-xs text-ak-text-secondary">{description}</p>
          </div>
          {badge ? (
            <span className="rounded-full bg-ak-surface px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-ak-text-secondary/80">
              {badge}
            </span>
          ) : null}
        </div>
      </button>
    );
  };

  const modelError = showValidation && !modelConfig ? 'Model provider and model ID are required' : null;
  const taskError = showValidation && !taskPrompt.trim() ? 'Task description is required' : null;
  const SettingsComponent = agentDefinition.Component;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ak-text-secondary/70">
          Task Composer · V1
        </p>
        <h1 className="text-3xl font-semibold text-ak-text-primary sm:text-4xl">
          Compose agent tasks with model + config routing
        </h1>
        <p className="text-sm text-ak-text-secondary sm:max-w-3xl">
          Select an agent, pick a model, configure agent options, and launch a run. Scribe is enabled end-to-end;
          Trace and Proto are visible but disabled (coming soon).
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="space-y-4 lg:col-span-1">
          <Card className="space-y-4 bg-ak-surface-2">
            <div>
              <p className="text-sm font-semibold text-ak-text-primary">Agent</p>
              <p className="text-xs text-ak-text-secondary">Choose which agent will execute the task.</p>
            </div>
            <div className="space-y-3">
              {renderAgentCard('scribe', 'Scribe', 'Docs automation', true)}
              {renderAgentCard('trace', 'Trace', 'Test authoring', false, 'Coming soon')}
              {renderAgentCard('proto', 'Proto', 'Prototype bootstrapping', false, 'Coming soon')}
            </div>
          </Card>

          <Card className="space-y-4 bg-ak-surface-2">
            <div>
              <p className="text-sm font-semibold text-ak-text-primary">Model</p>
              <p className="text-xs text-ak-text-secondary">Config-only picker. No SDK calls from the browser.</p>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-ak-text-secondary/70">Provider</label>
                <input
                  value={modelPicker.providerId}
                  onChange={(e) => setModelPicker({ ...modelPicker, providerId: e.target.value })}
                  className="w-full rounded-xl border border-ak-border bg-ak-surface px-3 py-2 text-sm text-ak-text-primary placeholder:text-ak-text-secondary focus:border-ak-primary focus:outline-none focus:ring-2 focus:ring-ak-primary/60"
                  placeholder="openai | anthropic | vertex"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-ak-text-secondary/70">Model</label>
                <input
                  value={modelPicker.modelId}
                  onChange={(e) => setModelPicker({ ...modelPicker, modelId: e.target.value })}
                  className="w-full rounded-xl border border-ak-border bg-ak-surface px-3 py-2 text-sm text-ak-text-primary placeholder:text-ak-text-secondary focus:border-ak-primary focus:outline-none focus:ring-2 focus:ring-ak-primary/60"
                  placeholder="gpt-4o-mini | claude-3-haiku"
                />
              </div>
              <details className="rounded-xl border border-ak-border bg-ak-surface px-3 py-2 text-sm text-ak-text-secondary">
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.2em] text-ak-text-secondary/80">
                  Advanced tuning (optional)
                </summary>
                <div className="mt-3 space-y-3">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.2em] text-ak-text-secondary/70">Temperature</label>
                    <input
                      value={modelPicker.temperature}
                      onChange={(e) => setModelPicker({ ...modelPicker, temperature: e.target.value })}
                      className="w-full rounded-xl border border-ak-border bg-ak-surface px-3 py-2 text-sm text-ak-text-primary placeholder:text-ak-text-secondary focus:border-ak-primary focus:outline-none focus:ring-2 focus:ring-ak-primary/60"
                      placeholder="0.2"
                      inputMode="decimal"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.2em] text-ak-text-secondary/70">
                      Max output tokens
                    </label>
                    <input
                      value={modelPicker.maxOutputTokens}
                      onChange={(e) => setModelPicker({ ...modelPicker, maxOutputTokens: e.target.value })}
                      className="w-full rounded-xl border border-ak-border bg-ak-surface px-3 py-2 text-sm text-ak-text-primary placeholder:text-ak-text-secondary focus:border-ak-primary focus:outline-none focus:ring-2 focus:ring-ak-primary/60"
                      placeholder="8000"
                      inputMode="numeric"
                    />
                  </div>
                </div>
              </details>
              {modelError ? <p className="text-xs text-ak-danger">{modelError}</p> : null}
            </div>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Card className="space-y-3 bg-ak-surface-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-ak-text-primary">Define the task</p>
                <p className="text-xs text-ak-text-secondary">Describe the work Scribe should do.</p>
              </div>
              <span className="text-xs text-ak-text-secondary">{taskPrompt.length} chars</span>
            </div>
            <textarea
              value={taskPrompt}
              onChange={(e) => setTaskPrompt(e.target.value)}
              rows={8}
              className="w-full rounded-2xl border border-ak-border bg-ak-surface px-4 py-3 text-sm text-ak-text-primary placeholder:text-ak-text-secondary focus:border-ak-primary focus:outline-none focus:ring-2 focus:ring-ak-primary/60"
              placeholder="Example: Update the changelog with the latest release notes and ensure links are refreshed."
            />
            {taskError ? <p className="text-xs text-ak-danger">{taskError}</p> : null}
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="bg-ak-surface-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-ak-text-primary">Agent settings</p>
                <p className="text-xs text-ak-text-secondary">Tailored configuration per agent.</p>
              </div>
              {!agentDefinition.enabled ? (
                <span className="text-[11px] uppercase tracking-[0.2em] text-ak-text-secondary/70">Disabled</span>
              ) : null}
            </div>
            <div className="mt-4">
              <SettingsComponent
                value={agentSettings}
                onChange={setAgentSettings}
                errors={showValidation ? agentErrors : undefined}
                disabled={!agentDefinition.enabled || isSubmitting}
              />
              {!agentDefinition.enabled && agentDefinition.disabledReason ? (
                <p className="mt-3 text-xs text-ak-text-secondary">{agentDefinition.disabledReason}</p>
              ) : null}
            </div>
          </Card>
        </div>
      </div>

      <Card className="space-y-6 bg-ak-surface">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleRun} disabled={!isReady || isSubmitting}>
              {isSubmitting ? 'Running...' : 'Run task'}
            </Button>
            <Button variant="ghost" onClick={resetForm} disabled={isSubmitting}>
              Reset
            </Button>
            <Button variant="outline" onClick={() => navigate('/dashboard/jobs')} disabled={isSubmitting}>
              View jobs
            </Button>
          </div>
          <div className="text-xs text-ak-text-secondary">
            Flow: Select Agent → Select Model → Configure Agent Options → Run → Observe status/logs → View artifacts
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-2xl border border-ak-border bg-ak-surface-2 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ak-text-primary">Status</p>
              <span className="text-xs text-ak-text-secondary">
                {job ? `Job ${job.id.slice(0, 8)}` : 'Waiting to start'}
              </span>
            </div>
            <JobStatus job={job} isPolling={isPolling} />
          </div>
          <div className="space-y-3 rounded-2xl border border-ak-border bg-ak-surface-2 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ak-text-primary">Logs</p>
              <span className="text-xs text-ak-text-secondary">Realtime</span>
            </div>
            <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl bg-ak-surface p-3">
              {logs.length === 0 ? (
                <p className="text-xs text-ak-text-secondary">No events yet. Run a task to see updates.</p>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between gap-2 rounded-lg border border-ak-border bg-ak-surface-2 px-3 py-2"
                  >
                    <div>
                      <p
                        className={`text-sm ${
                          log.level === 'error'
                            ? 'text-ak-danger'
                            : log.level === 'success'
                              ? 'text-ak-primary'
                              : 'text-ak-text-primary'
                        }`}
                      >
                        {log.message}
                      </p>
                    </div>
                    <span className="text-[11px] text-ak-text-secondary">{formatTime(log.timestamp)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
