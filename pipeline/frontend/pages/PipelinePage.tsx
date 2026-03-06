import { useState, useRef, useEffect, useCallback } from 'react';
import type { Pipeline, PipelineStage } from '../types';
import { PipelineProgress } from '../components/PipelineProgress';
import { ChatMessage } from '../components/ChatMessage';
import { SpecPreviewCard } from '../components/SpecPreviewCard';
import { AgentStatusIndicator } from '../components/AgentStatusIndicator';
import { PipelineErrorCard } from '../components/ErrorBoundary';
import { RepoNameInput } from '../components/RepoNameInput';
import { CompletionScreen } from '../components/CompletionScreen';

const API_BASE = '/api/pipelines';

export function PipelinePage() {
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [history, setHistory] = useState<Pipeline[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [pipeline?.scribeConversation.length, scrollToBottom]);

  useEffect(() => {
    fetchHistory();
  }, []);

  // ─── API Calls ──────────────────────────────

  async function fetchHistory() {
    try {
      const res = await fetch(API_BASE);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.pipelines ?? []);
      }
    } catch {
      // silently fail
    }
  }

  async function startPipeline() {
    if (!input.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: input }),
      });
      const data = await res.json();
      setPipeline(data.pipeline);
      setInput('');
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!pipeline || !input.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${pipeline.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      setPipeline(data.pipeline);
      setInput('');
    } finally {
      setLoading(false);
    }
  }

  async function approveSpec(repoName: string, visibility: 'public' | 'private') {
    if (!pipeline || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${pipeline.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoName, repoVisibility: visibility }),
      });
      const data = await res.json();
      setPipeline(data.pipeline);
    } finally {
      setLoading(false);
    }
  }

  async function rejectSpec(feedback: string) {
    if (!pipeline || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${pipeline.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
      });
      const data = await res.json();
      setPipeline(data.pipeline);
    } finally {
      setLoading(false);
    }
  }

  async function retryStage() {
    if (!pipeline || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${pipeline.id}/retry`, { method: 'POST' });
      const data = await res.json();
      setPipeline(data.pipeline);
    } finally {
      setLoading(false);
    }
  }

  async function cancelPipeline() {
    if (!pipeline || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${pipeline.id}`, { method: 'DELETE' });
      const data = await res.json();
      setPipeline(data.pipeline);
    } finally {
      setLoading(false);
    }
  }

  async function skipTrace() {
    if (!pipeline || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${pipeline.id}/skip-trace`, { method: 'POST' });
      const data = await res.json();
      setPipeline(data.pipeline);
    } finally {
      setLoading(false);
    }
  }

  function startNewPipeline() {
    setPipeline(null);
    setInput('');
    fetchHistory();
  }

  function loadPipeline(p: Pipeline) {
    setPipeline(p);
    setShowHistory(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pipeline) {
      startPipeline();
    } else if (pipeline.stage === 'scribe_clarifying') {
      sendMessage();
    }
  }

  const isTerminal = pipeline?.stage === 'completed' || pipeline?.stage === 'completed_partial' || pipeline?.stage === 'cancelled';
  const isInputEnabled = !loading && (!pipeline || pipeline.stage === 'scribe_clarifying');
  const isWorking = pipeline?.stage === 'proto_building' || pipeline?.stage === 'trace_testing' || pipeline?.stage === 'scribe_generating';

  return (
    <div className="h-screen flex flex-col bg-ak-bg">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-ak-border bg-ak-surface/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold text-ak-text-primary">AKIS</span>
            <span className="text-xs text-ak-text-secondary">Pipeline</span>
          </div>
          <div className="flex items-center gap-3">
            {/* History Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-xs text-ak-text-secondary hover:text-ak-text-primary transition-colors px-3 py-1.5 rounded-lg border border-ak-border hover:border-ak-text-secondary/30"
              >
                Pipeline History
              </button>
              {showHistory && history.length > 0 && (
                <div className="absolute right-0 top-full mt-1 w-72 rounded-xl border border-ak-border bg-ak-surface-2 shadow-ak-lg overflow-hidden z-50">
                  {history.slice(0, 10).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => loadPipeline(p)}
                      className="w-full text-left px-4 py-3 hover:bg-ak-surface transition-colors border-b border-ak-border/50 last:border-0"
                    >
                      <p className="text-sm text-ak-text-primary truncate">{p.title ?? 'Untitled'}</p>
                      <p className="text-xs text-ak-text-secondary mt-0.5">{p.stage} — {new Date(p.createdAt).toLocaleDateString('tr-TR')}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {pipeline && !isTerminal && (
              <button
                onClick={cancelPipeline}
                className="text-xs text-ak-danger hover:text-ak-danger/80 transition-colors"
              >
                İptal
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      {pipeline && (
        <div className="flex-shrink-0 border-b border-ak-border bg-ak-surface/30">
          <div className="max-w-4xl mx-auto">
            <PipelineProgress stage={pipeline.stage} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
          {/* Welcome Screen */}
          {!pipeline && (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
              <h1 className="text-2xl font-semibold text-ak-text-primary mb-2">Yeni Proje Oluştur</h1>
              <p className="text-sm text-ak-text-secondary max-w-md">
                Fikrinizi anlatın, Scribe size sorular soracak, spec oluşturacak.
                Onayladığınızda Proto kodu üretecek ve Trace testleri yazacak.
              </p>
            </div>
          )}

          {/* Chat Messages */}
          {pipeline?.scribeConversation.map((msg, i) => (
            <ChatMessage
              key={i}
              message={msg}
              onSuggestionClick={(suggestion) => {
                setInput(suggestion);
              }}
            />
          ))}

          {/* Agent Status */}
          {isWorking && <AgentStatusIndicator stage={pipeline!.stage} />}

          {/* Spec Preview */}
          {pipeline?.stage === 'awaiting_approval' && pipeline.scribeOutput && (
            <div className="space-y-4">
              <SpecPreviewCard
                spec={pipeline.scribeOutput.spec}
                confidence={pipeline.scribeOutput.confidence}
                onApprove={() => {/* RepoNameInput handles this */}}
                onReject={rejectSpec}
                onRegenerate={() => rejectSpec('Lütfen spec\'i tamamen yeniden oluştur.')}
                disabled={loading}
              />
              <RepoNameInput
                defaultName={deriveRepoName(pipeline.scribeOutput.spec.title)}
                onSubmit={approveSpec}
                disabled={loading}
              />
            </div>
          )}

          {/* Error */}
          {pipeline?.stage === 'failed' && pipeline.error && (
            <PipelineErrorCard
              error={pipeline.error}
              onRetry={retryStage}
              onStartOver={startNewPipeline}
            />
          )}

          {/* Skip Trace option */}
          {pipeline?.stage === 'trace_testing' && (
            <div className="flex justify-center">
              <button
                onClick={skipTrace}
                disabled={loading}
                className="text-xs text-ak-text-secondary hover:text-ak-text-primary transition-colors"
              >
                Trace'i atla (testsiz tamamla)
              </button>
            </div>
          )}

          {/* Completion Screen */}
          {isTerminal && pipeline?.stage !== 'cancelled' && (
            <CompletionScreen pipeline={pipeline!} onNewPipeline={startNewPipeline} />
          )}

          {/* Cancelled */}
          {pipeline?.stage === 'cancelled' && (
            <div className="flex flex-col items-center py-8">
              <p className="text-sm text-ak-text-secondary mb-4">Pipeline iptal edildi.</p>
              <button
                onClick={startNewPipeline}
                className="px-5 py-2 text-sm rounded-xl bg-ak-primary text-ak-bg font-medium hover:bg-ak-primary/90 transition-all"
              >
                Yeni Pipeline Başlat
              </button>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </main>

      {/* Input Bar */}
      {isInputEnabled && (
        <div className="flex-shrink-0 border-t border-ak-border bg-ak-surface/50 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={!pipeline ? 'Projenizi anlatın...' : 'Cevabınızı yazın...'}
                className="flex-1 bg-ak-surface-2 border border-ak-border rounded-xl px-4 py-2.5 text-sm text-ak-text-primary placeholder:text-ak-text-secondary/50 focus:outline-none focus:border-ak-primary/40 transition-colors"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-5 py-2.5 text-sm rounded-xl bg-ak-primary text-ak-bg font-medium hover:bg-ak-primary/90 shadow-ak-glow-sm disabled:opacity-50 transition-all"
              >
                {loading ? '...' : 'Gönder'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function deriveRepoName(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}
