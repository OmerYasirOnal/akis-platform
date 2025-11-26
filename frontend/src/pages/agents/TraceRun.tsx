import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { JobStatus } from '../../components/agents/JobStatus';
import { useI18n } from '../../i18n/useI18n';
import { useAuth } from '../../contexts/AuthContext';
import { useAgentRunner } from './useAgentRunner';

/** Helper to check if agents feature is enabled (evaluated at runtime for testability) */
const isAgentsEnabled = () =>
  String(import.meta.env.VITE_AGENTS_ENABLED ?? '').toLowerCase() === 'true';

const TraceRunPage = () => {
  const agentsEnabled = isAgentsEnabled();
  const { t } = useI18n();
  const { user } = useAuth();
  const isAuthenticated = Boolean(user);
  const [spec, setSpec] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const { runAgent, job, error, isSubmitting, isPolling, reset } = useAgentRunner('trace');

  const canSubmit = useMemo(() => Boolean(spec.trim()) && isAuthenticated, [spec, isAuthenticated]);

  if (!agentsEnabled) {
    return <Navigate to="/agents" replace />;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!spec.trim()) {
      setValidationError(t('agents.trace.validation.spec'));
      return;
    }

    setValidationError(null);
    void runAgent({ spec: spec.trim() });
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ak-text-secondary/70">
          {t('agents.trace.subtitle')}
        </p>
        <h1 className="text-3xl font-semibold text-ak-text-primary sm:text-4xl">
          {t('agents.trace.title')}
        </h1>
        <p className="text-sm text-ak-text-secondary sm:max-w-2xl">
          {t('agents.trace.description')}
        </p>
      </header>

      <Card className="space-y-6 bg-ak-surface">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-ak-text-primary" htmlFor="trace-spec">
              {t('agents.trace.form.specLabel')}
            </label>
            <textarea
              id="trace-spec"
              rows={10}
              className="w-full rounded-xl border border-ak-border bg-ak-surface-2 px-4 py-3 text-sm text-ak-text-primary placeholder:text-ak-text-secondary/70 focus:border-ak-primary focus:outline-none focus:ring-2 focus:ring-ak-primary/60"
              placeholder={t('agents.trace.form.specPlaceholder')}
              value={spec}
              onChange={(event) => setSpec(event.target.value)}
              disabled={isSubmitting || !isAuthenticated}
            />
            {validationError ? (
              <p className="text-xs text-ak-danger">{validationError}</p>
            ) : (
              <p className="text-xs text-ak-text-secondary/80">
                {t('agents.trace.form.specHint')}
              </p>
            )}
          </div>

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
                setSpec('');
                setValidationError(null);
                reset();
              }}
            >
              {t('agents.form.reset')}
            </Button>
            {error ? <p className="text-sm text-ak-danger">{error}</p> : null}
          </div>
        </form>

        <JobStatus job={job} isPolling={isPolling} />
      </Card>
    </div>
  );
};

export default TraceRunPage;

