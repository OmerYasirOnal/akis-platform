import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuthAPI, type UserProfile } from '../../services/api/auth';

type Tab = 'profile' | 'github' | 'password';

interface GitHubIntegrationStatus {
  connected: boolean;
  username?: string;
  avatarUrl?: string;
}

async function fetchGitHubIntegrationStatus(): Promise<GitHubIntegrationStatus> {
  const res = await fetch('/api/integrations/github/status', { credentials: 'include' });
  if (!res.ok) return { connected: false };
  return res.json();
}

async function disconnectGitHub(): Promise<void> {
  const res = await fetch('/api/integrations/github', {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Bağlantı kesilemedi');
}

export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<Tab>(
    tabParam === 'github' || tabParam === 'password' ? tabParam : 'profile'
  );

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'profile' ? {} : { tab });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-display text-ak-text-primary">Ayarlar</h1>
        <p className="mt-1 text-body text-ak-text-secondary">Hesabınızı ve entegrasyonlarınızı yönetin.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl border border-ak-border bg-ak-surface p-1">
        {([
          { key: 'profile' as Tab, label: 'Profil' },
          { key: 'github' as Tab, label: 'GitHub' },
          { key: 'password' as Tab, label: 'Şifre' },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleTabChange(key)}
            className={`flex-1 rounded-lg px-4 py-2 text-caption font-medium transition-all duration-150 ${
              activeTab === key
                ? 'bg-ak-surface-2 text-ak-text-primary shadow-sm'
                : 'text-ak-text-tertiary hover:text-ak-text-secondary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && <ProfileSection />}
      {activeTab === 'github' && <GitHubSection />}
      {activeTab === 'password' && <PasswordSection />}
    </div>
  );
}

/* ── Profile Section ── */
function ProfileSection() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    AuthAPI.getProfile()
      .then((p) => {
        setProfile(p);
        setName(p.name);
        setEmail(p.email);
      })
      .catch(() => setMessage({ type: 'error', text: 'Profil yüklenemedi' }))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await AuthAPI.updateProfile({ name, email });
      setMessage({ type: 'success', text: 'Profil güncellendi' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Güncelleme başarısız' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingCard />;

  return (
    <div className="rounded-xl border border-ak-border bg-ak-surface p-6">
      <h2 className="text-body font-semibold text-ak-text-primary mb-4">Profil Bilgileri</h2>
      <form onSubmit={handleSave} className="space-y-4">
        <Field label="Ad" value={name} onChange={setName} />
        <Field label="E-posta" value={email} onChange={setEmail} type="email" />

        {profile && (
          <div className="flex flex-wrap items-center gap-4 text-caption text-ak-text-tertiary pt-2">
            <span>Rol: {profile.role}</span>
            <span className="h-3 w-px bg-ak-border" />
            <span>Katılım: {new Date(profile.createdAt).toLocaleDateString('tr-TR')}</span>
            {profile.emailVerified && (
              <>
                <span className="h-3 w-px bg-ak-border" />
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  E-posta doğrulandı
                </span>
              </>
            )}
          </div>
        )}

        {message && <StatusMessage type={message.type} text={message.text} />}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-ak-primary px-5 py-2 text-caption font-semibold text-[#0a1215] transition-all hover:shadow-ak-glow-sm disabled:opacity-50"
          >
            {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ── GitHub Section — OAuth-based ── */
function GitHubSection() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<GitHubIntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const s = await fetchGitHubIntegrationStatus();
      setStatus(s);
    } catch {
      setStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Handle OAuth callback query params
  useEffect(() => {
    const githubResult = searchParams.get('github');
    if (githubResult === 'connected') {
      setMessage({ type: 'success', text: 'GitHub başarıyla bağlandı!' });
      fetchStatus();
    } else if (githubResult === 'error') {
      const reason = searchParams.get('reason') || 'bilinmeyen';
      setMessage({ type: 'error', text: `GitHub bağlantısı başarısız: ${reason}` });
    }
  }, [searchParams, fetchStatus]);

  const handleConnect = () => {
    window.location.href = '/api/integrations/github/oauth/start';
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    setMessage(null);
    try {
      await disconnectGitHub();
      setStatus({ connected: false });
      setMessage({ type: 'success', text: 'GitHub bağlantısı kesildi' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Bağlantı kesilemedi' });
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) return <LoadingCard />;

  return (
    <div className="rounded-xl border border-ak-border bg-ak-surface p-6">
      <h2 className="text-body font-semibold text-ak-text-primary mb-1">GitHub Entegrasyonu</h2>
      <p className="text-caption text-ak-text-tertiary mb-5">
        Proto ajanının kod göndermesi ve Trace ajanının depoları okuması için GitHub hesabınızı bağlayın.
      </p>

      {status?.connected ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            {status.avatarUrl && (
              <img src={status.avatarUrl} alt="" className="h-10 w-10 rounded-full" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-body font-medium text-ak-text-primary truncate">{status.username}</p>
              <p className="text-caption text-emerald-400 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                GitHub OAuth ile bağlı
              </p>
            </div>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="shrink-0 rounded-lg border border-red-500/30 px-4 py-2 text-caption font-medium text-red-400 transition-all hover:bg-red-500/10 disabled:opacity-50"
            >
              {disconnecting ? 'Kesiliyor...' : 'Bağlantıyı Kes'}
            </button>
          </div>
          {message && <StatusMessage type={message.type} text={message.text} />}
        </div>
      ) : (
        <div className="space-y-4">
          <button
            onClick={handleConnect}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-ak-border bg-ak-bg px-5 py-3 text-body font-medium text-ak-text-primary transition-all duration-150 hover:bg-black/[0.03] hover:border-ak-text-tertiary"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            GitHub ile Bağlan
          </button>
          <p className="text-micro text-ak-text-tertiary text-center">
            Kod göndermek ve okumak için <code className="text-ak-text-secondary">repo</code> erişim izni verir.
          </p>
          {message && <StatusMessage type={message.type} text={message.text} />}
        </div>
      )}
    </div>
  );
}

/* ── Password Section ── */
function PasswordSection() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    setSaving(true);
    setMessage(null);
    try {
      await AuthAPI.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setMessage({ type: 'success', text: 'Şifre güncellendi' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Güncelleme başarısız' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-ak-border bg-ak-surface p-6">
      <h2 className="text-body font-semibold text-ak-text-primary mb-4">Şifre Değiştir</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Mevcut Şifre" value={currentPassword} onChange={setCurrentPassword} type="password" />
        <Field label="Yeni Şifre" value={newPassword} onChange={setNewPassword} type="password" placeholder="En az 8 karakter" />
        {message && <StatusMessage type={message.type} text={message.text} />}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving || !currentPassword || !newPassword}
            className="rounded-lg bg-ak-primary px-5 py-2 text-caption font-semibold text-[#0a1215] transition-all hover:shadow-ak-glow-sm disabled:opacity-50"
          >
            {saving ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ── Shared UI components ── */

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-caption font-medium text-ak-text-secondary">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-ak-border bg-ak-bg px-4 py-2.5 text-body text-ak-text-primary placeholder-ak-text-tertiary transition-all duration-150 focus:border-ak-primary focus:outline-none focus:ring-2 focus:ring-ak-primary/20"
      />
    </div>
  );
}

function StatusMessage({ type, text }: { type: 'success' | 'error'; text: string }) {
  const colors = type === 'success'
    ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
    : 'border-red-500/20 bg-red-500/5 text-red-400';
  return <div className={`rounded-xl border px-4 py-3 text-caption ${colors}`}>{text}</div>;
}

function LoadingCard() {
  return (
    <div className="flex items-center justify-center rounded-xl border border-ak-border bg-ak-surface p-12">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-ak-primary border-t-transparent" />
    </div>
  );
}
