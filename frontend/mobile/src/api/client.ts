import { useSettingsStore } from '../state/settingsStore';

type Query = Record<string, string | number | boolean | undefined | null>;

function joinUrl(baseUrl: string, path: string) {
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

function toQueryString(query?: Query) {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    params.set(key, String(value));
  }
  const s = params.toString();
  return s ? `?${s}` : '';
}

async function request(
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  opts?: {
    query?: Query;
    body?: unknown;
    timeoutMs?: number;
    headers?: Record<string, string>;
    responseType?: 'json' | 'text';
  }
) {
  const { query, body, timeoutMs = 10000, headers, responseType = 'json' } =
    opts ?? {};

  const baseUrl = useSettingsStore.getState().apiBaseUrl;
  if (!baseUrl) throw new Error('Missing apiBaseUrl (set it in Settings).');

  const url = `${joinUrl(baseUrl, path)}${toQueryString(query)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(headers ?? {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (responseType === 'text') {
      const text = await res.text();
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
      }
      return text;
    }

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const msg =
        json && typeof json === 'object' && 'message' in json
          ? String((json as any).message)
          : res.statusText;
      throw new Error(`HTTP ${res.status}: ${msg}`);
    }
    return json;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getJson<T>(
  path: string,
  query?: Query,
  headers?: Record<string, string>
) {
  return (await request('GET', path, { query, headers, responseType: 'json' })) as T;
}

export async function postJson<T>(
  path: string,
  body?: unknown,
  query?: Query,
  headers?: Record<string, string>
) {
  return (await request('POST', path, { query, body, headers, responseType: 'json' })) as T;
}

export async function postText(
  path: string,
  body?: unknown,
  query?: Query,
  headers?: Record<string, string>
) {
  return (await request('POST', path, { query, body, headers, responseType: 'text' })) as string;
}

export async function getText(path: string, query?: Query, headers?: Record<string, string>) {
  return (await request('GET', path, { query, headers, responseType: 'text' })) as string;
}

export async function deleteJson<T>(path: string, query?: Query, headers?: Record<string, string>) {
  return (await request('DELETE', path, { query, headers, responseType: 'json' })) as T;
}
