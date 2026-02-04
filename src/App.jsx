import React from 'react';
import { useRecoilState, useRecoilValue, RecoilRoot } from 'recoil';
import { navigationState, sidebarOpenState } from './store/atoms';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './features/dashboard/Dashboard';
import { IDE } from './features/ide/IDE';
import { ProblemList } from './features/problems/ProblemList';
import { Profile } from './features/user/Profile';
import { SolutionForm } from './features/community/SolutionForm';
import { Community } from './features/community/Community';
import { Menu } from 'lucide-react';
function AppContent() {
    const currentPage = useRecoilValue(navigationState);
    const [isSidebarOpen, setSidebarOpen] = useRecoilState(sidebarOpenState);
    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard': return <Dashboard />;
            case 'problems': return <ProblemList />;
            case 'ide': return <IDE />;
            case 'solution-form': return <SolutionForm />;
            case 'community': return <Community />;
            case 'profile': return <Profile />;
            default: return <div className="flex-1 flex items-center justify-center text-slate-500">준비 중인 페이지입니다.</div>;
        }
    };
    return (<div className="flex h-screen bg-[#0F1117] text-white font-sans overflow-hidden selection:bg-emerald-500/30">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Mobile / Collapsed Sidebar Trigger */}
        {!isSidebarOpen && (<div className="absolute top-3 left-3 z-50">
            <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors">
              <Menu className="w-5 h-5"/>
            </button>
          </div>)}
        {renderPage()}
      </div>
    </div>);
}
export default function App() {
    return (<RecoilRoot>
      <AppContent />
    </RecoilRoot>);
}
