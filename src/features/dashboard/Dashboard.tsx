import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Card, Button, Badge } from '../../components/ui/Base';
import { 
  Activity, 
  CheckCircle2, 
  Clock, 
  Trophy, 
  MoreHorizontal,
  Plus,
  Moon,
  Sun,
  Megaphone,
  HelpCircle,
  TrendingUp
} from 'lucide-react';
import { useSetRecoilState } from 'recoil';
import { navigationState, communityTabState } from '../../store/atoms';

// Contribution Graph Component
const ContributionGraph = () => {
  // Simulate data: 52 weeks * 7 days
  const weeks = 20;
  const days = 7;
  
  // State for Tooltip
  const [hoverInfo, setHoverInfo] = useState({ show: false, x: 0, y: 0, count: 0, date: '' });
  
  // Helper to generate a fake date based on indices (just for demo)
  const getDate = (w, d) => {
    const date = new Date();
    date.setDate(date.getDate() - ((weeks - w) * 7 + (6 - d)));
    return date.toISOString().split('T')[0];
  };

  // Random activity level 0-4
  const activityData = useMemo(() => {
    return Array.from({ length: weeks }).map((_, weekIndex) => 
      Array.from({ length: days }).map((_, dayIndex) => {
        const level = Math.random() > 0.7 ? Math.floor(Math.random() * 5) : 0;
        const count = level === 0 ? 0 : level * 2 + Math.floor(Math.random() * 3);
        const dateStr = getDate(weekIndex, dayIndex);
        return { level, count, dateStr };
      })
    );
  }, [weeks, days]);

  const getActivityColor = (level) => {
    switch(level) {
      case 0: return 'bg-slate-800/50';
      case 1: return 'bg-emerald-900/40';
      case 2: return 'bg-emerald-700/60';
      case 3: return 'bg-emerald-500';
      case 4: return 'bg-emerald-400';
      default: return 'bg-slate-800/50';
    }
  };

  return (
    <div className="w-full overflow-x-auto pb-2 relative">
       {/* Floating Tooltip */}
       {hoverInfo.show && createPortal(
        <div 
          className="fixed z-[9999] px-3 py-2 bg-slate-800 text-xs text-white rounded shadow-xl border border-slate-700 pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-8px]"
          style={{ left: hoverInfo.x, top: hoverInfo.y }}
        >
          <div className="font-bold text-slate-200">{hoverInfo.count} problems solved</div>
          <div className="text-slate-500">{hoverInfo.date}</div>
          <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 border-r border-b border-slate-700 transform rotate-45"></div>
        </div>,
        document.body
      )}

      <div className="flex gap-1 min-w-fit">
        {activityData.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {week.map((day, dayIndex) => (
               <div 
                 key={`${weekIndex}-${dayIndex}`}
                 className={`w-3 h-3 rounded-sm ${getActivityColor(day.level)} transition-colors hover:ring-1 hover:ring-white/50 cursor-pointer`}
                 onMouseEnter={(e) => {
                   const rect = e.target.getBoundingClientRect();
                   setHoverInfo({
                     show: true,
                     x: rect.left + rect.width / 2,
                     y: rect.top,
                     count: day.count,
                     date: day.dateStr
                   });
                 }}
                 onMouseLeave={() => setHoverInfo({ ...hoverInfo, show: false })}
               />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500 justify-end">
        <span>Less</span>
        <div className="w-2 h-2 bg-slate-800/50 rounded-sm"></div>
        <div className="w-2 h-2 bg-emerald-900/40 rounded-sm"></div>
        <div className="w-2 h-2 bg-emerald-700/60 rounded-sm"></div>
        <div className="w-2 h-2 bg-emerald-500 rounded-sm"></div>
        <div className="w-2 h-2 bg-emerald-400 rounded-sm"></div>
        <span>More</span>
      </div>
    </div>
  );
};

export const Dashboard = () => {
  const setPage = useSetRecoilState(navigationState);
  const setCommunityTab = useSetRecoilState(communityTabState);

  const notices = [
    { id: 1, title: '시스템 점검 안내 (02/10 02:00 ~ 04:00)', date: '2024.02.08', author: 'Admin' },
    { id: 2, title: '새로운 챌린지 시즌 5가 시작됩니다!', date: '2024.02.05', author: 'Manager' },
    { id: 3, title: 'IDE 다크 모드 가독성 개선 업데이트', date: '2024.02.01', author: 'DevTeam' },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#0F1117] p-8 pb-24 relative">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">지훈 성의 Workspace</h1>
            <p className="text-slate-400 mt-1">오늘도 즐거운 코딩 되세요!</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-yellow-400 transition-colors">
              <Sun className="w-5 h-5" />
            </button>
            <Button className="gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 cursor-not-allowed opacity-70">
              <Plus className="w-4 h-4" /> Create Workspace
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Stats Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Team Stats / Contribution */}
            <Card className="p-6 bg-[#141820] border-slate-800">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-500" /> Team Activity
                </h3>
                <div className="flex gap-4 text-sm">
                  <div className="text-slate-400">Weekly Solved: <span className="text-slate-200 font-bold">42</span></div>
                  <div className="text-slate-400">Avg Accuracy: <span className="text-slate-200 font-bold">87%</span></div>
                </div>
              </div>
              
              <ContributionGraph />
            </Card>

            <div className="grid grid-cols-2 gap-6">
              <Card className="p-6 bg-[#141820] border-slate-800">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-emerald-500/10 rounded-lg">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  </div>
                  <Badge variant="success">+12%</Badge>
                </div>
                <div className="text-2xl font-bold text-slate-100 mb-1">1,284</div>
                <div className="text-sm text-slate-400">Total Solved Problems</div>
              </Card>

              <Card className="p-6 bg-[#141820] border-slate-800">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <Clock className="w-6 h-6 text-blue-500" />
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
                <div className="text-2xl font-bold text-slate-100 mb-1">24h 12m</div>
                <div className="text-sm text-slate-400">Total Coding Time</div>
              </Card>
            </div>
          </div>

          {/* Right Sidebar: Notice & Recommended */}
          <div className="space-y-6">
            {/* Notice Board */}
            <Card className="p-0 bg-[#141820] border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-emerald-500" />
                <h3 className="font-bold text-slate-200">공지사항</h3>
              </div>
              <div className="divide-y divide-slate-800/50">
                {notices.map(notice => (
                  <div key={notice.id} className="p-4 hover:bg-slate-800/30 transition-colors cursor-pointer">
                    <div className="font-medium text-slate-300 text-sm mb-1 line-clamp-1">{notice.title}</div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>{notice.date}</span>
                      <span>{notice.author}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-slate-800 text-center">
                 <button 
                  onClick={() => {
                    setCommunityTab('notices');
                    setPage('community');
                  }}
                  className="text-xs text-slate-400 hover:text-emerald-500 font-medium"
                >
                  View All
                </button>
              </div>
            </Card>

            <Card className="p-5 bg-gradient-to-br from-emerald-900/20 to-slate-900 border-slate-800">
              <div className="flex items-center gap-3 mb-3">
                <Trophy className="w-8 h-8 text-yellow-500" />
                <div>
                  <div className="font-bold text-slate-200">주간 랭킹 도전</div>
                  <div className="text-xs text-slate-400">상위 10% 진입 시 뱃지 획득</div>
                </div>
              </div>
              <Button onClick={() => setPage('challenges')} className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 mt-2">
                보러가기
              </Button>
            </Card>
          </div>
        </div>
      </div>

      {/* Floating Customer Support Button */}
      <button className="fixed bottom-6 right-6 p-4 rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 hover:shadow-emerald-900/20 hover:-translate-y-1 transition-all z-50">
        <HelpCircle className="w-6 h-6" />
      </button>
    </div>
  );
};
