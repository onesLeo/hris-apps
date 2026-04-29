// Thin fetch wrapper for the HRIS API.
// Auth token source priority:
//   1. NEXT_PUBLIC_DEV_AUTH_TOKEN env var  (dev only — never set in production)
//   2. window.__hrisAuthToken              (set by AuroraAppShell from NextAuth session)
// If neither is available the request is sent without Authorization and the
// API will return 401, which callers handle by falling back to mock data.

declare global {
  interface Window { __hrisAuthToken?: string }
}

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000/api/v1';

function getToken(): string | null {
  if (typeof process !== 'undefined' && process.env['NEXT_PUBLIC_DEV_AUTH_TOKEN']) {
    return process.env['NEXT_PUBLIC_DEV_AUTH_TOKEN'];
  }
  if (typeof window !== 'undefined' && window.__hrisAuthToken) {
    return window.__hrisAuthToken;
  }
  return null;
}

export async function apiGet<T>(path: string): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, text);
  }
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, text);
  }
  return res.json() as Promise<T>;
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, text);
  }
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}
