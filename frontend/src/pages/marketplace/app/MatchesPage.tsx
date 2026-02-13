import { useCallback, useEffect, useState } from 'react';

import { useI18n } from '../../../i18n/useI18n';
import { marketplaceApi, type MatchItem } from '../../../services/api/marketplace';

export default function MatchesPage() {
  const { t } = useI18n();
  const [items, setItems] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMatches = useCallback(async (fallbackMessage = 'Failed to load matches') => {
    setLoading(true);
    setError(null);

    try {
      const response = await marketplaceApi.listMatches({ limit: 30, offset: 0 });
      setItems(response.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : fallbackMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMatches();
  }, [loadMatches]);

  const handleRunMatch = async () => {
    setRunning(true);
    setError(null);
    try {
      await marketplaceApi.runMatch();
      await loadMatches(t('marketplace.matches.errorLoad'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('marketplace.matches.errorRun'));
    } finally {
      setRunning(false);
    }
  };

  return (
    <section className="rounded-xl border border-ak-border bg-ak-surface p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-ak-text-primary">{t('marketplace.matches.title')}</h2>
        <button
          type="button"
          className="rounded-lg bg-ak-primary px-4 py-2 text-sm font-semibold text-[color:var(--ak-on-primary)] hover:brightness-110 disabled:opacity-70"
          onClick={handleRunMatch}
          disabled={running}
        >
          {running ? t('marketplace.matches.actions.running') : t('marketplace.matches.actions.run')}
        </button>
      </div>

      {loading && <p className="text-sm text-ak-text-secondary">{t('marketplace.matches.loading')}</p>}
      {error && <p role="alert" className="text-sm text-ak-danger">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="text-sm text-ak-text-secondary">{t('marketplace.matches.empty')}</p>
      )}

      {!loading && !error && items.length > 0 && (
        <ul className="grid gap-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-lg border border-ak-border bg-ak-surface-2 p-4" data-testid="match-item">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-base font-semibold text-ak-text-primary">{item.jobTitle}</h3>
                <span className="rounded-full bg-ak-primary/15 px-3 py-1 text-xs font-semibold text-ak-primary">
                  {t('marketplace.matches.scoreLabel')} {Math.round(item.score * 100)}%
                </span>
              </div>

              <p className="mt-2 text-sm text-ak-text-secondary">{item.explanation.summary}</p>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ak-text-secondary">{t('marketplace.matches.topFactors')}</p>
                  <ul className="mt-1 flex flex-wrap gap-2 text-xs text-ak-text-primary">
                    {item.explanation.top_factors.map((factor) => (
                      <li key={factor} className="rounded border border-ak-border px-2 py-1">
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ak-text-secondary">{t('marketplace.matches.missingSkills')}</p>
                  {item.explanation.missing_skills.length === 0 ? (
                    <p className="mt-1 text-xs text-ak-text-secondary">{t('marketplace.matches.noMissingSkills')}</p>
                  ) : (
                    <ul className="mt-1 flex flex-wrap gap-2 text-xs text-ak-text-primary">
                      {item.explanation.missing_skills.map((skill) => (
                        <li key={skill} className="rounded border border-ak-border px-2 py-1">
                          {skill}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <details className="mt-3 rounded border border-ak-border p-2">
                <summary className="cursor-pointer text-xs font-semibold text-ak-text-secondary">{t('marketplace.matches.viewJson')}</summary>
                <pre className="mt-2 overflow-auto rounded bg-ak-bg p-2 text-xs text-ak-text-primary">
                  {JSON.stringify(item.explanation, null, 2)}
                </pre>
              </details>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
