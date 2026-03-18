import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { workflowsApi } from '../../services/api/workflows';
import { githubApi, type GitHubRepo } from '../../services/api/github';
import { TR } from '../../constants/tr';

const PIPELINE_STEPS = [
  { label: 'Scribe', color: 'bg-ak-scribe', textColor: 'text-ak-scribe', desc: 'Fikir → Spec' },
  { label: 'Sen', color: 'bg-ak-primary', textColor: 'text-ak-primary', desc: 'İnceleme' },
  { label: 'Proto', color: 'bg-ak-proto', textColor: 'text-ak-proto', desc: 'Spec → Kod' },
  { label: 'Trace', color: 'bg-ak-trace', textColor: 'text-ak-trace', desc: 'Kod → Test' },
];

const MODEL_OPTIONS = [
  { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', desc: 'Dengeli \u2014 hız ve kalite', badge: 'Önerilir' },
  { value: 'claude-haiku-4-5', label: 'Claude Haiku 4.5', desc: 'Hızlı \u2014 düşük maliyet', badge: 'Hızlı' },
] as const;

type RepoMode = 'select' | 'manual' | 'create';

export default function NewWorkflowPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = (location.state as { prefillIdea?: string } | null);
  const [idea, setIdea] = useState(prefill?.prefillIdea || '');
  const [targetRepo, setTargetRepo] = useState('');
  const [model, setModel] = useState<string>('claude-sonnet-4-6');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // GitHub repos
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [repoMode, setRepoMode] = useState<RepoMode>('select');

  // Create new repo
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoPrivate, setNewRepoPrivate] = useState(true);
  const [creatingRepo, setCreatingRepo] = useState(false);

  useEffect(() => {
    githubApi
      .listRepos()
      .then((data) => {
        setRepos(data.repos || []);
        if (data.repos?.length > 0) {
          setTargetRepo(data.repos[0].fullName);
        } else {
          setRepoMode('manual');
        }
      })
      .catch(() => {
        setRepoMode('manual');
      })
      .finally(() => setLoadingRepos(false));
  }, []);

  const handleCreateRepo = async () => {
    if (!newRepoName.trim()) return;
    setCreatingRepo(true);
    setError(null);
    try {
      const result = await githubApi.createRepo(newRepoName.trim(), newRepoPrivate);
      setTargetRepo(result.fullName);
      setRepos((prev) => [
        { name: result.name, fullName: result.fullName, private: newRepoPrivate, url: result.url, updatedAt: new Date().toISOString() },
        ...prev,
      ]);
      setRepoMode('select');
      setNewRepoName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Depo oluşturulamadı');
    } finally {
      setCreatingRepo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const workflow = await workflowsApi.create({ idea: idea.trim(), targetRepo: targetRepo.trim() || undefined, model });
      navigate(`/dashboard/workflows/${workflow.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İş akışı başlatılamadı');
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/dashboard/workflows')}
          className="mb-3 flex items-center gap-1 text-caption text-ak-text-secondary transition-colors hover:text-ak-text-primary"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Geri
        </button>
        <h1 className="text-display text-ak-text-primary">{TR.newWorkflowTitle}</h1>
        <p className="mt-1 text-body text-ak-text-secondary">{TR.newWorkflowDesc}</p>
      </div>

      {/* Pipeline steps */}
      <div className="flex items-center justify-center gap-1 rounded-xl border border-ak-border bg-ak-surface py-4 px-6">
        {PIPELINE_STEPS.map((step, i) => (
          <div key={step.label} className="flex items-center gap-1">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`h-3 w-3 rounded-full ${step.color} shadow-[0_0_8px_rgba(255,255,255,0.1)]`} />
              <div className="text-center">
                <p className={`text-caption font-semibold ${step.textColor}`}>{step.label}</p>
                <p className="text-micro text-ak-text-tertiary">{step.desc}</p>
              </div>
            </div>
            {i < PIPELINE_STEPS.length - 1 && (
              <div className="mx-3 mb-8 h-px w-8 bg-ak-border" />
            )}
          </div>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="idea" className="mb-1.5 block text-caption font-medium text-ak-text-secondary">
            {TR.yourIdea}
          </label>
          <textarea
            id="idea"
            rows={6}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder={TR.ideaPlaceholder}
            className="w-full rounded-xl border border-ak-border bg-ak-bg px-4 py-3 text-body text-ak-text-primary placeholder-ak-text-tertiary transition-all duration-150 focus:border-ak-primary focus:outline-none focus:ring-2 focus:ring-ak-primary/20"
          />
        </div>

        {/* Model selector */}
        <div>
          <label className="mb-1.5 block text-caption font-medium text-ak-text-secondary">
            {TR.model}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {MODEL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setModel(opt.value)}
                className={`group relative flex flex-col items-start rounded-xl border p-3 text-left transition-all duration-150 ${
                  model === opt.value
                    ? 'border-ak-primary bg-ak-primary/5 ring-1 ring-ak-primary/30'
                    : 'border-ak-border bg-ak-bg hover:border-ak-border-strong hover:bg-black/[0.02]'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-caption font-semibold text-ak-text-primary">{opt.label}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                    model === opt.value
                      ? 'bg-ak-primary/20 text-ak-primary'
                      : 'bg-ak-surface-2 text-ak-text-tertiary'
                  }`}>
                    {opt.badge}
                  </span>
                </div>
                <span className="mt-0.5 text-micro text-ak-text-tertiary">{opt.desc}</span>
                {model === opt.value && (
                  <div className="absolute -right-px -top-px flex h-4 w-4 items-center justify-center rounded-bl-lg rounded-tr-xl bg-ak-primary">
                    <svg className="h-2.5 w-2.5 text-[#0a1215]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="repo" className="text-caption font-medium text-ak-text-secondary">
              {TR.targetRepo}
            </label>
            {repos.length > 0 && (
              <div className="flex gap-2">
                {(['select', 'create', 'manual'] as RepoMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setRepoMode(mode)}
                    className={`text-micro transition-colors ${
                      repoMode === mode ? 'text-ak-primary font-medium' : 'text-ak-text-tertiary hover:text-ak-text-secondary'
                    }`}
                  >
                    {mode === 'select' ? 'Depolarım' : mode === 'create' ? 'Yeni depo' : 'Manuel'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {loadingRepos ? (
            <div className="flex h-10 items-center rounded-xl border border-ak-border bg-ak-bg px-4">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-ak-primary border-t-transparent" />
              <span className="ml-2 text-caption text-ak-text-tertiary">Depolar yükleniyor...</span>
            </div>
          ) : repoMode === 'create' ? (
            <div className="space-y-3 rounded-xl border border-ak-border bg-ak-bg p-4">
              <div>
                <label htmlFor="new-repo-name" className="mb-1 block text-micro font-medium text-ak-text-secondary">
                  {TR.repoName}
                </label>
                <input
                  id="new-repo-name"
                  type="text"
                  value={newRepoName}
                  onChange={(e) => setNewRepoName(e.target.value)}
                  placeholder="my-new-project"
                  className="w-full rounded-lg border border-ak-border bg-ak-surface px-3 py-2 font-mono text-body text-ak-text-primary placeholder-ak-text-tertiary transition-all duration-150 focus:border-ak-primary focus:outline-none focus:ring-2 focus:ring-ak-primary/20"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-caption text-ak-text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newRepoPrivate}
                    onChange={(e) => setNewRepoPrivate(e.target.checked)}
                    className="h-4 w-4 rounded border-ak-border bg-ak-surface accent-ak-primary"
                  />
                  {TR.private} depo
                </label>
                <button
                  type="button"
                  onClick={handleCreateRepo}
                  disabled={creatingRepo || !newRepoName.trim()}
                  className="rounded-lg bg-ak-primary px-4 py-1.5 text-caption font-semibold text-[#0a1215] transition-all hover:shadow-ak-glow-sm disabled:opacity-50"
                >
                  {creatingRepo ? 'Oluşturuluyor...' : 'Oluştur'}
                </button>
              </div>
            </div>
          ) : repoMode === 'manual' || repos.length === 0 ? (
            <input
              id="repo"
              type="text"
              value={targetRepo}
              onChange={(e) => setTargetRepo(e.target.value)}
              placeholder="owner/repo-name"
              className="w-full rounded-xl border border-ak-border bg-ak-bg px-4 py-2.5 font-mono text-body text-ak-text-primary placeholder-ak-text-tertiary transition-all duration-150 focus:border-ak-primary focus:outline-none focus:ring-2 focus:ring-ak-primary/20"
            />
          ) : (
            <select
              id="repo"
              value={targetRepo}
              onChange={(e) => setTargetRepo(e.target.value)}
              className="w-full rounded-xl border border-ak-border bg-ak-bg px-4 py-2.5 font-mono text-body text-ak-text-primary transition-all duration-150 focus:border-ak-primary focus:outline-none focus:ring-2 focus:ring-ak-primary/20"
            >
              {repos.map((r) => (
                <option key={r.fullName} value={r.fullName}>
                  {r.fullName} {r.private ? `(${TR.private.toLowerCase()})` : ''}
                </option>
              ))}
            </select>
          )}
          {repos.length === 0 && !loadingRepos && repoMode !== 'create' && (
            <p className="mt-1.5 text-micro text-ak-text-tertiary">
              Depolarınızdan seçim yapabilmek için{' '}
              <button type="button" onClick={() => navigate('/dashboard/settings?tab=github')} className="text-ak-primary hover:underline">
                Ayarlar
              </button>
              {' '}sayfasından GitHub bağlantınızı yapın.
            </p>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-body text-red-400">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard/workflows')}
            className="rounded-lg border border-ak-border px-5 py-2.5 text-body font-medium text-ak-text-secondary transition-all duration-150 hover:bg-ak-hover hover:text-ak-text-primary"
          >
            {TR.cancel}
          </button>
          <button
            type="submit"
            disabled={submitting || !idea.trim()}
            className="rounded-lg bg-ak-primary px-5 py-2.5 text-body font-semibold text-[#0a1215] shadow-ak-glow-sm transition-all duration-150 hover:shadow-ak-glow hover:-translate-y-px disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0"
          >
            {submitting ? 'Başlatılıyor...' : TR.startWorkflow}
          </button>
        </div>
      </form>
    </div>
  );
}
