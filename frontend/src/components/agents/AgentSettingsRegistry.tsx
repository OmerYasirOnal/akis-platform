import type { ChangeEvent } from 'react';
import React from 'react';
import type { AgentType, ModelConfig } from '../../services/api/agents';

type AgentSettingsComponentProps<TSettings extends Record<string, unknown>> = {
  value: TSettings;
  onChange: (next: TSettings) => void;
  errors?: Partial<Record<keyof TSettings | string, string>>;
  disabled?: boolean;
};

export type AgentSettingsValidationResult = {
  isValid: boolean;
  errors: Record<string, string>;
  normalizedConfig?: Record<string, unknown>;
};

export type AgentSettingsDefinition<TSettings extends Record<string, unknown>> = {
  id: AgentType;
  label: string;
  description: string;
  enabled: boolean;
  disabledReason?: string;
  Component: React.FC<AgentSettingsComponentProps<TSettings>>;
  validate: (value: TSettings, modelConfig?: ModelConfig | null) => AgentSettingsValidationResult;
};

export type ScribeSettingsState = {
  repositoryOwner: string;
  repositoryName: string;
  baseBranch: string;
  featureBranch: string;
  targetPath: string;
  branchPattern: string;
  includeGlobs: string;
  excludeGlobs: string;
  targetPlatform: string;
  dryRun: boolean;
};

const defaultScribeSettings: ScribeSettingsState = {
  repositoryOwner: '',
  repositoryName: '',
  baseBranch: 'main',
  featureBranch: '',
  targetPath: '',
  branchPattern: '',
  includeGlobs: '',
  excludeGlobs: '',
  targetPlatform: '',
  dryRun: false,
};

const parseDelimitedList = (value: string): string[] =>
  value
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);

