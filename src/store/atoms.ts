import { atom, AtomEffect } from 'recoil';

const localStorageEffect = <T>(key: string): AtomEffect<T> => ({ setSelf, onSet }) => {
  try {
    const saved = localStorage.getItem(key);
    if (saved != null) setSelf(JSON.parse(saved));
  } catch { /* ignore */ }
  onSet((newValue, _, isReset) => {
    try {
      if (isReset) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(newValue));
    } catch { /* ignore */ }
  });
};

export type ThemeMode = 'system' | 'light' | 'dark';

export const themeState = atom<ThemeMode>({
  key: 'themeState',
  default: 'dark',
  effects: [localStorageEffect('theme')],
});

export type Language = 'ko' | 'en';

export const languageState = atom<Language>({
  key: 'languageState',
  default: 'ko',
  effects: [localStorageEffect('language')],
});

export const sidebarOpenState = atom({
  key: 'sidebarOpenState',
  default: true,
});

// 문제집(ProblemBox) 타입 — API 응답 기반
export interface ProblemBox {
  id: number;
  title: string;
  description?: string | null;
  createdAt: string;
}


// Problem Box State
export const currentProblemBoxState = atom<ProblemBox | null>({
  key: 'currentProblemBoxState',
  default: null, // null이면 문제집 목록 표시, 값이 있으면 해당 문제집 내부 표시
  effects: [localStorageEffect('currentProblemBox')],
});

// IDE State
export const ideCodeState = atom({
  key: 'ideCodeState',
  default: `// Write your code here
console.log("Hello, World!");`,
});

export const ideLanguageState = atom({
  key: 'ideLanguageState',
  default: 'javascript',
});

// IDE 실행 결과 타입 정의
export interface IdeOutput {
  stdout: string | null;
  stderr: string | null;
  status: { id: number; description: string } | null;
  time: string | null;
  memory: string | null;
}

export const ideOutputState = atom<IdeOutput | null>({
  key: 'ideOutputState',
  default: null,
});

export const ideIsExecutingState = atom({
  key: 'ideIsExecutingState',
  default: false,
});

export interface UserState {
  isLoggedIn: boolean;
  id: number;
  name: string;
  email: string;
  avatar: string;
  profileImageUrl: string;
  baekjoonId: string;
  accessToken: string;
  refreshToken: string;
  provider: string;
}

function loadUser(): UserState {
  try {
    const stored = localStorage.getItem('auth');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object' && parsed.accessToken) {
        return {
          isLoggedIn: true,
          id: parsed.id || 0,
          name: parsed.name || 'User',
          email: parsed.email || '',
          avatar: parsed.avatar || '',
          profileImageUrl: parsed.profileImageUrl || '',
          baekjoonId: parsed.baekjoonId || '',
          provider: parsed.provider || '',
          accessToken: parsed.accessToken as string,
          refreshToken: parsed.refreshToken as string,
        };
      }
    }
  } catch (e) {
    console.warn('Failed to load user session, clearing storage:', e);
    localStorage.removeItem('auth');
  }
  return { isLoggedIn: false, id: 0, name: 'Guest', email: '', avatar: '', profileImageUrl: '', baekjoonId: '', provider: '', accessToken: '', refreshToken: '' };
}

export const userState = atom<UserState>({
  key: 'userState',
  default: loadUser(),
});


// 챌린지 타입
export interface Challenge {
  id: number;
  title: string;
  participants: number;
  duration: string;
  startDate: string;
  reward: string;
  status: 'active' | 'recruiting' | 'ended';
  color: string;
  description: string;
}

export const currentChallengeState = atom<Challenge | null>({
  key: 'currentChallengeState',
  default: null,
});

// 워크스페이스 타입 (API WorkspaceResponse 기반)
export interface Workspace {
  id: number;
  name: string;
  description: string | null;
}

export const currentWorkspaceState = atom<number>({
  key: 'currentWorkspaceState',
  default: 0,
  effects: [localStorageEffect('currentWorkspaceId')],
});

export const workspacesState = atom<Workspace[]>({
  key: 'workspacesState',
  default: [],
  effects: [localStorageEffect('workspaces')],
});

export const settingsTabState = atom({
  key: 'settingsTabState',
  default: 'profile',
});

export const isCreateWorkspaceModalOpenState = atom({
  key: 'isCreateWorkspaceModalOpenState',
  default: false,
});
