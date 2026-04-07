import { toast } from 'sonner';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

function getAccessToken(): string | null {
  return localStorage.getItem('auth_access');
}

function getRefreshToken(): string | null {
  return localStorage.getItem('auth_refresh');
}

function setTokens(access: string, refresh: string): void {
  localStorage.setItem('auth_access', access);
  localStorage.setItem('auth_refresh', refresh);
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const res = await fetch(`${BASE_URL}/api/users/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: refreshToken }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  const newAccess: string = data.access;
  const newRefresh: string = data.refresh ?? refreshToken;
  setTokens(newAccess, newRefresh);
  return newAccess;
}

function buildHeaders(isUpload = false): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isUpload) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { _retry?: boolean; _silent?: boolean } = {}
): Promise<T> {
  const { _retry, _silent, ...fetchOptions } = options;
  const isUpload = fetchOptions.body instanceof FormData;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...fetchOptions,
      headers: {
        ...buildHeaders(isUpload),
        ...(fetchOptions.headers ?? {}),
      },
    });
  } catch {
    // Network error — fetch itself threw (no connection, DNS failure, etc.)
    if (!_silent) {
      toast.error('No connection. Please check your network and try again.');
    }
    throw new Error('No connection');
  }

  if (res.status === 401 && !_retry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiFetch<T>(path, { ...options, _retry: true });
    }
    // Refresh failed — session expired
    window.dispatchEvent(new CustomEvent('auth:expired'));
    throw new Error('Session expired');
  }

  if (res.status === 401 && _retry) {
    window.dispatchEvent(new CustomEvent('auth:expired'));
    throw new Error('Session expired');
  }

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const err = await res.json();
      message = err.detail ?? err.error ?? JSON.stringify(err);
    } catch {
      // ignore parse errors
    }
    if (!_silent) {
      toast.error(message);
    }
    throw new Error(message);
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return undefined as unknown as T;
  }

  return res.json() as Promise<T>;
}

export const api = {
  get<T>(path: string, options?: RequestInit): Promise<T> {
    return apiFetch<T>(path, { ...options, method: 'GET' });
  },

  post<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    return apiFetch<T>(path, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    return apiFetch<T>(path, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    return apiFetch<T>(path, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(path: string, options?: RequestInit): Promise<T> {
    return apiFetch<T>(path, { ...options, method: 'DELETE' });
  },

  upload<T>(path: string, formData: FormData, options?: RequestInit): Promise<T> {
    // Don't set Content-Type — let the browser set it with the multipart boundary
    return apiFetch<T>(path, {
      ...options,
      method: 'POST',
      body: formData,
    });
  },
};
