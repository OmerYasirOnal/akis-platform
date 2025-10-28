'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DocumentAgent } from "@/modules/documentation/components/DocumentAgent";
import { AgentPlaybookViewer } from "@/modules/documentation/components/AgentPlaybookViewer";
import { GitHubRepositories } from "@/shared/components/github/GitHubRepositories";
import { DocumentationAgentUI } from "@/modules/documentation/components/DocumentationAgentUI";
import Link from 'next/link';

export default function DashboardPage() {
  const { user, isAuthenticated, integrations, logout } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Kısa bir delay ile auth kontrolü yap
    const timer = setTimeout(() => {
      setIsChecking(false);
      if (!isAuthenticated) {
        router.push('/login');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, router]);

  useEffect(() => {
    // GitHub integration cookie'den yükle
    const cookies = document.cookie.split(';');
    const githubIntegrationCookie = cookies.find(c => c.trim().startsWith('github_integration='));
    
    if (githubIntegrationCookie && user) {
      try {
        const integrationData = JSON.parse(decodeURIComponent(githubIntegrationCookie.split('=')[1]));
        
        // Context'e ekle
        const { addIntegration } = useAuth();
        // Bu useEffect içinde hook çağıramayız, bu yüzden farklı yaklaşım gerekli
        // Storage'a direkt yazalım
        if (typeof window !== 'undefined') {
          const { AuthStorage } = require('@/shared/lib/auth/storage');
          AuthStorage.addIntegration(integrationData);
          window.location.reload(); // Yenile ki context güncellensin
        }
      } catch (e) {
        console.error('Failed to load GitHub integration:', e);
      }
    }
  }, [user]);

  if (isChecking || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Yükleniyor...</div>
      </div>
    );
  }

  const githubIntegration = integrations.find(int => int.provider === 'github');
  const githubConnected = githubIntegration?.connected || false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                DevAgents Dashboard
              </h1>
              <p className="text-sm text-gray-400">AI-Powered Development Platform</p>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/profile"
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
              >
                👤 Profil
              </Link>
              
              {githubIntegration?.metadata && (
                <div className="flex items-center gap-2">
                  <img
                    src={githubIntegration.metadata.avatar_url}
                    alt={githubIntegration.metadata.login}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-sm text-gray-400">
                    @{githubIntegration.metadata.login}
                  </span>
                </div>
              )}

              <button
                onClick={logout}
                className="text-sm text-gray-400 hover:text-gray-300"
              >
                Çıkış
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Agent Playbook Info */}
        <div className="mb-8">
          <AgentPlaybookViewer />
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column: Stats & Info */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                <div className="text-3xl font-bold text-blue-400">1</div>
                <div className="text-sm text-gray-400">Aktif Agent</div>
              </div>
              
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                <div className="text-3xl font-bold text-purple-400">
                  {integrations.filter(i => i.connected).length}
                </div>
                <div className="text-sm text-gray-400">Entegrasyon</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h2 className="text-xl font-semibold mb-4">Hızlı Erişim</h2>
              <div className="space-y-2">
                <Link
                  href="/profile"
                  className="block p-3 bg-gray-900 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔗</span>
                    <div>
                      <p className="font-medium">Entegrasyonlar</p>
                      <p className="text-sm text-gray-400">
                        GitHub, Jira, Confluence bağlantıları
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* GitHub Repositories */}
            <GitHubRepositories />
          </div>

          {/* Right Column: Document Agent */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>📄</span>
              Document Agent
            </h2>
            
            <DocumentAgent />
          </div>
        </div>

        {/* Documentation Agent Section (Full Width) */}
        <div className="mt-8">
          <DocumentationAgentUI />
        </div>
      </div>
    </div>
  );
}

