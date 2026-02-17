const RETURN_TO_KEY = 'akis_returnTo';

/**
 * Sanitize returnTo path: allow only same-origin relative paths starting with /.
 * Prevents open-redirect vulnerabilities (e.g. https://evil.com).
 */
export function sanitizeReturnTo(path: string | undefined): string | null {
  if (!path || typeof path !== 'string') return null;
  const trimmed = path.trim();
  if (trimmed === '' || trimmed === '/') return null;
  if (!trimmed.startsWith('/')) return null;
  if (trimmed.startsWith('//')) return null;
  try {
    new URL(trimmed, 'https://example.com');
  } catch {
    return null;
  }
  return trimmed;
}

export function getReturnTo(): string | null {
  try {
    const stored = sessionStorage.getItem(RETURN_TO_KEY);
    return sanitizeReturnTo(stored ?? undefined);
  } catch {
    return null;
  }
}

export function setReturnTo(path: string): void {
  const safe = sanitizeReturnTo(path);
  if (safe) {
    sessionStorage.setItem(RETURN_TO_KEY, safe);
  }
}

export function clearReturnTo(): void {
  sessionStorage.removeItem(RETURN_TO_KEY);
}
