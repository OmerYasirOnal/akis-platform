'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  updated_at: string;
  private: boolean;
  owner: {
    login: string;
    avatar_url: string;
  };
}

export function GitHubRepositories() {
  const { user, integrations } = useAuth();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const githubIntegration = integrations.find(int => int.provider === 'github');
  const isConnected = githubIntegration?.connected || false;

  // Debug log
  useEffect(() => {
    console.log('GitHubRepositories: Current state:', {
      user: user?.id,
      integrations,
      githubIntegration,
      isConnected,
    });
  }, [user, integrations, githubIntegration, isConnected]);

  const fetchRepositories = async () => {
    if (!user || !githubIntegration?.accessToken) {
      console.log('Cannot fetch: No user or token', { user, githubIntegration });
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('Fetching repositories with token...');
      
      // Direct GitHub API call (client-side)
      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=10', {
        headers: {
          'Authorization': `Bearer ${githubIntegration.accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('GitHub API error:', response.status, errorText);
        throw new Error(`GitHub API error: ${response.status}`);
      }
      
      const repos = await response.json();
      console.log('Fetched repositories:', repos.length);
      
      // Format data
      const repoList = repos.map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        html_url: repo.html_url,
        language: repo.language,
        stargazers_count: repo.stargazers_count,
        updated_at: repo.updated_at,
        private: repo.private,
        owner: {
          login: repo.owner.login,
          avatar_url: repo.owner.avatar_url,
        },
      }));
      
      setRepositories(repoList);
    } catch (err: any) {
      console.error('Error fetching repositories:', err);
      setError(err.message || 'Repository listesi yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && user && githubIntegration?.accessToken) {
      console.log('GitHub connected, fetching repositories...');
      fetchRepositories();
    } else {
      console.log('Not fetching repos:', { isConnected, hasUser: !!user, hasToken: !!githubIntegration?.accessToken });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, user, githubIntegration?.accessToken]);

  if (!isConnected) {
    return (
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">📁</span>
          <h2 className="text-xl font-semibold">GitHub Repositories</h2>
        </div>
        <p className="text-gray-400 mb-2">
          GitHub hesabınızı bağlayarak repository'lerinizi görüntüleyebilirsiniz.
        </p>
        <p className="text-xs text-gray-500">
          Debug: {integrations.length} integration found, GitHub connected: {String(isConnected)}
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">📁</span>
          <h2 className="text-xl font-semibold">GitHub Repositories</h2>
        </div>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-400">Repository'ler yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">📁</span>
          <h2 className="text-xl font-semibold">GitHub Repositories</h2>
        </div>
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
          <p className="text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📁</span>
          <h2 className="text-xl font-semibold">GitHub Repositories</h2>
          <span className="px-2 py-1 bg-blue-900/30 border border-blue-700 rounded text-sm text-blue-300">
            {repositories.length} repo
          </span>
        </div>
        <button
          onClick={fetchRepositories}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-sm"
        >
          🔄 Yenile
        </button>
      </div>

      {repositories.length === 0 ? (
        <p className="text-gray-400 text-center py-8">
          Henüz repository bulunamadı.
        </p>
      ) : (
        <div className="space-y-3">
          {repositories.map((repo) => (
            <a
              key={repo.id}
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-gray-700/50 hover:bg-gray-700 border border-gray-600 rounded-lg p-4 transition group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-blue-400 group-hover:text-blue-300">
                      {repo.name}
                    </h3>
                    {repo.private && (
                      <span className="px-2 py-0.5 bg-yellow-900/30 border border-yellow-700 rounded text-xs text-yellow-300">
                        🔒 Private
                      </span>
                    )}
                  </div>
                  
                  {repo.description && (
                    <p className="text-sm text-gray-400 mb-2">
                      {repo.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {repo.language && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        {repo.language}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      ⭐ {repo.stargazers_count}
                    </span>
                    <span>
                      🕒 {new Date(repo.updated_at).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </div>
                
                <div className="ml-4">
                  <span className="text-gray-500 group-hover:text-gray-400 transition">
                    →
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

