import { useState, useEffect } from 'react';
import { getLogs, type LogEntry } from '../../services/api/logs';
import Card from '../../components/common/Card';
import { StatusBadge } from '../../components/ui/Badge';

const LEVEL_VARIANT: Record<string, 'error' | 'warning' | 'info' | 'neutral'> = {
  error: 'error',
  warn: 'warning',
  info: 'info',
  debug: 'neutral',
  trace: 'neutral',
};

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [level, setLevel] = useState('info');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      const res = await getLogs({ level: level === 'all' ? undefined : level, limit: 100 });
      setLogs(res.logs);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchLogs();
    const id = setInterval(() => void fetchLogs(), 5000);
    return () => clearInterval(id);
  }, [level]);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString() + '.' + String(d.getMilliseconds()).padStart(3, '0');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ak-text-primary">Logs</h1>
          <p className="text-sm text-ak-text-secondary mt-0.5">
            Recent backend logs (auto-refresh every 5s)
          </p>
        </div>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="rounded-lg border border-ak-border bg-ak-surface px-3 py-1.5 text-sm text-ak-text-primary focus:outline-none focus:ring-1 focus:ring-ak-primary"
        >
          <option value="all">All levels</option>
          <option value="trace">Trace</option>
          <option value="debug">Debug</option>
          <option value="info">Info</option>
          <option value="warn">Warn</option>
          <option value="error">Error</option>
        </select>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <Card className="bg-ak-surface overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="p-8 text-center text-ak-text-secondary">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-ak-text-secondary">No logs yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ak-border">
                  <th className="px-4 py-2 text-left font-medium text-ak-text-secondary w-24">Time</th>
                  <th className="px-4 py-2 text-left font-medium text-ak-text-secondary w-20">Level</th>
                  <th className="px-4 py-2 text-left font-medium text-ak-text-secondary min-w-[200px]">Message</th>
                  <th className="px-4 py-2 text-left font-medium text-ak-text-secondary w-32">RequestId</th>
                  <th className="px-4 py-2 text-left font-medium text-ak-text-secondary w-20">Duration</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((entry, i) => (
                  <tr key={i} className="border-b border-ak-border/50 hover:bg-ak-surface-2/50">
                    <td className="px-4 py-2 font-mono text-xs text-ak-text-secondary">
                      {formatTime(entry.time as number)}
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge variant={LEVEL_VARIANT[String(entry.levelLabel)] ?? 'neutral'}>
                        {String(entry.levelLabel ?? 'info')}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-2 text-ak-text-primary break-all">
                      {String(entry.msg ?? '-')}
                      {entry.jobId != null && entry.jobId !== '' ? (
                        <span className="ml-1 text-ak-text-secondary">jobId={String(entry.jobId).slice(0, 8)}…</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-ak-text-secondary">
                      {entry.requestId ? String(entry.requestId).slice(0, 8) + '…' : '-'}
                    </td>
                    <td className="px-4 py-2 text-ak-text-secondary">
                      {typeof entry.duration === 'number' ? `${(entry.duration * 1000).toFixed(0)}ms` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
