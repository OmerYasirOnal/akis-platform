/**
 * Auth API Service
 * 
 * Get the base URL for auth endpoints.
 * Auth routes are at /auth/* (no /api prefix).
 * In production/staging, we use same origin. In development, backend may be on different port.
 * 
 * IMPORTANT: This must be called at runtime (not module init) to ensure window is available.
 */
function getAuthBaseUrl(): string {
  // VITE_BACKEND_URL is the explicit backend origin (e.g., http://localhost:3000)
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  // In production/staging, frontend and backend share the same origin
  // This MUST be evaluated at runtime when window is available
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  // Fallback for development
  return 'http://localhost:3000';
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // Get base URL at runtime (not module init) to ensure window.location is available
  const BASE = getAuthBaseUrl();
  
  // Only set Content-Type: application/json if there's a body
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> ?? {}),
  };
  
  // Add Content-Type only when body is present
  if (init?.body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers,
    ...init,
  });

  if (!response.ok) {
    const rawMessage = (await response.text()) || 'Request failed';
    
    // Try to parse JSON error response
    let errorMessage: string;
    try {
      const errorData = JSON.parse(rawMessage);
      errorMessage = errorData.error || errorData.message || rawMessage;
    } catch {
      errorMessage = rawMessage;
    }
    
    // Convert technical errors to user-friendly messages
    if (response.status === 404 || errorMessage.toLowerCase().includes('not found')) {
      errorMessage = 'Service temporarily unavailable. Please try again.';
    } else if (response.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    }
    
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export type AuthUser = { 
  id: string; 
  name: string; 
  email: string;
  status?: string;
  emailVerified?: boolean;
  dataSharingConsent?: boolean | null;
  hasSeenBetaWelcome?: boolean;
};

export type SignupStartResponse = {
  userId: string;
  email: string;
  message: string;
  status: string;
};

export type LoginStartResponse = {
  userId: string;
  email: string;
  requiresPassword: boolean;
  status: string;
};

export type LoginCompleteResponse = {
  user: AuthUser;
  needsDataSharingConsent: boolean;
};

export type VerifyEmailResponse = {
  user: AuthUser;
  message: string;
};

export const AuthAPI = {
  // Legacy single-step methods (deprecated)
  signup: (data: { name: string; email: string; password: string }) =>
    request<AuthUser>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  login: (data: { email: string; password: string }) =>
    request<AuthUser>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Multi-step signup flow
  signupStart: (data: { firstName: string; lastName: string; email: string }) =>
    request<SignupStartResponse>('/auth/signup/start', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  signupPassword: (data: { userId: string; password: string }) =>
    request<{ ok: boolean; message: string }>('/auth/signup/password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  verifyEmail: (data: { userId: string; code: string }) =>
    request<VerifyEmailResponse>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  resendCode: (data: { userId: string }) =>
    request<{ ok: boolean; message: string }>('/auth/resend-code', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Multi-step login flow
  loginStart: (data: { email: string }) =>
    request<LoginStartResponse>('/auth/login/start', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  loginComplete: (data: { userId: string; password: string }) =>
    request<LoginCompleteResponse>('/auth/login/complete', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // User preferences
  updatePreferences: (data: { dataSharingConsent?: boolean; hasSeenBetaWelcome?: boolean }) =>
    request<{ ok: boolean }>('/auth/update-preferences', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Session management
  me: () => request<AuthUser>('/auth/me'),
  logout: () =>
    request<{ ok: boolean }>('/auth/logout', {
      method: 'POST',
      // No body - server accepts empty POST for logout
    }),
};

