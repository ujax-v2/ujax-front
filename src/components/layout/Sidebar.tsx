import React, { useState, useRef, useEffect } from 'react';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { 
  navigationState, 
  sidebarOpenState, 
  workspacesState, 
  currentWorkspaceState, 
  userState, 
  settingsTabState,
  isCreateWorkspaceModalOpenState
} from '../../store/atoms';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Trophy,
  SlidersHorizontal,
  Bell,
  PanelLeftClose,
  ChevronsUpDown,
  Plus,
  Check,
  LogOut,
  Settings,
  UserPlus,
  MoreHorizontal
} from 'lucide-react';
import { cn, Button } from '../ui/Base';

export const Sidebar = () => {
  const [currentPage, setPage] = useRecoilState(navigationState);
  const setSettingsTab = useSetRecoilState(settingsTabState);
  const [isOpen, setIsOpen] = useRecoilState(sidebarOpenState);
  const [workspaces, setWorkspaces] = useRecoilState(workspacesState);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useRecoilState(currentWorkspaceState);
  const setIsCreateWorkspaceModalOpen = useSetRecoilState(isCreateWorkspaceModalOpenState);
  const user = useRecoilValue(userState);
  
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId) || workspaces[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsWorkspaceMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: '워크스페이스', icon: LayoutDashboard },
    { id: 'problems', label: '문제', icon: BookOpen },
    // Challenges hidden as per request
    // { id: 'challenges', label: '챌린지 & 대회', icon: Trophy },
    { id: 'community', label: '커뮤니티', icon: Users },
  ];

  const handleCreateWorkspace = () => {
    setIsWorkspaceMenuOpen(false);
    setIsCreateWorkspaceModalOpen(true);
  };

  const handleSwitchWorkspace = (id) => {
    setCurrentWorkspaceId(id);
    setIsWorkspaceMenuOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="w-64 h-full bg-[#0F1117] border-r border-slate-800 flex flex-col flex-shrink-0 transition-all duration-300 relative z-50">
      {/* Header with Workspace Switcher */}
      <div className="p-3 relative" ref={menuRef}>
        <div 
          onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
          className="h-10 flex items-center justify-between px-2 hover:bg-slate-800/50 transition-colors cursor-pointer rounded-lg group select-none"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-5 h-5 rounded bg-emerald-600 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white">
              {currentWorkspace.icon}
            </div>
            <span className="font-semibold text-sm text-slate-200 truncate">{currentWorkspace.name}</span>
            <ChevronsUpDown className="w-3 h-3 text-slate-500" />
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-700/50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Workspace Switcher Popover */}
        {isWorkspaceMenuOpen && (
          <div className="absolute top-14 left-3 w-[260px] bg-[#1e1e1e] border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-100">
             {/* Current Workspace Header */}
             <div className="p-4 bg-slate-800/30 border-b border-slate-700/50">
               <div className="flex items-center gap-3 mb-3">
                 <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-lg font-bold text-white">
                   {currentWorkspace.icon}
                 </div>
                 <div className="flex-1 overflow-hidden">
                   <div className="font-bold text-slate-200 text-sm truncate">{currentWorkspace.name}</div>
                   <div className="text-xs text-slate-500">무료 요금제 • {currentWorkspace.members}명의 멤버</div>
                 </div>
               </div>
               <div className="flex gap-2">
                 <button 
                  onClick={() => {
                    setSettingsTab('general');
                    setPage('settings');
                    setIsWorkspaceMenuOpen(false);
                  }}
                  className="flex-1 py-1.5 text-xs text-slate-300 bg-slate-700/50 hover:bg-slate-700 rounded border border-slate-600/50 flex items-center justify-center gap-1.5 transition-colors"
                 >
                   <Settings className="w-3.5 h-3.5" /> 설정
                 </button>
                 <button 
                  onClick={() => {
                    setSettingsTab('ws-members');
                    setPage('settings'); 
                    setIsWorkspaceMenuOpen(false);
                  }}
                  className="flex-1 py-1.5 text-xs text-slate-300 bg-slate-700/50 hover:bg-slate-700 rounded border border-slate-600/50 flex items-center justify-center gap-1.5 transition-colors"
                 >
                   <UserPlus className="w-3.5 h-3.5" /> 멤버 초대
                 </button>
               </div>
             </div>

             {/* Workspace List */}
             <div className="py-2 max-h-[240px] overflow-y-auto">
               <div className="px-3 py-1.5 text-xs font-medium text-slate-500">bookandpapers717@gmail.com</div>
               {workspaces.map(ws => (
                 <div 
                   key={ws.id}
                   onClick={() => handleSwitchWorkspace(ws.id)}
                   className="flex items-center justify-between px-3 py-2 hover:bg-slate-700/30 cursor-pointer group"
                 >
                   <div className="flex items-center gap-2 overflow-hidden">
                     <div className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-300">
                       {ws.icon}
                     </div>
                     <span className={`text-sm truncate ${ws.id === currentWorkspaceId ? 'text-slate-100 font-medium' : 'text-slate-400'}`}>
                       {ws.name}
                     </span>
                     {ws.role !== 'owner' && (
                       <span className="px-1.5 py-0.5 rounded text-[10px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">게스트</span>
                     )}
                   </div>
                   {ws.id === currentWorkspaceId ? (
                     <Check className="w-4 h-4 text-emerald-500" />
                   ) : (
                     <MoreHorizontal className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100" />
                   )}
                 </div>
               ))}
               
               <div 
                 onClick={handleCreateWorkspace}
                 className="flex items-center gap-2 px-3 py-2 hover:bg-slate-700/30 cursor-pointer text-slate-400 hover:text-slate-200 mt-1"
               >
                 <div className="w-6 h-6 flex items-center justify-center">
                   <Plus className="w-4 h-4" />
                 </div>
                 <span className="text-sm">새 워크스페이스</span>
               </div>
             </div>

             <div className="border-t border-slate-700/50 py-2">
               <div className="px-3 py-2 hover:bg-slate-700/30 cursor-pointer text-slate-400 hover:text-slate-200 text-sm">
                 다른 계정 추가
               </div>
               <div className="px-3 py-2 hover:bg-slate-700/30 cursor-pointer text-slate-400 hover:text-slate-200 text-sm">
                 모든 계정에서 로그아웃
               </div>
             </div>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        <div className="mb-2 px-2 pt-2">
          <div className="text-[11px] font-bold text-slate-500 mb-1 px-2 uppercase tracking-wider">메뉴</div>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors group',
                currentPage === item.id 
                  ? 'bg-slate-800 text-slate-100' 
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              )}
            >
              <item.icon className={cn("w-4 h-4", currentPage === item.id ? "text-slate-100" : "text-slate-500 group-hover:text-slate-400")} />
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Settings Section */}
      <div className="p-2 border-t border-slate-800/50 space-y-0.5">
         <button 
          onClick={() => {
             setSettingsTab('general');
             setPage('settings');
          }}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="flex-1 text-left">설정</span>
        </button>
      </div>
    </div>
  );
};
