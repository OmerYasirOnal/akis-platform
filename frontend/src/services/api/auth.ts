const BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  'http://localhost:3000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const message = (await response.text()) || 'Request failed';
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export type AuthUser = { id: string; name: string; email: string };

export const AuthAPI = {
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
  me: () => request<AuthUser>('/auth/me'),
  logout: () =>
    request<{ ok: boolean }>('/auth/logout', {
      method: 'POST',
    }),
};

