import { atom } from 'recoil';

export const navigationState = atom({
  key: 'navigationState',
  default: 'dashboard',
});

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

export const userState = atom({
  key: 'userState',
  default: {
    isLoggedIn: false,
    name: 'Guest',
    email: '',
    avatar: '',
  }
});

export const communityTabState = atom({
  key: 'communityTabState',
  default: 'notices',
});

export const currentChallengeState = atom({
  key: 'currentChallengeState',
  default: null,
});
