import React from 'react';
import { useRecoilState, useRecoilValue, RecoilRoot } from 'recoil';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { sidebarOpenState, userState, currentWorkspaceState, workspacesState } from './store/atoms';
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
  const workspaces = useRecoilValue(workspacesState);
  const navigate = useNavigate();

  const numericWsId = Number(wsId);
  const isMember = workspaces.some(w => w.id === numericWsId);

  // URL의 wsId가 변경되면 Recoil 상태도 동기화
  React.useEffect(() => {
    if (wsId && numericWsId !== currentWsId && isMember) {
      setCurrentWsId(numericWsId);
    }
  }, [wsId, numericWsId, currentWsId, setCurrentWsId, isMember]);

  if (!isMember) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0F1117] text-white p-4">
        <div className="max-w-md text-center space-y-6 p-8 bg-[#141820] border border-slate-800 rounded-2xl shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">접근 권한이 없습니다</h1>
          <p className="text-slate-400">
            요청하신 워크스페이스에 접근할 수 없습니다.<br />
            멤버가 아니거나 존재하지 않는 워크스페이스일 수 있습니다.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => navigate('/')}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors font-medium text-sm"
            >
              홈으로
            </button>
            <button
              onClick={() => navigate('/explore')}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-sm"
            >
              다른 스터디 찾기
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

  // 사이드바를 숨겨야 하는 페이지: 인증, IDE, 홈
  const isFullScreen = ['/login', '/signup', '/auth/callback', '/'].includes(location.pathname)
    || location.pathname.startsWith('/ide');
  // 워크스페이스가 없으면 사이드바 숨김 (컨텍스트 없으므로)
  const showSidebar = !isFullScreen && user.isLoggedIn && workspaces.length > 0;

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
