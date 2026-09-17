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
