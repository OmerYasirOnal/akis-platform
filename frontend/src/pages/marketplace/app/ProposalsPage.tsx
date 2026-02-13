import { useCallback, useEffect, useState } from 'react';

import { useI18n } from '../../../i18n/useI18n';
import { marketplaceApi, type JobPostItem, type ProposalItem } from '../../../services/api/marketplace';

export default function ProposalsPage() {
  const { t } = useI18n();
  const [jobs, setJobs] = useState<JobPostItem[]>([]);
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingJobId, setGeneratingJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = useCallback(async (fallbackMessage = 'Failed to load jobs') => {
    setLoading(true);
    setError(null);
    try {
      const response = await marketplaceApi.listJobs({ limit: 20, offset: 0 });
      setJobs(response.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : fallbackMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  const handleGenerate = async (jobId: string) => {
    setGeneratingJobId(jobId);
    setError(null);
    try {
      const response = await marketplaceApi.generateProposal(jobId);
      setProposals((prev) => [response.proposal, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('marketplace.proposals.errorGenerate'));
    } finally {
      setGeneratingJobId(null);
    }
  };

  return (
    <section className="rounded-xl border border-ak-border bg-ak-surface p-5">
      <h2 className="mb-4 text-xl font-semibold text-ak-text-primary">{t('marketplace.proposals.title')}</h2>

      {loading && <p className="text-sm text-ak-text-secondary">{t('marketplace.proposals.loading')}</p>}
      {error && <p role="alert" className="text-sm text-ak-danger">{error}</p>}

      {!loading && jobs.length === 0 && (
        <p className="text-sm text-ak-text-secondary">{t('marketplace.proposals.emptyJobs')}</p>
      )}

      {!loading && jobs.length > 0 && (
        <ul className="grid gap-3">
          {jobs.map((job) => (
            <li key={job.id} className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-ak-border bg-ak-surface-2 p-4">
              <div>
                <h3 className="text-base font-semibold text-ak-text-primary">{job.title}</h3>
                <p className="mt-1 text-sm text-ak-text-secondary">{job.description}</p>
              </div>
              <button
                type="button"
                className="rounded-lg border border-ak-border bg-ak-surface px-3 py-2 text-sm font-semibold text-ak-text-primary hover:border-ak-primary/50 disabled:opacity-70"
                onClick={() => handleGenerate(job.id)}
                disabled={generatingJobId === job.id}
              >
                {generatingJobId === job.id ? t('marketplace.proposals.actions.generating') : t('marketplace.proposals.actions.generate')}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6">
        <h3 className="mb-3 text-base font-semibold text-ak-text-primary">{t('marketplace.proposals.generatedTitle')}</h3>
        {proposals.length === 0 ? (
          <p className="text-sm text-ak-text-secondary">{t('marketplace.proposals.generatedEmpty')}</p>
        ) : (
          <ul className="grid gap-3">
            {proposals.map((proposal) => (
              <li key={proposal.id} className="rounded-lg border border-ak-border bg-ak-bg p-4">
                <p className="mb-2 text-xs uppercase tracking-[0.12em] text-ak-text-secondary">
                  {t('marketplace.proposals.sourceLabel')} {proposal.source}
                </p>
                <pre className="whitespace-pre-wrap text-sm text-ak-text-primary">{proposal.content}</pre>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
