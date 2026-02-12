import React, { useEffect } from 'react';
import { useRecoilState, useRecoilValue, RecoilRoot } from 'recoil';
import { navigationState, sidebarOpenState, userState } from './store/atoms';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './features/dashboard/Dashboard';
import { IDE } from './features/ide/IDE';
import { ProblemList } from './features/problems/ProblemList';
import { Profile } from './features/user/Profile';
import { Settings } from './features/user/Settings';
import { SolutionForm } from './features/community/SolutionForm';
import { Community } from './features/community/Community';
import { Login } from './features/auth/Login';
import { SignUp } from './features/auth/SignUp';
import { ProblemSolutions } from './features/problems/ProblemSolutions';
import { ChallengeList } from './features/challenges/ChallengeList';
import { ChallengeDetail } from './features/challenges/ChallengeDetail';
import { ProblemRegistration } from './features/problems/ProblemRegistration';
import { CreateWorkspaceModal } from './components/modals/CreateWorkspaceModal';
import { Menu } from 'lucide-react';

function AppContent() {
  const currentPage = useRecoilValue(navigationState);
  const [isSidebarOpen, setSidebarOpen] = useRecoilState(sidebarOpenState);
  const [user, setUser] = useRecoilState(userState);

  // Simple Auth Redirect Check
  const isAuthPage = currentPage === 'login' || currentPage === 'signup';

  if (!user.isLoggedIn && !isAuthPage) {
    return <Login />;
  }
  
  if (currentPage === 'signup') {
    return <SignUp />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'problems': return <ProblemList />;
      case 'problem-registration': return <ProblemRegistration />;
      case 'ide': return <IDE />;
      case 'solution-form': return <SolutionForm />;
      case 'community': return <Community />;
      case 'problem-solutions': return <ProblemSolutions />;
      case 'challenges': return <ChallengeList />;
      case 'challenge-detail': return <ChallengeDetail />;
      case 'profile': return <Profile />;
      case 'settings': return <Settings />;
      default: return <Dashboard />; // Default redirect
    }
  };

  return (
    <div className="flex h-screen bg-[#0F1117] text-white font-sans overflow-hidden selection:bg-emerald-500/30">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Mobile / Collapsed Sidebar Trigger */}
        {!isSidebarOpen && (
          <div className="absolute top-3 left-3 z-50">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        )}
        {renderPage()}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <RecoilRoot>
      <AppContent />
      <CreateWorkspaceModal />
    </RecoilRoot>
  );
}
