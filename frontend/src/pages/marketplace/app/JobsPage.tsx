import { useEffect, useState } from 'react';

import { useI18n } from '../../../i18n/useI18n';
import { marketplaceApi, type JobPostItem } from '../../../services/api/marketplace';

export default function JobsPage() {
  const { t } = useI18n();
  const [items, setItems] = useState<JobPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await marketplaceApi.listJobs({ limit: 30, offset: 0 });
      setItems(response.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('marketplace.jobs.errorLoad'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadJobs();
  }, []);

  const handleIngestSample = async () => {
    setIngesting(true);
    setError(null);

    try {
      await marketplaceApi.ingestJobs({
        source: 'manual',
        jobs: [
          {
            externalId: `sample-${Date.now()}`,
            title: 'Frontend React Developer',
            description: 'Need a freelancer to build a dashboard with React and TypeScript.',
            requiredSkills: ['react', 'typescript', 'ui'],
            seniority: 'mid',
            language: 'en',
            location: 'remote',
            remoteAllowed: true,
            keywords: ['dashboard', 'react', 'typescript'],
          },
        ],
      });
      await loadJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('marketplace.jobs.errorIngest'));
    } finally {
      setIngesting(false);
    }
  };

  return (
    <section className="rounded-xl border border-ak-border bg-ak-surface p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-ak-text-primary">{t('marketplace.jobs.title')}</h2>
        <button
          type="button"
          className="rounded-lg bg-ak-primary px-4 py-2 text-sm font-semibold text-[color:var(--ak-on-primary)] hover:brightness-110 disabled:opacity-70"
          onClick={handleIngestSample}
          disabled={ingesting}
        >
          {ingesting ? t('marketplace.jobs.actions.ingesting') : t('marketplace.jobs.actions.ingestSample')}
        </button>
      </div>

      {loading && <p className="text-sm text-ak-text-secondary">{t('marketplace.jobs.loading')}</p>}
      {error && <p role="alert" className="text-sm text-ak-danger">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="text-sm text-ak-text-secondary">{t('marketplace.jobs.empty')}</p>
      )}

      {!loading && !error && items.length > 0 && (
        <ul className="grid gap-3">
          {items.map((job) => (
            <li key={job.id} className="rounded-lg border border-ak-border bg-ak-surface-2 p-4">
              <h3 className="text-base font-semibold text-ak-text-primary">{job.title}</h3>
              <p className="mt-1 text-sm text-ak-text-secondary">{job.description}</p>
              <p className="mt-2 text-xs text-ak-text-secondary">
                {job.location ?? t('marketplace.jobs.unknownLocation')} ·{' '}
                {job.remoteAllowed ? t('marketplace.jobs.remoteAllowed') : t('marketplace.jobs.onSite')} ·{' '}
                {job.language ?? t('marketplace.jobs.languageNA')}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
