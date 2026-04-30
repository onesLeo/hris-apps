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
    throw await readError(res);
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
    throw await readError(res);
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
    throw await readError(res);
  }
  return res.json() as Promise<T>;
}

export async function apiUpload<T>(path: string, body: FormData): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body,
  });
  if (!res.ok) {
    throw await readError(res);
  }
  return res.json() as Promise<T>;
}

export async function apiGetBlob(path: string): Promise<{ blob: Blob; contentType: string; disposition: string | null }> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Accept': 'application/octet-stream',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    throw await readError(res);
  }
  return {
    blob: await res.blob(),
    contentType: res.headers.get('content-type') ?? 'application/octet-stream',
    disposition: res.headers.get('content-disposition'),
  };
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body: unknown = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function readError(res: Response): Promise<ApiError> {
  const text = await res.text().catch(() => '');
  try {
    const body = text ? JSON.parse(text) as { error?: { code?: string; message?: string } } : null;
    const message = body?.error?.message ?? text ?? 'Request failed';
    return new ApiError(res.status, message, body);
  } catch {
    return new ApiError(res.status, text || 'Request failed', null);
  }
}
