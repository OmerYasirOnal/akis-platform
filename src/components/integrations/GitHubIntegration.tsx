'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface DiagnosticsData {
  installed: boolean;
  appSlug?: string;
  installationId?: number;
  account?: {
    type: 'User' | 'Organization';
    login: string;
  };
  htmlUrl?: string;
  repositorySelection?: 'all' | 'selected';
  repositoryCount?: number;
  tokenPermissions?: Record<string, string>;
  requiredPermissions: Record<string, string>;
  missing: string[];
  error?: string;
}

export function GitHubIntegration() {
  const { user, integrations, addIntegration, removeIntegration } = useAuth();
  const [loading, setLoading] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsData | null>(null);
  const [showPermissions, setShowPermissions] = useState(false);
  const [loadingDiagnostics, setLoadingDiagnostics] = useState(false);

  const githubIntegration = integrations.find(int => int.provider === 'github');
  const isConnected = githubIntegration?.connected || false;

  // Fetch diagnostics on mount
  useEffect(() => {
    fetchDiagnostics();
  }, []);

  const fetchDiagnostics = async () => {
    setLoadingDiagnostics(true);
    try {
      const response = await fetch('/api/github/app/diagnostics');
      const data = await response.json();
      setDiagnostics(data);
    } catch (error) {
      console.error('Failed to fetch diagnostics:', error);
    } finally {
      setLoadingDiagnostics(false);
    }
  };

  const handleConnect = async () => {
    if (!user) return;
    
    setLoading(true);

    try {
      // GitHub OAuth URL'ine yönlendir
      const response = await fetch('/api/integrations/github/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (data.authUrl) {
        // GitHub OAuth sayfasına yönlendir
        window.location.href = data.authUrl;
      } else {
        throw new Error('OAuth URL alınamadı');
      }
    } catch (error) {
      console.error('GitHub connection error:', error);
      alert('GitHub bağlantısı başarısız oldu');
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;

    const confirmed = confirm('GitHub entegrasyonunu kaldırmak istediğinizden emin misiniz?');
    if (!confirmed) return;

    setLoading(true);

    try {
      await fetch('/api/integrations/github/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      removeIntegration('github');
    } catch (error) {
      console.error('GitHub disconnect error:', error);
      alert('Bağlantı kaldırılırken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getInstallUrl = () => {
    if (!diagnostics) return '#';
    
    // Priority 1: Use htmlUrl from installation
    if (diagnostics.htmlUrl) {
      return diagnostics.htmlUrl;
    }
    
    // Priority 2: Construct URL based on account type
    if (diagnostics.installationId && diagnostics.account) {
      if (diagnostics.account.type === 'Organization') {
        return `https://github.com/organizations/${diagnostics.account.login}/settings/installations/${diagnostics.installationId}`;
      } else {
        return `https://github.com/settings/installations/${diagnostics.installationId}`;
      }
    }
    
    // Priority 3: New installation URL
    const appSlug = diagnostics.appSlug || 'akis-scribe';
    return `https://github.com/apps/${appSlug}/installations/new`;
  };

  if (isConnected && githubIntegration) {
    return (
      <div className="p-4 bg-gray-900 rounded-lg border border-green-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#24292e] rounded-lg flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold">GitHub</h3>
              <p className="text-sm text-green-400">✓ Bağlı</p>
            </div>
          </div>

          <button
            onClick={handleDisconnect}
            disabled={loading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg text-sm transition-colors"
          >
            {loading ? 'İşleniyor...' : 'Bağlantıyı Kes'}
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

        {/* GitHub App Diagnostics Section */}
        {diagnostics && diagnostics.installed && (
          <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-400">🤖 GitHub App Mode</span>
                <span className="px-2 py-0.5 bg-green-600/20 text-green-400 text-xs rounded-full">Active</span>
              </div>
              <a
                href={getInstallUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                Manage Installation
              </a>
            </div>

            {diagnostics.account && (
              <p className="text-xs text-gray-400 mb-2">
                Installed on: <span className="text-white">{diagnostics.account.login}</span> ({diagnostics.account.type})
              </p>
            )}

            {diagnostics.repositorySelection && (
              <p className="text-xs text-gray-400 mb-3">
                Repository access: <span className="text-white">{diagnostics.repositorySelection === 'all' ? 'All repositories' : `Selected (${diagnostics.repositoryCount || 0})`}</span>
              </p>
            )}

            {/* Permissions Section */}
            <div className="mt-3">
              <button
                onClick={() => setShowPermissions(!showPermissions)}
                className="flex items-center justify-between w-full text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                <span>
                  Required Permissions ({Object.keys(diagnostics.requiredPermissions).length})
                  {diagnostics.missing.length > 0 && (
                    <span className="ml-2 text-yellow-400">⚠️ {diagnostics.missing.length} missing</span>
                  )}
                </span>
                <svg
                  className={`w-4 h-4 transition-transform ${showPermissions ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showPermissions && (
                <div className="mt-3 space-y-2">
                  {Object.entries(diagnostics.requiredPermissions).map(([key, value]) => {
                    const actual = diagnostics.tokenPermissions?.[key];
                    const isMissing = !actual || (value === 'write' && actual !== 'write');
                    
                    return (
                      <div key={key} className="flex items-center justify-between text-xs p-2 bg-gray-900/50 rounded">
                        <span className="text-gray-300">
                          <code className="bg-gray-700 px-1 py-0.5 rounded">{key}</code>: {value}
                        </span>
                        {isMissing ? (
                          <span className="text-red-400">❌ {actual ? `(current: ${actual})` : 'missing'}</span>
                        ) : (
                          <span className="text-green-400">✓</span>
                        )}
                      </div>
                    );
                  })}

                  {diagnostics.missing.length > 0 && (
                    <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-xs text-yellow-400 mb-2">
                        ⚠️ Some permissions are missing. The app may not work correctly.
                      </p>
                      <a
                        href={getInstallUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded transition-colors"
                      >
                        Fix Permissions
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Repository Coverage Warning */}
            {diagnostics.repositorySelection === 'selected' && (
              <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-xs text-blue-400 mb-2">
                  ℹ️ This app is installed on selected repositories only. If you want to use it on more repos:
                </p>
                <a
                  href={getInstallUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                >
                  Add More Repositories
                </a>
                <p className="text-xs text-gray-500 mt-2">
                  GitHub will ask you to sign in if you're not already authenticated.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Diagnostics Error */}
        {diagnostics && !diagnostics.installed && diagnostics.error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-xs text-red-400">{diagnostics.error}</p>
            {diagnostics.appSlug && (
              <a
                href={`https://github.com/apps/${diagnostics.appSlug}/installations/new`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
              >
                Install AKIS GitHub App
              </a>
            )}
          </div>
        )}

        {/* Loading State */}
        {loadingDiagnostics && !diagnostics && (
          <div className="mt-4 p-3 bg-gray-800 rounded-lg text-center text-sm text-gray-400">
            Loading diagnostics...
          </div>
        )}

        <div className="mt-4 text-sm text-gray-400">
          <p>Bağlantı tarihi: {githubIntegration.connectedAt ? new Date(githubIntegration.connectedAt).toLocaleDateString('tr-TR') : '-'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#24292e] rounded-lg flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </div>
          <div>
            <h3 className="font-semibold">GitHub</h3>
            <p className="text-sm text-gray-400">Repository ve issue yönetimi</p>
          </div>
        </div>

        <button
          onClick={handleConnect}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg text-sm transition-colors"
        >
          {loading ? 'Bağlanıyor...' : 'Bağlan'}
        </button>
      </div>

      {/* Show GitHub App install option even when not connected */}
      {diagnostics && !diagnostics.installed && (
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-xs text-blue-400 mb-2">
            💡 For better security, install AKIS as a GitHub App instead of OAuth:
          </p>
          <a
            href={getInstallUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
          >
            Install AKIS GitHub App
          </a>
        </div>
      )}
    </div>
  );
}
