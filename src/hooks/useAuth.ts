import { useRecoilValue, useSetRecoilState } from 'recoil';
import { useNavigate } from 'react-router-dom';
import { userState, workspacesState, currentWorkspaceState, currentProblemBoxState, myWorkspaceRoleState, problemContextState, GUEST_USER, UserState } from '@/store/atoms';
import { logoutApi } from '@/api/auth';
import { getMe } from '@/api/user';

/**
 * 인증 관련 공통 로직을 제공하는 훅.
 *
 * - setAuthUser: 토큰으로 유저 정보를 조회하고 Recoil에 저장 (localStorage는 atom effect가 자동 처리)
 * - logout: API 로그아웃 + Recoil 초기화 + /login 이동
 */
export function useAuth() {
  const setUser = useSetRecoilState(userState);
  const setWorkspaces = useSetRecoilState(workspacesState);
  const currentWsId = useRecoilValue(currentWorkspaceState);
  const setCurrentWsId = useSetRecoilState(currentWorkspaceState);
  const setCurrentProblemBox = useSetRecoilState(currentProblemBoxState);
  const setMyWorkspaceRole = useSetRecoilState(myWorkspaceRoleState);
  const setProblemContext = useSetRecoilState(problemContextState);
  const navigate = useNavigate();

  const normalizeBojId = (value?: string | null) => String(value ?? '').trim();

  /**
   * 토큰을 받아 getMe()로 유저 정보를 조회하고 Recoil userState에 저장한다.
   * authFetch가 localStorage의 auth.accessToken을 참조하므로,
   * 호출 전에 localStorage에 토큰이 저장되어 있어야 한다.
   *
   * ※ 주의: localStorage에 임시 토큰 저장은 호출측에서 해야 한다.
   *   (authFetch → getAccessToken → localStorage.getItem('auth') 경로 때문)
   */
  const setAuthUser = async (accessToken: string, refreshToken: string): Promise<UserState> => {
    // authFetch가 토큰을 localStorage에서 읽으므로 임시 저장
    localStorage.setItem('auth', JSON.stringify({ accessToken, refreshToken }));

    let me;
    try {
      me = await getMe();
    } catch (e) {
      localStorage.removeItem('auth');
      throw e;
    }

    const normalizedBojId = normalizeBojId(me.baekjoonId);

    const userData: UserState = {
      isLoggedIn: true,
      id: me.id,
      name: me.name,
      email: me.email,
      avatar: me.name,
      profileImageUrl: me.profileImageUrl ?? '',
      baekjoonId: normalizedBojId,
      provider: me.provider,
      accessToken,
      refreshToken,
    };

    // Recoil 업데이트 → authStorageEffect가 자동으로 localStorage 동기화
    setWorkspaces([]);
    setUser(userData);
    window.postMessage({ type: 'ujaxAuthChanged', token: accessToken, bojId: normalizedBojId || null }, '*');

    return userData;
  };

  const logout = async (_refreshToken?: string) => {
    // Recoil userState의 refreshToken은 silent refresh 이후 stale할 수 있으므로
    // 항상 localStorage에서 최신 refreshToken을 직접 읽어 사용한다.
    let currentRefreshToken: string | undefined;
    try {
      const stored = JSON.parse(localStorage.getItem('auth') || '{}');
      currentRefreshToken = stored.refreshToken || undefined;
    } catch { /* ignore */ }

    try {
      if (currentRefreshToken) {
        await logoutApi(currentRefreshToken);
      }
    } catch {
      // logout API 실패해도 로컬 상태는 초기화
    }
    if (currentWsId) localStorage.setItem('lastWorkspaceId', String(currentWsId));
    setUser(GUEST_USER);
    setWorkspaces([]);
    setCurrentWsId(0);
    setCurrentProblemBox(null);
    setMyWorkspaceRole('MEMBER');
    setProblemContext({});
    window.postMessage({ type: 'ujaxAuthChanged', token: null, bojId: null }, '*');
    navigate('/login');
  };

  return { setAuthUser, logout };
}
