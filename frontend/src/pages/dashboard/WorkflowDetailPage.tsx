import { useEffect, useState, useCallback, useRef, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../components/workflow/StatusBadge';
import { StageTimeline } from '../../components/workflow/StageTimeline';
import { WorkflowChatView } from '../../components/workflow/WorkflowChatView';
import { FileManager } from '../../components/workflow/FileManager';
import { CodeViewer } from '../../components/workflow/CodeViewer';
import { PreviewPanel } from '../../components/workflow/PreviewPanel';
import { MiniPipeline } from '../../components/workflow/MiniPipeline';
import { GitFlowView } from '../../components/workflow/GitFlowView';
import { workflowsApi } from '../../services/api/workflows';
import { usePipelineStream } from '../../hooks/usePipelineStream';
import { TR } from '../../constants/tr';
import type { Workflow } from '../../types/workflow';

const IDELayout = lazy(() =>
  import('../../components/ide/IDELayout').then((m) => ({ default: m.IDELayout })),
);

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'az önce';
  if (mins < 60) return `${mins}dk önce`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}sa önce`;
  return `${Math.floor(hrs / 24)}g önce`;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getRepoInfo(workflow: Workflow): { owner: string; repo: string; branch: string } | null {
  const protoMsg = workflow.conversation?.find(m => m.type === 'proto_result');
  const repo = protoMsg?.protoResult?.repo;
  const branch = protoMsg?.protoResult?.branch || workflow.stages.proto.branch;
  if (!repo || !branch) return null;
  const parts = repo.split('/');
  if (parts.length === 2) return { owner: parts[0], repo: parts[1], branch };
  return { owner: 'OmerYasirOnal', repo, branch };
}

// Main area: chat | stages | preview (preview is now a tab, NOT a right panel)
type MainView = 'chat' | 'stages' | 'preview';
// Right panel: files/code only (preview removed)
type RightPanelView = 'files' | 'code' | null;

function GitContextBar({ owner, repo, branch }: { owner: string; repo: string; branch: string }) {
  const [copied, setCopied] = useState(false);

  const handleClone = async () => {
    const cmd = `git clone https://github.com/${owner}/${repo}.git && cd ${repo} && git checkout ${branch}`;
    try {
      await navigator.clipboard.writeText(cmd);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* noop */ }
  };

  const compareUrl = `https://github.com/${owner}/${repo}/compare/main...${branch}?expand=1`;

  return (
    <div className="mt-1.5 flex items-center gap-2 text-[11px]">
      <code className="flex items-center gap-1 rounded bg-ak-surface-2 px-1.5 py-0.5 font-mono text-ak-text-secondary">
        &lt;/&gt; {branch}
      </code>
      <button
        onClick={handleClone}
        className="flex items-center gap-1 rounded px-1.5 py-0.5 font-medium text-ak-text-tertiary transition-colors hover:bg-ak-hover hover:text-ak-text-secondary"
      >
        {copied ? `✓ ${TR.copiedLabel}` : `📋 ${TR.cloneRepo}`}
      </button>
      <a
        href={`https://github.com/${owner}/${repo}/tree/${branch}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 rounded px-1.5 py-0.5 font-medium text-ak-text-tertiary transition-colors hover:bg-ak-hover hover:text-ak-text-secondary"
      >
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
        GitHub
      </a>
      <a
        href={compareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 rounded px-1.5 py-0.5 font-medium text-ak-text-tertiary transition-colors hover:bg-ak-hover hover:text-ak-text-secondary"
      >
        {TR.createPR}
      </a>
    </div>
  );
}

export default function WorkflowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mainView, setMainView] = useState<MainView>('chat');
  const [ideMode, setIdeMode] = useState(false);

  // Right panel — files/code only
  const [rightPanel, setRightPanel] = useState<RightPanelView>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<{
    content: string;
    language: string;
    lines: number;
    agent: 'proto' | 'trace';
  } | null>(null);
  const [fileLoading, setFileLoading] = useState(false);

  // Preview files state — fetched once when proto completes
  const [previewFiles, setPreviewFiles] = useState<Record<string, string> | null>(null);
  const [previewFilesLoading, setPreviewFilesLoading] = useState(false);
  const previewFilesFetchedRef = useRef(false);

  const isValidId = id && UUID_RE.test(id);

  // SSE stream for real-time activity tracking
  const isStreamActive =
    workflow?.status === 'running' ||
    workflow?.status === 'awaiting_approval';
  const { activities, currentStep, isConnected, progressByStage } =
    usePipelineStream(workflow?.id, !!isStreamActive);

  const fetchWorkflow = useCallback(async () => {
    if (!id || !UUID_RE.test(id)) return;
    try {
      const wf = await workflowsApi.get(id);
      setWorkflow(wf);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'İş akışı yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isValidId) {
      fetchWorkflow();
    } else if (id) {
      setLoading(false);
      setError('Geçersiz iş akışı ID');
    }
  }, [fetchWorkflow, isValidId, id]);

  const workflowStatus = workflow?.status;
  useEffect(() => {
    if (!isValidId || !workflowStatus) return;
    if (workflowStatus === 'running' || workflowStatus === 'awaiting_approval') {
      const interval = setInterval(async () => {
        try {
          const updated = await workflowsApi.poll(id!);
          setWorkflow(updated);
        } catch { /* ignore polling errors */ }
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [workflowStatus, isValidId, id]);

  // Fetch preview files when proto completes (once)
  const protoStatus = workflow?.stages?.proto?.status;
  useEffect(() => {
    if (protoStatus === 'completed' && id && !previewFilesFetchedRef.current) {
      previewFilesFetchedRef.current = true;
      setPreviewFilesLoading(true);
      workflowsApi.getAllFiles(id)
        .then(data => setPreviewFiles(data.files))
        .catch(() => setPreviewFiles(null))
        .finally(() => setPreviewFilesLoading(false));
    }
  }, [protoStatus, id]);

  const handleApprove = async (repoName: string, repoVisibility?: 'public' | 'private') => {
    if (!isValidId) return;
    try {
      const updated = await workflowsApi.approve(id, repoName, repoVisibility || 'private');
      setWorkflow(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Onaylama başarısız');
    }
  };

  const handleReject = async (feedback?: string) => {
    if (!isValidId) return;
    try {
      const updated = await workflowsApi.reject(id, feedback || 'Spec reddedildi');
      setWorkflow(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reddetme başarısız');
    }
  };

  const handleRetry = async () => {
    if (!isValidId) return;
    try {
      const updated = await workflowsApi.retry(id);
      setWorkflow(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yeniden deneme başarısız');
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!isValidId) return;
    try {
      const updated = await workflowsApi.sendMessage(id, message);
      setWorkflow(updated);
    } catch (e) {
      console.error('Mesaj gönderilemedi:', e);
      if (workflow) {
        setWorkflow({
          ...workflow,
          conversation: [
            ...(workflow.conversation || []),
            {
              role: 'user',
              type: 'message',
              content: message,
              timestamp: new Date().toISOString(),
            },
          ],
        });
      }
    }
  };

  // Panel toggle handlers
  const toggleFiles = () => {
    setRightPanel(prev => (prev === 'files' ? null : 'files'));
  };

  const closePanel = () => {
    setRightPanel(null);
    setSelectedFile(null);
    setFileContent(null);
  };

  const handleFileSelect = async (filePath: string) => {
    if (!id) return;
    setSelectedFile(filePath);
    setRightPanel('code');
    setFileLoading(true);
    try {
      const data = await workflowsApi.getFileContent(id, filePath);
      setFileContent(data);
    } catch {
      setFileContent({ content: '// Dosya yüklenemedi', language: 'text', lines: 0, agent: 'proto' });
    } finally {
      setFileLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ak-primary border-t-transparent" />
      </div>
    );
  }

  if (error && !workflow) {
    return (
      <div className="space-y-4 p-6">
        <button onClick={() => navigate('/dashboard/workflows')} className="text-sm text-ak-text-secondary hover:text-ak-text-primary">&larr; Geri</button>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!workflow) return null;

  const repoInfo = getRepoInfo(workflow);
  const hasPreview = workflow.stages.proto.status === 'completed' && !!repoInfo;
  const isFilesActive = rightPanel === 'files' || rightPanel === 'code';

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-ak-border bg-ak-surface px-4 py-3">
        {/* Row 1: Back + Title + Status + Pipeline */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard/workflows')}
            className="flex items-center gap-1 text-sm text-ak-text-secondary transition-colors hover:text-ak-text-primary"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="min-w-0 flex-1 truncate text-base font-bold text-ak-text-primary">{workflow.title}</h1>
          <StatusBadge status={workflow.status} />
          <MiniPipeline stages={workflow.stages} />
          <span className="text-xs text-ak-text-tertiary">{timeAgo(workflow.createdAt)}</span>
        </div>

        {/* Row 1.5: Repo Context Bar */}
        {repoInfo && (
          <GitContextBar owner={repoInfo.owner} repo={repoInfo.repo} branch={repoInfo.branch} />
        )}

        {/* Row 2: Main tabs (Chat / Aşamalar / Önizleme) + Files button */}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex rounded-lg border border-ak-border bg-ak-surface-2 p-0.5">
            <button
              onClick={() => setMainView('chat')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                mainView === 'chat'
                  ? 'bg-ak-primary/20 text-ak-primary'
                  : 'text-ak-text-tertiary hover:text-ak-text-secondary'
              }`}
            >
              Sohbet
            </button>
            <button
              onClick={() => setMainView('stages')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                mainView === 'stages'
                  ? 'bg-ak-primary/20 text-ak-primary'
                  : 'text-ak-text-tertiary hover:text-ak-text-secondary'
              }`}
            >
              Aşamalar
            </button>
            {hasPreview && (
              <button
                onClick={() => setMainView('preview')}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  mainView === 'preview'
                    ? 'bg-ak-primary/20 text-ak-primary'
                    : 'text-ak-text-tertiary hover:text-ak-text-secondary'
                }`}
              >
                &#9654; Önizleme
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!ideMode && (
              <button
                onClick={toggleFiles}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  isFilesActive
                    ? 'border-ak-primary/30 bg-ak-primary/10 text-ak-primary'
                    : 'border-ak-border text-ak-text-tertiary hover:text-ak-text-secondary hover:border-ak-border-strong'
                }`}
              >
                &#128193; Dosyalar
              </button>
            )}
            {previewFiles && Object.keys(previewFiles).length > 0 && window.innerWidth >= 768 && (
              <button
                onClick={() => setIdeMode(!ideMode)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  ideMode
                    ? 'border-ak-primary/30 bg-ak-primary/10 text-ak-primary'
                    : 'border-ak-border text-ak-text-tertiary hover:text-ak-text-secondary hover:border-ak-border-strong'
                }`}
              >
                {ideMode ? '\u229F Normal' : '\u229E IDE'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex-shrink-0 border-b border-red-500/20 bg-red-500/5 px-4 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Main Content */}
      {ideMode && previewFiles ? (
        <Suspense
          fallback={
            <div className="flex flex-1 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-ak-primary border-t-transparent" />
            </div>
          }
        >
          <div style={{ height: 'calc(100vh - 120px)', width: '100%' }}>
            <IDELayout
              files={Object.entries(previewFiles).map(([path, content]) => ({ path, content }))}
              pipelinePanel={
                <StageTimeline
                  workflow={workflow}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onRetry={handleRetry}
                  activities={activities}
                  currentStep={currentStep}
                  isConnected={isConnected}
                  progressByStage={progressByStage}
                />
              }
            />
          </div>
        </Suspense>
      ) : (
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left: Chat / Stages / Preview */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {mainView === 'chat' && (
            <WorkflowChatView
              workflow={workflow}
              onSendMessage={handleSendMessage}
              onApprove={handleApprove}
              onReject={handleReject}
              onRetry={handleRetry}
              onOpenPreview={hasPreview ? () => setMainView('preview') : undefined}
              onOpenFiles={() => setRightPanel(prev => (prev === 'files' ? prev : 'files'))}
              sseActivities={activities}
              sseConnected={isConnected}
              sseProgressByStage={progressByStage}
            />
          )}

          {mainView === 'stages' && (
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="rounded-xl border border-ak-border bg-ak-surface p-5">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ak-text-tertiary">Pipeline İlerleme</h2>
                <StageTimeline
                  workflow={workflow}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onRetry={handleRetry}
                  activities={activities}
                  currentStep={currentStep}
                  isConnected={isConnected}
                  progressByStage={progressByStage}
                />
              </div>
              {workflow.stages.proto.status === 'completed' && (
                <GitFlowView workflow={workflow} />
              )}
            </div>
          )}

          {/* Preview: ALWAYS rendered, hidden with CSS for iframe caching */}
          <div
            className="min-h-0 flex-1 overflow-hidden"
            style={{ display: mainView === 'preview' ? 'flex' : 'none', flexDirection: 'column' }}
          >
            <PreviewPanel
              files={previewFiles}
              title={workflow.title}
              loading={previewFilesLoading}
              branch={repoInfo?.branch}
            />
          </div>
        </div>

        {/* Right Panel: Files/Code only (no preview) */}
        <div
          className="flex flex-shrink-0 flex-col overflow-hidden border-l border-ak-border"
          style={{
            width: 'clamp(320px, 40vw, 520px)',
            display: rightPanel ? 'flex' : 'none',
          }}
        >
            {/* Panel header */}
            <div className="flex flex-shrink-0 items-center gap-1 border-b border-ak-border bg-ak-surface px-3 py-2">
              <button
                onClick={() => setRightPanel('files')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  rightPanel === 'files'
                    ? 'bg-ak-primary/15 text-ak-primary'
                    : 'text-ak-text-tertiary hover:text-ak-text-secondary hover:bg-ak-hover'
                }`}
              >
                &#128193; Dosyalar
              </button>

              {selectedFile && (
                <button
                  onClick={() => setRightPanel('code')}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    rightPanel === 'code'
                      ? 'bg-ak-primary/15 text-ak-primary'
                      : 'text-ak-text-tertiary hover:text-ak-text-secondary hover:bg-ak-hover'
                  }`}
                >
                  &#128196; Kod
                </button>
              )}

              <div className="flex-1" />

              {/* Close panel */}
              <button
                onClick={closePanel}
                className="rounded-md p-1 text-ak-text-tertiary transition-colors hover:bg-ak-hover hover:text-ak-text-primary"
                title="Paneli kapat"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Panel content */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {rightPanel === 'files' && (
                <FileManager
                  workflow={workflow}
                  onFileSelect={handleFileSelect}
                  selectedFile={selectedFile}
                />
              )}

              {rightPanel === 'code' && (
                fileLoading ? (
                  <div className="flex flex-1 items-center justify-center bg-ak-surface">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-ak-primary border-t-transparent" />
                  </div>
                ) : fileContent && selectedFile ? (
                  <CodeViewer
                    filePath={selectedFile}
                    content={fileContent.content}
                    language={fileContent.language}
                    agent={fileContent.agent}
                    lines={fileContent.lines}
                  />
                ) : (
                  <div className="flex flex-1 items-center justify-center px-4 text-center">
                    <p className="text-xs text-ak-text-tertiary">Dosya içeriğini görmek için Dosyalar sekmesinden bir dosya seçin.</p>
                  </div>
                )
              )}
            </div>
        </div>
      </div>
      )}
    </div>
  );
}
