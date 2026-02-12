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
}

export async function authFetch(url: string, options: RequestInit = {}) {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(url, { ...options, headers });

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
  return res.json();
}
