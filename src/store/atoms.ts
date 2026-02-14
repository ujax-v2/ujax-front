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

export const ideOutputState = atom({
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
    { id: 'ws-1', name: "지훈 성의 Notion", icon: "지", role: 'owner', members: 1 },
    { id: 'ws-2', name: "Ujax (임시)", icon: "U", role: 'member', members: 5 }
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
