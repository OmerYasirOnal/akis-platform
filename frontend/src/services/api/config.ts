/**
 * API Configuration
 *
 * Single source of truth for API base URL resolution.
 *
 * Resolution order:
 *   1. VITE_BACKEND_URL (dev only — rejected in production if localhost)
 *   2. VITE_API_URL     (legacy, same localhost guard)
 *   3. window.location.origin (production/staging default)
 *   4. '' (SSR / test fallback)
 */

function isLocalhost(url: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)([:/?#]|$)/i.test(url);
}

export function getApiBaseUrl(): string {
  if (import.meta.env.VITE_BACKEND_URL) {
    const url = import.meta.env.VITE_BACKEND_URL.replace(/\/api\/?$/, '');
    if (isLocalhost(url)) {
      // Localhost backend — use relative paths so Vite proxy handles CORS
    } else if (!import.meta.env.PROD) {
      return url;
    }
  }

  if (import.meta.env.VITE_API_URL) {
    const apiUrl = import.meta.env.VITE_API_URL as string;

    if (apiUrl.startsWith('/')) {
      // Relative path — fall through to window.location.origin
    } else if (apiUrl.startsWith('http')) {
      try {
        const origin = new URL(apiUrl).origin;
        if (isLocalhost(origin)) {
          // Localhost — use relative paths so Vite proxy handles CORS
        } else if (!import.meta.env.PROD) {
          return origin;
        }
      } catch {
        // Invalid URL — fall through
      }
    }
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return '';
}

/**
 * Get the auth base URL (origin only, no path suffix).
 *
 * Auth routes are at /auth/* (not /api/auth/*).
 * This is the same as getApiBaseUrl() but named distinctly for clarity.
 */
export function getAuthBaseUrl(): string {
  return getApiBaseUrl();
}
