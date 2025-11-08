import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { JobStatus } from '../../components/agents/JobStatus';
import { useI18n } from '../../i18n/useI18n';
import { useAuth } from '../../state/auth/AuthContext';
import { useAgentRunner } from './useAgentRunner';

const agentsEnabled =
  String(import.meta.env.VITE_AGENTS_ENABLED ?? '').toLowerCase() === 'true';

const ProtoRunPage = () => {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const [goal, setGoal] = useState('');
  const { runAgent, job, error, isSubmitting, isPolling, reset } = useAgentRunner('proto');

  const canSubmit = useMemo(() => isAuthenticated, [isAuthenticated]);

  if (!agentsEnabled) {
    return <Navigate to="/agents" replace />;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void runAgent(goal.trim() ? { goal: goal.trim() } : {});
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ak-text-secondary/70">
          {t('agents.proto.subtitle')}
        </p>
        <h1 className="text-3xl font-semibold text-ak-text-primary sm:text-4xl">
          {t('agents.proto.title')}
        </h1>
        <p className="text-sm text-ak-text-secondary sm:max-w-2xl">
          {t('agents.proto.description')}
        </p>
      </header>

      <Card className="space-y-6 bg-ak-surface">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-ak-text-primary" htmlFor="proto-goal">
              {t('agents.proto.form.goalLabel')}
            </label>
            <textarea
              id="proto-goal"
              rows={6}
              className="w-full rounded-xl border border-ak-border bg-ak-surface-2 px-4 py-3 text-sm text-ak-text-primary placeholder:text-ak-text-secondary/70 focus:border-ak-primary focus:outline-none focus:ring-2 focus:ring-ak-primary/60"
              placeholder={t('agents.proto.form.goalPlaceholder')}
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              disabled={isSubmitting || !isAuthenticated}
            />
            <p className="text-xs text-ak-text-secondary/80">{t('agents.proto.form.goalHint')}</p>
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
                setGoal('');
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

export default ProtoRunPage;


