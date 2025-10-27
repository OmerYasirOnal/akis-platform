'use client';

import { useState } from 'react';
import { runScribeAction, RunScribeActionInput } from '@/app/actions/scribe';

interface AgentRunPanelProps {
  repoOwner: string;
  repoName: string;
  baseBranch: string;
  workingBranch: string;
  accessToken?: string; // Optional - GitHub App token will be used if not provided
  scope: 'readme' | 'getting-started' | 'api' | 'changelog' | 'all';
}

export function AgentRunPanel({
  repoOwner,
  repoName,
  baseBranch,
  workingBranch,
  accessToken,
  scope,
}: AgentRunPanelProps) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleRunAgent = async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    setLogs([]);

    try {
      const input: RunScribeActionInput = {
        repo: `${repoOwner}/${repoName}`,
        branch: baseBranch,
        workingBranch: workingBranch, // Pass the selected working branch from UI
        scope,
        ...(accessToken && { accessToken }), // Only include accessToken if provided (OAuth mode)
        dryRun: false,
        options: {
          skipValidation: false,
          autoMergeDAS: 80,
        },
      };

      // Run the agent via server action
      const output = await runScribeAction(input);

      if (!output.success) {
        throw new Error(output.errors?.join(', ') || 'Agent failed');
      }

      setResult(output);
      setLogs(output.logs);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Run Button */}
      <button
        onClick={handleRunAgent}
        disabled={running}
        className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-bold text-lg transition-all transform hover:scale-[1.02]"
      >
        {running ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Agent Çalışıyor...
          </span>
        ) : (
          '🚀 Run AKIS Scribe Agent'
        )}
      </button>

      {/* Info Panel */}
      <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
        <p className="text-sm text-gray-400 mb-2">Agent Yapacak İşlemler:</p>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>Repository analizi ve özet çıkarma</li>
          <li>Doküman boşluk analizi</li>
          <li>README, CHANGELOG ve diğer dokümanları oluşturma</li>
          <li>DAS metriklerini hesaplama (RefCoverage, Consistency, SpotCheck)</li>
          <li>Branch&apos;e commit yapma</li>
          <li>Draft Pull Request açma</li>
        </ol>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg">
          <p className="font-semibold text-red-400">❌ Hata</p>
          <p className="text-sm text-red-300 mt-1">{error}</p>
        </div>
      )}

      {/* Logs Display */}
      {logs.length > 0 && (
        <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
          <p className="font-semibold mb-2">📋 Agent Logs</p>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {logs.map((log, i) => (
              <p key={i} className="text-xs font-mono text-gray-400">
                {log}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="space-y-4">
          {/* Success Banner */}
          <div className="p-4 bg-green-900/30 border border-green-700 rounded-lg">
            <p className="font-semibold text-green-400 text-lg">✅ Agent Başarıyla Tamamlandı!</p>
          </div>

          {/* DAS Metrics */}
          {result.validation && (
            <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
              <h3 className="font-semibold text-lg mb-3">📊 DAS Metrikleri</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-gray-900 rounded-lg border border-gray-700">
                  <p className="text-xs text-gray-400">DAS Score</p>
                  <p className={`text-2xl font-bold ${
                    result.validation.das >= 70 ? 'text-green-400' :
                    result.validation.das >= 50 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {result.validation.das}%
                  </p>
                </div>
                <div className="p-3 bg-gray-900 rounded-lg border border-gray-700">
                  <p className="text-xs text-gray-400">RefCoverage</p>
                  <p className="text-xl font-bold text-blue-400">
                    {result.validation.refCoverage?.score || 0}%
                  </p>
                </div>
                <div className="p-3 bg-gray-900 rounded-lg border border-gray-700">
                  <p className="text-xs text-gray-400">Consistency</p>
                  <p className="text-xl font-bold text-purple-400">
                    {result.validation.consistency?.score || 0}%
                  </p>
                </div>
                <div className="p-3 bg-gray-900 rounded-lg border border-gray-700">
                  <p className="text-xs text-gray-400">SpotCheck</p>
                  <p className="text-xl font-bold text-pink-400">
                    {result.validation.spotCheck?.score || 0}%
                  </p>
                </div>
              </div>
              <div className={`mt-3 p-3 rounded-lg ${
                result.validation.recommendation === 'approve'
                  ? 'bg-green-900/30 border border-green-700 text-green-400'
                  : result.validation.recommendation === 'needs-changes'
                  ? 'bg-yellow-900/30 border border-yellow-700 text-yellow-400'
                  : 'bg-red-900/30 border border-red-700 text-red-400'
              }`}>
                <p className="font-semibold">
                  Recommendation: {result.validation.recommendation.toUpperCase()}
                </p>
              </div>
            </div>
          )}

          {/* PR Info */}
          {result.prUrl && (
            <div className="p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">🌿 Pull Request</h3>
              <p className="text-sm mb-2">
                <span className="text-gray-400">Branch:</span>{' '}
                <code className="text-blue-400">{result.branchName}</code>
              </p>
              <p className="text-sm mb-3">
                <span className="text-gray-400">PR #{result.prNumber}:</span>{' '}
                <span className="text-gray-300">Draft Pull Request</span>
              </p>
              <a
                href={result.prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                🔗 Pull Request&apos;i Görüntüle
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}

          {/* Artifacts */}
          {result.artifacts && Object.keys(result.artifacts).length > 0 && (
            <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
              <h3 className="font-semibold text-lg mb-3">📄 Generated Artifacts</h3>
              <div className="space-y-2">
                {Object.entries(result.artifacts).map(([name, content]) => {
                  if (!content || typeof content !== 'string') return null;
                  return (
                    <details key={name} className="bg-gray-900 rounded-lg border border-gray-700">
                      <summary className="px-4 py-3 cursor-pointer hover:bg-gray-800 font-medium">
                        {name}
                      </summary>
                      <div className="px-4 py-3 border-t border-gray-700">
                        <pre className="text-xs overflow-x-auto whitespace-pre-wrap text-gray-300">
                          {String(content)}
                        </pre>
                      </div>
                    </details>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

