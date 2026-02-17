import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { WorkerCard } from '../../../components/agents/WorkerCard';
import { CrewChat } from '../../../components/agents/CrewChat';
import { CrewTaskBoard } from '../../../components/agents/CrewTaskBoard';
import { useCrewStream } from '../../../hooks/useCrewStream';
import { crewApi, type CrewRunDetail, type CrewMessage } from '../../../services/api/crew';
import { Skeleton, SkeletonCard } from '../../../components/ui/Skeleton';

type Tab = 'workers' | 'tasks' | 'chat' | 'merge';

const statusLabels: Record<string, string> = {
  planning: 'Planlanıyor',
  spawning: 'Başlatılıyor',
  running: 'Çalışıyor',
  merging: 'Birleştiriliyor',
  completed: 'Tamamlandı',
  failed: 'Başarısız',
};

const statusBadgeColors: Record<string, string> = {
  planning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  spawning: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  running: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  merging: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export const CrewRunPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [crewRun, setCrewRun] = useState<CrewRunDetail | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('workers');
  const [chatMessages, setChatMessages] = useState<CrewMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setTalkTarget] = useState<string | null>(null);

  const isActive = crewRun?.status === 'running' || crewRun?.status === 'spawning' || crewRun?.status === 'merging';
  const { events, isConnected, currentStatus } = useCrewStream(isActive ? id! : null);

  // Initial load
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const data = await crewApi.getCrewRun(id);
        setCrewRun(data);
        setChatMessages(data.messages || []);
      } catch (err) {
        console.error('Failed to load crew run:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Poll for updates when active
  useEffect(() => {
    if (!id || !isActive) return;
    const interval = setInterval(async () => {
      try {
        const data = await crewApi.getCrewRun(id);
        setCrewRun(data);
        setChatMessages(data.messages || []);
      } catch {
        // ignore polling errors
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [id, isActive]);

  // Process SSE events for chat messages
  useEffect(() => {
    const newMessages = events
      .filter(e => e.type === 'crew:message')
      .map(e => ({
        id: e.data.messageId as string,
        crewRunId: e.crewRunId,
        fromJobId: null,
        toJobId: null,
        fromRole: e.data.fromRole as string,
        toRole: e.data.toRole as string | null,
        content: e.data.content as string,
        messageType: e.data.messageType as string,
        createdAt: e.timestamp,
      }));

    if (newMessages.length > 0) {
      setChatMessages(prev => {
        const ids = new Set(prev.map(m => m.id));
        const toAdd = newMessages.filter(m => !ids.has(m.id));
        if (toAdd.length === 0) return prev;
        return [...prev, ...toAdd];
      });
    }
  }, [events]);

  const handleSendMessage = useCallback(async (toJobId: string, content: string) => {
    if (!id) return;
    try {
      const msg = await crewApi.sendMessage(id, toJobId, content);
      setChatMessages(prev => [...prev, msg]);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  }, [id]);

  const handleBroadcast = useCallback(async (content: string) => {
    if (!id) return;
    try {
      const msg = await crewApi.broadcast(id, content);
      setChatMessages(prev => [...prev, msg]);
    } catch (err) {
      console.error('Failed to broadcast:', err);
    }
  }, [id]);

  const handleCancel = useCallback(async () => {
    if (!id) return;
    try {
      await crewApi.cancelCrewRun(id);
      const data = await crewApi.getCrewRun(id);
      setCrewRun(data);
    } catch (err) {
      console.error('Failed to cancel:', err);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!crewRun) {
    return (
      <div className="text-center py-12 text-zinc-500">
        Crew run bulunamadı
      </div>
    );
  }

  const workerMap = new Map<string, { role: string; color: string }>();
  for (const w of crewRun.workers) {
    workerMap.set(w.id, {
      role: w.workerRole || 'unknown',
      color: w.workerColor || '#6366F1',
    });
  }

  const displayStatus = currentStatus || crewRun.status;

  return (
    <div className="flex flex-col h-full max-h-screen">
      {/* Header */}
      <div className="border-b border-zinc-700/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-100 mb-1">
              Crew Run
            </h1>
            <p className="text-sm text-zinc-400 line-clamp-2">{crewRun.goal}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Status badge */}
            <span className={`text-xs px-2.5 py-1 rounded-full border ${statusBadgeColors[displayStatus] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
              {statusLabels[displayStatus] || displayStatus}
            </span>

            {/* Progress */}
            <span className="text-sm text-zinc-400">
              {crewRun.completedWorkers}/{crewRun.totalWorkers} worker
            </span>

            {/* Connection status */}
            {isActive && (
              <span className={`inline-flex items-center gap-1 text-xs ${isConnected ? 'text-emerald-400' : 'text-zinc-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                {isConnected ? 'Canlı' : 'Bağlanıyor'}
              </span>
            )}

            {/* Cost */}
            {crewRun.totalCostUsd && (
              <span className="text-xs text-zinc-500">
                ${parseFloat(crewRun.totalCostUsd).toFixed(4)}
              </span>
            )}

            {/* Cancel button */}
            {isActive && (
              <button
                onClick={handleCancel}
                className="text-xs px-3 py-1.5 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
              >
                İptal Et
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-700/50 px-6">
        <div className="flex gap-1">
          {(['workers', 'tasks', 'chat', 'merge'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'text-zinc-100 border-indigo-500'
                  : 'text-zinc-500 border-transparent hover:text-zinc-300'
              }`}
            >
              {tab === 'workers' ? 'Çalışanlar' :
               tab === 'tasks' ? 'Görevler' :
               tab === 'chat' ? 'Mesajlar' :
               'Birleşik Çıktı'}
              {tab === 'chat' && chatMessages.length > 0 && (
                <span className="ml-1.5 text-xs text-zinc-500">({chatMessages.length})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        {activeTab === 'workers' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {crewRun.workers.map(worker => (
              <WorkerCard
                key={worker.id}
                jobId={worker.id}
                role={worker.workerRole || 'unknown'}
                agentType={worker.type}
                color={worker.workerColor || '#6366F1'}
                state={worker.state}
                workerIndex={worker.workerIndex || 0}
                tokenUsage={worker.aiTotalTokens}
                costUsd={worker.aiEstimatedCostUsd}
                error={worker.error}
                onTalk={(jobId) => {
                  setTalkTarget(jobId);
                  setActiveTab('chat');
                }}
              />
            ))}
          </div>
        )}

        {activeTab === 'tasks' && (
          <CrewTaskBoard tasks={crewRun.tasks} workerMap={workerMap} />
        )}

        {activeTab === 'chat' && (
          <div className="h-[calc(100vh-16rem)]">
            <CrewChat
              messages={chatMessages}
              workers={crewRun.workers}
              onSendMessage={handleSendMessage}
              onBroadcast={handleBroadcast}
            />
          </div>
        )}

        {activeTab === 'merge' && (
          <div className="space-y-4">
            {crewRun.status === 'completed' && crewRun.mergedOutput ? (
              <div className="prose prose-invert max-w-none">
                <pre className="bg-zinc-800/50 rounded-lg p-4 text-sm text-zinc-300 overflow-auto whitespace-pre-wrap">
                  {typeof crewRun.mergedOutput === 'string'
                    ? crewRun.mergedOutput
                    : JSON.stringify(crewRun.mergedOutput, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="text-center py-12 text-zinc-500">
                {crewRun.status === 'merging'
                  ? 'Çıktılar birleştiriliyor...'
                  : 'Tüm çalışanlar tamamlandığında birleşik çıktı burada görünecek'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CrewRunPage;
