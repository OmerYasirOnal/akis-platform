'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { GitHubPATIntegration } from "@/shared/components/integrations/GitHubPATIntegration";

function ProfileContent() {
  const { user, isAuthenticated, integrations, logout, addIntegration, refreshIntegrations } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [successMessage, setSuccessMessage] = useState('');
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Kısa bir delay ile auth kontrolü yap
    // Bu, AuthContext'in mount olmasına zaman tanır
    const timer = setTimeout(() => {
      setIsChecking(false);
      if (!isAuthenticated) {
        router.push('/login');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, router]);

  useEffect(() => {
    // GitHub callback'ten geldik mi kontrol et
    const githubConnected = searchParams.get('github_connected');
    
    console.log('Profile useEffect:', { githubConnected, user });
    
    if (githubConnected === 'success' && user) {
      console.log('GitHub connection success detected!');
      console.log('All cookies:', document.cookie);
      
      // Cookie'den integration bilgilerini al
      const cookies = document.cookie.split(';');
      const githubIntegrationCookie = cookies.find(c => c.trim().startsWith('github_integration='));
      
      console.log('GitHub integration cookie:', githubIntegrationCookie);
      
      if (githubIntegrationCookie) {
        try {
          const cookieValue = githubIntegrationCookie.split('=')[1];
          const integrationData = JSON.parse(decodeURIComponent(cookieValue));
          
          console.log('Integration data:', integrationData);
          
          // Integration'ı ekle
          addIntegration(integrationData);
          
          console.log('Integration added successfully!');
          console.log('Current integrations after add:', integrations);
          
          // Success mesajı göster
          setSuccessMessage('✅ GitHub hesabınız başarıyla bağlandı! 🎉');
          
          // URL'i temizle
          window.history.replaceState({}, '', '/profile');
          
          // 5 saniye sonra mesajı kaldır
          setTimeout(() => setSuccessMessage(''), 5000);
          
          // Cookie'yi temizle
          document.cookie = 'github_integration=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          
          // Force refresh integrations
          setTimeout(() => {
            refreshIntegrations();
            console.log('Integrations refreshed manually');
          }, 100);
        } catch (e) {
          console.error('Failed to load GitHub integration:', e);
          setSuccessMessage('❌ GitHub bağlantısı başarısız oldu.');
          setTimeout(() => setSuccessMessage(''), 5000);
        }
      } else {
        console.log('No github_integration cookie found');
        setSuccessMessage('✅ GitHub bağlantısı başarılı! (Cookie bulunamadı ama bağlandınız)');
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    }
  }, [searchParams, user, addIntegration]);

  if (isChecking || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Yükleniyor...</div>
      </div>
    );
  }

  const githubIntegration = integrations.find(int => int.provider === 'github');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Profil & Ayarlar</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
            >
              ← Dashboard'a Dön
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-900/30 border border-green-700 rounded-lg text-green-300 animate-pulse">
            {successMessage}
          </div>
        )}

        {/* User Info */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span>👤</span>
            Kullanıcı Bilgileri
          </h2>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-400">Ad Soyad</label>
              <p className="text-lg font-medium">{user.name}</p>
            </div>
            
            <div>
              <label className="text-sm text-gray-400">Email</label>
              <p className="text-lg font-medium">{user.email}</p>
            </div>
            
            <div>
              <label className="text-sm text-gray-400">Hesap Oluşturma</label>
              <p className="text-lg font-medium">
                {new Date(user.createdAt).toLocaleDateString('tr-TR')}
              </p>
            </div>
          </div>
        </div>

        {/* Integrations */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span>🔗</span>
            Entegrasyonlar ({integrations.filter(i => i.connected).length})
          </h2>

          <div className="space-y-4">
            {/* GitHub Integration */}
              <GitHubPATIntegration />

            {/* Jira Integration (Coming Soon) */}
            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700 opacity-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Jira</h3>
                    <p className="text-sm text-gray-400">Issue ve task yönetimi</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500 px-3 py-1 bg-gray-800 rounded">
                  Yakında
                </span>
              </div>
            </div>

            {/* Confluence Integration (Coming Soon) */}
            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700 opacity-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📚</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Confluence</h3>
                    <p className="text-sm text-gray-400">Döküman yönetimi</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500 px-3 py-1 bg-gray-800 rounded">
                  Yakında
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-900/20 border border-red-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-red-300">Tehlikeli Bölge</h2>
          
          <button
            onClick={logout}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
          >
            Çıkış Yap
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center"><div className="text-white">Yükleniyor...</div></div>}>
      <ProfileContent />
    </Suspense>
  );
}

