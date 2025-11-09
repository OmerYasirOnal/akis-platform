const DEFAULT_DEV_BACKEND_URL = 'http://localhost:3000';
const DEV_SERVER_PORT = '5173';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const ensureLeadingSlash = (value: string) => {
  if (!value) {
    return '';
  }

  return value.startsWith('/') ? value : `/${value}`;
};

export function getApiPrefix(): string {
  const rawPrefix = import.meta.env.VITE_API_PREFIX;
  if (typeof rawPrefix !== 'string') {
    return '/api';
  }

  const trimmed = rawPrefix.trim();
  if (!trimmed || trimmed === '/') {
    return '';
  }

  return ensureLeadingSlash(trimmed.replace(/^\/+/, '').replace(/\/+$/, ''));
}

export function getApiBaseUrl(): string {
  const { VITE_API_URL, VITE_BACKEND_URL } = import.meta.env;

  if (typeof VITE_API_URL === 'string' && VITE_API_URL.trim()) {
    return trimTrailingSlash(VITE_API_URL.trim());
  }

  if (typeof VITE_BACKEND_URL === 'string' && VITE_BACKEND_URL.trim()) {
    return trimTrailingSlash(VITE_BACKEND_URL.trim());
  }

  if (typeof window !== 'undefined') {
    if (import.meta.env.DEV && window.location.port === DEV_SERVER_PORT) {
      return DEFAULT_DEV_BACKEND_URL;
    }

    return trimTrailingSlash(window.location.origin);
  }

  return DEFAULT_DEV_BACKEND_URL;
}

export function getApiBaseUrlWithPrefix(): string {
  const baseUrl = trimTrailingSlash(getApiBaseUrl());
  const prefix = getApiPrefix();

  if (!prefix) {
    return baseUrl;
  }

  return `${baseUrl}${prefix}`;
}


