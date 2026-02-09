import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { agentsApi } from '../../services/api/agents';

interface RunningJob {
  id: string;
  type: string;
  state: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'akis-runbar-jobs';

function loadStoredJobs(): RunningJob[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function storeJobs(jobs: RunningJob[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs.slice(0, 5)));
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function RunBar() {
  const [jobs, setJobs] = useState<RunningJob[]>(loadStoredJobs);
  const [expanded, setExpanded] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const location = useLocation();

  const reconcile = useCallback(async () => {
    try {
      const response = await agentsApi.getRunningJobs();
      const running: RunningJob[] = (response.jobs || []).map((j: { id: string; type: string; state: 'pending' | 'running'; createdAt: string; updatedAt: string }) => ({
        id: j.id,
        type: j.type,
        state: j.state,
        createdAt: j.createdAt,
        updatedAt: j.updatedAt,
      }));

      setJobs(prev => {
        const runningIds = new Set(running.map(j => j.id));

        // Jobs that were running/pending locally but are no longer in the API
        // response have likely completed — mark them as completed so they
        // remain visible in the bar instead of vanishing.
        const transitioned = prev
          .filter(j => (j.state === 'running' || j.state === 'pending') && !runningIds.has(j.id))
          .map(j => ({ ...j, state: 'completed' as const, updatedAt: new Date().toISOString() }));

        // Keep recently completed/failed jobs from local state
        const kept = prev
          .filter(j => !runningIds.has(j.id) && (j.state === 'completed' || j.state === 'failed'))
          .slice(0, 3);

        const merged = [...running, ...transitioned, ...kept]
          .filter((j, i, arr) => arr.findIndex(x => x.id === j.id) === i)
          .slice(0, 5);
        storeJobs(merged);
        return merged;
      });
    } catch {
      // Network error — keep local state
    }
  }, []);

  // Only poll on agent-related pages (scribe, trace, proto, jobs)
  const isAgentRoute =
    location.pathname.startsWith('/dashboard/scribe') ||
    location.pathname.startsWith('/dashboard/trace') ||
    location.pathname.startsWith('/dashboard/proto') ||
    location.pathname.startsWith('/dashboard/jobs') ||
    location.pathname.startsWith('/agents');

  useEffect(() => {
    if (!isAgentRoute) return;
    reconcile();
    pollRef.current = setInterval(reconcile, 8000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [reconcile, isAgentRoute]);

  // Listen for custom "job-started" event (dispatched from Scribe page etc.)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as RunningJob | undefined;
      if (detail) {
        setJobs(prev => {
          const updated = [detail, ...prev.filter(j => j.id !== detail.id)].slice(0, 5);
          storeJobs(updated);
          return updated;
        });
        reconcile();
      }
    };
    window.addEventListener('akis-job-started', handler);
    return () => window.removeEventListener('akis-job-started', handler);
  }, [reconcile]);

  // Only offset for dashboard sidebar (not agents or other full-width layouts)
  const hasSidebar = location.pathname.startsWith('/dashboard');

  if (jobs.length === 0) return null;

  const primary = jobs.find(j => j.state === 'running' || j.state === 'pending') || jobs[0];
  const isActive = primary.state === 'running' || primary.state === 'pending';
  const hasMultiple = jobs.length > 1;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-30 ${hasSidebar ? 'lg:left-56' : ''}`}>
      {/* Expanded drawer */}
      {expanded && hasMultiple && (
        <div className="border-t border-ak-border bg-ak-surface px-4 py-2 space-y-1 max-h-48 overflow-y-auto">
          {jobs.map(j => (
            <Link
              key={j.id}
              to={`/dashboard/jobs/${j.id}`}
              onClick={() => setExpanded(false)}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-ak-surface-2 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  j.state === 'running' || j.state === 'pending' ? 'bg-blue-400 animate-pulse' :
                  j.state === 'completed' ? 'bg-green-400' : 'bg-red-400'
                }`} />
                <span className="text-ak-text-primary capitalize">{j.type}</span>
                <span className="text-xs text-ak-text-secondary">{j.id.slice(0, 8)}</span>
              </div>
              <span className="text-xs text-ak-text-secondary">{formatRelativeTime(j.updatedAt)}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Main bar */}
      <div className="border-t border-ak-border bg-ak-surface-2 backdrop-blur-sm px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isActive ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-ak-primary border-t-transparent" />
              <span className="text-sm font-medium text-ak-text-primary capitalize">{primary.type}</span>
              <span className="text-xs text-ak-text-secondary">
                {primary.state === 'pending' ? 'Queued' : 'Running'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${primary.state === 'completed' ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-sm text-ak-text-secondary">
                Last run: {formatRelativeTime(primary.updatedAt)}
              </span>
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                primary.state === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {primary.state}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasMultiple && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="px-2 py-1 text-xs text-ak-text-secondary hover:text-ak-text-primary transition-colors"
            >
              {expanded ? 'Hide' : `${jobs.length} jobs`}
            </button>
          )}
          <Link
            to={`/dashboard/jobs/${primary.id}`}
            className="px-3 py-1 text-xs font-medium rounded-lg bg-ak-primary/10 text-ak-primary hover:bg-ak-primary/20 transition-colors"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}
