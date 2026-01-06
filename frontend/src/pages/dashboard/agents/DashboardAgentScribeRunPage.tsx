import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { JobStatus } from '../../../components/agents/JobStatus';
import { useI18n } from '../../../i18n/useI18n';
import { useAuth } from '../../../contexts/AuthContext';
import { useAgentRunner } from '../../agents/useAgentRunner';
import { aiKeysApi, type AiKeyStatus } from '../../../services/api/ai-keys';

/** Helper to check if agents feature is enabled (evaluated at runtime for testability) */
const isAgentsEnabled = () =>
  String(import.meta.env.VITE_AGENTS_ENABLED ?? '').toLowerCase() === 'true';

const DashboardAgentScribeRunPage = () => {
  const agentsEnabled = isAgentsEnabled();
  const { t } = useI18n();
  const { user } = useAuth();
  const isAuthenticated = Boolean(user);

  const [aiKeyStatus, setAiKeyStatus] = useState<AiKeyStatus | null>(null);
  const [aiKeyLoading, setAiKeyLoading] = useState(true);
  const [aiKeyError, setAiKeyError] = useState<string | null>(null);
  
  // Form state
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [baseBranch, setBaseBranch] = useState('main');
  const [featureBranch, setFeatureBranch] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const { runAgent, job, error, isSubmitting, isPolling, reset } = useAgentRunner('scribe');

  useEffect(() => {
    let active = true;
    const loadStatus = async () => {
      setAiKeyLoading(true);
      setAiKeyError(null);
      try {
        const status = await aiKeysApi.getStatus();
        if (active) {
          setAiKeyStatus(status);
        }
      } catch (err) {
        if (active) {
          setAiKeyError(err instanceof Error ? err.message : 'Failed to load OpenAI key status.');
        }
      } finally {
        if (active) {
          setAiKeyLoading(false);
        }
      }
    };

    void loadStatus();
    return () => {
      active = false;
    };
  }, []);

  const aiKeyBlocked = aiKeyLoading || !aiKeyStatus?.configured;

  const canSubmit = useMemo(
    () =>
      Boolean(owner.trim()) &&
      Boolean(repo.trim()) &&
      Boolean(baseBranch.trim()) &&
      isAuthenticated &&
      !aiKeyBlocked,
    [owner, repo, baseBranch, isAuthenticated, aiKeyBlocked]
  );

  if (!agentsEnabled) {
    return <Navigate to="/agents" replace />;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (aiKeyBlocked) {
      setValidationError('OpenAI API key is required before running Scribe.');
      return;
    }

    if (!owner.trim() || !repo.trim() || !baseBranch.trim()) {
      setValidationError('Owner, Repo, and Base Branch are required');
      return;
    }

    setValidationError(null);
    void runAgent({
      owner: owner.trim(),
      repo: repo.trim(),
      baseBranch: baseBranch.trim(),
      featureBranch: featureBranch.trim() || undefined,
      taskDescription: taskDescription.trim() || undefined,
      // doc: taskDescription.trim() // Backward compat if needed
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ak-text-secondary/70">
          {t('agents.scribe.subtitle')}
        </p>
        <h1 className="text-3xl font-semibold text-ak-text-primary sm:text-4xl">
          {t('agents.scribe.title')}
        </h1>
        <p className="text-sm text-ak-text-secondary sm:max-w-2xl">
          {t('agents.scribe.description')}
        </p>
      </header>

      <Card className="space-y-6 bg-ak-surface">
        <div className="rounded-xl border border-ak-border bg-ak-surface-2 px-4 py-3 text-sm text-ak-text-secondary">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-ak-text-primary font-medium">OpenAI Key Status</p>
              <p className="text-xs text-ak-text-secondary">
                {aiKeyLoading
                  ? 'Checking key status...'
                  : aiKeyStatus?.configured
                    ? `Configured (•••• ${aiKeyStatus.last4})`
                    : 'Missing — add a key to run Scribe'}
              </p>
            </div>
            <Link
              to="/dashboard/settings/api-keys"
              className="text-xs font-semibold text-ak-primary"
            >
              Manage Keys →
            </Link>
          </div>
        </div>

        {aiKeyError ? (
          <div className="rounded-xl border border-ak-danger/60 bg-ak-danger/10 px-4 py-3 text-sm text-ak-danger">
            {aiKeyError}
          </div>
        ) : null}

        {aiKeyBlocked ? (
          <div className="rounded-xl border border-ak-danger/60 bg-ak-danger/10 px-4 py-3 text-sm text-ak-text-primary">
            OpenAI API key is required to run Scribe. Add your key in Settings → API Keys.
          </div>
        ) : null}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-ak-text-primary" htmlFor="scribe-owner">
                Repo Owner
              </label>
              <input
                id="scribe-owner"
                type="text"
                className="w-full rounded-xl border border-ak-border bg-ak-surface-2 px-4 py-2 text-sm text-ak-text-primary placeholder:text-ak-text-secondary/70 focus:border-ak-primary focus:outline-none focus:ring-2 focus:ring-ak-primary/60"
                placeholder="e.g. my-org"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                disabled={isSubmitting || !isAuthenticated}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-ak-text-primary" htmlFor="scribe-repo">
                Repo Name
              </label>
              <input
                id="scribe-repo"
                type="text"
                className="w-full rounded-xl border border-ak-border bg-ak-surface-2 px-4 py-2 text-sm text-ak-text-primary placeholder:text-ak-text-secondary/70 focus:border-ak-primary focus:outline-none focus:ring-2 focus:ring-ak-primary/60"
                placeholder="e.g. my-repo"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                disabled={isSubmitting || !isAuthenticated}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-ak-text-primary" htmlFor="scribe-baseBranch">
                Base Branch
              </label>
              <input
                id="scribe-baseBranch"
                type="text"
                className="w-full rounded-xl border border-ak-border bg-ak-surface-2 px-4 py-2 text-sm text-ak-text-primary placeholder:text-ak-text-secondary/70 focus:border-ak-primary focus:outline-none focus:ring-2 focus:ring-ak-primary/60"
                value={baseBranch}
                onChange={(e) => setBaseBranch(e.target.value)}
                disabled={isSubmitting || !isAuthenticated}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-ak-text-primary" htmlFor="scribe-featureBranch">
                Target/Feature Branch (Optional)
              </label>
              <input
                id="scribe-featureBranch"
                type="text"
                className="w-full rounded-xl border border-ak-border bg-ak-surface-2 px-4 py-2 text-sm text-ak-text-primary placeholder:text-ak-text-secondary/70 focus:border-ak-primary focus:outline-none focus:ring-2 focus:ring-ak-primary/60"
                placeholder="e.g. feat/update-docs"
                value={featureBranch}
                onChange={(e) => setFeatureBranch(e.target.value)}
                disabled={isSubmitting || !isAuthenticated}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-ak-text-primary" htmlFor="scribe-task">
              Task Description
            </label>
            <textarea
              id="scribe-task"
              rows={4}
              className="w-full rounded-xl border border-ak-border bg-ak-surface-2 px-4 py-3 text-sm text-ak-text-primary placeholder:text-ak-text-secondary/70 focus:border-ak-primary focus:outline-none focus:ring-2 focus:ring-ak-primary/60"
              placeholder="Describe what documentation needs to be updated..."
              value={taskDescription}
              onChange={(event) => setTaskDescription(event.target.value)}
              disabled={isSubmitting || !isAuthenticated}
            />
          </div>

          {validationError ? (
            <p className="text-xs text-ak-danger">{validationError}</p>
          ) : null}

          {!isAuthenticated ? (
            <p className="rounded-xl border border-ak-border bg-ak-surface-2 px-4 py-3 text-xs text-ak-text-secondary">
              {t('agents.form.loginGate')}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? t('agents.form.submitting') : t('agents.form.submit')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={isSubmitting && !job}
              onClick={() => {
                setOwner('');
                setRepo('');
                setFeatureBranch('');
                setTaskDescription('');
                setValidationError(null);
                reset();
              }}
            >
              {t('agents.form.reset')}
            </Button>
            {error ? <p className="text-sm text-ak-danger">{error}</p> : null}
          </div>
        </form>

        {isSubmitting && !job ? (
          <div className="rounded-xl border border-ak-border bg-ak-surface px-4 py-8 text-center">
            <p className="text-sm font-medium text-ak-primary">Starting Scribe job...</p>
            <p className="mt-1 text-xs text-ak-text-secondary">This may take a moment.</p>
          </div>
        ) : (
          <JobStatus job={job} isPolling={isPolling} />
        )}
      </Card>
    </div>
  );
};

export default DashboardAgentScribeRunPage;
