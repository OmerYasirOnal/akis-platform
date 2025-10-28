'use client';

import { useState } from 'react';

interface BranchCreatorProps {
  owner: string;
  repo: string;
  baseBranch: string;
  accessToken: string;
  onBranchReady: (branchName: string, action: 'created' | 'exists') => void;
}

export function BranchCreator({ owner, repo, baseBranch, accessToken, onBranchReady }: BranchCreatorProps) {
  const [branchName, setBranchName] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string;
  }>({ type: null, message: '' });

  const generateBranchName = () => {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const name = `docs/${repo}-${date}-readme-refresh`;
    setBranchName(name);
  };

  const handleCreateOrCheckout = async () => {
    if (!branchName.trim()) {
      setStatus({
        type: 'error',
        message: 'Branch adı gerekli',
      });
      return;
    }

    setLoading(true);
    setStatus({ type: 'info', message: 'Branch kontrol ediliyor...' });

    try {
      // Call API endpoint
      const response = await fetch('/api/github/branch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner,
          repo,
          branchName,
          baseBranch,
          // accessToken is optional - API will use GitHub App token if not provided
          ...(accessToken && { accessToken }),
        }),
      });

      const result = await response.json();

      if (!result.success) {
        // Show detailed validation errors if available
        if (result.issues) {
          const errorMessages = result.issues.map((issue: any) => issue.message).join(', ');
          throw new Error(errorMessages);
        }
        throw new Error(result.error || 'Branch işlemi başarısız');
      }

      const message = result.action === 'created' 
        ? `✅ Branch "${branchName}" başarıyla oluşturuldu`
        : result.action === 'exists'
        ? `ℹ️ Branch "${branchName}" zaten mevcut, checkout yapıldı`
        : `✅ Branch "${branchName}" hazır`;

      setStatus({
        type: 'success',
        message,
      });

      // Notify parent
      onBranchReady(branchName, result.action as 'created' | 'exists');
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: err.message || 'Branch işlemi başarısız oldu',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Branch Adı
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            placeholder="docs/repo-20250127-readme-refresh"
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
            disabled={loading}
          />
          <button
            onClick={generateBranchName}
            disabled={loading}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Otomatik branch adı oluştur"
          >
            🎲
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Örnek format: docs/&lt;repo&gt;-&lt;YYYYMMDD&gt;-&lt;description&gt;
        </p>
      </div>

      {/* Base Branch Info */}
      <div className="p-3 bg-gray-800 border border-gray-700 rounded-lg">
        <p className="text-sm">
          <span className="text-gray-400">Base Branch:</span>{' '}
          <code className="text-blue-400">{baseBranch}</code>
        </p>
        <p className="text-sm mt-1">
          <span className="text-gray-400">Repository:</span>{' '}
          <code className="text-green-400">{owner}/{repo}</code>
        </p>
      </div>

      {/* Status Messages */}
      {status.type && (
        <div
          className={`p-3 rounded-lg border ${
            status.type === 'success'
              ? 'bg-green-900/30 border-green-700 text-green-400'
              : status.type === 'error'
              ? 'bg-red-900/30 border-red-700 text-red-400'
              : 'bg-blue-900/30 border-blue-700 text-blue-400'
          }`}
        >
          {status.message}
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleCreateOrCheckout}
        disabled={loading || !branchName.trim()}
        className="w-full py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold transition-all"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            İşleniyor...
          </span>
        ) : (
          '🌿 Branch Oluştur / Checkout'
        )}
      </button>

      {/* Help Text */}
      <div className="p-3 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-300">
        <p className="font-medium mb-1">Nasıl Çalışır?</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Branch adı yazın veya otomatik oluştur (🎲)</li>
          <li>Sistem önce branch&apos;in var olup olmadığını kontrol eder</li>
          <li>Yoksa: yeni branch <code className="text-blue-400">{baseBranch}</code> üzerinden oluşturulur</li>
          <li>Varsa: mevcut branch&apos;e checkout yapılır</li>
        </ul>
      </div>
    </div>
  );
}

