import { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { ConversationSidebar } from '../../components/chat/ConversationSidebar';
import { ChatPanel } from '../../components/chat/ChatPanel';
import { EmptyState } from '../../components/chat/EmptyState';
import { useConversationState } from '../../hooks/useConversationState';
import { usePipelineStream } from '../../hooks/usePipelineStream';
import { useProfileCompleteness } from '../../hooks/useProfileCompleteness';
import { ProfileSetupBanner } from '../../components/onboarding/ProfileSetupBanner';
import { ProfileSetupWizard } from '../../components/onboarding/ProfileSetupWizard';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { mapStageToMode } from '../../utils/mapPipelineEvent';
import type { ConversationListItem, ChatMessage, ConversationStatus } from '../../types/chat';
import type { Workflow, WorkflowStatus, ConversationMessage, StructuredSpec } from '../../types/workflow';
import type { UserFriendlyPlan } from '../../types/plan';
import type { PipelineStage } from '../../types/pipeline';
import { workflowsApi } from '../../services/api/workflows';
import { LOGO_MARK_SVG } from '../../theme/brand';

const PreviewPanel = lazy(() => import('../../components/workflow/PreviewPanel').then(m => ({ default: m.PreviewPanel })));

/* ── helpers ──────────────────────────────────────── */

const POLLING_STAGES: PipelineStage[] = [
  'scribe_generating', 'proto_building', 'trace_testing', 'ci_running',
];

function isRunningStage(stage?: PipelineStage): boolean {
  return !!stage && POLLING_STAGES.includes(stage);
}

/** Converts a human-readable title to a valid GitHub repo name */
function sanitizeRepoName(title: string): string {
  const TR_MAP: Record<string, string> = {
    ç: 'c', Ç: 'C', ğ: 'g', Ğ: 'G', ı: 'i', İ: 'I',
    ö: 'o', Ö: 'O', ş: 's', Ş: 'S', ü: 'u', Ü: 'U',
  };
  return title
    .replace(/[çÇğĞıİöÖşŞüÜ]/g, (c) => TR_MAP[c] || c)
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'project';
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
    repoFullName: w.stages.proto.repo ?? w.title ?? '',
    repoShortName: w.title || 'Untitled',
    status: statusMap[w.status] ?? 'idle',
    fileCount: w.stages.proto.files?.length ?? 0,
    lastActivity: w.updatedAt ?? w.createdAt,
    branch: w.stages.proto.branch,
    prUrl: undefined,
  };
}

function specToUserFriendlyPlan(spec: StructuredSpec): UserFriendlyPlan {
  const tc = spec.technicalConstraints;
  let techChoices: string[] = [];
  if (Array.isArray(tc)) {
    techChoices = tc;
  } else if (tc && typeof tc === 'object') {
    if (tc.stack) techChoices.push(tc.stack);
    if (tc.integrations) techChoices.push(...tc.integrations);
  }

  return {
    projectName: spec.title ?? 'Proje',
    summary: spec.problemStatement,
    features: spec.userStories.map((s) => {
      const action = s.action || s.iWant || '';
      const benefit = s.benefit || s.soThat || '';
      return {
        name: action,
        description: benefit,
      };
    }),
    techChoices,
    estimatedFiles: Math.max((spec.userStories?.length ?? 1) * 3, 5),
    requiresTests: true,
  };
}

