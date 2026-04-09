import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { ConversationSidebar } from '../../components/chat/ConversationSidebar';
import { ChatPanel } from '../../components/chat/ChatPanel';
import { EmptyState } from '../../components/chat/EmptyState';
// NewConversationModal removed — "Yeni Sohbet" opens empty chat directly
import { useConversationState } from '../../hooks/useConversationState';
import { usePipelineStream } from '../../hooks/usePipelineStream';
import { useProfileCompleteness } from '../../hooks/useProfileCompleteness';
import { ProfileSetupBanner } from '../../components/onboarding/ProfileSetupBanner';
import { ProfileSetupWizard } from '../../components/onboarding/ProfileSetupWizard';
import type { ConversationListItem, ChatMessage, ConversationStatus } from '../../types/chat';
import type { Workflow, WorkflowStatus, ConversationMessage } from '../../types/workflow';
import type { PipelineStage } from '../../types/pipeline';
import { workflowsApi } from '../../services/api/workflows';
import { LOGO_MARK_SVG } from '../../theme/brand';

/* ── helpers ──────────────────────────────────────── */

function workflowStatusToStage(s: WorkflowStatus): PipelineStage {
  switch (s) {
    case 'running':       return 'scribe_generating';
    case 'awaiting_approval': return 'awaiting_approval';
    case 'completed':     return 'completed';
    case 'completed_partial': return 'completed_partial';
    case 'failed':        return 'failed';
    case 'cancelled':     return 'cancelled';
    default:              return 'scribe_generating';
  }
}

function workflowToListItem(w: Workflow): ConversationListItem {
  const statusMap: Record<WorkflowStatus, ConversationStatus> = {
    pending: 'idle',
    running: 'running',
    awaiting_approval: 'awaiting_approval',
    completed: 'idle',
    completed_partial: 'idle',
    failed: 'error',
    cancelled: 'idle',
  };
  return {
    id: w.id,
    title: w.title || 'Untitled',
    repoFullName: w.stages.proto.branch ?? w.title ?? '',
    repoShortName: w.title || 'Untitled',
    status: statusMap[w.status] ?? 'idle',
    fileCount: w.stages.proto.files?.length ?? 0,
    lastActivity: w.updatedAt ?? w.createdAt,
    branch: w.stages.proto.branch,
    prUrl: undefined,
  };
}

function conversationToChatMessages(conv: ConversationMessage[]): ChatMessage[] {
  const msgs: ChatMessage[] = [];
  for (const m of conv) {
    const ts = m.timestamp ?? new Date().toISOString();
    switch (m.role) {
      case 'user':
        msgs.push({ type: 'user', content: m.content, timestamp: ts });
        break;
      case 'scribe':
      case 'proto':
      case 'trace':
        msgs.push({ type: 'agent', agent: m.role, content: m.content, timestamp: ts });
        break;
      case 'system':
        msgs.push({ type: 'info', content: m.content, timestamp: ts });
        break;
    }
  }
  return msgs;
}

const RUNNING_STATUSES: WorkflowStatus[] = ['running', 'pending'];

/* ── component ────────────────────────────────────── */

