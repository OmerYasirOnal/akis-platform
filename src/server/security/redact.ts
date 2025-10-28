/**
 * Logging Redaction Utilities
 * 
 * Implements token/secret redaction for logs (last-4 policy).
 * Part of Phase 2: Security Hardening (Gate-B requirement)
 * 
 * @module server/security/redact
 */

/**
 * Patterns for detecting tokens/secrets
 */
const TOKEN_PATTERNS = [
  /ghp_[a-zA-Z0-9]{36}/g,        // GitHub Personal Access Token
  /gho_[a-zA-Z0-9]{36}/g,        // GitHub OAuth Token
  /ghs_[a-zA-Z0-9]{36}/g,        // GitHub Server Token
  /ghu_[a-zA-Z0-9]{36}/g,        // GitHub User Token
  /github_pat_[a-zA-Z0-9_]{82}/g, // GitHub Fine-grained PAT
  /Bearer\s+[a-zA-Z0-9._-]+/g,   // Bearer tokens
  /jwt\s+[a-zA-Z0-9._-]+/gi,     // JWT tokens
  /key[-_]?[a-zA-Z0-9]{32,}/gi,  // Generic API keys
];

/**
 * Redact a single token (show prefix + last 4 characters)
 * 
 * @param token - Token to redact
 * @returns Redacted token (e.g., "ghp_***...xyz9")
 */
export function redactToken(token: string): string {
  if (token.length <= 8) {
    return '***'; // Too short to show last 4
  }
  
  // Extract prefix (e.g., "ghp_", "Bearer ")
  const prefixMatch = token.match(/^[a-zA-Z_]+\s?/);
  const prefix = prefixMatch ? prefixMatch[0] : '';
  
  const last4 = token.slice(-4);
  const middle = '***';
  
  return `${prefix}${middle}...${last4}`;
}

/**
 * Redact tokens/secrets in a string
 * 
 * @param text - Text that may contain tokens
 * @returns Text with tokens redacted
 */
export function redactString(text: string): string {
  let redacted = text;
  
  for (const pattern of TOKEN_PATTERNS) {
    redacted = redacted.replace(pattern, (match) => redactToken(match));
  }
  
  return redacted;
}

/**
 * Redact tokens/secrets in an object (recursive)
 * 
 * @param obj - Object that may contain tokens
 * @returns New object with tokens redacted
 */
export function redactObject<T>(obj: T): T {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return redactString(obj) as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map((item) => redactObject(item)) as T;
  }
  
  const redacted: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Redact specific fields by name
    if (
      key.toLowerCase().includes('token') ||
      key.toLowerCase().includes('secret') ||
      key.toLowerCase().includes('password') ||
      key.toLowerCase().includes('key')
    ) {
      if (typeof value === 'string') {
        redacted[key] = redactToken(value);
      } else {
        redacted[key] = '***';
      }
    } else if (typeof value === 'string') {
      redacted[key] = redactString(value);
    } else if (typeof value === 'object') {
      redacted[key] = redactObject(value);
    } else {
      redacted[key] = value;
    }
  }
  
  return redacted as T;
}

/**
 * Safe console.log with automatic redaction
 * 
 * @param level - Log level (info, warn, error, debug)
 * @param message - Log message
 * @param data - Optional data to log (will be redacted)
 */
export function secureLog(
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  data?: any
): void {
  const timestamp = new Date().toISOString();
  const redactedMessage = redactString(message);
  const redactedData = data ? redactObject(data) : undefined;
  
  const logEntry = {
    timestamp,
    level,
    message: redactedMessage,
    ...(redactedData && { data: redactedData }),
  };
  
  switch (level) {
    case 'error':
      console.error(JSON.stringify(logEntry));
      break;
    case 'warn':
      console.warn(JSON.stringify(logEntry));
      break;
    case 'debug':
      if (process.env.LOG_LEVEL === 'debug') {
        console.debug(JSON.stringify(logEntry));
      }
      break;
    default:
      console.log(JSON.stringify(logEntry));
  }
}

/**
 * Create a logger instance with automatic redaction
 */
export function createSecureLogger(context: string) {
  return {
    info: (message: string, data?: any) =>
      secureLog('info', `[${context}] ${message}`, data),
    warn: (message: string, data?: any) =>
      secureLog('warn', `[${context}] ${message}`, data),
    error: (message: string, data?: any) =>
      secureLog('error', `[${context}] ${message}`, data),
    debug: (message: string, data?: any) =>
      secureLog('debug', `[${context}] ${message}`, data),
  };
}

