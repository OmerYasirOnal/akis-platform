/**
 * API Configuration
 *
 * Centralized configuration for API base URLs to prevent /api/api double prefix issues.
 *
 * STANDARD:
 * - Base URL = Origin only (e.g., https://staging.akisflow.com or http://localhost:3000)
 * - API paths include the prefix (e.g., /api/agents/jobs)
 * - Auth paths include the prefix (e.g., /auth/login)
 *
 * This matches the Caddy routing:
 * - /api/* → backend:3000
 * - /auth/* → backend:3000
 */

/**
 * Get the API base URL (origin only, no path suffix).
 *
 * Use this for API calls where paths already include /api prefix.
 *
 * @example
 * const baseUrl = getApiBaseUrl(); // "https://staging.akisflow.com"
 * fetch(`${baseUrl}/api/agents/jobs`); // Correct: /api/agents/jobs
 */
export function getApiBaseUrl(): string {
  // VITE_BACKEND_URL = explicit backend origin for development
  // Should be the origin only, e.g., http://localhost:3000
  if (import.meta.env.VITE_BACKEND_URL) {
    // Strip any accidental /api suffix to prevent double prefix
    return import.meta.env.VITE_BACKEND_URL.replace(/\/api\/?$/, '');
  }

  // VITE_API_URL is deprecated for this purpose but handle gracefully
  // If it's a relative path like '/api', ignore it and use origin
  // If it's an absolute URL, extract the origin
  if (import.meta.env.VITE_API_URL) {
    const apiUrl = import.meta.env.VITE_API_URL;

    // Skip relative paths (they cause /api/api issues)
    if (apiUrl.startsWith('/')) {
      // Fall through to use window.location.origin
    } else if (apiUrl.startsWith('http')) {
      // Extract origin from absolute URL, strip /api suffix
      try {
        const url = new URL(apiUrl);
        return url.origin;
      } catch {
        // Invalid URL, fall through
      }
    }
  }

  // Production/staging: use same origin as the frontend
  // This is the standard case for deployed environments
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  // Fallback: empty string = relative path (safe for all environments)
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
