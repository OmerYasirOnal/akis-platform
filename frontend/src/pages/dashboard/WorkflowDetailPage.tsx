import { useEffect, useState, useCallback, useRef, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { StageTimeline } from '../../components/workflow/StageTimeline';
import { WorkflowChatView } from '../../components/workflow/WorkflowChatView';
import { FileManager } from '../../components/workflow/FileManager';
import { CodeViewer } from '../../components/workflow/CodeViewer';
import { PreviewPanel } from '../../components/workflow/PreviewPanel';
import { MiniPipeline } from '../../components/workflow/MiniPipeline';
import { GitFlowView } from '../../components/workflow/GitFlowView';
import { DevChatPanel } from '../../components/dev/DevChatPanel';
import { workflowsApi } from '../../services/api/workflows';
import { usePipelineStream } from '../../hooks/usePipelineStream';

import type { Workflow } from '../../types/workflow';

const IDELayout = lazy(() =>
  import('../../components/ide/IDELayout').then((m) => ({ default: m.IDELayout })),
);


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

// Main area: chat | stages | preview | dev
type MainView = 'chat' | 'stages' | 'preview' | 'dev';
// Right panel: files/code only (preview removed)
type RightPanelView = 'files' | 'code' | null;


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
  const isPipelineCompleted = workflow.status === 'completed' || workflow.status === 'completed_partial';
  const isFilesActive = rightPanel === 'files' || rightPanel === 'code';

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header — minimal Claude.ai style */}
      <div className="flex-shrink-0 border-b border-ak-border px-4 py-2.5">
        <div className="flex items-center gap-3">
          {/* Back button */}
          <button
            onClick={() => navigate('/dashboard/workflows')}
            className="flex items-center justify-center rounded-lg p-1 text-ak-text-tertiary transition-colors hover:bg-ak-hover hover:text-ak-text-primary"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          {/* Title */}
          <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-ak-text-primary">{workflow.title}</h1>

          {/* Mini pipeline progress */}
          <MiniPipeline stages={workflow.stages} />

          {/* View tabs — compact */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMainView('chat')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                mainView === 'chat'
                  ? 'bg-ak-primary/15 text-ak-primary'
                  : 'text-ak-text-tertiary hover:text-ak-text-secondary hover:bg-ak-hover'
              }`}
            >
              &#128172;
            </button>
            <button
              onClick={() => setMainView('stages')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                mainView === 'stages'
                  ? 'bg-ak-primary/15 text-ak-primary'
                  : 'text-ak-text-tertiary hover:text-ak-text-secondary hover:bg-ak-hover'
              }`}
            >
              &#128202;
            </button>
            {hasPreview && (
              <button
                onClick={() => setMainView('preview')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  mainView === 'preview'
                    ? 'bg-ak-primary/15 text-ak-primary'
                    : 'text-ak-text-tertiary hover:text-ak-text-secondary hover:bg-ak-hover'
                }`}
              >
                &#9654;
              </button>
            )}
            {isPipelineCompleted && (
              <button
                onClick={() => setMainView('dev')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  mainView === 'dev'
                    ? 'bg-ak-primary/15 text-ak-primary'
                    : 'text-ak-text-tertiary hover:text-ak-text-secondary hover:bg-ak-hover'
                }`}
                title="Dev Mode"
              >
                &#9889;
              </button>
            )}
          </div>

          {/* Files toggle */}
          {!ideMode && (
            <button
              onClick={toggleFiles}
              className={`rounded-md p-1.5 text-xs transition-colors ${
                isFilesActive
                  ? 'bg-ak-primary/15 text-ak-primary'
                  : 'text-ak-text-tertiary hover:text-ak-text-secondary hover:bg-ak-hover'
              }`}
              title="Dosyalar"
            >
              &#128193;
            </button>
          )}
          {previewFiles && Object.keys(previewFiles).length > 0 && window.innerWidth >= 768 && (
            <button
              onClick={() => setIdeMode(!ideMode)}
              className={`rounded-md p-1.5 text-xs transition-colors ${
                ideMode
                  ? 'bg-ak-primary/15 text-ak-primary'
                  : 'text-ak-text-tertiary hover:text-ak-text-secondary hover:bg-ak-hover'
              }`}
              title={ideMode ? 'Normal görünüm' : 'IDE görünüm'}
            >
              {ideMode ? '\u229F' : '\u229E'}
            </button>
          )}
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

          {/* Dev Mode Chat */}
          {mainView === 'dev' && (
            <DevChatPanel
              pipelineId={workflow.id}
              isCompleted={isPipelineCompleted}
            />
          )}
        </div>

        {/* Right Panel: Files/Code only (no preview) */}
        <div
          className="flex flex-shrink-0 flex-col overflow-hidden border-l border-ak-border w-full sm:w-[clamp(320px,40vw,520px)]"
          style={{
            display: rightPanel ? 'flex' : 'none',
          }}
        >
            {/* Panel header — Claude.ai artifact style */}
            <div className="flex flex-shrink-0 items-center gap-2 border-b border-ak-border px-3 py-2" style={{ backgroundColor: 'var(--ak-bg-input)' }}>
              {/* Tab toggles */}
              <button
                onClick={() => setRightPanel('files')}
                className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                  rightPanel === 'files'
                    ? 'bg-ak-primary/15 text-ak-primary'
                    : 'text-ak-text-tertiary hover:text-ak-text-secondary'
                }`}
              >
                &#128193; Dosyalar
              </button>

              {selectedFile && (
                <button
                  onClick={() => setRightPanel('code')}
                  className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                    rightPanel === 'code'
                      ? 'bg-ak-primary/15 text-ak-primary'
                      : 'text-ak-text-tertiary hover:text-ak-text-secondary'
                  }`}
                >
                  &lt;/&gt; Kod
                </button>
              )}

              {/* File name when code is showing */}
              {rightPanel === 'code' && selectedFile && (
                <span className="flex-1 truncate text-xs text-ak-text-secondary font-mono">{selectedFile.split('/').pop()}</span>
              )}
              {rightPanel !== 'code' && <div className="flex-1" />}

              {/* Close button */}
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
