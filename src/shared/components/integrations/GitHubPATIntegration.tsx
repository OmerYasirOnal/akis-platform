'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface AppInstallInfo {
  ok: boolean;
  configured: boolean;
  isInstalled?: boolean;
  installUrl?: string;
  app?: {
    id: string;
    slug: string | null;
    name: string;
  };
  requiredPermissions?: string[];
}

export function GitHubPATIntegration() {
  const { user, integrations, addIntegration, removeIntegration } = useAuth();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [appMode, setAppMode] = useState<'checking' | 'app' | 'oauth'>('checking');
  const [appInfo, setAppInfo] = useState<AppInstallInfo | null>(null);

  // Check if GitHub App is configured/installed
  useEffect(() => {
    checkAppMode();
  }, []);

  const checkAppMode = async () => {
    try {
      const response = await fetch('/api/github/app/install-info');
      const info: AppInstallInfo = await response.json();
      
      setAppInfo(info);
      
      if (info.ok && info.configured && info.isInstalled) {
        setAppMode('app');
      } else {
        setAppMode('oauth');
      }
    } catch (err) {
      console.warn('Could not check app mode, defaulting to OAuth:', err);
      setAppMode('oauth');
    }
  };

  const githubIntegration = integrations.find(int => int.provider === 'github');
  const isConnected = githubIntegration?.connected || false;

  const handleConnect = async () => {
    if (!user || !token.trim()) {
      setError('Lütfen token girin');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // GitHub API ile token'ı test et
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error('Geçersiz token veya bağlantı hatası');
      }

      const userData = await response.json();

      // Integration'ı kaydet
      const integration = {
        userId: user.id,
        provider: 'github' as const,
        connected: true,
        accessToken: token,
        metadata: {
          id: userData.id,
          login: userData.login,
          name: userData.name,
          avatar_url: userData.avatar_url,
          email: userData.email,
        },
        connectedAt: new Date(),
      };

      addIntegration(integration);
      setToken('');
      setError('');
    } catch (err: any) {
      console.error('GitHub connection error:', err);
      setError(err.message || 'Bağlantı başarısız');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    if (confirm('GitHub bağlantısını kaldırmak istediğinizden emin misiniz?')) {
      removeIntegration('github');
    }
  };

  if (isConnected && githubIntegration) {
    return (
      <div className="p-4 bg-gray-900 rounded-lg border border-green-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">GitHub</h3>
                <span className="px-2 py-0.5 bg-green-900/30 border border-green-700 rounded text-xs text-green-300">
                  ✓ Bağlı
                </span>
              </div>
              <p className="text-sm text-gray-400">Personal Access Token</p>
            </div>
          </div>

          <button
            onClick={handleDisconnect}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition-colors"
          >
            Bağlantıyı Kes
          </button>
        </div>

        {githubIntegration.metadata && (
          <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
            {githubIntegration.metadata.avatar_url && (
              <img
                src={githubIntegration.metadata.avatar_url}
                alt={githubIntegration.metadata.login}
                className="w-10 h-10 rounded-full"
              />
            )}
            <div>
              <p className="font-medium">{githubIntegration.metadata.name || githubIntegration.metadata.login}</p>
              <p className="text-sm text-gray-400">@{githubIntegration.metadata.login}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // App mode: Show Install CTA instead of PAT input
  if (appMode === 'app' && appInfo) {
    return (
      <div className="p-4 bg-gray-900 rounded-lg border border-blue-600">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center">
            <svg className="w-7 h-7 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">GitHub App Modu</h3>
              <span className="px-2 py-0.5 bg-blue-900/30 border border-blue-600 rounded text-xs text-blue-300">
                ✓ Aktif
              </span>
            </div>
            <p className="text-sm text-gray-400">
              {appInfo.app?.name || 'AKIS GitHub App'} kullanılıyor
            </p>
          </div>
        </div>

        <div className="p-3 bg-blue-900/20 border border-blue-700 rounded-lg mb-3">
          <p className="text-sm text-blue-300 mb-2">
            ℹ️ GitHub App aktif olduğunda Personal Access Token gerekmez.
          </p>
          <p className="text-xs text-gray-400">
            Uygulama kurulu repolarınıza otomatik olarak erişebilir.
          </p>
        </div>

        {appInfo.installUrl && (
          <a
            href={appInfo.installUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm text-center transition-colors"
          >
            📦 Daha Fazla Repoya Yükle
          </a>
        )}

        {appInfo.requiredPermissions && appInfo.requiredPermissions.length > 0 && (
          <details className="mt-3">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
              Gerekli izinler ({appInfo.requiredPermissions.length})
            </summary>
            <ul className="mt-2 space-y-1 text-xs text-gray-500">
              {appInfo.requiredPermissions.map((perm, i) => (
                <li key={i}>• {perm}</li>
              ))}
            </ul>
          </details>
        )}
      </div>
    );
  }

  // Checking mode
  if (appMode === 'checking') {
    return (
      <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
        <div className="text-center py-4">
          <svg className="animate-spin h-6 w-6 mx-auto text-blue-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-400 text-sm mt-2">GitHub entegrasyon modu kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  // OAuth mode: show PAT input
  return (
    <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-[#24292e] rounded-lg flex items-center justify-center">
          <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">GitHub</h3>
          <p className="text-sm text-gray-400">Personal Access Token ile bağlan</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            GitHub Personal Access Token
          </label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            <a
              href="https://github.com/settings/tokens/new?scopes=repo,user"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300"
            >
              Token oluştur →
            </a>
            {' '}(repo, user scope'larını seçin)
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleConnect}
          disabled={loading || !token.trim()}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-sm transition-colors"
        >
          {loading ? '⏳ Bağlanıyor...' : '🔗 Bağlan'}
        </button>
      </div>
    </div>
  );
}

