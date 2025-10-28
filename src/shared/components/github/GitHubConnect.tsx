'use client';

interface GitHubConnectProps {
  isConnected: boolean;
  userData?: {
    login: string;
    name: string;
    avatar_url: string;
  } | null;
}

export function GitHubConnect({ isConnected, userData }: GitHubConnectProps) {
  const handleConnect = () => {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    
    if (!clientId) {
      alert('GitHub Client ID yapılandırılmamış. .env.local dosyasını kontrol edin.');
      return;
    }

    const redirectUri = `${window.location.origin}/api/github/connect`;
    const scope = 'repo,user';
    
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
    
    window.location.href = githubAuthUrl;
  };

  const handleDisconnect = () => {
    // Clear cookies
    document.cookie = 'github_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'github_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Reload page
    window.location.reload();
  };

  if (isConnected && userData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-green-900/20 border border-green-700 rounded-lg">
          <div className="text-green-400 text-2xl">✓</div>
          <div className="flex-1">
            <p className="font-medium text-green-300">GitHub bağlantısı aktif</p>
            <p className="text-sm text-gray-400">@{userData.login} olarak bağlı</p>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-300">Kullanılabilir İşlemler:</h3>
          <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
            <li>Repository'leri görüntüle</li>
            <li>Issue oluştur ve yönet</li>
            <li>Pull request işlemleri</li>
            <li>Kod analizi yap</li>
          </ul>
        </div>

        <button
          onClick={handleDisconnect}
          className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm"
        >
          Bağlantıyı Kes
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-gray-400 text-sm">
        GitHub hesabınızı bağlayarak repository'lerinize erişim sağlayın,
        otomatik issue oluşturun ve kod analizleri yapın.
      </p>

      <button
        onClick={handleConnect}
        className="w-full px-6 py-3 bg-[#24292e] hover:bg-[#1a1e22] rounded-lg font-medium transition-all flex items-center justify-center gap-3 group"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
        <span>GitHub ile Bağlan</span>
      </button>

      <div className="text-xs text-gray-500 text-center">
        Güvenli OAuth 2.0 ile GitHub hesabınıza bağlanın
      </div>
    </div>
  );
}

