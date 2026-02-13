import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n/useI18n';
import { ragApi, type RAGQueryResponse, type RAGSearchResponse, type RAGWebSearchResponse, type RAGLearnResponse, type RAGStatus, type RAGStats } from '../../services/api/rag';

type RAGTab = 'ask' | 'search' | 'webSearch' | 'learn';

const SparkleIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
  </svg>
);

const SearchIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

const GlobeIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
  </svg>
);

const BookIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
  </svg>
);

const LoadingSpinner = () => (
  <div className="h-5 w-5 animate-spin rounded-full border-2 border-ak-primary border-t-transparent" />
);

function StatusBadge({ status }: { status: RAGStatus | null }) {
  if (!status) return null;

  const isHealthy = status.configured && status.healthy;
  return (
    <div className="flex items-center gap-2">
      <div className={`h-2 w-2 rounded-full ${isHealthy ? 'bg-emerald-400' : 'bg-red-400'}`} />
      <span className="text-xs text-ak-text-secondary">
        {isHealthy ? `Piri v${status.version}` : status.error || 'Offline'}
        {status.rag_ready && status.rag_status && ` • ${status.rag_status}`}
      </span>
    </div>
  );
}

function SourcesList({ sources }: { sources: Array<{ content: string; source: string; score: number }> }) {
  const { t } = useI18n();
  if (!sources.length) return null;

  return (
    <div className="mt-4 space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-ak-text-secondary">{t('rag.sources')}</h4>
      {sources.map((src, i) => (
        <div key={i} className="rounded-lg border border-ak-border bg-ak-bg p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-medium text-ak-primary">{src.source}</span>
            <span className="text-[10px] text-ak-text-secondary">
              {t('rag.score')}: {(src.score * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-xs text-ak-text-secondary line-clamp-3">{src.content}</p>
        </div>
      ))}
    </div>
  );
}

function AskTab() {
  const { t } = useI18n();
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RAGQueryResponse | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await ragApi.query({ question });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('rag.error.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t('rag.ask.placeholder')}
          className="flex-1 rounded-lg border border-ak-border bg-ak-bg px-4 py-2.5 text-sm text-ak-text-primary placeholder:text-ak-text-secondary/50 focus:border-ak-primary focus:outline-none focus:ring-1 focus:ring-ak-primary/30"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="flex items-center gap-2 rounded-lg bg-ak-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-ak-primary/90 disabled:opacity-50"
        >
          {loading ? <LoadingSpinner /> : <SparkleIcon />}
          {t('rag.ask.button')}
        </button>
      </form>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {result ? (
        <div className="rounded-xl border border-ak-border bg-ak-surface p-5">
          <div className="mb-3 text-xs text-ak-text-secondary">
            {result.model} • {result.backend}
          </div>
          <div className="prose prose-sm prose-invert max-w-none text-ak-text-primary whitespace-pre-wrap">
            {result.answer}
          </div>
          <SourcesList sources={result.sources} />
        </div>
      ) : (
        !loading && !error && (
          <div className="rounded-xl border border-ak-border/50 bg-ak-surface/50 px-6 py-12 text-center">
            <SparkleIcon />
            <p className="mt-2 text-sm text-ak-text-secondary">{t('rag.ask.empty')}</p>
          </div>
        )
      )}
    </div>
  );
}

function SearchTab() {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RAGSearchResponse | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await ragApi.search({ query });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('rag.error.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('rag.search.placeholder')}
          className="flex-1 rounded-lg border border-ak-border bg-ak-bg px-4 py-2.5 text-sm text-ak-text-primary placeholder:text-ak-text-secondary/50 focus:border-ak-primary focus:outline-none focus:ring-1 focus:ring-ak-primary/30"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="flex items-center gap-2 rounded-lg bg-ak-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-ak-primary/90 disabled:opacity-50"
        >
          {loading ? <LoadingSpinner /> : <SearchIcon />}
          {t('rag.search.button')}
        </button>
      </form>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {result ? (
        <div className="space-y-2">
          {result.results.map((item, i) => (
            <div key={i} className="rounded-xl border border-ak-border bg-ak-surface p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-ak-primary">{item.source}</span>
                <span className="rounded-full bg-ak-primary/10 px-2 py-0.5 text-[10px] font-medium text-ak-primary">
                  {(item.score * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-sm text-ak-text-primary">{item.content}</p>
            </div>
          ))}
          {result.results.length === 0 && (
            <p className="py-8 text-center text-sm text-ak-text-secondary">No results found</p>
          )}
        </div>
      ) : (
        !loading && !error && (
          <div className="rounded-xl border border-ak-border/50 bg-ak-surface/50 px-6 py-12 text-center">
            <SearchIcon />
            <p className="mt-2 text-sm text-ak-text-secondary">{t('rag.search.empty')}</p>
          </div>
        )
      )}
    </div>
  );
}

function WebSearchTab() {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [autoLearn, setAutoLearn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RAGWebSearchResponse | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await ragApi.webSearch({ query, auto_learn: autoLearn });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('rag.error.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('rag.webSearch.placeholder')}
            className="flex-1 rounded-lg border border-ak-border bg-ak-bg px-4 py-2.5 text-sm text-ak-text-primary placeholder:text-ak-text-secondary/50 focus:border-ak-primary focus:outline-none focus:ring-1 focus:ring-ak-primary/30"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="flex items-center gap-2 rounded-lg bg-ak-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-ak-primary/90 disabled:opacity-50"
          >
            {loading ? <LoadingSpinner /> : <GlobeIcon />}
            {t('rag.webSearch.button')}
          </button>
        </div>
        <label className="flex items-center gap-2 text-sm text-ak-text-secondary">
          <input
            type="checkbox"
            checked={autoLearn}
            onChange={(e) => setAutoLearn(e.target.checked)}
            className="h-4 w-4 rounded border-ak-border bg-ak-bg text-ak-primary focus:ring-ak-primary/30"
          />
          {t('rag.webSearch.autoLearn')}
        </label>
      </form>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {result ? (
        <div className="space-y-4">
          {result.answer && (
            <div className="rounded-xl border border-ak-border bg-ak-surface p-5">
              <div className="prose prose-sm prose-invert max-w-none text-ak-text-primary whitespace-pre-wrap">
                {result.answer}
              </div>
              {result.learned && (
                <p className="mt-3 text-xs text-emerald-400">
                  +{result.chunks_added} chunks learned ({result.total_chunks} total)
                </p>
              )}
              <SourcesList sources={result.sources} />
            </div>
          )}

          {result.web_results.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-ak-text-secondary">Web Results</h4>
              {result.web_results.map((wr, i) => (
                <a
                  key={i}
                  href={wr.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg border border-ak-border bg-ak-surface p-3 transition-colors hover:border-ak-primary/30"
                >
                  <p className="text-sm font-medium text-ak-primary">{wr.title}</p>
                  <p className="mt-1 text-xs text-ak-text-secondary line-clamp-2">{wr.snippet}</p>
                  <p className="mt-1 text-[10px] text-ak-text-secondary/50">{wr.url}</p>
                </a>
              ))}
            </div>
          )}
        </div>
      ) : (
        !loading && !error && (
          <div className="rounded-xl border border-ak-border/50 bg-ak-surface/50 px-6 py-12 text-center">
            <GlobeIcon />
            <p className="mt-2 text-sm text-ak-text-secondary">{t('rag.webSearch.empty')}</p>
          </div>
        )
      )}
    </div>
  );
}

function LearnTab() {
  const { t } = useI18n();
  const [text, setText] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RAGLearnResponse | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || loading) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await ragApi.learn({ text, source_name: sourceName || undefined });
      setResult(res);
      setText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('rag.error.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('rag.learn.placeholder')}
          rows={8}
          className="w-full rounded-lg border border-ak-border bg-ak-bg px-4 py-3 text-sm text-ak-text-primary placeholder:text-ak-text-secondary/50 focus:border-ak-primary focus:outline-none focus:ring-1 focus:ring-ak-primary/30 resize-none"
        />
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-ak-text-secondary">
              {t('rag.learn.sourceName')}
            </label>
            <input
              type="text"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              placeholder={t('rag.learn.sourceNamePlaceholder')}
              className="w-full rounded-lg border border-ak-border bg-ak-bg px-3 py-2 text-sm text-ak-text-primary placeholder:text-ak-text-secondary/50 focus:border-ak-primary focus:outline-none focus:ring-1 focus:ring-ak-primary/30"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="flex items-center gap-2 rounded-lg bg-ak-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-ak-primary/90 disabled:opacity-50"
          >
            {loading ? <LoadingSpinner /> : <BookIcon />}
            {t('rag.learn.button')}
          </button>
        </div>
      </form>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {result && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-sm font-medium text-emerald-400">{result.message}</p>
          <div className="mt-2 flex gap-4 text-xs text-ak-text-secondary">
            <span>+{result.chunks_added} chunks</span>
            <span>{result.total_chunks} total</span>
            <span>{result.char_count} chars</span>
            <span>{result.source}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function StatsPanel({ stats }: { stats: RAGStats | null }) {
  const { t } = useI18n();
  if (!stats) return null;

  return (
    <div className="rounded-xl border border-ak-border bg-ak-surface p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ak-text-secondary">
        {t('rag.stats.title')}
      </h3>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-lg font-bold text-ak-text-primary">{stats.total_chunks ?? '—'}</p>
          <p className="text-[10px] text-ak-text-secondary">{t('rag.stats.totalChunks')}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-ak-text-primary truncate">{stats.model ?? '—'}</p>
          <p className="text-[10px] text-ak-text-secondary">{t('rag.stats.model')}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-ak-text-primary truncate">{stats.backend ?? '—'}</p>
          <p className="text-[10px] text-ak-text-secondary">{t('rag.stats.backend')}</p>
        </div>
      </div>
    </div>
  );
}

function QuickActionsPanel() {
  const navigate = useNavigate();

  const actions = [
    {
      label: 'Open Scribe with Context',
      description: 'Use knowledge base context while generating docs',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
      path: '/agents/scribe',
    },
    {
      label: 'Open Trace with Context',
      description: 'Generate tests informed by knowledge base',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
        </svg>
      ),
      path: '/agents/trace',
    },
    {
      label: 'Open Proto with Context',
      description: 'Scaffold MVPs using knowledge base insights',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      ),
      path: '/agents/proto',
    },
  ];

  return (
    <div className="rounded-xl border border-ak-border bg-ak-surface p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ak-text-secondary">
        Quick Actions
      </h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {actions.map((action) => (
          <button
            key={action.path}
            onClick={() => navigate(action.path)}
            className="flex items-start gap-3 rounded-lg border border-ak-border/50 bg-ak-bg p-3 text-left transition-colors hover:border-ak-primary/30 hover:bg-ak-primary/5"
          >
            <span className="flex-shrink-0 text-ak-primary">{action.icon}</span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-ak-text-primary">{action.label}</p>
              <p className="text-[10px] text-ak-text-secondary">{action.description}</p>
            </div>
          </button>
        ))}
      </div>
      <p className="mt-3 text-[10px] text-ak-text-secondary/60">
        Open the Piri Context sidebar on any agent page to query your knowledge base while configuring jobs.
      </p>
    </div>
  );
}

function AgentIntegrationInfo() {
  return (
    <div className="rounded-xl border border-ak-border bg-ak-surface p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ak-text-secondary">
        Agent Integration
      </h3>
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-lg border border-ak-border/50 bg-ak-bg p-3">
          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-emerald-400" />
          <div>
            <p className="text-sm font-medium text-ak-text-primary">Context Sidebar Active</p>
            <p className="text-[10px] text-ak-text-secondary">
              All agent consoles (Scribe, Trace, Proto) have a Piri Context sidebar.
              Ask questions or search your knowledge base to inject context into agent runs.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-ak-border/50 bg-ak-bg p-3">
          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-emerald-400" />
          <div>
            <p className="text-sm font-medium text-ak-text-primary">Automatic RAG Injection</p>
            <p className="text-[10px] text-ak-text-secondary">
              When you select Piri context entries in the sidebar, they are automatically included 
              in the agent's execution context via the Context Assembly Service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardRAGPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<RAGTab>('ask');
  const [status, setStatus] = useState<RAGStatus | null>(null);
  const [stats, setStats] = useState<RAGStats | null>(null);

  const tabs: { id: RAGTab; label: string; icon: React.ReactNode }[] = [
    { id: 'ask', label: t('rag.tabs.ask'), icon: <SparkleIcon /> },
    { id: 'search', label: t('rag.tabs.search'), icon: <SearchIcon /> },
    { id: 'webSearch', label: t('rag.tabs.webSearch'), icon: <GlobeIcon /> },
    { id: 'learn', label: t('rag.tabs.learn'), icon: <BookIcon /> },
  ];

  const fetchStatus = useCallback(async () => {
    try {
      const s = await ragApi.getStatus();
      setStatus(s);
    } catch {
      setStatus({ configured: false, healthy: false });
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const s = await ragApi.getStats();
      setStats(s);
    } catch {
      /* stats are optional */
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchStats();
  }, [fetchStatus, fetchStats]);

  const notConfigured = status && !status.configured;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-ak-text-primary">{t('rag.title')}</h1>
          <p className="mt-1 text-sm text-ak-text-secondary">{t('rag.subtitle')}</p>
        </div>
        <StatusBadge status={status} />
      </div>

      {notConfigured ? (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-6 py-8 text-center">
          <p className="text-sm text-amber-400">{t('rag.error.notConfigured')}</p>
        </div>
      ) : (
        <>
          {/* Stats + Quick Actions */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <StatsPanel stats={stats} />
            <QuickActionsPanel />
          </div>

          {/* Agent Integration Info */}
          <AgentIntegrationInfo />

          {/* Tabs */}
          <div className="flex gap-1 rounded-lg bg-ak-surface p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-ak-primary/10 text-ak-primary'
                    : 'text-ak-text-secondary hover:text-ak-text-primary'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div>
            {activeTab === 'ask' && <AskTab />}
            {activeTab === 'search' && <SearchTab />}
            {activeTab === 'webSearch' && <WebSearchTab />}
            {activeTab === 'learn' && <LearnTab />}
          </div>
        </>
      )}
    </div>
  );
}

export default DashboardRAGPage;
