

export async function apiFetch(url: string, options: RequestInit = {}) {
  const res = await fetch(url, options);
  return res;
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

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  // 이미 진행 중인 refresh가 있으면 같은 Promise를 공유 (race condition 방지)
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const auth = getAuth();
    if (!auth?.refreshToken) return null;

    try {
      const res = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: auth.refreshToken }),
      });

      if (!res.ok) {
        // 다른 탭이 먼저 갱신해서 refreshToken이 이미 교체됐는지 확인
        const currentAuth = getAuth();
        if (currentAuth?.refreshToken && currentAuth.refreshToken !== auth.refreshToken) {
          // 다른 탭이 갱신 완료 → 새 accessToken 사용
          return currentAuth.accessToken;
        }
        localStorage.removeItem('auth');
        // 앱에 세션 만료를 알려 즉시 /login으로 이동하게 함
        window.dispatchEvent(new CustomEvent('ujaxAuthExpired'));
        return null;
      }

      const { data } = await res.json();
      const stored = JSON.parse(localStorage.getItem('auth') || '{}');
      const updated = {
        ...stored,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      };
      localStorage.setItem('auth', JSON.stringify(updated));

      // Recoil userState의 토큰도 동기화 (stale 토큰이 localStorage를 덮어쓰는 것 방지)
      window.dispatchEvent(new CustomEvent('ujaxTokenUpdated', {
        detail: { accessToken: data.accessToken, refreshToken: data.refreshToken },
      }));
      // Extension에 갱신된 토큰 전달 (ujaxBridge.js가 수신)
      window.postMessage({ type: 'ujaxTokenRefreshed', token: data.accessToken }, '*');

      return data.accessToken;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
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

  // Handle Token Refresh
  if (res.status === 401 && token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(url, { ...options, headers });
    }
  }

  if (!res.ok) {
    let body = '';
    try { body = await res.text(); } catch { /* ignore */ }
    console.error(`[authFetch] ${options.method || 'GET'} ${url} → ${res.status}`, body);
    throw new Error(`Request failed: ${res.status} ${body}`);
  }

  // Handle empty responses designated by 204 No Content
  if (res.status === 204) {
    return {};
  }

  return res.json();
}

