import type { JobDetail, JobState } from '../../services/api/agents';
import { useI18n } from '../../i18n/useI18n';

type JobStatusProps = {
  job: JobDetail | null;
  isPolling: boolean;
};

const stateLabels: Record<JobState, { tone: string }> = {
  pending: { tone: 'text-ak-warning' },
  running: { tone: 'text-ak-primary' },
  completed: { tone: 'text-ak-success' },
  failed: { tone: 'text-ak-danger' },
};

const formatDate = (value?: string) => {
  if (!value) {
    return '—';
  }

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

export const JobStatus = ({ job, isPolling }: JobStatusProps) => {
  const { t } = useI18n();

  if (!job) {
    return (
      <div className="rounded-xl border border-ak-border bg-ak-surface px-4 py-5 text-sm text-ak-text-secondary">
        {t('agents.status.empty')}
      </div>
    );
  }

  const stateTone = stateLabels[job.state];

  return (
    <div className="space-y-4 rounded-xl border border-ak-border bg-ak-surface px-4 py-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold uppercase tracking-wide ${stateTone.tone}`}>
            {t(`agents.status.state.${job.state}`)}
          </span>
          {isPolling ? (
            <span className="rounded-full bg-ak-primary/10 px-2 py-0.5 text-xs text-ak-primary">
              {t('agents.status.polling')}
            </span>
          ) : null}
        </div>
        <span className="text-xs text-ak-text-secondary">
          {t('agents.status.jobIdLabel')}: {job.id}
        </span>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs uppercase tracking-[0.2em] text-ak-text-secondary/70">
            {t('agents.status.startedAt')}
          </dt>
          <dd className="mt-1 text-ak-text-primary">{formatDate(job.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.2em] text-ak-text-secondary/70">
            {t('agents.status.updatedAt')}
          </dt>
          <dd className="mt-1 text-ak-text-primary">{formatDate(job.updatedAt)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.2em] text-ak-text-secondary/70">
            {t('agents.status.type')}
          </dt>
          <dd className="mt-1 capitalize text-ak-text-primary">{job.type}</dd>
        </div>
      </dl>

      <div className="space-y-3 text-sm text-ak-text-secondary">
        {job.result ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ak-text-secondary/70">
              {t('agents.status.result')}
            </p>
            <pre className="mt-2 overflow-x-auto rounded-xl bg-ak-surface-2 p-3 text-xs text-ak-text-secondary">
              {JSON.stringify(job.result, null, 2)}
            </pre>
          </div>
        ) : null}

        {job.error || job.errorMessage ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ak-text-secondary/70">
              {t('agents.status.error')}
            </p>
            {job.errorCode && (
              <span className="mt-2 inline-block rounded-md bg-ak-danger/20 px-2 py-0.5 text-xs font-medium text-ak-danger">
                {job.errorCode}
              </span>
            )}
            {job.errorMessage && (
              <p className="mt-2 text-sm text-ak-danger">{job.errorMessage}</p>
            )}
            {job.error && job.error !== job.errorMessage && (
              <pre className="mt-2 overflow-x-auto rounded-xl bg-ak-danger/10 p-3 text-xs text-ak-danger">
                {typeof job.error === 'string' ? job.error : JSON.stringify(job.error, null, 2)}
              </pre>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