const ScribeSettingsPanel: React.FC<AgentSettingsComponentProps<ScribeSettingsState>> = ({
  value,
  onChange,
  errors,
  disabled,
}) => {
  const handleChange = (key: keyof ScribeSettingsState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const nextValue =
      event.target instanceof HTMLInputElement && event.target.type === 'checkbox'
        ? event.target.checked
        : event.target.value;
    onChange({ ...value, [key]: nextValue });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-2xl border border-ak-border bg-ak-surface-2 p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ak-text-primary">Required</p>
            <span className="text-[11px] uppercase tracking-[0.2em] text-ak-text-secondary/70">Scribe</span>
          </div>
          <p className="text-xs text-ak-text-secondary">Repository coordinates that Scribe will use to open branches and commit docs.</p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-ak-text-secondary/70">Repository Owner</label>
            <input
              value={value.repositoryOwner}
              onChange={handleChange('repositoryOwner')}
              disabled={disabled}
              className="w-full rounded-xl border border-ak-border bg-ak-surface px-3 py-2 text-sm text-ak-text-primary placeholder:text-ak-text-secondary focus:border-ak-primary focus:outline-none focus:ring-2 focus:ring-ak-primary/60"
              placeholder="e.g., akis-team"
            />
            {errors?.repositoryOwner ? <p className="text-xs text-ak-danger">{errors.repositoryOwner}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-ak-text-secondary/70">Repository Name</label>
            <input
              value={value.repositoryName}
              onChange={handleChange('repositoryName')}
              disabled={disabled}
              className="w-full rounded-xl border border-ak-border bg-ak-surface px-3 py-2 text-sm text-ak-text-primary placeholder:text-ak-text-secondary focus:border-ak-primary focus:outline-none focus:ring-2 focus:ring-ak-primary/60"
              placeholder="e.g., docs"
            />
            {errors?.repositoryName ? <p className="text-xs text-ak-danger">{errors.repositoryName}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-ak-text-secondary/70">Base Branch</label>
            <input
              value={value.baseBranch}
              onChange={handleChange('baseBranch')}
              disabled={disabled}
              className="w-full rounded-xl border border-ak-border bg-ak-surface px-3 py-2 text-sm text-ak-text-primary placeholder:text-ak-text-secondary focus:border-ak-primary focus:outline-none focus:ring-2 focus:ring-ak-primary/60"
              placeholder="main"
            />
            {errors?.baseBranch ? <p className="text-xs text-ak-danger">{errors.baseBranch}</p> : null}
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-ak-border bg-ak-surface-2 p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ak-text-primary">Optional / Advanced</p>
            <span className="text-[11px] uppercase tracking-[0.2em] text-ak-text-secondary/70">Doesn’t block run</span>
          </div>
          <p className="text-xs text-ak-text-secondary">Tuning knobs and guards; leave blank to use defaults.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-ak-text-secondary/70">Feature Branch</label>
            <input
              value={value.featureBranch}
              onChange={handleChange('featureBranch')}
              disabled={disabled}
              className="w-full rounded-xl border border-ak-border bg-ak-surface px-3 py-2 text-sm text-ak-text-primary placeholder:text-ak-text-secondary focus:border-ak-primary focus:outline-none focus:ring-2 focus:ring-ak-primary/60"
              placeholder="feat/docs-update"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-ak-text-secondary/70">Branch Pattern</label>
            <input
              value={value.branchPattern}
              onChange={handleChange('branchPattern')}
              disabled={disabled}
              className="w-full rounded-xl border border-ak-border bg-ak-surface px-3 py-2 text-sm text-ak-text-primary placeholder:text-ak-text-secondary focus:border-ak-primary focus:outline-none focus:ring-2 focus:ring-ak-primary/60"
              placeholder="docs/scribe-{timestamp}"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-ak-text-secondary/70">Target Path</label>
          <input
            value={value.targetPath}
            onChange={handleChange('targetPath')}
            disabled={disabled}
            className="w-full rounded-xl border border-ak-border bg-ak-surface px-3 py-2 text-sm text-ak-text-primary placeholder:text-ak-text-secondary focus:border-ak-primary focus:outline-none focus:ring-2 focus:ring-ak-primary/60"
            placeholder="docs/"
          />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-ak-text-secondary/70">Include Globs</label>
            <textarea
              value={value.includeGlobs}
              onChange={handleChange('includeGlobs')}
              disabled={disabled}
              rows={3}
              className="w-full rounded-xl border border-ak-border bg-ak-surface px-3 py-2 text-sm text-ak-text-primary placeholder:text-ak-text-secondary focus:border-ak-primary focus:outline-none focus:ring-2 focus:ring-ak-primary/60"
              placeholder="docs/**/*.md"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-ak-text-secondary/70">Exclude Globs</label>
            <textarea
              value={value.excludeGlobs}
              onChange={handleChange('excludeGlobs')}
              disabled={disabled}
              rows={3}
              className="w-full rounded-xl border border-ak-border bg-ak-surface px-3 py-2 text-sm text-ak-text-primary placeholder:text-ak-text-secondary focus:border-ak-primary focus:outline-none focus:ring-2 focus:ring-ak-primary/60"
              placeholder="**/*.test.ts"
            />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-ak-text-secondary/70">Target Platform</label>
            <input
              value={value.targetPlatform}
              onChange={handleChange('targetPlatform')}
              disabled={disabled}
              className="w-full rounded-xl border border-ak-border bg-ak-surface px-3 py-2 text-sm text-ak-text-primary placeholder:text-ak-text-secondary focus:border-ak-primary focus:outline-none focus:ring-2 focus:ring-ak-primary/60"
              placeholder="confluence | github_repo"
            />
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-ak-border bg-ak-surface px-3 py-3">
            <input
              id="scribe-dryRun"
              type="checkbox"
              checked={value.dryRun}
              onChange={handleChange('dryRun')}
              disabled={disabled}
              className="h-4 w-4 rounded border-ak-border bg-ak-surface text-ak-primary focus:ring-2 focus:ring-ak-primary/60"
            />
            <label htmlFor="scribe-dryRun" className="text-sm text-ak-text-primary">
              Dry run (no writes)
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

const validateScribeSettings = (value: ScribeSettingsState): AgentSettingsValidationResult => {
  const errors: Record<string, string> = {};

  if (!value.repositoryOwner.trim()) {
    errors.repositoryOwner = 'Repository owner is required';
  }
  if (!value.repositoryName.trim()) {
    errors.repositoryName = 'Repository name is required';
  }
  if (!value.baseBranch.trim()) {
    errors.baseBranch = 'Base branch is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    normalizedConfig: {
      repositoryOwner: value.repositoryOwner.trim(),
      repositoryName: value.repositoryName.trim(),
      baseBranch: value.baseBranch.trim(),
      featureBranch: value.featureBranch.trim() || undefined,
      targetPath: value.targetPath.trim() || undefined,
      branchPattern: value.branchPattern.trim() || undefined,
      includeGlobs: parseDelimitedList(value.includeGlobs),
      excludeGlobs: parseDelimitedList(value.excludeGlobs),
      targetPlatform: value.targetPlatform.trim() || undefined,
      dryRun: value.dryRun,
    },
  };
};

const DisabledPlaceholder: React.FC<{ label: string }> = ({ label }) => (
  <div className="rounded-2xl border border-dashed border-ak-border bg-ak-surface-2 p-4 text-sm text-ak-text-secondary">
    {label} — coming soon.
  </div>
);

const registry: Record<AgentType, AgentSettingsDefinition<Record<string, unknown>>> = {
  scribe: {
    id: 'scribe',
    label: 'Scribe',
    description: 'Documentation agent',
    enabled: true,
    Component: ScribeSettingsPanel as React.FC<AgentSettingsComponentProps<Record<string, unknown>>>,
    validate: (value) => validateScribeSettings(value as ScribeSettingsState),
  },
  trace: {
    id: 'trace',
    label: 'Trace',
    description: 'Test agent',
    enabled: false,
    disabledReason: 'Trace will arrive after Scribe V1',
    Component: () => <DisabledPlaceholder label="Trace" />,
    validate: () => ({ isValid: false, errors: {}, normalizedConfig: {} }),
  },
  proto: {
    id: 'proto',
    label: 'Proto',
    description: 'Prototype agent',
    enabled: false,
    disabledReason: 'Proto will follow Trace in later phases',
    Component: () => <DisabledPlaceholder label="Proto" />,
    validate: () => ({ isValid: false, errors: {}, normalizedConfig: {} }),
  },
};

export const AgentSettingsRegistry = {
  getDefinition(agent: AgentType) {
    return registry[agent];
  },
  getDefaultSettings(agent: AgentType): Record<string, unknown> {
    if (agent === 'scribe') return { ...defaultScribeSettings };
    return {};
  },
};

export { defaultScribeSettings };
