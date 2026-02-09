import React from 'react';
import { useRecoilState } from 'recoil';
import { navigationState, sidebarOpenState } from '../../store/atoms';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Trophy,
  SlidersHorizontal,
  Bell,
  PanelLeftClose,
  ChevronsUpDown
} from 'lucide-react';
import { cn } from '../ui/Base';

export const Sidebar = () => {
  const [currentPage, setCurrentPage] = useRecoilState(navigationState);
  const [isOpen, setIsOpen] = useRecoilState(sidebarOpenState);

  const menuItems = [
    { id: 'dashboard', label: '워크스페이스', icon: LayoutDashboard },
    { id: 'problems', label: '문제', icon: BookOpen },
    { id: 'challenges', label: '챌린지 & 대회', icon: Trophy },
    { id: 'community', label: '커뮤니티', icon: Users },
  ];

  if (!isOpen) return null;

  return (
    <div className="w-64 h-full bg-[#0F1117] border-r border-slate-800 flex flex-col flex-shrink-0 transition-all duration-300">
      {/* Header with User Switcher & Collapse */}
      <div className="h-14 flex items-center justify-between px-3 hover:bg-slate-800/30 transition-colors cursor-pointer group mb-2">
        <div className="flex items-center gap-2 px-2 overflow-hidden">
          <div className="w-5 h-5 rounded bg-emerald-500 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white">C</div>
          <span className="font-semibold text-sm text-slate-200 truncate">지훈 성의 Space</span>
          <ChevronsUpDown className="w-3 h-3 text-slate-500" />
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-700/50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
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

      {/* Bottom Settings Section */}
      <div className="p-2 border-t border-slate-800/50 space-y-0.5">
        <div className="px-3 py-2 text-xs font-medium text-slate-500 mb-1">계정</div>
        
        {/* User Profile Trigger */}
        <button 
          onClick={() => setCurrentPage('profile')}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-800/50 transition-colors"
        >
          <div className="w-5 h-5 rounded-full bg-slate-700 overflow-hidden">
             <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Profile" className="w-full h-full object-cover" />
          </div>
          <span className="flex-1 text-left truncate">지훈 성</span>
        </button>

        {/* Basic Settings */}
        <button 
          onClick={() => setCurrentPage('settings')}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="flex-1 text-left">기본 설정</span>
        </button>

        {/* Notifications */}
        <button 
          onClick={() => setCurrentPage('settings')} // Can route to specific tab if needed
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="flex-1 text-left">알림</span>
        </button>
      </div>
    </div>
  );
};
