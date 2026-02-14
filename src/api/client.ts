import { MOCK_AUTH, MOCK_USER, MOCK_WORKSPACES, MOCK_PROBLEMS } from './mockData';

const IS_DEV = import.meta.env.DEV;
let isBackendChecked = false;
let isBackendAvailable = true;

/**
 * Checks if the backend is reachable.
 * Only runs once in production; in dev, it can be reset if needed.
 */
async function checkBackendConnection(): Promise<boolean> {
  if (isBackendChecked) return isBackendAvailable;

  try {
    // Try a low-cost endpoint or even one that might 401/404, just to check network connectivity.
    // Using a timeout to avoid hanging.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    // We try to fetch the refresh token endpoint as a probe. 
    // Even a 400/401 response means the server is THERE.
    // Connection refused/timeout means it's NOT.
    // If Vite proxy returns 502/504, it means target is down.
    const res = await fetch('/api/v1/auth/refresh', {
      method: 'OPTIONS',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // If we get a proxy error (Bad Gateway, Service Unavailable, Gateway Timeout, Internal Server Error), 
    // assume backend is down.
    if (res.status === 500 || res.status === 502 || res.status === 503 || res.status === 504) {
      console.warn('Backend returned 5xx (likely proxy error), marking as unavailable.');
      isBackendAvailable = false;
    } else {
      isBackendAvailable = true;
    }

  } catch (err) {
    console.warn('Backend connectivity check failed (Network Error):', err);
    isBackendAvailable = false;
  } finally {
    isBackendChecked = true;
  }

  if (IS_DEV && !isBackendAvailable) {
    console.info('%c Using Mock Data (Backend Unavailable) ', 'background: #222; color: #bada55');
  }

  return isBackendAvailable;
}

/**
 * Core fetch wrapper that handles backend connectivity checks and mock fallbacks.
 */
// Core fetch wrapper that handles backend connectivity checks and mock fallbacks.
export async function apiFetch(url: string, options: RequestInit = {}) {
  await checkBackendConnection();

  // 1. Proactive: If we already know backend is down, use mock immediately.
  if (IS_DEV && !isBackendAvailable) {
    return handleMockRequest(url, options);
  }

  // 2. Reactive: Try real fetch. If it fails (network error or 5xx server error), fallback to mock in DEV.
  try {
    const res = await fetch(url, options);

    // If server returns 5xx, it means backend logic failed OR proxy failed.
    // In local dev, this usually means we should use mock.
    if (IS_DEV && res.status >= 500) {
      console.warn(`Server Error (${res.status}). Switching to Mock Mode.`);
      isBackendAvailable = false;
      return handleMockRequest(url, options);
    }

    return res;
  } catch (err) {
    console.warn(`Fetch failed for ${url}. Switching to Mock Mode.`, err);

    if (IS_DEV) {
      isBackendAvailable = false;
      return handleMockRequest(url, options);
    }
    throw err;
  }
}

function getAuth(): { accessToken: string; refreshToken: string } | null {
  try {
    const stored = localStorage.getItem('auth');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.accessToken) return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

export function getAccessToken(): string | null {
  return getAuth()?.accessToken || null;
}

async function refreshAccessToken(): Promise<string | null> {
  const auth = getAuth();
  if (!auth?.refreshToken) return null;

  // Use apiFetch internally? No, circular dependency risk if not careful.
  // But refresh is specific. Let's keep it simple or use apiFetch carefully.
  // Actually, if we are in mock mode, refresh should also be mocked.

  await checkBackendConnection();
  if (IS_DEV && !isBackendAvailable) {
    return 'mock-access-token';
  }

  try {
    const res = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: auth.refreshToken }),
    });

    if (!res.ok) {
      localStorage.removeItem('auth');
      return null;
    }

    const { data } = await res.json();
    const stored = JSON.parse(localStorage.getItem('auth') || '{}');
    localStorage.setItem('auth', JSON.stringify({
      ...stored,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    }));
    return data.accessToken;
  } catch {
    return null;
  }
}

export async function authFetch(url: string, options: RequestInit = {}) {
  await checkBackendConnection();

  // 1. Mock Mode
  if (IS_DEV && !isBackendAvailable) {
    return handleMockRequest(url, options);
  }

  // 2. Real Mode
  const token = getAccessToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(url, { ...options, headers });

  // Handle Token Refresh
  if (res.status === 401 && token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(url, { ...options, headers });
    }
  }

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  // Handle empty responses designated by 204 No Content
  if (res.status === 204) {
    return {};
  }

  return res.json();
}

// ----------------------------------------------------------------------
// Mock Handlers (Located at bottom as requested)
// ----------------------------------------------------------------------

async function handleMockRequest(url: string, options: RequestInit = {}) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 400));

  const method = options.method || 'GET';

  // Helper for success response
  const success = (data: any) => ({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => data,
    headers: new Headers({ 'Content-Type': 'application/json' }),
  });

  // --- Auth Mocks ---
  if (url.includes('/api/v1/auth/login') && method === 'POST') {
    return success({ data: MOCK_AUTH });
  }

  if (url.includes('/api/v1/auth/signup') && method === 'POST') {
    return success({ data: MOCK_AUTH });
  }

  if (url.includes('/api/v1/auth/logout')) {
    return success({ success: true });
  }

  // --- User Mocks ---
  if (url.includes('/api/v1/users/me')) {
    return success({ data: MOCK_USER });
  }

  // --- Workspace Mocks ---
  if (url.includes('/api/v1/workspaces')) {
    return success({ data: MOCK_WORKSPACES });
  }

  // --- Problem Mocks ---
  if (url.includes('/api/v1/problems')) {
    return success({ data: MOCK_PROBLEMS });
  }

  // Fallback for unknown mock routes
  console.warn(`[Mock] No handler for ${method} ${url}`);
  return {
    ok: false,
    status: 404,
    statusText: 'Not Found (Mock)',
    json: async () => ({ error: 'Mock endpoint not implemented' }),
    headers: new Headers(),
  };
}
