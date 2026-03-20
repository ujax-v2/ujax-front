import { useSetRecoilState } from 'recoil';
import { useNavigate } from 'react-router-dom';
import { userState, workspacesState, currentWorkspaceState, GUEST_USER, UserState } from '@/store/atoms';
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
  const setCurrentWsId = useSetRecoilState(currentWorkspaceState);
  const navigate = useNavigate();

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

    const userData: UserState = {
      isLoggedIn: true,
      id: me.id,
      name: me.name,
      email: me.email,
      avatar: me.name,
      profileImageUrl: me.profileImageUrl ?? '',
      baekjoonId: me.baekjoonId ?? '',
      provider: me.provider,
      accessToken,
      refreshToken,
    };

    // Recoil 업데이트 → authStorageEffect가 자동으로 localStorage 동기화
    setWorkspaces([]);
    setUser(userData);

    return userData;
  };

  const logout = async (refreshToken?: string) => {
    try {
      if (refreshToken) {
        await logoutApi(refreshToken);
      }
    } catch {
      // logout API 실패해도 로컬 상태는 초기화
    }
    setUser(GUEST_USER);
    setWorkspaces([]);
    setCurrentWsId(0);
    navigate('/login');
  };

  return { setAuthUser, logout };
}
