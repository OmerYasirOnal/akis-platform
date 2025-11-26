import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';

interface HealthStatus {
  health: 'ok' | 'fail' | 'loading';
  ready: boolean | null;
  version: string | null;
  error: string | null;
}

const initialStatus: HealthStatus = {
  health: 'loading',
  ready: null,
  version: null,
  error: null,
};

export function HealthPanel() {
  const [status, setStatus] = useState<HealthStatus>(initialStatus);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStatus = useCallback(async () => {
    setIsRefreshing(true);

    try {
      // Fetch all health endpoints in parallel
      const [healthRes, readyRes, versionRes] = await Promise.allSettled([
        api.getHealth(),
        api.getReady(),
        api.getVersion(),
      ]);

      const healthOk =
        healthRes.status === 'fulfilled' && healthRes.value.status === 'ok';
      const readyOk =
        readyRes.status === 'fulfilled' ? readyRes.value.ready : null;
      const version =
        versionRes.status === 'fulfilled' ? versionRes.value.version : null;

      setStatus({
        health: healthOk ? 'ok' : 'fail',
        ready: readyOk,
        version,
        error: null,
      });
    } catch (err) {
      setStatus({
        health: 'fail',
        ready: null,
        version: null,
        error: err instanceof Error ? err.message : 'Failed to fetch system status',
      });
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const statusColor = {
    ok: 'text-green-500',
    fail: 'text-red-500',
    loading: 'text-yellow-500',
  };

  const statusIcon = {
    ok: '●',
    fail: '●',
    loading: '○',
  };

  return (
    <div className="rounded-xl border border-ak-border bg-ak-surface-2 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-ak-text-primary">System Status</h3>
        <button
          onClick={fetchStatus}
          disabled={isRefreshing}
          className="text-xs text-ak-text-secondary hover:text-ak-primary transition-colors disabled:opacity-50"
          aria-label="Refresh status"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {status.error ? (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2">
          <p className="text-xs text-red-400">{status.error}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Health Status */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-ak-text-secondary">Liveness</span>
            <span className={`flex items-center gap-1.5 ${statusColor[status.health]}`}>
              <span aria-hidden="true">{statusIcon[status.health]}</span>
              {status.health === 'loading' ? 'Checking...' : status.health.toUpperCase()}
            </span>
          </div>

          {/* Ready Status */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-ak-text-secondary">DB Ready</span>
            {status.ready === null ? (
              <span className="text-yellow-500">○ Unknown</span>
            ) : (
              <span className={status.ready ? 'text-green-500' : 'text-red-500'}>
                <span aria-hidden="true">{status.ready ? '●' : '●'}</span>{' '}
                {status.ready ? 'Connected' : 'Disconnected'}
              </span>
            )}
          </div>

          {/* Version */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-ak-text-secondary">Version</span>
            <span className="text-ak-text-primary font-mono text-xs">
              {status.version || '—'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default HealthPanel;

