/**
 * Isomorphic Logger
 * Works both client-side and server-side
 * 
 * Features:
 * - Structured logging
 * - Token/secret redaction
 * - Timestamp injection
 * - Server-side: direct console (no HTTP overhead)
 * - Client-side: mirror to server endpoint
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogPayload {
  level: LogLevel;
  scope: string;
  message: string;
  timestamp: string;
  meta?: any;
}

/**
 * Redact sensitive data from log messages
 */
function redact(text: string): string {
  return text
    .replace(/ghp_[a-zA-Z0-9]{36}/g, 'ghp_***REDACTED***')
    .replace(/gho_[a-zA-Z0-9]{36}/g, 'gho_***REDACTED***')
    .replace(/ghs_[a-zA-Z0-9]{36}/g, 'ghs_***REDACTED***')
    .replace(/Bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer ***REDACTED***')
    .replace(/sk-[a-zA-Z0-9]{48}/g, 'sk-***REDACTED***');
}

/**
 * Format log message
 */
function formatLog(payload: LogPayload): string {
  const emoji = {
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
    debug: '🔍',
  }[payload.level] || '';

  const metaStr = payload.meta ? ` ${JSON.stringify(payload.meta)}` : '';
  return `${emoji} [${payload.timestamp}] [${payload.scope}] ${redact(payload.message)}${metaStr}`;
}

/**
 * Server-side logging (direct console)
 */
function serverLog(payload: LogPayload) {
  const formatted = formatLog(payload);
  const consoleMethod = console[payload.level] || console.log;
  consoleMethod(formatted);
}

/**
 * Client-side logging (browser + server mirror)
 */
async function clientLog(payload: LogPayload) {
  // Browser console
  const consoleMethod = console[payload.level] || console.log;
  consoleMethod(`[${payload.scope}]`, payload.message, payload.meta || '');

  // Mirror to server (non-blocking)
  if (typeof window !== 'undefined') {
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {
        // Fail silently
      });
    } catch {
      // Ignore
    }
  }
}

/**
 * Core log function
 */
function log(level: LogLevel, scope: string, message: string, meta?: any) {
  const payload: LogPayload = {
    level,
    scope,
    message,
    timestamp: new Date().toISOString(),
    meta,
  };

  // Server-side or client-side?
  if (typeof window === 'undefined') {
    serverLog(payload);
  } else {
    clientLog(payload);
  }
}

export const logger = {
  info: (scope: string, message: string, meta?: any) => {
    log('info', scope, message, meta);
  },
  
  warn: (scope: string, message: string, meta?: any) => {
    log('warn', scope, message, meta);
  },
  
  error: (scope: string, message: string, meta?: any) => {
    log('error', scope, message, meta);
  },
  
  debug: (scope: string, message: string, meta?: any) => {
    if (process.env.NODE_ENV === 'development') {
      log('debug', scope, message, meta);
    }
  },
};

