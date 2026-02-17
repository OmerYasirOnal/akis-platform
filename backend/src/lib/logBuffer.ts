/**
 * In-memory ring buffer for recent log entries.
 * Used by GET /api/admin/logs for dev/admin log viewer.
 */
const MAX_ENTRIES = 1000;

export interface LogEntry {
  time: number;
  level: number;
  levelLabel: string;
  msg?: string;
  [key: string]: unknown;
}

const buffer: LogEntry[] = [];
let head = 0;
let size = 0;

function levelLabel(level: number): string {
  if (level >= 60) return 'error';
  if (level >= 50) return 'warn';
  if (level >= 40) return 'info';
  if (level >= 30) return 'debug';
  return 'trace';
}

function sanitize(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v instanceof Error) {
      out[k] = { message: v.message, stack: v.stack };
    } else {
      out[k] = v;
    }
  }
  return out;
}

export function pushLog(entry: Record<string, unknown>): void {
  const item: LogEntry = {
    ...sanitize(entry),
    time: (entry.time as number) ?? Date.now(),
    level: (entry.level as number) ?? 30,
    levelLabel: levelLabel((entry.level as number) ?? 30),
  } as LogEntry;
  if (size < MAX_ENTRIES) {
    buffer.push(item);
    size++;
  } else {
    buffer[head] = item;
    head = (head + 1) % MAX_ENTRIES;
  }
}

export function getLogs(options: {
  level?: string;
  limit?: number;
  since?: number;
}): LogEntry[] {
  let out: LogEntry[];
  if (size < MAX_ENTRIES) {
    out = [...buffer];
  } else {
    out = buffer.slice(head).concat(buffer.slice(0, head));
  }
  if (options.since) {
    out = out.filter((e) => (e.time as number) >= options.since!);
  }
  if (options.level && options.level !== 'all') {
    const levelOrder = { trace: 10, debug: 20, info: 30, warn: 50, error: 60 };
    const minLevel = levelOrder[options.level as keyof typeof levelOrder] ?? 30;
    out = out.filter((e) => e.level >= minLevel);
  }
  const limit = Math.min(options.limit ?? 100, 500);
  return out.slice(-limit);
}
