export function getAccessToken(): string | null {
  try {
    const stored = localStorage.getItem('auth');
    if (stored) {
      return JSON.parse(stored).accessToken || null;
    }
  } catch {
    // ignore
  }
  return null;
}

export async function authFetch(url: string, options: RequestInit = {}) {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json();
}
