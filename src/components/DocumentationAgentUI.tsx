'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { RepoPicker } from './RepoPicker';
import { BranchCreator } from './BranchCreator';
import { AgentRunPanel } from './AgentRunPanel';

type ScopeType = 'readme' | 'getting-started' | 'api' | 'changelog' | 'all';

interface SelectedRepo {
  name: string;
  full_name: string;
  owner: string;
  private: boolean;
  default_branch: string;
  description?: string;
  html_url: string;
}

interface AppModeInfo {
  installed: boolean;
  configured: boolean;
  appSlug?: string;
  installationId?: number;
}

export function DocumentationAgentUI() {
  const { integrations } = useAuth();
  const [selectedRepo, setSelectedRepo] = useState<SelectedRepo | null>(null);
  const [workingBranch, setWorkingBranch] = useState<string>('');
  const [branchReady, setBranchReady] = useState(false);
  const [scope, setScope] = useState<ScopeType>('all');
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [appMode, setAppMode] = useState<AppModeInfo | null>(null);
  const [checkingAppMode, setCheckingAppMode] = useState(true);

  const githubIntegration = integrations.find(int => int.provider === 'github');
  const isGitHubConnected = githubIntegration?.connected || false;
  const accessToken = githubIntegration?.accessToken || '';

  // Check if GitHub App is installed
  useEffect(() => {
    checkAppInstallation();
  }, []);

  const checkAppInstallation = async () => {
    try {
      const response = await fetch('/api/github/app/install-info');
      const data = await response.json();
      
      setAppMode({
        installed: data.isInstalled || false,
        configured: data.configured || false,
        appSlug: data.app?.slug,
        installationId: parseInt(process.env.NEXT_PUBLIC_GITHUB_APP_INSTALLATION_ID || '0') || undefined,
      });
    } catch (error) {
      console.error('Failed to check app mode:', error);
      setAppMode({ installed: false, configured: false });
    } finally {
      setCheckingAppMode(false);
    }
  };

  // Determine if user has access (OAuth OR App Mode)
  const hasGitHubAccess = isGitHubConnected || (appMode?.installed && appMode?.configured);

  const handleRepoSelect = (repo: SelectedRepo) => {
    setSelectedRepo(repo);
    setCurrentStep(2);
  };

  const handleBranchReady = (branchName: string, action: 'created' | 'exists') => {
    setWorkingBranch(branchName);
    setBranchReady(true);
    setCurrentStep(3);
  };

  const handleReset = () => {
    setSelectedRepo(null);
    setWorkingBranch('');
    setBranchReady(false);
    setCurrentStep(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-blue-900 rounded-lg p-6 border border-purple-700">
        <h2 className="text-2xl font-bold mb-2">🤖 AKIS Scribe Agent</h2>
        <p className="text-gray-300">
          GitHub repository dokümantasyonunu otomatik olarak analiz eder, iyileştirir ve Draft PR açar.
          OAuth-backed repo picker ile kolayca repository seçin, branch oluşturun ve agent&apos;ı çalıştırın.
        </p>
      </div>

      {/* GitHub Connection Warning */}
      {!hasGitHubAccess && !checkingAppMode && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
          <p className="text-yellow-400 mb-2">
            ⚠️ GitHub erişimi gerekli.
          </p>
          <div className="text-sm text-gray-300 space-y-2">
            <p>• <a href="/profile" className="underline text-blue-400">Profile sayfasından</a> GitHub hesabınızı bağlayın (OAuth)</p>
            {appMode?.appSlug && (
              <p>• Veya <a 
                href={`https://github.com/apps/${appMode.appSlug}/installations/new`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-400"
              >AKIS GitHub App</a> yükleyin (Önerilen)</p>
            )}
          </div>
        </div>
      )}

      {/* App Mode Active Banner */}
      {appMode?.installed && !isGitHubConnected && (
        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
          <p className="text-blue-300 flex items-center gap-2">
            <span>🤖</span>
            <span><strong>GitHub App Mode:</strong> AKIS Scribe App üzerinden çalışıyorsunuz. OAuth bağlantısı gerekmez.</span>
          </p>
        </div>
      )}

      {checkingAppMode && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center text-gray-400">
          <p>GitHub App durumu kontrol ediliyor...</p>
        </div>
      )}

      {/* Progress Steps */}
      <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-700">
        <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-blue-400' : 'text-gray-500'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-blue-600' : 'bg-gray-700'}`}>
            {currentStep > 1 ? '✓' : '1'}
          </div>
          <span className="text-sm font-medium">Select Repo</span>
        </div>
        <div className={`flex-1 h-1 mx-2 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-700'}`} />
        <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-blue-400' : 'text-gray-500'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-700'}`}>
            {currentStep > 2 ? '✓' : '2'}
          </div>
          <span className="text-sm font-medium">Create Branch</span>
        </div>
        <div className={`flex-1 h-1 mx-2 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-700'}`} />
        <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-blue-400' : 'text-gray-500'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-700'}`}>
            3
          </div>
          <span className="text-sm font-medium">Run Agent</span>
        </div>
      </div>

      {/* Main Content - Step by Step */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-700 space-y-6">
        {/* Step 1: Repository Selection */}
        {currentStep === 1 && (
          <div>
            <h3 className="text-xl font-semibold mb-4">📦 Step 1: Select Repository</h3>
            {hasGitHubAccess ? (
              <RepoPicker
                accessToken={accessToken}
                onSelect={handleRepoSelect}
                selectedRepo={selectedRepo || undefined}
              />
            ) : checkingAppMode ? (
              <p className="text-gray-400 text-center py-4">Yükleniyor...</p>
            ) : (
              <p className="text-gray-400">GitHub bağlantısı veya App kurulumu gerekli.</p>
            )}
          </div>
        )}

        {/* Step 2: Branch Creation */}
        {currentStep === 2 && selectedRepo && (
          <div>
            <h3 className="text-xl font-semibold mb-4">🌿 Step 2: Create/Checkout Branch</h3>
            <BranchCreator
              owner={selectedRepo.owner}
              repo={selectedRepo.name}
              baseBranch={selectedRepo.default_branch}
              accessToken={accessToken}
              onBranchReady={handleBranchReady}
            />
            <button
              onClick={() => setCurrentStep(1)}
              className="mt-4 text-sm text-gray-400 hover:text-gray-300 underline"
            >
              ← Farklı repo seç
            </button>
          </div>
        )}

        {/* Step 3: Agent Configuration & Run */}
        {currentStep === 3 && selectedRepo && branchReady && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">🚀 Step 3: Run Agent</h3>
              
              {/* Scope Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Documentation Scope</label>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value as ScopeType)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="all">🌐 All Documentation</option>
                  <option value="readme">📄 README Only</option>
                  <option value="changelog">📋 CHANGELOG Only</option>
                  <option value="getting-started">🚀 Getting Started</option>
                  <option value="api">🔌 API Docs</option>
                </select>
              </div>

              {/* Agent Run Panel */}
              <AgentRunPanel
                repoOwner={selectedRepo.owner}
                repoName={selectedRepo.name}
                baseBranch={selectedRepo.default_branch}
                workingBranch={workingBranch}
                accessToken={accessToken}
                scope={scope}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-gray-300 underline"
              >
                ← Farklı branch
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm text-gray-400 hover:text-gray-300 underline"
              >
                🔄 Baştan başla
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-3">💡 Nasıl Kullanılır?</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-300">
          <li>GitHub hesabınızı Profile sayfasından bağlayın (OAuth)</li>
          <li>Repository listesinden analiz etmek istediğiniz repo&apos;yu seçin</li>
          <li>Branch adı girin veya otomatik oluştur (🎲 buton)</li>
          <li>Branch oluşturulduğunda &quot;Run Agent&quot; adımına geçin</li>
          <li>Documentation scope&apos;unu seçin (All, README, CHANGELOG, vb.)</li>
          <li>&quot;Run AKIS Scribe Agent&quot; butonuna tıklayın</li>
          <li>Agent tüm playbook adımlarını (1-7) otomatik çalıştırır</li>
          <li>Sonuçları inceleyin ve Draft PR&apos;ı görüntüleyin</li>
        </ol>

        <div className="mt-4 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
          <p className="text-sm text-blue-300">
            <strong>DAS Score:</strong> Documentation Agent Score = 0.4 × RefCoverage + 0.4 × Consistency + 0.2 × SpotCheck
            <br />
            <strong>Hedef:</strong> ≥70% (Approve), 50-69% (Needs Changes), &lt;50% (Reject)
          </p>
        </div>

        <div className="mt-4 p-4 bg-purple-900/20 border border-purple-700 rounded-lg">
          <p className="text-sm text-purple-300">
            <strong>Playbook Adımları:</strong>
            <br />
            1. Repo Summary → 2. Gap Analysis → 3. Generate Proposals → 4. Validation (DAS) → 5. Branch & Commit → 6. Draft PR → 7. Human Review
          </p>
        </div>
      </div>
    </div>
  );
}

