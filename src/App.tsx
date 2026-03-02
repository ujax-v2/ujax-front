import React from 'react';
import { useRecoilState, useRecoilValue, RecoilRoot } from 'recoil';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { sidebarOpenState, userState, currentWorkspaceState, workspacesState, Workspace, themeState, ThemeMode, languageState } from './store/atoms';
import { Sidebar } from './components/layout/Sidebar';
import { getWorkspaces } from './api/workspace';
import { Dashboard } from './features/dashboard/Dashboard';
import { Home } from './features/home/Home';
import { IDE } from './features/ide/IDE';
import { ProblemList } from './features/problems/ProblemList';
import { Profile } from './features/user/Profile';
import { Settings } from './features/user/Settings';
import { Community } from './features/community/Community';
import { PostCreate } from './features/community/PostCreate';
import { PostDetail } from './features/community/PostDetail';
import { PostEdit } from './features/community/PostEdit';
import { Login } from './features/auth/Login';
import { SignUp } from './features/auth/SignUp';
import { OAuthCallback } from './features/auth/OAuthCallback';
import { ProblemSolutions } from './features/problems/ProblemSolutions';
import { ChallengeList } from './features/challenges/ChallengeList';
import { ChallengeDetail } from './features/challenges/ChallengeDetail';
import { ProblemRegistration } from './features/problems/ProblemRegistration';
import { WorkspaceExplore } from './features/explore/WorkspaceExplore';
import { CreateWorkspaceModal } from './components/modals/CreateWorkspaceModal';
import { Menu } from 'lucide-react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/ko';
import 'dayjs/locale/en';
import { LangSync, useT } from './i18n';
import { Toaster } from 'sonner';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#0F1117', paper: '#141820' },
    primary: { main: '#6366f1' },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none', border: '1px solid #1e293b' },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#0f172a',
          borderRadius: 8,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#1e293b' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1' },
        },
        input: { color: '#e2e8f0' },
      },
    },
    MuiInputLabel: {
      styleOverrides: { root: { color: '#94a3b8' } },
    },
    MuiIconButton: {
      styleOverrides: { root: { color: '#94a3b8' } },
    },
  },
});

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    background: { default: '#ffffff', paper: '#ffffff' },
    primary: { main: '#6366f1' },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none', border: '1px solid #e2e8f0' },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#f8fafc',
          borderRadius: 8,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1' },
        },
        input: { color: '#0f172a' },
      },
    },
    MuiInputLabel: {
      styleOverrides: { root: { color: '#64748b' } },
    },
    MuiIconButton: {
      styleOverrides: { root: { color: '#64748b' } },
    },
  },
});

/** Resolve effective theme: 'system' → check prefers-color-scheme */
function useResolvedTheme(): 'light' | 'dark' {
  const theme = useRecoilValue(themeState);
  const [systemDark, setSystemDark] = React.useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (theme === 'system') return systemDark ? 'dark' : 'light';
  return theme;
}