function conversationToChatMessages(conv: ConversationMessage[], currentStage?: PipelineStage): ChatMessage[] {
  const msgs: ChatMessage[] = [];
  let specSeen = false;

  for (const m of conv) {
    const ts = m.timestamp ?? new Date().toISOString();
    switch (m.role) {
      case 'user':
        msgs.push({ type: 'user', content: m.content, timestamp: ts });
        break;
      case 'scribe':
      case 'proto':
      case 'trace':
        if (m.type === 'trace_result' && m.traceResult) {
          const tr = m.traceResult;
          msgs.push({
            type: 'test_result',
            passed: tr.passing ?? 0,
            failed: tr.failing ?? 0,
            total: tr.testCount ?? 0,
            coverage: tr.coverage ?? '0',
            testFiles: tr.testFiles?.map((f) => ({ filePath: f.path ?? f.name, testCount: f.lines ?? 0 })),
            coverageMatrix: tr.traceability?.reduce<Record<string, string[]>>((acc, t) => {
              if (!acc[t.criterionId]) acc[t.criterionId] = [];
              acc[t.criterionId].push(t.testFile);
              return acc;
            }, {}),
            coveredCriteria: tr.traceability?.filter((t) => t.coverage !== 'none').map((t) => t.criterionId).filter((v, i, a) => a.indexOf(v) === i),
            uncoveredCriteria: tr.traceability?.filter((t) => t.coverage === 'none').map((t) => t.criterionId).filter((v, i, a) => a.indexOf(v) === i),
            timestamp: ts,
          });
          // Append BDD/Gherkin spec message if features were generated
          if (tr.gherkinFeatures?.length) {
            msgs.push({
              type: 'gherkin_spec',
              features: tr.gherkinFeatures,
              totalScenarios: tr.gherkinFeatures.reduce((sum: number, f: { scenarioCount: number }) => sum + f.scenarioCount, 0),
              timestamp: ts,
            });
          }
        } else if (m.type === 'clarification' && m.questions?.length) {
          msgs.push({ type: 'clarification', role: m.role, content: m.content, questions: m.questions, timestamp: ts });
        } else if (m.type === 'spec' && m.spec) {
          specSeen = true;
          const plan = specToUserFriendlyPlan(m.spec);
          // Determine plan status from pipeline stage
          let planStatus: 'active' | 'approved' | 'rejected' = 'active';
          if (currentStage && currentStage !== 'awaiting_approval' && currentStage !== 'scribe_clarifying' && currentStage !== 'scribe_generating') {
            planStatus = 'approved';
          }
          msgs.push({
            type: 'plan',
            plan,
            version: 1,
            status: planStatus,
            spec: m.spec,
            timestamp: ts,
          });
        } else {
          msgs.push({ type: 'agent', agent: m.role, content: m.content, timestamp: ts });
        }
        break;
      case 'system':
        // Check if system message indicates approval/rejection and update last plan
        if (specSeen && (m.content.includes('onaylandı') || m.content.includes('reddedildi'))) {
          for (let j = msgs.length - 1; j >= 0; j--) {
            if (msgs[j].type === 'plan') {
              (msgs[j] as { status: string }).status = m.content.includes('onaylandı') ? 'approved' : 'rejected';
              break;
            }
          }
        }
        msgs.push({ type: 'info', content: m.content, timestamp: ts });
        break;
    }
  }
  return msgs;
}

