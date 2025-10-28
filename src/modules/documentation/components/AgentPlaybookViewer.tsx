'use client';

import { useState, useEffect } from 'react';

export function AgentPlaybookViewer() {
  const [agentInfo, setAgentInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgentInfo();
  }, []);

  const fetchAgentInfo = async () => {
    try {
      const response = await fetch('/api/agent/info?agentId=document-agent-001');
      const data = await response.json();
      
      if (data.success) {
        setAgentInfo(data.agent);
      }
    } catch (error) {
      console.error('Failed to fetch agent info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-800 rounded-xl border border-gray-700 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!agentInfo) {
    return (
      <div className="p-6 bg-gray-800 rounded-xl border border-red-700">
        <p className="text-red-400">Agent bilgisi yüklenemedi</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 bg-gray-800 rounded-xl border border-gray-700">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🤖</span>
          <div>
            <h2 className="text-2xl font-bold text-white">{agentInfo.name}</h2>
            <p className="text-sm text-gray-400">
              {agentInfo.type} • v{agentInfo.version}
            </p>
          </div>
        </div>
        <p className="text-gray-300 mt-3">{agentInfo.description}</p>
      </div>

      {/* Capabilities */}
      <div className="p-6 bg-gray-800 rounded-xl border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span>⚡</span>
          Yetenekler ({agentInfo.capabilities.length})
        </h3>
        <div className="space-y-3">
          {agentInfo.capabilities.map((cap: any, idx: number) => (
            <div key={cap.id} className="p-4 bg-gray-900 rounded-lg border border-gray-700">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white">{cap.name}</h4>
                  <p className="text-sm text-gray-400 mt-1">{cap.description}</p>
                  <div className="mt-2 inline-block px-2 py-1 bg-gray-800 rounded text-xs text-gray-300 font-mono">
                    {cap.id}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rules */}
      <div className="p-6 bg-gray-800 rounded-xl border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span>📋</span>
          Kurallar ve Kısıtlamalar
        </h3>
        <div className="space-y-2">
          {agentInfo.rules.map((rule: any) => (
            <div key={rule.id} className="p-3 bg-gray-900 rounded-lg border border-gray-700">
              <div className="flex items-start gap-2">
                <span className={`
                  px-2 py-1 rounded text-xs font-medium shrink-0
                  ${rule.priority === 'high' ? 'bg-red-900/30 text-red-300 border border-red-700' : ''}
                  ${rule.priority === 'medium' ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-700' : ''}
                  ${rule.priority === 'low' ? 'bg-gray-700 text-gray-300' : ''}
                `}>
                  {rule.priority.toUpperCase()}
                </span>
                <p className="text-sm text-gray-300 flex-1">{rule.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
        <p className="text-sm text-blue-300">
          💡 <strong>Playbook:</strong> Bu agent, yukarıdaki yetenekler ve kurallara göre çalışır. 
          Tüm işlemler bu contract'a uygun şekilde gerçekleştirilir.
        </p>
      </div>
    </div>
  );
}

