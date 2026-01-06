/**
 * Dashboard Agent Scribe Page - S0.4.6
 * Wizard + Configured Dashboard View
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Card from '../../../components/common/Card';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import SearchableSelect, { type SelectOption } from '../../../components/common/SearchableSelect';
import {
  agentConfigsApi,
  type ScribeConfig,
  type IntegrationStatus,
  type ConfigUpdatePayload,
} from '../../../services/api/agent-configs';
import { aiKeysApi, type AiKeyStatus } from '../../../services/api/ai-keys';
import { agentsApi } from '../../../services/api/agents';
import {
  githubDiscoveryApi,
  type GitHubOwner,
  type GitHubRepo,
  type GitHubBranch,
} from '../../../services/api/github-discovery';

type WizardStep = 1 | 2 | 3 | 4 | 5;

const parseGlobs = (value: string): string[] | null => {
  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length > 0 ? items : null;
};

const formatGlobs = (globs?: string[] | null): string => {
  if (!globs || globs.length === 0) return '';
  return globs.join(', ');
};

const DashboardAgentScribePage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<ScribeConfig | null>(null);
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus | null>(null);
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [wizardData, setWizardData] = useState<Partial<ConfigUpdatePayload>>({});
  const [saving, setSaving] = useState(false);
  const [creatingJob, setCreatingJob] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [step3Touched, setStep3Touched] = useState(false);
  const [aiKeyStatus, setAiKeyStatus] = useState<AiKeyStatus | null>(null);
  const [aiKeyLoading, setAiKeyLoading] = useState(true);
  const [aiKeyError, setAiKeyError] = useState<string | null>(null);
  const [modelAllowlist, setModelAllowlist] = useState<string[]>([]);
  const [modelDefault, setModelDefault] = useState<string | null>(null);
  const [modelLoading, setModelLoading] = useState(true);
  const [modelError, setModelError] = useState<string | null>(null);

  // GitHub Discovery State
  const [githubOwners, setGithubOwners] = useState<GitHubOwner[]>([]);
  const [githubRepos, setGithubRepos] = useState<GitHubRepo[]>([]);
  const [githubBranches, setGithubBranches] = useState<GitHubBranch[]>([]);
  const [ownersLoading, setOwnersLoading] = useState(false);
  const [reposLoading, setReposLoading] = useState(false);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);

  // Load config and integration status
  const loadData = useCallback(async () => {
    try {
      const configRes = await agentConfigsApi.getConfig('scribe');
      setConfig(configRes.config);
      setIntegrationStatus(configRes.integrationStatus);
    } catch (err) {
      console.error('Failed to load config:', err);
      setError(err instanceof Error ? err.message : 'Failed to load configuration');
    } finally {
      setLoading(false);
    }

    setAiKeyLoading(true);
    setAiKeyError(null);
    try {
      const status = await aiKeysApi.getStatus();
      setAiKeyStatus(status);
    } catch (err) {
      console.error('Failed to load AI key status:', err);
      setAiKeyError(err instanceof Error ? err.message : 'Failed to load AI key status');
    } finally {
      setAiKeyLoading(false);
    }

    setModelLoading(true);
    setModelError(null);
    try {
      const models = await agentConfigsApi.getModelAllowlist('scribe');
      setModelAllowlist(models.allowlist);
      setModelDefault(models.defaultModel);
    } catch (err) {
      console.error('Failed to load model allowlist:', err);
      setModelError(err instanceof Error ? err.message : 'Failed to load model allowlist');
    } finally {
      setModelLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Handle OAuth callback query params
  useEffect(() => {
    const connected = searchParams.get('connected');
    const errorParam = searchParams.get('error');

    if (connected) {
      setNotification({
        type: 'success',
        message: `Successfully connected ${connected.charAt(0).toUpperCase() + connected.slice(1)}!`,
      });
      // Refresh integration status
      void loadData();
      setSearchParams({});
    } else if (errorParam) {
      setNotification({
        type: 'error',
        message: `Connection error: ${errorParam}`,
      });
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, loadData]);

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Fetch GitHub owners when step 2 is active and GitHub is connected
  useEffect(() => {
    if (wizardStep === 2 && integrationStatus?.github.connected && githubOwners.length === 0) {
      const fetchOwners = async () => {
        setOwnersLoading(true);
        setGithubError(null);
        try {
          const result = await githubDiscoveryApi.getOwners();
          setGithubOwners(result.owners);
          // If no owner selected and we have owners, auto-select the user's account
          if (!wizardData.repositoryOwner && result.owners.length > 0) {
            const userOwner = result.owners.find(o => o.type === 'User');
            if (userOwner) {
              setWizardData(prev => ({ ...prev, repositoryOwner: userOwner.login }));
            }
          }
        } catch (err) {
          console.error('Failed to fetch GitHub owners:', err);
          setGithubError('Failed to load GitHub accounts. Please try again.');
        } finally {
          setOwnersLoading(false);
        }
      };
      void fetchOwners();
    }
  }, [wizardStep, integrationStatus?.github.connected, githubOwners.length, wizardData.repositoryOwner]);

  // Fetch repos when owner changes
  useEffect(() => {
    if (wizardData.repositoryOwner) {
      const fetchRepos = async () => {
        setReposLoading(true);
        setGithubRepos([]);
        setGithubBranches([]);
        try {
          const result = await githubDiscoveryApi.getRepos(wizardData.repositoryOwner!);
          setGithubRepos(result.repos);
        } catch (err) {
          console.error('Failed to fetch repos:', err);
          setGithubError('Failed to load repositories.');
        } finally {
          setReposLoading(false);
        }
      };
      void fetchRepos();
    }
  }, [wizardData.repositoryOwner]);

  // Fetch branches when repo changes
  useEffect(() => {
    if (wizardData.repositoryOwner && wizardData.repositoryName) {
      const fetchBranches = async () => {
        setBranchesLoading(true);
        setGithubBranches([]);
        try {
          const result = await githubDiscoveryApi.getBranches(
            wizardData.repositoryOwner!,
            wizardData.repositoryName!
          );
          setGithubBranches(result.branches);
          // Auto-select default branch if not already set
          if (!wizardData.baseBranch || wizardData.baseBranch === 'main') {
            setWizardData(prev => ({ ...prev, baseBranch: result.defaultBranch }));
          }
        } catch (err) {
          console.error('Failed to fetch branches:', err);
          setGithubError('Failed to load branches.');
        } finally {
          setBranchesLoading(false);
        }
      };
      void fetchBranches();
    }
  }, [wizardData.repositoryOwner, wizardData.repositoryName, wizardData.baseBranch]);

  // Convert GitHub data to SelectOption format
  const ownerOptions: SelectOption[] = useMemo(() => 
    githubOwners.map(owner => ({
      value: owner.login,
      label: owner.login,
      description: owner.type,
      icon: (
        <img
          src={owner.avatarUrl}
          alt={owner.login}
          className="h-5 w-5 rounded-full"
        />
      ),
    })),
    [githubOwners]
  );

  const repoOptions: SelectOption[] = useMemo(() =>
    githubRepos.map(repo => ({
      value: repo.name,
      label: repo.name,
      description: repo.description || (repo.private ? 'Private' : 'Public'),
    })),
    [githubRepos]
  );

  const branchOptions: SelectOption[] = useMemo(() =>
    githubBranches.map(branch => ({
      value: branch.name,
      label: branch.name,
      description: branch.isDefault ? 'Default branch' : undefined,
    })),
    [githubBranches]
  );

  const modelOptions: SelectOption[] = useMemo(
    () =>
      modelAllowlist.map((model) => ({
        value: model,
        label: model,
        description: model === modelDefault ? 'Default' : undefined,
      })),
    [modelAllowlist, modelDefault]
  );

  const confluenceSpaceKey = useMemo(() => {
    const raw = (wizardData.targetConfig as { space_key?: string })?.space_key;
    return typeof raw === 'string' ? raw.trim() : '';
  }, [wizardData.targetConfig]);

  const docsPath = useMemo(() => {
    const raw = (wizardData.targetConfig as { docs_path?: string })?.docs_path;
    if (typeof raw === 'string' && raw.trim().length > 0) {
      return raw.trim();
    }
    return 'docs/';
  }, [wizardData.targetConfig]);

  const aiKeyMissing = !aiKeyStatus?.configured;
  const aiKeyBlocked = aiKeyLoading || aiKeyMissing;

  const step3Errors = useMemo(() => {
    const errors: string[] = [];
    if (!wizardData.targetPlatform) {
      errors.push('Select a target platform to continue.');
    }
    if (wizardData.targetPlatform === 'confluence') {
      if (!integrationStatus?.confluence.connected) {
        errors.push('Connect Confluence to continue.');
      }
      if (!confluenceSpaceKey) {
        errors.push('Confluence space key is required.');
      }
    }
    return errors;
  }, [wizardData.targetPlatform, integrationStatus?.confluence.connected, confluenceSpaceKey]);

  const canProceedStep3 = step3Errors.length === 0;

  // Handler for repo selection (also sets default branch)
  const handleRepoSelect = (repoName: string) => {
    const repo = githubRepos.find(r => r.name === repoName);
    setWizardData(prev => ({
      ...prev,
      repositoryName: repoName,
      baseBranch: repo?.defaultBranch || prev.baseBranch || 'main',
    }));
  };

  // Start wizard if no config, or prefill wizard data from existing config
  useEffect(() => {
    if (!loading && !config) {
      setWizardStep(1);
    }
  }, [loading, config]);

  // Prefill wizard data from existing config when editing
  useEffect(() => {
    if (config) {
      setWizardData({
        enabled: config.enabled,
        repositoryOwner: config.repositoryOwner || '',
        repositoryName: config.repositoryName || '',
        baseBranch: config.baseBranch || 'main',
        branchPattern: config.branchPattern || 'docs/scribe-{timestamp}',
        targetPlatform: config.targetPlatform || undefined,
        targetConfig: config.targetConfig || {},
        triggerMode: config.triggerMode || 'manual',
        scheduleCron: config.scheduleCron || undefined,
        prTitleTemplate: config.prTitleTemplate || undefined,
        prBodyTemplate: config.prBodyTemplate || undefined,
        autoMerge: config.autoMerge || false,
        includeGlobs: config.includeGlobs || undefined,
        excludeGlobs: config.excludeGlobs || undefined,
        llmModelOverride: config.llmModelOverride || undefined,
      });
    }
  }, [config]);

  useEffect(() => {
    if (!wizardData.llmModelOverride && modelDefault) {
      setWizardData((prev) => ({ ...prev, llmModelOverride: modelDefault }));
    }
  }, [modelDefault, wizardData.llmModelOverride]);

  useEffect(() => {
    if (wizardStep === 4 && !wizardData.triggerMode) {
      setWizardData((prev) => ({ ...prev, triggerMode: 'manual' }));
    }
  }, [wizardStep, wizardData.triggerMode]);

  const handleWizardNext = () => {
    if (wizardStep === 3) {
      setStep3Touched(true);
      if (!canProceedStep3) {
        return;
      }
    }
    if (wizardStep < 5) {
      setWizardStep((s) => (s + 1) as WizardStep);
    }
  };

  const handleWizardBack = () => {
    if (wizardStep > 1) {
      setWizardStep((s) => (s - 1) as WizardStep);
    }
  };

  const buildConfigPayload = (enabledOverride?: boolean): ConfigUpdatePayload => {
    const repositoryOwner = wizardData.repositoryOwner?.trim();
    const repositoryName = wizardData.repositoryName?.trim();
    const baseBranch = wizardData.baseBranch?.trim() || 'main';
    const branchPattern = (wizardData.branchPattern || 'docs/scribe-{timestamp}').trim();
    const targetPlatform = wizardData.targetPlatform;
    const targetConfig =
      targetPlatform === 'confluence'
        ? (confluenceSpaceKey ? { space_key: confluenceSpaceKey } : {})
        : targetPlatform === 'github_repo'
          ? { docs_path: docsPath }
          : wizardData.targetConfig || {};

    return {
      enabled: enabledOverride ?? wizardData.enabled ?? false,
      repositoryOwner: repositoryOwner || undefined,
      repositoryName: repositoryName || undefined,
      baseBranch,
      branchPattern,
      targetPlatform,
      targetConfig,
      triggerMode: wizardData.triggerMode ?? 'manual',
      scheduleCron: wizardData.scheduleCron?.trim() || null,
      prTitleTemplate: wizardData.prTitleTemplate?.trim() || undefined,
      prBodyTemplate: wizardData.prBodyTemplate?.trim() || null,
      autoMerge: wizardData.autoMerge ?? false,
      includeGlobs: wizardData.includeGlobs ?? null,
      excludeGlobs: wizardData.excludeGlobs ?? null,
      llmModelOverride: wizardData.llmModelOverride ?? null,
    };
  };

  const validateWizardRequiredFields = (): boolean => {
    const issues: string[] = [];

    if (!wizardData.repositoryOwner?.trim() || !wizardData.repositoryName?.trim() || !wizardData.baseBranch?.trim()) {
      issues.push('Repository owner, name, and base branch are required.');
    }

    if (!integrationStatus?.github.connected) {
      issues.push('GitHub must be connected before saving.');
    }

    if (!canProceedStep3) {
      issues.push(...step3Errors);
    }

    if (issues.length > 0) {
      setError(issues.join(' '));
      return false;
    }

    return true;
  };

  const saveWizardConfig = async (enabledOverride?: boolean) => {
    setSaving(true);
    setError(null);
    try {
      const payload = buildConfigPayload(enabledOverride);
      const updated = await agentConfigsApi.updateConfig('scribe', payload);
      setConfig(updated.config);
      return updated.config;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndCreateJob = async () => {
    if (!validateWizardRequiredFields()) {
      setStep3Touched(true);
      return;
    }

    setCreatingJob(true);
    try {
      const updatedConfig = await saveWizardConfig(true);
      if (!updatedConfig) return;
      const result = await agentsApi.runAgent('scribe', {
        mode: 'from_config',
        dryRun: false,
      });
      navigate(`/dashboard/jobs/${result.jobId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create job';
      setError(message.includes('configuration') ? message : `Failed to create job: ${message}`);
    } finally {
      setCreatingJob(false);
    }
  };

  const handleSaveOnly = async () => {
    if (!validateWizardRequiredFields()) {
      setStep3Touched(true);
      return;
    }
    await saveWizardConfig(true);
  };

  const handleRunTestJob = async () => {
    if (aiKeyBlocked) {
      setError('OpenAI API key is required to run Scribe. Add your key in Settings → API Keys.');
      return;
    }

    let activeConfig = config;
    if (!activeConfig) {
      if (!validateWizardRequiredFields()) {
        setStep3Touched(true);
        return;
      }
      activeConfig = await saveWizardConfig(wizardData.enabled ?? false);
      if (!activeConfig) return;
    }

    // Validate config has required fields
    if (!activeConfig.repositoryOwner || !activeConfig.repositoryName || !activeConfig.baseBranch) {
      setError('Configuration incomplete. Please ensure repository owner, name, and base branch are set.');
      return;
    }

    // Validate GitHub connection
    if (!integrationStatus?.github.connected) {
      setError('GitHub is not connected. Please connect GitHub before running Scribe.');
      return;
    }

    // Validate Confluence if selected
    if (activeConfig.targetPlatform === 'confluence' && !integrationStatus?.confluence.connected) {
      setError('Confluence target selected but not connected. Please connect Confluence or change target platform.');
      return;
    }

    setTesting(true);
    setError(null);
    try {
      const result = await agentsApi.runAgent('scribe', {
        mode: 'from_config',
        dryRun: true,
      });
      navigate(`/dashboard/jobs/${result.jobId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to run test job';
      setError(message.includes('configuration') ? message : `Failed to run test job: ${message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleRunNow = async () => {
    if (aiKeyBlocked) {
      setError('OpenAI API key is required to run Scribe. Add your key in Settings → API Keys.');
      return;
    }

    if (!config) {
      setError('No configuration found. Please complete the setup wizard first.');
      return;
    }

    // Validate config has required fields
    if (!config.repositoryOwner || !config.repositoryName || !config.baseBranch) {
      setError('Configuration incomplete. Please ensure repository owner, name, and base branch are set.');
      return;
    }

    // Validate GitHub connection
    if (!integrationStatus?.github.connected) {
      setError('GitHub is not connected. Please connect GitHub before running Scribe.');
      return;
    }

    // Validate Confluence if selected
    if (config.targetPlatform === 'confluence' && !integrationStatus?.confluence.connected) {
      setError('Confluence target selected but not connected. Please connect Confluence or change target platform.');
      return;
    }

    setTesting(true);
    setError(null);
    try {
      const result = await agentsApi.runAgent('scribe', {
        mode: 'from_config',
        dryRun: false,
      });
      navigate(`/dashboard/jobs/${result.jobId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to run job';
      setError(message.includes('configuration') ? message : `Failed to run job: ${message}`);
    } finally {
      setTesting(false);
    }
  };

  const effectiveTriggerMode = wizardData.triggerMode || 'manual';
  const triggerModeLabel =
    effectiveTriggerMode === 'on_pr_merge'
      ? 'On PR merge'
      : effectiveTriggerMode === 'scheduled'
        ? 'Scheduled'
        : 'Manual';

  const targetPlatformLabel =
    wizardData.targetPlatform === 'confluence'
      ? `Confluence${confluenceSpaceKey ? ` (${confluenceSpaceKey})` : ''}`
      : wizardData.targetPlatform === 'github_repo'
        ? `GitHub repository docs (${docsPath})`
        : 'Not set';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-ak-surface-2" />
        <div className="h-64 animate-pulse rounded-2xl bg-ak-surface-2" />
      </div>
    );
  }

  // Empty State - Show Wizard
  if (!config) {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-ak-text-primary">
            AKIS Scribe Configuration
          </h1>
          <p className="text-sm text-ak-text-secondary">
            Configure Scribe to automatically update your documentation.
          </p>
        </header>

        {/* Success/Error Notification */}
        {notification && (
          <div
            className={`rounded-lg border p-3 ${
              notification.type === 'success'
                ? 'border-green-500/30 bg-green-500/10'
                : 'border-red-500/30 bg-red-500/10'
            }`}
          >
            <p className={`text-sm ${notification.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {notification.message}
            </p>
          </div>
        )}

        {/* Wizard Step 1: Pre-flight Checks */}
        {wizardStep === 1 && (
          <Card className="space-y-6 bg-ak-surface-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ak-text-primary">
                  Step 1 of 5: Pre-flight Checks
                </h2>
                <span className="text-xs text-ak-text-secondary">Let's make sure everything is connected</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className={`rounded-xl border p-4 ${integrationStatus?.github.connected ? 'border-green-500/30 bg-green-500/10' : 'border-ak-border bg-ak-surface'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-ak-text-primary">
                      {integrationStatus?.github.connected ? '✓ GitHub' : '✗ GitHub'}
                    </p>
                    <p className="text-sm text-ak-text-secondary">
                      {integrationStatus?.github.connected
                        ? `Connected${integrationStatus.github.details?.username ? ` as ${integrationStatus.github.details.username}` : ''}`
                        : 'Not connected'}
                    </p>
                  </div>
                  {!integrationStatus?.github.connected && (
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => {
                        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
                        const returnTo = encodeURIComponent('/dashboard/agents/scribe');
                        window.location.href = `${backendUrl}/api/integrations/connect/github?returnTo=${returnTo}`;
                      }}
                    >
                      Connect GitHub
                    </Button>
                  )}
                </div>
              </div>

              <div className={`rounded-xl border p-4 ${integrationStatus?.confluence.connected ? 'border-green-500/30 bg-green-500/10' : 'border-ak-border bg-ak-surface'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-ak-text-primary">
                      {integrationStatus?.confluence.connected ? '✓ Confluence' : '✗ Confluence'}
                    </p>
                    <p className="text-sm text-ak-text-secondary">
                      {integrationStatus?.confluence.connected
                        ? `Connected${integrationStatus.confluence.details?.siteName ? ` to ${integrationStatus.confluence.details.siteName}` : ''}`
                        : 'Not connected - requires API token configuration'}
                    </p>
                  </div>
                  {!integrationStatus?.confluence.connected && (
                    <Button as={Link} to="/dashboard/integrations" variant="outline" size="md">
                      View Setup
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-ak-danger bg-ak-danger/10 p-4">
                <p className="text-sm text-ak-danger">{error}</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                onClick={handleWizardNext}
                disabled={!integrationStatus?.github.connected}
              >
                Continue →
              </Button>
            </div>
          </Card>
        )}

        {/* Wizard Step 2: Repository & Branch */}
        {wizardStep === 2 && (
          <Card className="space-y-6 bg-ak-surface-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ak-text-primary">
                  Step 2 of 5: Repository & Branch
                </h2>
                <button
                  onClick={handleWizardBack}
                  className="text-sm text-ak-text-secondary hover:text-ak-primary"
                >
                  ← Back
                </button>
              </div>
              <p className="text-sm text-ak-text-secondary">
                Select the repository and branch for documentation updates.
              </p>
            </div>

            {/* GitHub not connected warning */}
            {!integrationStatus?.github.connected && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                <p className="text-sm text-amber-400">
                  ⚠️ GitHub is not connected. Please go back to Step 1 and connect your GitHub account.
                </p>
              </div>
            )}

            {/* GitHub error */}
            {githubError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                <p className="text-sm text-red-400">{githubError}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Repository Owner Dropdown */}
              <SearchableSelect
                label="Repository Owner"
                placeholder="Select account or organization..."
                options={ownerOptions}
                value={wizardData.repositoryOwner || ''}
                onChange={(value) => setWizardData({ ...wizardData, repositoryOwner: value, repositoryName: '', baseBranch: 'main' })}
                loading={ownersLoading}
                disabled={!integrationStatus?.github.connected}
                emptyMessage="No GitHub accounts available"
                description="Your GitHub account or an organization you belong to"
                allowManualInput={true}
                manualInputPlaceholder="e.g., myorg"
              />

              {/* Repository Name Dropdown */}
              <SearchableSelect
                label="Repository Name"
                placeholder={wizardData.repositoryOwner ? "Select a repository..." : "Select owner first"}
                options={repoOptions}
                value={wizardData.repositoryName || ''}
                onChange={handleRepoSelect}
                loading={reposLoading}
                disabled={!integrationStatus?.github.connected || !wizardData.repositoryOwner}
                emptyMessage={wizardData.repositoryOwner ? "No repositories found" : "Select an owner first"}
                description="The repository where documentation will be updated"
                allowManualInput={true}
                manualInputPlaceholder="e.g., backend"
              />

              {/* Base Branch Dropdown */}
              <SearchableSelect
                label="Base Branch"
                placeholder={wizardData.repositoryName ? "Select a branch..." : "Select repository first"}
                options={branchOptions}
                value={wizardData.baseBranch || 'main'}
                onChange={(value) => setWizardData({ ...wizardData, baseBranch: value })}
                loading={branchesLoading}
                disabled={!integrationStatus?.github.connected || !wizardData.repositoryName}
                emptyMessage="No branches found"
                description="Scribe will create PRs targeting this branch"
                allowManualInput={true}
                manualInputPlaceholder="e.g., main"
              />

              {/* Branch Naming Pattern - keep as Input */}
              <Input
                label="Branch Naming Pattern"
                placeholder="docs/scribe-{timestamp}"
                value={wizardData.branchPattern || 'docs/scribe-{timestamp}'}
                onChange={(e) =>
                  setWizardData({ ...wizardData, branchPattern: e.target.value })
                }
                description={`Preview: ${(wizardData.branchPattern || 'docs/scribe-{timestamp}').replace('{timestamp}', new Date().toISOString().slice(0, 10).replace(/-/g, ''))}`}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleWizardBack}>
                ← Back
              </Button>
              <Button
                onClick={handleWizardNext}
                disabled={!wizardData.repositoryOwner || !wizardData.repositoryName || !wizardData.baseBranch}
              >
                Continue →
              </Button>
            </div>
          </Card>
        )}

        {/* Wizard Step 3: Target platform configuration */}
        {wizardStep === 3 && (
          <Card className="space-y-6 bg-ak-surface-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ak-text-primary">
                  Step 3 of 5: Target platform configuration
                </h2>
                <button
                  onClick={handleWizardBack}
                  className="text-sm text-ak-text-secondary hover:text-ak-primary"
                >
                  ← Back
                </button>
              </div>
              <p className="text-sm text-ak-text-secondary">
                Choose where Scribe should publish documentation updates and confirm required fields.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-ak-text-primary">
                  Target Platform
                </label>
                <p className="mb-3 text-xs text-ak-text-secondary">
                  Choose where Scribe should publish documentation updates
                </p>
                <div className="space-y-3">
                  <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 hover:border-ak-primary ${wizardData.targetPlatform === 'github_repo' ? 'border-ak-primary bg-ak-primary/10' : 'border-ak-border bg-ak-surface'}`}>
                    <input
                      type="radio"
                      name="targetPlatform"
                      value="github_repo"
                      checked={wizardData.targetPlatform === 'github_repo'}
                      onChange={(e) =>
                        setWizardData({
                          ...wizardData,
                          targetPlatform: e.target.value as 'github_repo',
                          targetConfig: { docs_path: docsPath },
                        })
                      }
                      className="h-4 w-4 text-ak-primary focus:ring-ak-primary"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-ak-text-primary">GitHub Repository Docs</p>
                        <span className="text-xs text-ak-primary">⭐ Recommended</span>
                      </div>
                      <p className="text-sm text-ak-text-secondary">
                        Commit docs directly to your repository (e.g., docs/ folder)
                      </p>
                    </div>
                  </label>
                  <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 hover:border-ak-primary ${wizardData.targetPlatform === 'confluence' ? 'border-ak-primary bg-ak-primary/10' : 'border-ak-border bg-ak-surface'}`}>
                    <input
                      type="radio"
                      name="targetPlatform"
                      value="confluence"
                      checked={wizardData.targetPlatform === 'confluence'}
                      onChange={(e) =>
                        setWizardData({
                          ...wizardData,
                          targetPlatform: e.target.value as 'confluence',
                          targetConfig: {
                            ...(wizardData.targetConfig || {}),
                          },
                        })
                      }
                      className="h-4 w-4 text-ak-primary focus:ring-ak-primary"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-ak-text-primary">Confluence</p>
                      <p className="text-sm text-ak-text-secondary">
                        Sync docs to Confluence pages (requires Confluence connection)
                      </p>
                    </div>
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-ak-border bg-ak-surface p-4 opacity-50">
                    <input type="radio" name="targetPlatform" value="notion" disabled />
                    <div className="flex-1">
                      <p className="font-medium text-ak-text-primary">Notion</p>
                      <p className="text-sm text-ak-text-secondary">Coming Soon (Q2 2026)</p>
                    </div>
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-ak-border bg-ak-surface p-4 opacity-50">
                    <input type="radio" name="targetPlatform" value="github_wiki" disabled />
                    <div className="flex-1">
                      <p className="font-medium text-ak-text-primary">GitHub Wiki</p>
                      <p className="text-sm text-ak-text-secondary">Coming Soon (Q3 2026)</p>
                    </div>
                  </label>
                </div>
              </div>

              {wizardData.targetPlatform === 'confluence' && (
                <>
                  {!integrationStatus?.confluence.connected && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                      <p className="text-sm text-amber-400">
                        ⚠️ Confluence is not connected. Please connect Confluence at{' '}
                        <Link to="/dashboard/integrations" className="underline">
                          Integrations page
                        </Link>{' '}
                        before proceeding.
                      </p>
                    </div>
                  )}
                  <Input
                    label="Confluence Space Key"
                    placeholder="ENGDOCS"
                    value={confluenceSpaceKey}
                    onChange={(e) =>
                      setWizardData({
                        ...wizardData,
                        targetConfig: {
                          ...(wizardData.targetConfig || {}),
                          space_key: e.target.value,
                        },
                      })
                    }
                    description="The Confluence space where docs will be published"
                    disabled={!integrationStatus?.confluence.connected}
                  />
                </>
              )}
              {wizardData.targetPlatform === 'github_repo' && (
                <Input
                  label="Documentation Path (Optional)"
                  placeholder="docs/"
                  value={docsPath}
                  onChange={(e) =>
                    setWizardData({
                      ...wizardData,
                      targetConfig: {
                        ...(wizardData.targetConfig || {}),
                        docs_path: e.target.value,
                      },
                    })
                  }
                  description="Path in repository where documentation files will be committed"
                />
              )}
            </div>

            {step3Touched && step3Errors.length > 0 && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                <p className="text-sm font-medium text-amber-400">Please resolve the following:</p>
                <ul className="ml-5 list-disc text-sm text-amber-400">
                  {step3Errors.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleWizardBack}>
                ← Back
              </Button>
              <Button 
                onClick={handleWizardNext}
                disabled={!canProceedStep3}
              >
                Continue →
              </Button>
            </div>
          </Card>
        )}

        {/* Wizard Step 4: Advanced options */}
        {wizardStep === 4 && (
          <Card className="space-y-6 bg-ak-surface-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ak-text-primary">
                  Step 4 of 5: Advanced options
                </h2>
                <button
                  onClick={handleWizardBack}
                  className="text-sm text-ak-text-secondary hover:text-ak-primary"
                >
                  ← Back
                </button>
              </div>
              <p className="text-sm text-ak-text-secondary">
                Optional settings. You can skip this step and use defaults.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-ak-text-primary">
                  Trigger mode (optional)
                </label>
                <div className="space-y-3">
                  <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${wizardData.triggerMode === 'on_pr_merge' ? 'border-ak-primary bg-ak-primary/10' : 'border-ak-border bg-ak-surface hover:border-ak-primary'}`}>
                    <input
                      type="radio"
                      name="triggerMode"
                      value="on_pr_merge"
                      checked={wizardData.triggerMode === 'on_pr_merge'}
                      onChange={(e) =>
                        setWizardData({
                          ...wizardData,
                          triggerMode: e.target.value as 'on_pr_merge',
                        })
                      }
                      className="mt-1 h-4 w-4 text-ak-primary focus:ring-ak-primary"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-ak-text-primary">On PR Merge</p>
                      <p className="text-sm text-ak-text-secondary">
                        Runs automatically when a PR is merged to your base branch.
                      </p>
                    </div>
                  </label>
                  <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${wizardData.triggerMode === 'scheduled' ? 'border-ak-primary bg-ak-primary/10' : 'border-ak-border bg-ak-surface hover:border-ak-primary'}`}>
                    <input
                      type="radio"
                      name="triggerMode"
                      value="scheduled"
                      checked={wizardData.triggerMode === 'scheduled'}
                      onChange={(e) =>
                        setWizardData({
                          ...wizardData,
                          triggerMode: e.target.value as 'scheduled',
                        })
                      }
                      className="mt-1 h-4 w-4 text-ak-primary focus:ring-ak-primary"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-ak-text-primary">On Schedule</p>
                      <p className="text-sm text-ak-text-secondary">
                        Run at specific times (daily, weekly).
                      </p>
                    </div>
                  </label>
                  <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${wizardData.triggerMode === 'manual' ? 'border-ak-primary bg-ak-primary/10' : 'border-ak-border bg-ak-surface hover:border-ak-primary'}`}>
                    <input
                      type="radio"
                      name="triggerMode"
                      value="manual"
                      checked={wizardData.triggerMode === 'manual'}
                      onChange={(e) =>
                        setWizardData({
                          ...wizardData,
                          triggerMode: e.target.value as 'manual',
                        })
                      }
                      className="mt-1 h-4 w-4 text-ak-primary focus:ring-ak-primary"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-ak-text-primary">Manual Only</p>
                      <p className="text-sm text-ak-text-secondary">
                        Only run when you click "Run Now" or create a job manually.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {wizardData.triggerMode === 'scheduled' && (
                <Input
                  label="Schedule (Cron) - Optional"
                  placeholder="0 9 * * 1"
                  value={wizardData.scheduleCron || ''}
                  onChange={(e) => setWizardData({ ...wizardData, scheduleCron: e.target.value })}
                  description="Cron expression for scheduled runs (leave empty to skip scheduling)"
                />
              )}

              <Card className="bg-ak-surface">
                <h3 className="mb-3 text-sm font-semibold text-ak-text-primary">PR Behavior (Optional)</h3>
                <div className="space-y-3">
                  <Input
                    label="PR Title Template"
                    placeholder="docs(scribe): {summary}"
                    value={wizardData.prTitleTemplate || ''}
                    onChange={(e) => setWizardData({ ...wizardData, prTitleTemplate: e.target.value })}
                    description="Template for pull request titles"
                  />
                  <Input
                    label="PR Body Template"
                    placeholder="Summary: {summary}"
                    value={wizardData.prBodyTemplate || ''}
                    onChange={(e) => setWizardData({ ...wizardData, prBodyTemplate: e.target.value })}
                    description="Template for pull request descriptions"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="autoMerge"
                      checked={wizardData.autoMerge || false}
                      onChange={(e) => setWizardData({ ...wizardData, autoMerge: e.target.checked })}
                      className="h-4 w-4 rounded border-ak-border text-ak-primary focus:ring-ak-primary"
                    />
                    <label htmlFor="autoMerge" className="text-sm text-ak-text-primary">
                      Enable auto-merge (optional, requires explicit opt-in)
                    </label>
                  </div>
                  {wizardData.autoMerge && (
                    <div className="rounded-lg border border-ak-danger bg-ak-danger/10 p-3">
                      <p className="text-xs text-ak-danger">
                        ⚠️ Auto-merge is enabled. Changes may merge without manual review.
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="bg-ak-surface">
                <h3 className="mb-3 text-sm font-semibold text-ak-text-primary">Model Selection</h3>
                {modelError ? (
                  <p className="text-xs text-ak-danger">{modelError}</p>
                ) : (
                  <SearchableSelect
                    label="Allowed OpenAI Models"
                    placeholder={modelLoading ? 'Loading models...' : 'Select a model'}
                    options={modelOptions}
                    value={wizardData.llmModelOverride || modelDefault || ''}
                    onChange={(value) => setWizardData({ ...wizardData, llmModelOverride: value })}
                    loading={modelLoading}
                    error={modelAllowlist.length === 0 ? 'No models available' : null}
                    allowManualInput={false}
                    description="Model list is enforced by the backend allowlist."
                  />
                )}
              </Card>

              <Card className="bg-ak-surface">
                <h3 className="mb-3 text-sm font-semibold text-ak-text-primary">File Filters (Optional)</h3>
                <div className="space-y-3">
                  <Input
                    label="Include Globs"
                    placeholder="src/**, docs/**"
                    value={formatGlobs(wizardData.includeGlobs)}
                    onChange={(e) =>
                      setWizardData({ ...wizardData, includeGlobs: parseGlobs(e.target.value) })
                    }
                    description="Comma-separated patterns to include"
                  />
                  <Input
                    label="Exclude Globs"
                    placeholder="*.test.ts"
                    value={formatGlobs(wizardData.excludeGlobs)}
                    onChange={(e) =>
                      setWizardData({ ...wizardData, excludeGlobs: parseGlobs(e.target.value) })
                    }
                    description="Comma-separated patterns to exclude"
                  />
                </div>
              </Card>

              <Card className="bg-ak-surface">
                <p className="text-xs text-ak-text-secondary">
                  Defaults apply if any advanced option is left blank. You can update these later.
                </p>
              </Card>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleWizardBack}>
                ← Back
              </Button>
              <Button onClick={handleWizardNext}>
                Continue →
              </Button>
            </div>
          </Card>
        )}

        {/* Wizard Step 5: Review and save */}
        {wizardStep === 5 && (
          <Card className="space-y-6 bg-ak-surface-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ak-text-primary">
                  Step 5 of 5: Review and save
                </h2>
                <button
                  onClick={handleWizardBack}
                  className="text-sm text-ak-text-secondary hover:text-ak-primary"
                >
                  ← Back
                </button>
              </div>
              <p className="text-sm text-ak-text-secondary">
                Review your configuration and save. You can jump back to edit any step.
              </p>
            </div>

            <div className="space-y-4">
              {aiKeyError ? (
                <div className="rounded-xl border border-ak-danger/60 bg-ak-danger/10 p-4 text-sm text-ak-danger">
                  {aiKeyError}
                </div>
              ) : null}
              {aiKeyBlocked ? (
                <Card className="border border-ak-danger/40 bg-ak-danger/10">
                  <p className="text-sm text-ak-text-primary">
                    OpenAI API key is required to run Scribe. Add your key before running test or live jobs.
                  </p>
                  <Link to="/dashboard/settings/api-keys" className="mt-2 inline-block text-xs font-semibold text-ak-primary">
                    Configure API key →
                  </Link>
                </Card>
              ) : null}
              <Card className="bg-ak-surface">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-ak-text-primary">Review Summary</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="ghost" size="md" className="px-3 py-1 text-xs" onClick={() => setWizardStep(2)}>
                      Edit Step 2
                    </Button>
                    <Button variant="ghost" size="md" className="px-3 py-1 text-xs" onClick={() => setWizardStep(3)}>
                      Edit Step 3
                    </Button>
                    <Button variant="ghost" size="md" className="px-3 py-1 text-xs" onClick={() => setWizardStep(4)}>
                      Edit Step 4
                    </Button>
                  </div>
                </div>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-ak-text-secondary">Repository</span>
                    <span className="text-ak-text-primary">
                      {wizardData.repositoryOwner && wizardData.repositoryName
                        ? `${wizardData.repositoryOwner}/${wizardData.repositoryName}`
                        : 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-ak-text-secondary">Base Branch</span>
                    <span className="text-ak-text-primary">{wizardData.baseBranch || 'main'}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-ak-text-secondary">Branch Pattern</span>
                    <span className="text-ak-text-primary">
                      {wizardData.branchPattern || 'docs/scribe-{timestamp}'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-ak-text-secondary">Target Platform</span>
                    <span className="text-ak-text-primary">{targetPlatformLabel}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-ak-text-secondary">Trigger Mode</span>
                    <span className="text-ak-text-primary">{triggerModeLabel}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-ak-text-secondary">Model</span>
                    <span className="text-ak-text-primary">
                      {wizardData.llmModelOverride || modelDefault || 'Default'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-ak-text-secondary">Schedule</span>
                    <span className="text-ak-text-primary">{wizardData.scheduleCron || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-ak-text-secondary">PR Title Template</span>
                    <span className="text-ak-text-primary">
                      {wizardData.prTitleTemplate || 'Default'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-ak-text-secondary">PR Body Template</span>
                    <span className="text-ak-text-primary">
                      {wizardData.prBodyTemplate || 'Default'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-ak-text-secondary">Auto-merge</span>
                    <span className="text-ak-text-primary">
                      {wizardData.autoMerge ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-ak-text-secondary">Include Globs</span>
                    <span className="text-ak-text-primary">
                      {formatGlobs(wizardData.includeGlobs) || 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-ak-text-secondary">Exclude Globs</span>
                    <span className="text-ak-text-primary">
                      {formatGlobs(wizardData.excludeGlobs) || 'Not set'}
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="bg-ak-surface">
                <h3 className="mb-3 text-sm font-semibold text-ak-text-primary">Optional: Run Test Job</h3>
                <p className="mb-4 text-sm text-ak-text-secondary">
                  Run a dry-run to verify the configuration. No real changes will be made.
                </p>
                <Button
                  variant="outline"
                  onClick={handleRunTestJob}
                  disabled={testing || saving || creatingJob || aiKeyBlocked}
                >
                  {testing ? 'Running...' : 'Run Test Job'}
                </Button>
              </Card>
            </div>

            {error && (
              <div className="rounded-xl border border-ak-danger bg-ak-danger/10 p-4">
                <p className="text-sm text-ak-danger">{error}</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleWizardBack}>
                ← Back
              </Button>
              <Button variant="outline" onClick={handleSaveOnly} disabled={saving || creatingJob}>
                {saving ? 'Saving...' : 'Save Only'}
              </Button>
              <Button onClick={handleSaveAndCreateJob} disabled={saving || creatingJob || aiKeyBlocked}>
                {creatingJob ? 'Creating...' : 'Save & Create Job'}
              </Button>
            </div>
          </Card>
        )}
      </div>
    );
  }

  // Configured Dashboard View
  return (
  <div className="space-y-6">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-ak-text-primary">
            AKIS Scribe Configuration
        </h1>
        <p className="text-sm text-ak-text-secondary">
            Automatically updates documentation from your commits.
        </p>
      </div>
        <div className="flex flex-shrink-0 gap-3">
          <Button variant="outline" onClick={() => setConfig(null)}>
            Edit Config
          </Button>
          <Button onClick={handleRunNow} disabled={testing || !config?.enabled || aiKeyBlocked}>
            {testing ? 'Running...' : 'Run Now'}
        </Button>
      </div>
    </header>

      {/* Pre-flight Checks */}
      <Card className="bg-ak-surface-2">
        <h2 className="mb-4 text-lg font-semibold text-ak-text-primary">Pre-flight Checks</h2>
              <div className="grid gap-3 md:grid-cols-3">
                <div className={`rounded-lg border p-3 ${integrationStatus?.github.connected ? 'border-green-500/30 bg-green-500/10' : 'border-ak-border'}`}>
                  <p className="text-sm font-medium text-ak-text-primary">
                    {integrationStatus?.github.connected ? '✓ GitHub' : '✗ GitHub'}
                  </p>
                  <p className="text-xs text-ak-text-secondary">
                    {integrationStatus?.github.connected ? 'Connected' : 'Not connected'}
                  </p>
                </div>
                <div className={`rounded-lg border p-3 ${integrationStatus?.confluence.connected ? 'border-green-500/30 bg-green-500/10' : 'border-ak-border'}`}>
                  <p className="text-sm font-medium text-ak-text-primary">
                    {integrationStatus?.confluence.connected ? '✓ Confluence' : '✗ Confluence'}
                  </p>
                  <p className="text-xs text-ak-text-secondary">
                    {integrationStatus?.confluence.connected ? 'Connected' : 'Not connected'}
                  </p>
                </div>
                <div className={`rounded-lg border p-3 ${aiKeyStatus?.configured ? 'border-green-500/30 bg-green-500/10' : 'border-ak-danger/40 bg-ak-danger/10'}`}>
                  <p className="text-sm font-medium text-ak-text-primary">
                    {aiKeyLoading ? '… OpenAI' : aiKeyStatus?.configured ? '✓ OpenAI Key' : '⚠ OpenAI Key'}
                  </p>
                  <p className="text-xs text-ak-text-secondary">
                    {aiKeyLoading
                      ? 'Checking key status'
                      : aiKeyStatus?.configured
                      ? `Configured (•••• ${aiKeyStatus.last4})`
                      : 'Missing — add your key to run Scribe'}
                  </p>
                  {!aiKeyLoading && !aiKeyStatus?.configured ? (
                    <Link to="/dashboard/settings/api-keys" className="mt-2 inline-block text-xs font-semibold text-ak-primary">
                      Add key →
                    </Link>
                  ) : null}
                </div>
              </div>
      </Card>

      {aiKeyBlocked ? (
        <div className="rounded-xl border border-ak-danger/50 bg-ak-danger/10 p-4 text-sm text-ak-text-primary">
          OpenAI API key is required to run Scribe. Add your key in Settings → API Keys.
        </div>
      ) : null}

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-ak-surface">
          <p className="text-xs uppercase tracking-[0.25em] text-ak-text-secondary/70">
            Status
          </p>
          <p className="mt-2 text-lg font-semibold text-ak-text-primary">
            {config.enabled ? '✓ Enabled' : '○ Disabled'}
          </p>
        </Card>
        <Card className="bg-ak-surface">
          <p className="text-xs uppercase tracking-[0.25em] text-ak-text-secondary/70">
            Repository
          </p>
          <p className="mt-2 text-sm font-medium text-ak-text-primary">
            {config.repositoryOwner}/{config.repositoryName}
          </p>
        </Card>
        <Card className="bg-ak-surface">
          <p className="text-xs uppercase tracking-[0.25em] text-ak-text-secondary/70">
            Target
          </p>
          <p className="mt-2 text-sm font-medium text-ak-text-primary">
            {config.targetPlatform || 'Not set'}
          </p>
        </Card>
        <Card className="bg-ak-surface">
          <p className="text-xs uppercase tracking-[0.25em] text-ak-text-secondary/70">
            Trigger
          </p>
          <p className="mt-2 text-sm font-medium text-ak-text-primary">
            {config.triggerMode === 'on_pr_merge' ? 'On PR merge' : config.triggerMode === 'scheduled' ? 'Scheduled' : 'Manual'}
          </p>
        </Card>
      </div>

      {/* Active Configuration */}
      <Card className="bg-ak-surface-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-ak-text-primary">Active Configuration</h2>
          <Button variant="ghost" size="md" onClick={() => setConfig(null)}>
            Edit
          </Button>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-ak-text-secondary">Repository:</span>
            <span className="text-ak-text-primary">{config.repositoryOwner}/{config.repositoryName} ({config.baseBranch})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ak-text-secondary">Target:</span>
            <span className="text-ak-text-primary">
              {config.targetPlatform === 'confluence' && config.targetConfig && typeof config.targetConfig === 'object' && 'space_key' in config.targetConfig
                ? `Confluence → ${config.targetConfig.space_key}`
                : config.targetPlatform || 'Not set'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-ak-text-secondary">Branch Policy:</span>
            <span className="text-ak-text-primary">{config.branchPattern || 'docs/scribe-{timestamp}'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ak-text-secondary">PR Behavior:</span>
            <span className="text-ak-text-primary">{config.autoMerge ? 'Auto-merge enabled' : 'Manual merge required'}</span>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-ak-surface-2">
        <h2 className="mb-4 text-lg font-semibold text-ak-text-primary">Quick Actions</h2>
        {aiKeyBlocked ? (
          <p className="mb-3 rounded-lg border border-ak-danger/40 bg-ak-danger/10 px-3 py-2 text-xs text-ak-text-primary">
            OpenAI API key required. Configure it in Settings → API Keys to run jobs.
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={handleRunTestJob}
            disabled={testing || aiKeyBlocked}
          >
            {testing ? 'Running...' : 'Run Test Job'}
          </Button>
          <Button
            onClick={handleRunNow}
            disabled={testing || !config.enabled || aiKeyBlocked}
          >
            {testing ? 'Running...' : 'Run Now'}
          </Button>
          <Button variant="ghost" as={Link} to="/dashboard/jobs">
            View Recent Jobs →
          </Button>
        </div>
      </Card>

      {/* Advanced Settings (Collapsed by default) */}
      <details className="rounded-2xl border border-ak-border bg-ak-surface-2">
        <summary className="cursor-pointer p-4 text-sm font-semibold text-ak-text-primary">
          Advanced Settings
        </summary>
        <div className="border-t border-ak-border p-4 space-y-4">
      <Input
            label="Include Globs"
        placeholder="src/**, docs/**"
            value={config.includeGlobs?.join(', ') || ''}
            disabled
      />
      <Input
            label="Exclude Globs"
        placeholder="*.test.ts"
            value={config.excludeGlobs?.join(', ') || ''}
            disabled
          />
          <Input
            label="PR Title Template"
            placeholder="docs(scribe): {summary}"
            value={config.prTitleTemplate || ''}
            disabled
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoMerge"
              checked={config.autoMerge}
              disabled
              className="h-4 w-4 rounded border-ak-border text-ak-primary focus:ring-ak-primary"
            />
            <label htmlFor="autoMerge" className="text-sm text-ak-text-primary">
              Enable auto-merge (requires explicit opt-in)
            </label>
          </div>
          {config.autoMerge && (
            <div className="rounded-lg border border-ak-danger bg-ak-danger/10 p-3">
              <p className="text-xs text-ak-danger">
                ⚠️ Auto-merge is enabled. Changes will be merged automatically without review.
              </p>
            </div>
          )}
        </div>
      </details>

      {error && (
        <Card className="border-ak-danger bg-ak-danger/10">
          <p className="text-sm text-ak-danger">{error}</p>
    </Card>
      )}
  </div>
);
};

export default DashboardAgentScribePage;
