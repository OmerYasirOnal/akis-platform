import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { useAuth } from '../../contexts/AuthContext';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Tab = 'ai-keys' | 'pipeline-stats';

type Provider = 'anthropic' | 'openai' | 'openrouter';

interface ProviderStatus {
  configured: boolean;
  last4: string | null;
  updatedAt: string | null;
}

interface MultiProviderStatus {
  activeProvider: Provider | null;
  providers: Record<Provider, ProviderStatus>;
}

interface PipelineStatsData {
  totalPipelines: number;
  successRate: number;
  avgDurations: {
    scribeMs: number | null;
    protoMs: number | null;
    traceMs: number | null;
    totalMs: number | null;
  };
  recentPipelines: Array<{
    id: string;
    title: string | null;
    stage: string;
    createdAt: string;
    durationMs: number | null;
  }>;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PROVIDERS: { key: Provider; label: string; description: string; placeholder: string }[] = [
  { key: 'anthropic', label: 'Anthropic (Claude)', description: 'claude-sonnet-4-6', placeholder: 'sk-ant-...' },
  { key: 'openai', label: 'OpenAI', description: 'gpt-4o', placeholder: 'sk-...' },
  { key: 'openrouter', label: 'OpenRouter', description: 'Birden fazla model', placeholder: 'sk-or-...' },
];

const STAGE_LABELS: Record<string, { text: string; color: string }> = {
  scribe_clarifying: { text: 'Scribe: Soru', color: 'text-blue-400 bg-blue-400/10' },
  scribe_generating: { text: 'Scribe: Üretim', color: 'text-blue-400 bg-blue-400/10' },
  awaiting_approval: { text: 'Onay Bekliyor', color: 'text-yellow-400 bg-yellow-400/10' },
  proto_building: { text: 'Proto: İnşa', color: 'text-purple-400 bg-purple-400/10' },
  trace_testing: { text: 'Trace: Test', color: 'text-cyan-400 bg-cyan-400/10' },
  ci_running: { text: 'CI Çalışıyor', color: 'text-orange-400 bg-orange-400/10' },
  completed: { text: 'Tamamlandı', color: 'text-emerald-400 bg-emerald-400/10' },
  completed_partial: { text: 'Kısmi Tamamlandı', color: 'text-emerald-300 bg-emerald-300/10' },
  failed: { text: 'Başarısız', color: 'text-red-400 bg-red-400/10' },
  cancelled: { text: 'İptal', color: 'text-gray-400 bg-gray-400/10' },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDuration(ms: number | null): string {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms}ms`;
  const totalSec = Math.round(ms / 1000);
  if (totalSec < 60) return `${totalSec}sn`;
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return sec > 0 ? `${min}dk ${sec}sn` : `${min}dk`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function SettingsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') === 'pipeline-stats' ? 'pipeline-stats' : 'ai-keys') as Tab;

  const setTab = (tab: Tab) => setSearchParams(tab === 'ai-keys' ? {} : { tab });

  return (
    <div className="flex min-h-screen flex-col bg-ak-bg">
      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <h1 className="mb-1 text-lg font-semibold text-ak-text-primary">Ayarlar</h1>
        <p className="mb-5 text-xs text-ak-text-tertiary">AI sağlayıcı, hesap ve pipeline ayarları.</p>

        {/* Tab bar */}
        <div className="mb-6 flex gap-1 rounded-lg border border-ak-border bg-ak-surface p-1">
          <TabButton active={activeTab === 'ai-keys'} onClick={() => setTab('ai-keys')}>
            AI Sağlayıcılar
          </TabButton>
          <TabButton active={activeTab === 'pipeline-stats'} onClick={() => setTab('pipeline-stats')}>
            Pipeline İstatistikleri
          </TabButton>
        </div>

        {activeTab === 'ai-keys' ? <AIKeysTab user={user} /> : <PipelineStatsTab />}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'bg-ak-surface-2 text-ak-text-primary shadow-sm'
          : 'text-ak-text-tertiary hover:text-ak-text-secondary',
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  AI Keys Tab (mevcut içerik)                                        */
/* ------------------------------------------------------------------ */

function AIKeysTab({ user }: { user: ReturnType<typeof useAuth>['user'] }) {
  const [status, setStatus] = useState<MultiProviderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/ai-keys/status', { credentials: 'include' });
      if (res.ok) setStatus(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const handleSave = async (provider: Provider) => {
    if (!apiKeyInput.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/settings/ai-keys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ provider, apiKey: apiKeyInput.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Key kaydedilemedi');
      }
      setEditingProvider(null);
      setApiKeyInput('');
      await fetchStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata oluştu');
    } finally { setSaving(false); }
  };

  const handleDelete = async (provider: Provider) => {
    try {
      await fetch('/api/settings/ai-keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ provider }),
      });
      await fetchStatus();
    } catch { /* ignore */ }
  };

  const handleSetActive = async (provider: Provider) => {
    try {
      await fetch('/api/settings/ai-provider/active', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ provider }),
      });
      await fetchStatus();
    } catch { /* ignore */ }
  };

  return (
    <>
      <h2 className="mb-3 text-sm font-semibold text-ak-text-primary">AI Sağlayıcılar</h2>
      <div className="space-y-3 mb-8">
        {loading ? (
          <div className="rounded-xl border border-ak-border bg-ak-surface p-4 text-xs text-ak-text-tertiary">Yükleniyor...</div>
        ) : (
          PROVIDERS.map((p) => {
            const ps = status?.providers[p.key];
            const isActive = status?.activeProvider === p.key;
            const isEditing = editingProvider === p.key;

            return (
              <div key={p.key} className="rounded-xl border border-ak-border bg-ak-surface p-4">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-ak-text-primary">{p.label}</h3>
                      {isActive && (
                        <span className="rounded-full bg-ak-primary/10 px-2 py-0.5 text-[10px] font-medium text-ak-primary">
                          Varsayılan
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ak-text-tertiary">
                      {ps?.configured
                        ? `API Key: ••••${ps.last4}`
                        : 'Henüz eklenmedi'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {ps?.configured && !isActive && (
                      <button
                        onClick={() => handleSetActive(p.key)}
                        className="rounded-lg border border-ak-border px-2.5 py-1 text-[11px] font-medium text-ak-text-secondary hover:text-ak-primary transition-colors"
                      >
                        Varsayılan Yap
                      </button>
                    )}
                    {ps?.configured && (
                      <button
                        onClick={() => handleDelete(p.key)}
                        className="rounded-lg border border-ak-border px-2.5 py-1 text-[11px] font-medium text-red-400 hover:bg-red-400/10 transition-colors"
                      >
                        Sil
                      </button>
                    )}
                    {!isEditing && (
                      <button
                        onClick={() => { setEditingProvider(p.key); setApiKeyInput(''); setError(null); }}
                        className="rounded-lg bg-ak-primary/10 px-2.5 py-1 text-[11px] font-medium text-ak-primary hover:bg-ak-primary/20 transition-colors"
                      >
                        {ps?.configured ? 'Güncelle' : '+ Ekle'}
                      </button>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-3 space-y-2">
                    <input
                      type="password"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder={p.placeholder}
                      autoFocus
                      className={cn(
                        'w-full rounded-lg border border-ak-border bg-ak-surface-2 px-3 py-2 text-xs text-ak-text-primary font-mono',
                        'placeholder:text-ak-text-tertiary focus:border-ak-primary focus:outline-none focus:ring-1 focus:ring-ak-primary/30',
                      )}
                    />
                    {error && <p className="text-xs text-red-400">{error}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditingProvider(null); setApiKeyInput(''); setError(null); }}
                        className="rounded-lg border border-ak-border px-3 py-1.5 text-xs text-ak-text-secondary"
                      >
                        İptal
                      </button>
                      <button
                        onClick={() => handleSave(p.key)}
                        disabled={!apiKeyInput.trim() || saving}
                        className={cn(
                          'rounded-lg bg-ak-primary px-3 py-1.5 text-xs font-medium text-[color:var(--ak-on-primary)]',
                          (!apiKeyInput.trim() || saving) && 'opacity-50 cursor-not-allowed',
                        )}
                      >
                        {saving ? 'Kaydediliyor...' : 'Kaydet'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* User Info */}
      <h2 className="mb-3 text-sm font-semibold text-ak-text-primary">Hesap</h2>
      <div className="rounded-xl border border-ak-border bg-ak-surface p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ak-primary/20 text-sm font-semibold text-ak-primary">
            {user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="text-sm font-medium text-ak-text-primary">{user?.name ?? 'Kullanıcı'}</p>
            <p className="text-xs text-ak-text-tertiary">{user?.email ?? ''}</p>
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Pipeline Stats Tab                                                 */
/* ------------------------------------------------------------------ */

function PipelineStatsTab() {
  const [data, setData] = useState<PipelineStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/settings/pipeline-stats', { credentials: 'include' });
        if (!res.ok) throw new Error('İstatistikler yüklenemedi');
        setData(await res.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Hata oluştu');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="rounded-xl border border-ak-border bg-ak-surface p-6 text-xs text-ak-text-tertiary text-center">Yükleniyor...</div>;
  }

  if (error) {
    return <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-xs text-red-400">{error}</div>;
  }

  if (!data) return null;

  return (
    <>
      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <StatCard label="Toplam Pipeline" value={String(data.totalPipelines)} />
        <StatCard label="Başarı Oranı" value={`%${data.successRate}`} accent={data.successRate >= 70} />
        <StatCard label="Ort. Toplam Süre" value={formatDuration(data.avgDurations.totalMs)} />
        <div className="rounded-xl border border-ak-border bg-ak-surface p-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-ak-text-tertiary">Ort. Agent Süreleri</p>
          <div className="space-y-1.5">
            <AgentDuration label="Scribe" ms={data.avgDurations.scribeMs} />
            <AgentDuration label="Proto" ms={data.avgDurations.protoMs} />
            <AgentDuration label="Trace" ms={data.avgDurations.traceMs} />
          </div>
        </div>
      </div>

      {/* Recent pipelines */}
      <h2 className="mb-3 text-sm font-semibold text-ak-text-primary">Son Pipeline'lar</h2>
      {data.recentPipelines.length === 0 ? (
        <div className="rounded-xl border border-ak-border bg-ak-surface p-6 text-center text-xs text-ak-text-tertiary">
          Henüz pipeline çalıştırılmamış.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-ak-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-ak-border bg-ak-surface">
                <th className="px-4 py-2.5 text-left font-semibold text-ak-text-tertiary">Başlık</th>
                <th className="px-4 py-2.5 text-left font-semibold text-ak-text-tertiary">Durum</th>
                <th className="px-4 py-2.5 text-left font-semibold text-ak-text-tertiary">Tarih</th>
                <th className="px-4 py-2.5 text-right font-semibold text-ak-text-tertiary">Süre</th>
              </tr>
            </thead>
            <tbody>
              {data.recentPipelines.map((p) => {
                const stage = STAGE_LABELS[p.stage] ?? { text: p.stage, color: 'text-gray-400 bg-gray-400/10' };
                return (
                  <tr key={p.id} className="border-b border-ak-border/50 bg-ak-surface/50 last:border-b-0">
                    <td className="px-4 py-2.5 text-ak-text-primary font-medium truncate max-w-[200px]">
                      {p.title || <span className="text-ak-text-tertiary italic">İsimsiz</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn('inline-block rounded-full px-2 py-0.5 text-[10px] font-medium', stage.color)}>
                        {stage.text}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-ak-text-secondary">{formatDate(p.createdAt)}</td>
                    <td className="px-4 py-2.5 text-right text-ak-text-secondary font-mono">{formatDuration(p.durationMs)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Small sub-components                                               */
/* ------------------------------------------------------------------ */

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-ak-border bg-ak-surface p-4">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-ak-text-tertiary">{label}</p>
      <p className={cn('text-xl font-bold', accent ? 'text-ak-primary' : 'text-ak-text-primary')}>{value}</p>
    </div>
  );
}

function AgentDuration({ label, ms }: { label: string; ms: number | null }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-ak-text-secondary">{label}</span>
      <span className="text-[11px] font-mono text-ak-text-primary">{formatDuration(ms)}</span>
    </div>
  );
}
