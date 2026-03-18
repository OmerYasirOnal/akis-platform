import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import { FloatingActivityToast } from '../pipeline/FloatingActivityToast';
import { useActivePipeline } from '../../hooks/useActivePipeline';
import { usePipelineStream } from '../../hooks/usePipelineStream';

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const userOverrideRef = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Global floating toast — detect running pipeline across all pages
  const activePipeline = useActivePipeline(5000);
  const { currentStep, progressByStage } = usePipelineStream(
    activePipeline?.id,
    !!activePipeline,
  );

  const toastActivity = currentStep
    ? {
        stage: currentStep.stage,
        message: currentStep.message,
        progress: progressByStage[currentStep.stage] ?? currentStep.progress,
        step: currentStep.step,
      }
    : null;

  // WorkflowDetailPage needs full-bleed (no padding, no maxWidth)
  const isFullBleed = /\/dashboard\/workflows\/[0-9a-f-]+$/i.test(location.pathname);
  const isWorkflowDetail = isFullBleed;

  // Auto-collapse sidebar on workflow detail route, expand on other pages
  useEffect(() => {
    if (isWorkflowDetail && !userOverrideRef.current) {
      setCollapsed(true);
    } else if (!isWorkflowDetail) {
      setCollapsed(false);
    }
    // Reset user override on route change
    userOverrideRef.current = false;
  }, [location.pathname, isWorkflowDetail]);

  const handleToggleCollapse = () => {
    setCollapsed(prev => !prev);
    userOverrideRef.current = true;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-ak-bg">
      {/* Global floating activity toast — visible on ALL pages */}
      <FloatingActivityToast
        activity={toastActivity}
        isActive={!!activePipeline}
        pipelineStatus={activePipeline?.status}
        onClickNavigate={
          activePipeline
            ? () => navigate(`/dashboard/workflows/${activePipeline.id}`)
            : undefined
        }
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — always visible on lg+, slide-in on mobile */}
      <div
        className={`fixed inset-y-0 left-0 z-40 flex-shrink-0 transform transition-transform duration-200 ease-out lg:relative lg:z-auto lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <DashboardSidebar
          onClose={() => setSidebarOpen(false)}
          collapsed={collapsed}
          onToggleCollapse={handleToggleCollapse}
        />
      </div>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="flex flex-shrink-0 items-center gap-3 border-b border-ak-border bg-ak-surface px-4 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1.5 text-ak-text-secondary transition-colors hover:bg-black/[0.04] hover:text-ak-text-primary"
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-ak-primary to-emerald-600 text-[10px] font-bold text-white">
              A
            </div>
            <span className="text-sm font-bold tracking-wide text-ak-text-primary">AKIS</span>
          </div>
        </div>

        {isFullBleed ? (
          <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <Outlet />
          </main>
        ) : (
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        )}
      </div>
    </div>
  );
}

export default DashboardLayout;