export default function ChatPage() {
  const akisLogoUrl = LOGO_MARK_SVG;
  // Single splat route: /chat/* — extract id from the splat param
  const { '*': splatParam } = useParams();
  const conversationId = splatParam || undefined;
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [activeWorkflow, setActiveWorkflow] = useState<Workflow | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [creating, setCreating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Tablet (md-lg): auto-collapse sidebar; Desktop (lg+): expanded
  const isTablet = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isTablet);
  // Pending new conversation — created locally, pipeline not yet started on backend
  const [pendingConv, setPendingConv] = useState<{ displayName: string } | null>(null);
  const [showProfileWizard, setShowProfileWizard] = useState(false);
  const { missingSteps, loading: profileLoading } = useProfileCompleteness();

  // Auto-collapse sidebar on tablet resize
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w >= 768 && w < 1024) setSidebarCollapsed(true);
      else if (w >= 1024) setSidebarCollapsed(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const stage = activeWorkflow ? workflowStatusToStage(activeWorkflow.status) : undefined;
  const { uiState, isInputEnabled, showCancelButton, inputPlaceholder, syncFromStage } =
    useConversationState(stage);

  const loadedIdRef = useRef<string | undefined>(undefined);

  const isRunning = activeWorkflow ? RUNNING_STATUSES.includes(activeWorkflow.status) : false;
  usePipelineStream(conversationId ?? '', isRunning);

  // Load conversation list — only on mount and after mutations, NOT on every chat switch
  const refreshList = useCallback(() => {
    workflowsApi.list().then((workflows) => {
      // Hide cancelled pipelines from sidebar
      setConversations(workflows.filter((w) => w.status !== 'cancelled').map(workflowToListItem));
    }).catch(() => {});
  }, []);

  useEffect(() => { refreshList(); }, [refreshList]);

  // Load active conversation — keep old content visible until new data arrives
  useEffect(() => {
    if (!conversationId) {
      // Going to /chat (no id) — only clear if we had a conversation before
      if (loadedIdRef.current) {
        setActiveWorkflow(null);
        setMessages([]);
        loadedIdRef.current = undefined;
      }
      return;
    }

    // Same chat — skip
    if (loadedIdRef.current === conversationId) return;

    // Different chat — load without clearing (keeps old content visible during fetch)
    workflowsApi.get(conversationId).then((w) => {
      loadedIdRef.current = conversationId;
      setActiveWorkflow(w);
      setMessages(conversationToChatMessages(w.conversation ?? []));
      syncFromStage(workflowStatusToStage(w.status));
    }).catch(() => {
      navigate('/chat', { replace: true });
    });
  }, [conversationId, navigate, syncFromStage]);

  // Polling for updates — only when agent is running
  useEffect(() => {
    if (!conversationId || !isRunning) return;
    const interval = setInterval(async () => {
      try {
        const w = await workflowsApi.get(conversationId);
        setActiveWorkflow(w);
        setMessages(conversationToChatMessages(w.conversation ?? []));
        syncFromStage(workflowStatusToStage(w.status));
      } catch { /* ignore */ }
    }, 3000);
    return () => clearInterval(interval);
  }, [conversationId, isRunning, syncFromStage]);

  // Sidebar conversations: real + pending
  const sidebarConversations = useMemo(() => {
    const list = [...conversations];
    if (pendingConv) {
      list.unshift({
        id: 'pending',
        title: pendingConv.displayName,
        repoFullName: '',
        repoShortName: pendingConv.displayName,
        status: 'idle' as ConversationStatus,
        fileCount: 0,
        lastActivity: new Date().toISOString(),
      });
    }
    return list;
  }, [conversations, pendingConv]);

  const handleRename = useCallback(async (id: string, newTitle: string) => {
    // Update locally immediately
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c)),
    );
    // Title rename is local-only (backend persistence planned for M2)
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (id === 'pending') {
      setPendingConv(null);
      return;
    }
    try {
      await workflowsApi.cancel(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (conversationId === id) navigate('/chat', { replace: true });
    } catch (e) {
      console.error('Failed to delete:', e);
    }
  }, [conversationId, navigate]);

  const refreshWorkflow = useCallback(async () => {
    if (!conversationId) return;
    const w = await workflowsApi.get(conversationId);
    loadedIdRef.current = conversationId;
    setActiveWorkflow(w);
    setMessages(conversationToChatMessages(w.conversation ?? []));
    syncFromStage(workflowStatusToStage(w.status));
    // Update sidebar item in-place (no full list refetch)
    const item = workflowToListItem(w);
    setConversations((prev) =>
      prev.some((c) => c.id === item.id) ? prev.map((c) => (c.id === item.id ? item : c)) : [item, ...prev],
    );
  }, [conversationId, syncFromStage]);

  // "Yeni Sohbet" — no modal, open empty chat directly
  const handleNewConversation = useCallback(() => {
    setPendingConv({ displayName: '' });
    setMessages([]);
    setActiveWorkflow(null);
    loadedIdRef.current = undefined;
    navigate('/chat');
  }, [navigate]);

  const handleSend = useCallback(async (content: string) => {
    const userMsg: ChatMessage = { type: 'user', content, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);

    // If pending new conversation — create pipeline with first message as idea
    if (pendingConv && !conversationId) {
      // Client-side validation: idea must be at least 10 chars
      if (content.trim().length < 10) {
        setMessages((prev) => [...prev, {
          type: 'error',
          agent: 'system',
          message: 'Fikrinizi en az 10 karakter ile açıklayın. Örn: "React ile basit bir todo uygulaması"',
          retryable: false,
          timestamp: new Date().toISOString(),
        }]);
        return;
      }

      try {
        setCreating(true);
        const w = await workflowsApi.create({ idea: content });
        setPendingConv(null);
        loadedIdRef.current = w.id;
        setActiveWorkflow(w);
        setMessages(conversationToChatMessages(w.conversation ?? []));
        syncFromStage(workflowStatusToStage(w.status));
        refreshList();
        navigate(`/chat/${w.id}`, { replace: true });
      } catch (e) {
        console.error('Failed to create pipeline:', e);
        const errorMsg = e instanceof Error ? e.message : 'Pipeline oluşturulamadı.';
        setMessages((prev) => [...prev, {
          type: 'error',
          agent: 'system',
          message: errorMsg,
          retryable: true,
          timestamp: new Date().toISOString(),
        }]);
      } finally {
        setCreating(false);
      }
      return;
    }

    if (!conversationId) return;
    try {
      await workflowsApi.sendMessage(conversationId, content);
      await refreshWorkflow();
    } catch (e) {
      console.error('Failed to send:', e);
    }
  }, [conversationId, pendingConv, refreshWorkflow, refreshList, syncFromStage, navigate]);

  const handleApprove = useCallback(async () => {
    if (!conversationId || !activeWorkflow) return;
    try {
      await workflowsApi.approve(conversationId, activeWorkflow.title ?? 'project', 'private');
      await refreshWorkflow();
    } catch (e) { console.error('Failed to approve:', e); }
  }, [conversationId, activeWorkflow, refreshWorkflow]);

  const handleReject = useCallback(async () => {
    if (!conversationId) return;
    try { await workflowsApi.reject(conversationId); await refreshWorkflow(); }
    catch (e) { console.error('Failed to reject:', e); }
  }, [conversationId, refreshWorkflow]);

  const handleCancel = useCallback(async () => {
    if (!conversationId) return;
    try { await workflowsApi.cancel(conversationId); await refreshWorkflow(); }
    catch (e) { console.error('Failed to cancel:', e); }
  }, [conversationId, refreshWorkflow]);

  const handleRetry = useCallback(async () => {
    if (!conversationId) return;
    try { await workflowsApi.retry(conversationId); await refreshWorkflow(); }
    catch (e) { console.error('Failed to retry:', e); }
  }, [conversationId, refreshWorkflow]);

  const handleSkip = useCallback(async () => {
    if (!conversationId) return;
    try { await workflowsApi.skipTrace(conversationId); await refreshWorkflow(); }
    catch (e) { console.error('Failed to skip:', e); }
  }, [conversationId, refreshWorkflow]);

  return (
    <div className="flex h-screen overflow-hidden bg-ak-bg">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar:
          Mobile (<768): hidden, slide-in overlay via hamburger
          Tablet (768-1023): collapsed 64px, relative in flow
          Desktop (≥1024): full 280px, relative in flow */}
      <div
        className={cn(
          'flex-shrink-0 transition-transform duration-200 ease-out',
          // Mobile: fixed overlay, hidden by default
          'fixed inset-y-0 left-0 z-40',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          // Tablet+: relative in flow, always visible
          'md:relative md:z-auto md:translate-x-0',
        )}
      >
        <ConversationSidebar
          conversations={sidebarConversations}
          activeId={conversationId ?? (pendingConv ? 'pending' : undefined)}
          onNewConversation={handleNewConversation}
          onRename={handleRename}
          onDelete={handleDelete}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile top bar — only visible below md */}
      <div className="absolute left-0 right-0 top-0 z-20 flex items-center gap-3 border-b border-ak-border bg-ak-surface px-4 py-3 md:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Menü"
          className="rounded-lg p-1.5 text-ak-text-secondary hover:bg-ak-surface-2 hover:text-ak-text-primary"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <img src={akisLogoUrl} alt="AKIS" className="h-7 w-7 object-contain" />
        <span className="text-[15px] font-extrabold tracking-tight text-ak-primary">AKIS</span>
      </div>

      {/* Profile setup wizard modal */}
      {showProfileWizard && (
        <ProfileSetupWizard onClose={() => setShowProfileWizard(false)} />
      )}

      {/* Main content — top padding only on mobile for the top bar */}
      <div className={cn('flex min-w-0 flex-1 flex-col', 'pt-[52px] md:pt-0')}>
        {/* Profile completeness banner */}
        {!profileLoading && missingSteps.length > 0 && !conversationId && !pendingConv && (
          <ProfileSetupBanner
            missingSteps={missingSteps}
            onSetup={() => setShowProfileWizard(true)}
          />
        )}

        {conversationId || pendingConv ? (
          <ChatPanel
            conversationId={conversationId ?? 'pending'}
            repoShortName={activeWorkflow?.title ?? pendingConv?.displayName ?? ''}
            repoFullName={activeWorkflow?.stages?.proto?.branch ?? ''}
            branch={activeWorkflow?.stages?.proto?.branch}
            messages={messages}
            uiState={uiState}
            isInputEnabled={pendingConv ? !creating : isInputEnabled}
            showCancelButton={showCancelButton}
            inputPlaceholder={pendingConv ? 'Projenizi anlatın...' : inputPlaceholder}
            onSend={handleSend}
            onCancel={handleCancel}
            onApprove={handleApprove}
            onReject={handleReject}
            onRetry={handleRetry}
            onSkip={handleSkip}
            onBack={() => { setPendingConv(null); navigate('/chat'); }}
            showBackButton
          />
        ) : (
          <EmptyState variant="no-conversation" onNewConversation={handleNewConversation} />
        )}
      </div>

    </div>
  );
}
