import { atom } from 'recoil';


export const themeState = atom({
  key: 'themeState',
  default: 'dark',
});

export const sidebarOpenState = atom({
  key: 'sidebarOpenState',
  default: true,
});

// Problem Box State
export const currentProblemBoxState = atom({
  key: 'currentProblemBoxState',
  default: null, // null means showing list of boxes, otherwise contains box ID/Data
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

function loadUser() {
  try {
    const stored = localStorage.getItem('auth');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.accessToken) {
        return {
          isLoggedIn: true,
          name: parsed.name || 'User',
          email: parsed.email || '',
          avatar: parsed.avatar || '',
          accessToken: parsed.accessToken as string,
          refreshToken: parsed.refreshToken as string,
        };
      }
    }
  } catch {
    // ignore
  }
  return { isLoggedIn: false, name: 'Guest', email: '', avatar: '', accessToken: '', refreshToken: '' };
}

export const userState = atom({
  key: 'userState',
  default: loadUser(),
});

export const communityTabState = atom({
  key: 'communityTabState',
  default: 'notices',
});

export const currentChallengeState = atom<any>({
  key: 'currentChallengeState',
  default: null,
});

export const currentWorkspaceState = atom({
  key: 'currentWorkspaceState',
  default: 'ws-1'
});

export const workspacesState = atom({
  key: 'workspacesState',
  default: [
    { id: 'ws-1', name: "알고리즘 스터디", icon: "📚", role: 'owner', members: 4 },
    { id: 'ws-2', name: "UJAX 개발팀", icon: "🚀", role: 'owner', members: 3 }
  ]
});

export const settingsTabState = atom({
  key: 'settingsTabState',
  default: 'profile',
});

export const isCreateWorkspaceModalOpenState = atom({
  key: 'isCreateWorkspaceModalOpenState',
  default: false,
});