/** Sync .dark class on <html> */
function ThemeSync() {
  const resolved = useResolvedTheme();

  React.useEffect(() => {
    const root = document.documentElement;
    if (resolved === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [resolved]);

  return null;
}

/** Expose resolved theme for MUI + components that need it */
export function useIsDark(): boolean {
  return useResolvedTheme() === 'dark';
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useRecoilValue(userState);
  const location = useLocation();

  if (!user.isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const user = useRecoilValue(userState);
  if (user.isLoggedIn) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

/**
 * 워크스페이스 스코프 라우트의 래퍼 컴포넌트
 * URL의 wsId를 읽어 Recoil의 currentWorkspaceState와 동기화
 */
function WorkspaceScope({ children }: { children: React.ReactNode }) {
  const { wsId } = useParams();
  const t = useT();
  const [currentWsId, setCurrentWsId] = useRecoilState(currentWorkspaceState);
  const [workspaces, setWorkspaces] = useRecoilState(workspacesState);
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(workspaces.length === 0);

  const numericWsId = Number(wsId);

  // 워크스페이스 목록이 비어있으면 fetch
  React.useEffect(() => {
    if (workspaces.length > 0) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await getWorkspaces();
        if (cancelled) return;
        const items = (list ?? []).map((w) => ({
          id: w.id,
          name: w.name,
          description: w.description ?? null,
          imageUrl: (w as any).imageUrl ?? null,
        })) as Workspace[];
        setWorkspaces(items);
      } catch (err) {
        console.error('Failed to fetch workspaces:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [workspaces.length, setWorkspaces]);

  const isMember = workspaces.some(w => w.id === numericWsId);

  // URL의 wsId가 변경되면 Recoil 상태도 동기화
  React.useEffect(() => {
    if (wsId && numericWsId !== currentWsId && isMember) {
      setCurrentWsId(numericWsId);
    }
  }, [wsId, numericWsId, currentWsId, setCurrentWsId, isMember]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-page">
        <div className="w-8 h-8 border-2 border-border-default border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isMember) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-page text-text-primary p-4">
        <div className="max-w-md text-center space-y-6 p-8 bg-surface border border-border-default rounded-2xl shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">{t('app.noAccess')}</h1>
          <p className="text-text-muted whitespace-pre-line">
            {t('app.noAccessDesc')}
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => navigate('/')}
              className="px-5 py-2.5 bg-surface-subtle hover:bg-border-subtle text-text-secondary rounded-lg transition-colors font-medium text-sm"
            >
              {t('app.goHome')}
            </button>
            <button
              onClick={() => navigate('/explore')}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-sm"
            >
              {t('app.findOtherStudy')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * 로그인 후 기본 워크스페이스로 리다이렉트하는 컴포넌트
 * /dashboard 같은 구(old) 라우트 접근 시 → /ws/:defaultWsId/dashboard 로 이동
 */
function RedirectToWorkspace({ page }: { page: string }) {
  const currentWsId = useRecoilValue(currentWorkspaceState);
  const workspaces = useRecoilValue(workspacesState);

  // 유효한 워크스페이스 ID 찾기
  const isValid = currentWsId > 0 && workspaces.some(w => w.id === currentWsId);
  const targetId = isValid ? currentWsId : (workspaces.length > 0 ? workspaces[0].id : null);

  if (!targetId) {
    return <Navigate to="/explore" replace />;
  }

  return <Navigate to={`/ws/${targetId}/${page}`} replace />;
}

function AppContent() {
  const [isSidebarOpen, setSidebarOpen] = useRecoilState(sidebarOpenState);
  const user = useRecoilValue(userState);
  const workspaces = useRecoilValue(workspacesState);
  const location = useLocation();

  // 사이드바를 숨겨야 하는 페이지: 인증, IDE, 홈, 풀이 보기(solutions)
  const isFullScreen = ['/login', '/signup', '/auth/callback', '/'].includes(location.pathname)
    || location.pathname.includes('/ide')
    || location.pathname.includes('/solutions');
  // 워크스페이스가 없으면 사이드바 숨김 (컨텍스트 없으므로)
  const showSidebar = !isFullScreen && user.isLoggedIn && workspaces.length > 0;

  return (
    <div className="flex h-screen bg-page text-text-primary font-sans overflow-hidden selection:bg-emerald-500/30">
      {showSidebar && <Sidebar />}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Mobile / Collapsed Sidebar Trigger */}
        {!isSidebarOpen && showSidebar && (
          <div className="absolute top-3 left-3 z-50">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-text-muted hover:text-text-primary hover:bg-hover-bg rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        )}

        <Routes>
          {/* 공개 라우트 */}
          <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="/signup" element={<PublicOnlyRoute><SignUp /></PublicOnlyRoute>} />
          <Route path="/auth/callback" element={<OAuthCallback />} />

          {/* 홈 (비로그인/로그인 모두 접근 가능) */}
          <Route path="/" element={<Home />} />

          {/* ═══ 워크스페이스 스코프 라우트 ═══ */}
          <Route path="/ws/:wsId/dashboard" element={
            <ProtectedRoute><WorkspaceScope><Dashboard /></WorkspaceScope></ProtectedRoute>
          } />
          <Route path="/ws/:wsId/problems" element={
            <ProtectedRoute><WorkspaceScope><ProblemList /></WorkspaceScope></ProtectedRoute>
          } />
          <Route path="/ws/:wsId/problems/new" element={
            <ProtectedRoute><WorkspaceScope><ProblemRegistration /></WorkspaceScope></ProtectedRoute>
          } />
          <Route path="/ws/:wsId/community" element={
            <ProtectedRoute><WorkspaceScope><Community /></WorkspaceScope></ProtectedRoute>
          } />
          <Route path="/ws/:wsId/community/new" element={
            <ProtectedRoute><WorkspaceScope><PostCreate /></WorkspaceScope></ProtectedRoute>
          } />
          <Route path="/ws/:wsId/community/:boardId" element={
            <ProtectedRoute><WorkspaceScope><PostDetail /></WorkspaceScope></ProtectedRoute>
          } />
          <Route path="/ws/:wsId/community/:boardId/edit" element={
            <ProtectedRoute><WorkspaceScope><PostEdit /></WorkspaceScope></ProtectedRoute>
          } />
          <Route path="/ws/:wsId/challenges" element={
            <ProtectedRoute><WorkspaceScope><ChallengeList /></WorkspaceScope></ProtectedRoute>
          } />
          <Route path="/ws/:wsId/challenges/:id" element={
            <ProtectedRoute><WorkspaceScope><ChallengeDetail /></WorkspaceScope></ProtectedRoute>
          } />

          <Route path="/ws/:wsId/ide" element={
            <ProtectedRoute><WorkspaceScope><IDE /></WorkspaceScope></ProtectedRoute>
          } />
          <Route path="/ws/:wsId/ide/:problemId" element={
            <ProtectedRoute><WorkspaceScope><IDE /></WorkspaceScope></ProtectedRoute>
          } />

          <Route path="/ws/:wsId/problems/:workspaceProblemId/solutions" element={
            <ProtectedRoute><WorkspaceScope><ProblemSolutions /></WorkspaceScope></ProtectedRoute>
          } />

          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/explore" element={<WorkspaceExplore />} />

          {/* ═══ 레거시 라우트 리다이렉트 (구 URL 호환) ═══ */}
          <Route path="/dashboard" element={<ProtectedRoute><RedirectToWorkspace page="dashboard" /></ProtectedRoute>} />
          <Route path="/problems" element={<ProtectedRoute><RedirectToWorkspace page="problems" /></ProtectedRoute>} />
          <Route path="/community" element={<ProtectedRoute><RedirectToWorkspace page="community" /></ProtectedRoute>} />
          <Route path="/challenges" element={<ProtectedRoute><RedirectToWorkspace page="challenges" /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function MuiThemeWrapper({ children }: { children: React.ReactNode }) {
  const isDark = useIsDark();
  return <ThemeProvider theme={isDark ? darkTheme : lightTheme}>{children}</ThemeProvider>;
}

function LocaleProvider({ children }: { children: React.ReactNode }) {
  const language = useRecoilValue(languageState);
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={language}>
      {children}
    </LocalizationProvider>
  );
}

export default function App() {
  return (
    <RecoilRoot>
      <MuiThemeWrapper>
        <LocaleProvider>
          <BrowserRouter>
            <ThemeSync />
            <LangSync />
            <AppContent />
            <CreateWorkspaceModal />
            <Toaster richColors position="top-right" theme="dark" />
          </BrowserRouter>
        </LocaleProvider>
      </MuiThemeWrapper>
    </RecoilRoot>
  );
}
