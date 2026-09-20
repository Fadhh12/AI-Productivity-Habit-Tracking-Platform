import { enqueue, isNetworkError, QueuedKind } from './offlineQueue';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

function getTokens() {
  if (typeof window === 'undefined') return { accessToken: null, refreshToken: null };
  return {
    accessToken: localStorage.getItem('continuum_access_token'),
    refreshToken: localStorage.getItem('continuum_refresh_token'),
  };
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('continuum_access_token', accessToken);
  localStorage.setItem('continuum_refresh_token', refreshToken);
}

export function clearTokens() {
  localStorage.removeItem('continuum_access_token');
  localStorage.removeItem('continuum_refresh_token');
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(typeof body === 'object' && body && 'message' in body ? String((body as { message: unknown }).message) : 'Request failed');
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken } = getTokens();
  if (!refreshToken) return null;
  const res = await fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  setTokens(data.accessToken, data.refreshToken);
  return data.accessToken as string;
}

export interface OfflineQueued {
  queued: true;
}

export function wasQueued(result: unknown): result is OfflineQueued {
  return typeof result === 'object' && result !== null && (result as OfflineQueued).queued === true;
}

/**
 * Like apiFetch for a write, but if the network is unreachable the request is
 * saved to the offline queue (replayed automatically when back online) and
 * `{ queued: true }` is returned instead of throwing. Server errors still throw.
 */
export async function apiFetchQueued<T = unknown>(
  path: string,
  options: RequestInit,
  kind: QueuedKind,
): Promise<T | OfflineQueued> {
  const idempotencyKey = crypto.randomUUID();
  try {
    return await apiFetch<T>(path, { ...options, idempotencyKey });
  } catch (err) {
    if (!isNetworkError(err)) throw err;
    enqueue({ kind, path, method: options.method ?? 'POST', body: String(options.body ?? '{}') });
    return { queued: true };
  }
}

/** Downloads a binary/file response (export endpoints) and saves it via the browser, reusing the same auth + refresh flow as apiFetch. */
export async function apiDownload(path: string, filename: string): Promise<void> {
  const { accessToken } = getTokens();
  const headers = new Headers();
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  let res = await fetch(`${API_URL}${path}`, { headers });

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      res = await fetch(`${API_URL}${path}`, { headers });
    }
  }

  if (!res.ok) {
    const body = (res.headers.get('content-type') ?? '').includes('application/json') ? await res.json() : await res.text();
    throw new ApiError(res.status, body);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit & { skipAuth?: boolean; idempotencyKey?: string } = {},
): Promise<T> {
  const { skipAuth, idempotencyKey, ...init } = options;
  const { accessToken } = getTokens();

  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (!skipAuth && accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  if (idempotencyKey) headers.set('Idempotency-Key', idempotencyKey);

  let res = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (res.status === 401 && !skipAuth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      res = await fetch(`${API_URL}${path}`, { ...init, headers });
    }
  }

  const contentType = res.headers.get('content-type') ?? '';
  const body = contentType.includes('application/json') ? await res.json() : await res.text();

  if (!res.ok) {
    throw new ApiError(res.status, body);
  }
  return body as T;
}
