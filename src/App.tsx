import React, { useEffect } from 'react';
import { useRecoilState, useRecoilValue, RecoilRoot } from 'recoil';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { sidebarOpenState, userState } from './store/atoms';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './features/dashboard/Dashboard';
import { Home } from './features/home/Home';
import { IDE } from './features/ide/IDE';
import { ProblemList } from './features/problems/ProblemList';
import { Profile } from './features/user/Profile';
import { Settings } from './features/user/Settings';
import { SolutionForm } from './features/community/SolutionForm';
import { Community } from './features/community/Community';
import { Login } from './features/auth/Login';
import { SignUp } from './features/auth/SignUp';
import { OAuthCallback } from './features/auth/OAuthCallback';
import { ProblemSolutions } from './features/problems/ProblemSolutions';
import { ChallengeList } from './features/challenges/ChallengeList';
import { ChallengeDetail } from './features/challenges/ChallengeDetail';
import { ProblemRegistration } from './features/problems/ProblemRegistration';
import { CreateWorkspaceModal } from './components/modals/CreateWorkspaceModal';
import { Menu } from 'lucide-react';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const user = useRecoilValue(userState);
  const location = useLocation();

  if (!user.isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function PublicOnlyRoute({ children }: { children: JSX.Element }) {
  const user = useRecoilValue(userState);
  if (user.isLoggedIn) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function AppContent() {
  const [isSidebarOpen, setSidebarOpen] = useRecoilState(sidebarOpenState);
  const user = useRecoilValue(userState);
  const location = useLocation();

  // Hide sidebar on auth pages and IDE
  const isFullScreen = ['/login', '/signup', '/auth/callback'].includes(location.pathname) || location.pathname.startsWith('/ide');
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
          {/* Public Routes */}
          <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="/signup" element={<PublicOnlyRoute><SignUp /></PublicOnlyRoute>} />
          <Route path="/auth/callback" element={<OAuthCallback />} />

          {/* Landing / Home (Accessible to all) */}
          <Route path="/" element={<Home />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/problems" element={<ProtectedRoute><ProblemList /></ProtectedRoute>} />
          <Route path="/problems/new" element={<ProtectedRoute><ProblemRegistration /></ProtectedRoute>} />
          <Route path="/problems/:id/solutions" element={<ProtectedRoute><ProblemSolutions /></ProtectedRoute>} />

          <Route path="/ide" element={<ProtectedRoute><IDE /></ProtectedRoute>} />
          <Route path="/ide/:problemId" element={<ProtectedRoute><IDE /></ProtectedRoute>} />

          <Route path="/solutions/new" element={<ProtectedRoute><SolutionForm /></ProtectedRoute>} />
          <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />

          <Route path="/challenges" element={<ProtectedRoute><ChallengeList /></ProtectedRoute>} />
          <Route path="/challenges/:id" element={<ProtectedRoute><ChallengeDetail /></ProtectedRoute>} />

          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

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
