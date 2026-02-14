import React from 'react';
import { useRecoilState, useRecoilValue, RecoilRoot } from 'recoil';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { sidebarOpenState, userState, currentWorkspaceState } from './store/atoms';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './features/dashboard/Dashboard';
import { Home } from './features/home/Home';
import { IDE } from './features/ide/IDE';
import { ProblemList } from './features/problems/ProblemList';
import { Profile } from './features/user/Profile';
import { Settings } from './features/user/Settings';
import { Community } from './features/community/Community';
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
  const [currentWsId, setCurrentWsId] = useRecoilState(currentWorkspaceState);

  // URL의 wsId가 변경되면 Recoil 상태도 동기화
  React.useEffect(() => {
    if (wsId && wsId !== currentWsId) {
      setCurrentWsId(wsId);
    }
  }, [wsId, currentWsId, setCurrentWsId]);

  return <>{children}</>;
}

/**
 * 로그인 후 기본 워크스페이스로 리다이렉트하는 컴포넌트
 * /dashboard 같은 구(old) 라우트 접근 시 → /ws/:defaultWsId/dashboard 로 이동
 */
function RedirectToWorkspace({ page }: { page: string }) {
  const currentWsId = useRecoilValue(currentWorkspaceState);
  return <Navigate to={`/ws/${currentWsId}/${page}`} replace />;
}

function AppContent() {
  const [isSidebarOpen, setSidebarOpen] = useRecoilState(sidebarOpenState);
  const user = useRecoilValue(userState);
  const location = useLocation();

  // 사이드바를 숨겨야 하는 페이지: 인증, IDE, 홈
  const isFullScreen = ['/login', '/signup', '/auth/callback', '/'].includes(location.pathname)
    || location.pathname.startsWith('/ide');
  const showSidebar = !isFullScreen && user.isLoggedIn;

  return (
    <div className="flex h-screen bg-[#0F1117] text-white font-sans overflow-hidden selection:bg-emerald-500/30">
      {showSidebar && <Sidebar />}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Mobile / Collapsed Sidebar Trigger */}
        {!isSidebarOpen && showSidebar && (
          <div className="absolute top-3 left-3 z-50">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
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
          <Route path="/ws/:wsId/challenges" element={
            <ProtectedRoute><WorkspaceScope><ChallengeList /></WorkspaceScope></ProtectedRoute>
          } />
          <Route path="/ws/:wsId/challenges/:id" element={
            <ProtectedRoute><WorkspaceScope><ChallengeDetail /></WorkspaceScope></ProtectedRoute>
          } />

          {/* ═══ 글로벌 라우트 (WS 무관) ═══ */}
          <Route path="/ide" element={<ProtectedRoute><IDE /></ProtectedRoute>} />
          <Route path="/ide/:problemId" element={<ProtectedRoute><IDE /></ProtectedRoute>} />
          <Route path="/problems/:id/solutions" element={<ProtectedRoute><ProblemSolutions /></ProtectedRoute>} />

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

export default function App() {
  return (
    <RecoilRoot>
      <BrowserRouter>
        <AppContent />
        <CreateWorkspaceModal />
      </BrowserRouter>
    </RecoilRoot>
  );
}