// Removed RUNNING_STATUSES — polling now uses isRunningStage(currentStage)

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
  // Sidebar collapse: tablet (md-lg) collapsed, desktop (lg+) expanded
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    const w = window.innerWidth;
    return w >= 768 && w < 1024;
  });
  // Pending new conversation — created locally, pipeline not yet started on backend
  const [pendingConv, setPendingConv] = useState<{ displayName: string } | null>(null);
  const [showProfileWizard, setShowProfileWizard] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { missingSteps, loading: profileLoading } = useProfileCompleteness();

  // Auto-collapse sidebar on tablet resize + re-sync on mount/navigation
  useEffect(() => {
    const syncCollapse = () => {
      const w = window.innerWidth;
      if (w >= 768 && w < 1024) setSidebarCollapsed(true);
      else if (w >= 1024) setSidebarCollapsed(false);
      // < 768: mobile uses sidebarOpen (overlay), not collapsed
    };
    // Re-sync immediately on mount (handles navigation/refresh)
    syncCollapse();
    window.addEventListener('resize', syncCollapse);
    return () => window.removeEventListener('resize', syncCollapse);
  }, []);

  const stage = activeWorkflow?.currentStage;
  const { uiState, isInputEnabled, showCancelButton, inputPlaceholder, syncFromStage } =
    useConversationState(stage);

  const loadedIdRef = useRef<string | undefined>(undefined);

  const isRunning = activeWorkflow ? isRunningStage(activeWorkflow.currentStage) : false;
  const { activities: pipelineActivities, currentStep, createdFiles } = usePipelineStream(conversationId ?? '', isRunning);

  // Load conversation list — only on mount and after mutations, NOT on every chat switch
  const refreshList = useCallback(() => {
    workflowsApi.list().then((workflows) => {
      // Hide cancelled pipelines from sidebar
      setConversations(workflows.filter((w) => w.status !== 'cancelled').map(workflowToListItem));
    }).catch((e) => {
      console.warn('Failed to load conversation list:', e);
    });
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

    // Mark immediately to prevent double-fetch on rapid navigation
    const targetId = conversationId;
    loadedIdRef.current = targetId;

    // Different chat — load without clearing (keeps old content visible during fetch)
    workflowsApi.get(targetId).then((w) => {
      // Stale response guard: skip if user navigated away during fetch
      if (loadedIdRef.current !== targetId) return;
      setActiveWorkflow(w);
      setMessages(conversationToChatMessages(w.conversation ?? [], w.currentStage));
      syncFromStage(w.currentStage ?? 'completed');
    }).catch(() => {
      if (loadedIdRef.current !== targetId) return;
      navigate('/chat', { replace: true });
    });
  }, [conversationId, navigate, syncFromStage]);

  // Polling for updates — only when agent is running
  const prevConvLenRef = useRef(0);
  const activeStageRef = useRef(activeWorkflow?.currentStage);
  activeStageRef.current = activeWorkflow?.currentStage;

  useEffect(() => {
    if (!conversationId || !isRunning) return;
    const controller = new AbortController();
    const interval = setInterval(async () => {
      if (controller.signal.aborted) return;
      try {
        const w = await workflowsApi.get(conversationId);
        if (controller.signal.aborted) return; // stale response guard
        const convLen = w.conversation?.length ?? 0;
        const stageChanged = w.currentStage !== activeStageRef.current;
        if (convLen === prevConvLenRef.current && !stageChanged) return;
        prevConvLenRef.current = convLen;
        setActiveWorkflow(w);
        setMessages(conversationToChatMessages(w.conversation ?? [], w.currentStage));
        syncFromStage(w.currentStage ?? 'completed');
      } catch { /* ignore */ }
    }, 3000);
    return () => { controller.abort(); clearInterval(interval); };
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

  // Proto files for StackBlitz preview
  const protoFiles = useMemo(() => {
    const protoMsg = activeWorkflow?.conversation?.find(m => m.type === 'proto_result');
    if (!protoMsg?.protoResult?.files) return null;
    const files: Record<string, string> = {};
    for (const f of protoMsg.protoResult.files) {
      const path = f.path ?? f.name;
      if (path && f.content) files[path] = f.content;
    }
    return Object.keys(files).length > 0 ? files : null;
  }, [activeWorkflow]);

  // Chat mode (Plan/Act/Ask/Review)
  const chatMode = useMemo(() => mapStageToMode(activeWorkflow?.currentStage), [activeWorkflow?.currentStage]);

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
    setMessages(conversationToChatMessages(w.conversation ?? [], w.currentStage));
    syncFromStage(w.currentStage ?? 'completed');
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
        setMessages(conversationToChatMessages(w.conversation ?? [], w.currentStage));
        syncFromStage(w.currentStage ?? 'completed');
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
      await workflowsApi.approve(conversationId, sanitizeRepoName(activeWorkflow.title ?? 'project'), 'private');
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
    <div className="flex h-screen overflow-hidden bg-ak-bg" role="application" aria-label="AKIS Chat">
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
          // Tablet+: sticky in flow, always visible, fixed height so it doesn't scroll with chat
          'md:sticky md:top-0 md:z-auto md:translate-x-0 md:h-screen',
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
          <div className="flex min-w-0 flex-1">
            <ErrorBoundary>
              <ChatPanel
                conversationId={conversationId ?? 'pending'}
                repoShortName={activeWorkflow?.title ?? pendingConv?.displayName ?? ''}
                repoFullName={activeWorkflow?.stages?.proto?.repo ?? ''}
                repoUrl={activeWorkflow?.stages?.proto?.repoUrl}
                branch={activeWorkflow?.stages?.proto?.branch}
                mode={chatMode}
                hasPreview={!!protoFiles}
                showPreview={showPreview}
                onTogglePreview={() => setShowPreview(p => !p)}
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
                currentStep={currentStep}
                activities={pipelineActivities}
                createdFiles={createdFiles}
              />
            </ErrorBoundary>
            {showPreview && protoFiles && (
              <div className="hidden w-1/2 border-l border-ak-border lg:block">
                <Suspense fallback={<div className="flex h-full items-center justify-center text-ak-text-tertiary text-sm">Yükleniyor...</div>}>
                  <PreviewPanel files={protoFiles} title={activeWorkflow?.title} branch={activeWorkflow?.stages?.proto?.branch} />
                </Suspense>
              </div>
            )}
          </div>
        ) : (
          <EmptyState variant="no-conversation" onNewConversation={handleNewConversation} />
        )}
      </div>

    </div>
  );
}
