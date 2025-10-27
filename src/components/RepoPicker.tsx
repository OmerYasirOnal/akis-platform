'use client';

import { useState, useEffect } from 'react';

interface Repository {
  name: string;
  full_name: string;
  owner: string;
  private: boolean;
  default_branch: string;
  description?: string;
  html_url: string;
}

interface RepoPickerProps {
  accessToken?: string; // Now optional (not needed in App mode)
  onSelect: (repo: Repository) => void;
  selectedRepo?: Repository;
}

export function RepoPicker({ accessToken, onSelect, selectedRepo }: RepoPickerProps) {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [source, setSource] = useState<'github_app' | 'oauth' | 'none'>('none');
  const [appInstallUrl, setAppInstallUrl] = useState<string | null>(null);

  useEffect(() => {
    loadRepos();
  }, [currentPage]);

  const loadRepos = async () => {
    setLoading(true);
    setError(null);

    try {
      // App-aware: token is optional (server handles App vs OAuth)
      const headers: HeadersInit = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`/api/github/repos?page=${currentPage}&perPage=30`, {
        headers,
      });

      const result = await response.json();
      
      if (!result.ok) {
        // Handle 403 in App mode (app not installed)
        if (response.status === 403 && result.details?.source === 'github_app') {
          setError('GitHub App kurulu repo bulunamadı veya gerekli izinler eksik.');
          setSource('github_app');
          
          // Fetch install URL
          const infoResponse = await fetch('/api/github/app/install-info');
          const infoData = await infoResponse.json();
          if (infoData.ok && infoData.installUrl) {
            setAppInstallUrl(infoData.installUrl);
          }
          return;
        }

        throw new Error(result.error || 'Repolar yüklenemedi');
      }

      // Success: parse normalized response
      const repositories = result.data || [];
      setSource(result.source || 'none');
      
      setRepos(repositories.map((repo: any) => ({
        name: repo.name,
        full_name: repo.full_name,
        owner: repo.owner?.login || repo.owner,
        private: repo.private,
        default_branch: repo.default_branch,
        description: repo.description,
        html_url: repo.html_url,
      })));
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const filteredRepos = repos.filter(repo => 
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Repository Seçin
        </label>
        
        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Repository ara..."
          className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 mb-3"
        />

        {/* Selected Repo Display */}
        {selectedRepo && (
          <div className="mb-3 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{selectedRepo.full_name}</p>
                {selectedRepo.description && (
                  <p className="text-sm text-gray-400">{selectedRepo.description}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Default branch: {selectedRepo.default_branch} • {selectedRepo.private ? '🔒 Private' : '🌐 Public'}
                </p>
              </div>
              <button
                onClick={() => setSearchQuery('')}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Değiştir
              </button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-3 p-3 bg-red-900/30 border border-red-700 rounded-lg text-sm text-red-400">
            {error}
            <button
              onClick={loadRepos}
              className="ml-2 underline hover:no-underline"
            >
              Tekrar dene
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <svg className="animate-spin h-8 w-8 mx-auto text-blue-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-gray-400 mt-2">Repolar yükleniyor...</p>
          </div>
        )}

        {/* Repo List */}
        {!loading && filteredRepos.length > 0 && (
          <div className="border border-gray-700 rounded-lg max-h-96 overflow-y-auto">
            {filteredRepos.map((repo) => (
              <button
                key={repo.full_name}
                onClick={() => onSelect(repo)}
                className={`w-full text-left p-4 border-b border-gray-700 last:border-b-0 hover:bg-gray-800 transition-colors ${
                  selectedRepo?.full_name === repo.full_name ? 'bg-blue-900/20' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{repo.name}</span>
                      {repo.private ? (
                        <span className="text-xs px-2 py-0.5 bg-gray-700 rounded">🔒 Private</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 bg-green-900/30 border border-green-700 rounded">🌐 Public</span>
                      )}
                    </div>
                    {repo.description && (
                      <p className="text-sm text-gray-400 mt-1">{repo.description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {repo.owner}/{repo.name} • Default: {repo.default_branch}
                    </p>
                  </div>
                  {selectedRepo?.full_name === repo.full_name && (
                    <svg className="w-6 h-6 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredRepos.length === 0 && repos.length > 0 && (
          <div className="text-center py-8 border border-gray-700 rounded-lg">
            <p className="text-gray-400">"{searchQuery}" için sonuç bulunamadı</p>
          </div>
        )}

        {!loading && repos.length === 0 && !error && (
          <div className="text-center py-8 border border-gray-700 rounded-lg">
            <p className="text-gray-400">Repository bulunamadı</p>
            {source === 'github_app' && appInstallUrl && (
              <div className="mt-4 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                <p className="text-sm text-blue-300 mb-3">
                  GitHub App henüz hiçbir repoya kurulmamış.
                </p>
                <a
                  href={appInstallUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm transition-colors"
                >
                  📦 GitHub App Kur
                </a>
              </div>
            )}
            {source !== 'github_app' && (
              <button
                onClick={loadRepos}
                className="mt-2 text-blue-400 hover:underline"
              >
                Yeniden yükle
              </button>
            )}
          </div>
        )}

        {/* App Install CTA in error state */}
        {error && source === 'github_app' && appInstallUrl && (
          <div className="mt-3 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
            <p className="text-sm text-blue-300 mb-3">
              💡 GitHub App'i repolarınıza kurarak devam edebilirsiniz.
            </p>
            <a
              href={appInstallUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm transition-colors"
            >
              📦 GitHub App Kur
            </a>
            <p className="text-xs text-gray-400 mt-3">
              Gerekli izinler: <strong>Contents: Read & Write</strong>, <strong>Metadata: Read</strong>, <strong>Pull Requests: Read & Write</strong>
            </p>
          </div>
        )}

        {/* Pagination */}
        {repos.length === 30 && (
          <div className="flex justify-between items-center mt-3">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Önceki
            </button>
            <span className="text-sm text-gray-400">Sayfa {currentPage}</span>
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={loading}
              className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sonraki →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

