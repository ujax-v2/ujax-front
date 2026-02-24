import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, Button, Badge } from '@/components/ui/Base';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { userState, workspacesState, currentWorkspaceState } from '@/store/atoms';
import { ArrowLeft } from 'lucide-react';
// 잔디(Contribution) 그래프 컴포넌트
const ContributionGraph = ({ title, activeColorClass = 'emerald' }: { title: string, activeColorClass?: string }) => {
  const weeks = 39;
  const days = 7;

  const [hoverInfo, setHoverInfo] = useState({ show: false, x: 0, y: 0, count: 0, date: '' });

  const getDate = (w: number, d: number) => {
    const date = new Date();
    date.setDate(date.getDate() - ((weeks - w) * 7 + (6 - d)));
    return date.toISOString().split('T')[0];
  };

  const activityData = useMemo(() => {
    return Array.from({ length: weeks }).map((_, weekIndex) =>
      Array.from({ length: days }).map((_, dayIndex) => {
        const level = Math.random() > 0.8 ? Math.floor(Math.random() * 5) : 0;
        const count = level === 0 ? 0 : level * 2 + Math.floor(Math.random() * 3);
        const dateStr = getDate(weekIndex, dayIndex);
        return { level, count, dateStr };
      })
    );
  }, [weeks, days]);

  const getActivityColor = (level: number) => {
    const isEmerald = activeColorClass === 'emerald';
    switch (level) {
      case 0: return 'bg-[#1e2330]';
      case 1: return isEmerald ? 'bg-emerald-900/40' : 'bg-indigo-900/40';
      case 2: return isEmerald ? 'bg-emerald-700/60' : 'bg-indigo-700/60';
      case 3: return isEmerald ? 'bg-emerald-500' : 'bg-indigo-500';
      case 4: return isEmerald ? 'bg-emerald-400' : 'bg-indigo-400';
      default: return 'bg-[#1e2330]';
    }
  };

  return (
    <Card className="bg-[#151922] border-slate-800 p-6 flex flex-col relative w-full overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-slate-100">{title}</h2>
      </div>

      <div className="w-full relative">
        {hoverInfo.show && createPortal(
          <div
            className="fixed z-[9999] px-3 py-2 bg-[#1b202c] text-xs text-white rounded shadow-xl border border-slate-700 pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-8px]"
            style={{ left: hoverInfo.x, top: hoverInfo.y }}
          >
            <div className="font-bold text-slate-200">{hoverInfo.count} 문제 해결</div>
            <div className="text-slate-500">{hoverInfo.date}</div>
            <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1b202c] border-r border-b border-slate-700 transform rotate-45"></div>
          </div>,
          document.body
        )}

        <div className="flex w-full justify-between min-w-fit">
          {activityData.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[4px]">
              {week.map((day, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`w-[14px] h-[14px] rounded-[3px] ${getActivityColor(day.level)} transition-colors hover:ring-1 hover:ring-white/50 cursor-pointer`}
                  onMouseEnter={(e) => {
                    const rect = (e.target as HTMLElement).getBoundingClientRect();
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
      </div>
    </Card>
  );
};

export const Profile = () => {
  const navigate = useNavigate();
  const currentUser = useRecoilValue(userState);
  const workspaces = useRecoilValue(workspacesState);
  const currentWorkspaceId = useRecoilValue(currentWorkspaceState);

  // User Data from state (fallback for mockup metrics)
  const user = {
    nickname: currentUser.name || '알려지지 않은 유저',
    email: currentUser.email || '이메일 정보 없음',
    reward: '0원',
    xp: 0,
    maxXp: 2000,
    accuracy: 0,
    level: 1
  };

  const chartData = [
    { name: 'Correct', value: user.accuracy },
    { name: 'Incorrect', value: 100 - user.accuracy },
  ];
  const COLORS = ['#34D399', '#1b202c']; // emerald-400 and dark shade

  const tierSolveData = [
    { tier: '브론즈', count: 120, fill: '#b45309' }, // amber-700
    { tier: '실버', count: 210, fill: '#94a3b8' },   // slate-400
    { tier: '골드', count: 85, fill: '#eab308' },    // yellow-500
    { tier: '플래티넘', count: 12, fill: '#22d3ee' } // cyan-400
  ];

  const algorithmData = [
    { subject: 'DP', A: 40, fullMark: 100 },
    { subject: 'BFS/DFS', A: 30, fullMark: 100 },
    { subject: '구현', A: 20, fullMark: 100 },
    { subject: '수학', A: 10, fullMark: 100 },
    { subject: '그리디', A: 45, fullMark: 100 },
  ];

  const languageData = [
    { name: 'Java', value: 70, color: '#3b82f6' }, // blue-500
    { name: 'Python', value: 25, color: '#eab308' }, // yellow-500
    { name: 'C++', value: 5, color: '#ef4444' }, // red-500
  ];

  const [hintSettings, setHintSettings] = useState<'on' | 'off'>('on');

  const totalSolved = tierSolveData.reduce((acc, cur) => acc + cur.count, 0);
  const bestLanguage = [...languageData].sort((a, b) => b.value - a.value)[0].name;
  const currentStreak = 14;

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0c10] p-8 pb-12 font-sans text-slate-100">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header Title */}
        <div className="flex items-center gap-4 mb-10 border-b border-slate-800 pb-4">
          <button
            onClick={() => currentWorkspaceId ? navigate(`/ws/${currentWorkspaceId}/dashboard`) : navigate(-1)}
            className="p-2 -ml-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">내 프로필</h1>
        </div>

        {/* ROW 1: 내 정보 상세 & 활동 지표 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 1. 내 정보 상세 (좌측 1단) */}
          <Card className="bg-[#151922] border-slate-800 p-6 relative flex flex-col lg:col-span-1">
            <div className="flex justify-between items-start mb-5">
              <h2 className="text-base font-bold text-slate-200">내 정보 상세</h2>
            </div>
            <div className="grid grid-cols-[80px_1fr] gap-y-3 text-xs items-center">
              <div className="text-slate-500">닉네임</div>
              <div className="text-slate-200 font-medium">{user.nickname}</div>

              <div className="text-slate-500">이메일</div>
              <div className="text-slate-200 truncate pr-2">{user.email}</div>

              <div className="text-slate-500">참여 랩실</div>
              <div className="text-slate-200 font-medium">{workspaces.length} 곳</div>

              <div className="text-slate-500">주력 언어</div>
              <div className="text-slate-200 font-medium">{bestLanguage}</div>

              <div className="text-slate-500">해결 문제 수</div>
              <div className="text-slate-200 font-bold text-emerald-400">{totalSolved} 문제</div>

              <div className="text-slate-500">연속 출석</div>
              <div className="text-slate-200 font-bold text-blue-400">{currentStreak} 일</div>
            </div>
          </Card>

          {/* 2. 활동 지표 (우측 2단) */}
          <Card className="bg-[#151922] border-slate-800 p-6 flex flex-col justify-center lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-slate-200">활동 지표</h2>
              <span className="text-[10px] text-slate-500">등급별 풀이 수 & 정답률</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center flex-1 h-[200px]">
              {/* Tier Bar Chart */}
              <div className="w-full h-[180px] bg-[#1b202c] rounded-xl border border-slate-800/80 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tierSolveData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={16}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="tier" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Tooltip cursor={{ fill: '#334155', opacity: 0.4 }} contentStyle={{ backgroundColor: '#0f1117', borderColor: '#334155', color: '#f1f5f9', borderRadius: '8px', fontSize: '12px' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Accuracy Donut Chart */}
              <div className="flex items-center justify-center relative w-full h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip contentStyle={{ backgroundColor: '#1b202c', borderColor: '#334155', borderRadius: '8px', color: '#f1f5f9', fontSize: '12px' }} itemStyle={{ color: '#f1f5f9', fontWeight: 'bold' }} cursor={{ fill: 'transparent' }} />
                    <Pie
                      data={chartData}
                      innerRadius={35}
                      outerRadius={48}
                      cornerRadius={4}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-lg font-extrabold text-white">{user.accuracy}%</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* ROW 2: 주력 알고리즘 & 사용 언어 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 3. 주력 알고리즘 (Radar Chart) */}
          <Card className="bg-[#151922] border-slate-800 p-6 flex flex-col justify-between shadow-md">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-base font-bold text-slate-200">주력 알고리즘</h2>
              <span className="text-[10px] text-slate-500">풀이 유형</span>
            </div>
            <div className="w-full h-[320px] flex items-center justify-center mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="90%" data={algorithmData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 'bold' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1b202c', borderColor: '#334155', borderRadius: '8px', color: '#f1f5f9', fontSize: '12px' }} itemStyle={{ color: '#f1f5f9', fontWeight: 'bold' }} cursor={{ fill: 'transparent' }} />
                  <Radar name="User" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* 4. 주력 언어 (Pie Chart) */}
          <Card className="bg-[#151922] border-slate-800 p-6 flex flex-col justify-between shadow-md">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-base font-bold text-slate-200">주력 언어</h2>
              <span className="text-[10px] text-slate-500">제출 언어 비중</span>
            </div>

            <div className="w-full flex-1 min-h-[250px] flex items-center justify-center mt-2 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip contentStyle={{ backgroundColor: '#1b202c', borderColor: '#334155', borderRadius: '8px', color: '#f1f5f9', fontSize: '12px' }} itemStyle={{ color: '#f1f5f9', fontWeight: 'bold' }} cursor={{ fill: 'transparent' }} />
                  <Pie
                    data={languageData}
                    cx="50%"
                    cy="50%"
                    outerRadius="90%"
                    dataKey="value"
                    stroke="#151922"
                    strokeWidth={2}
                  >
                    {languageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-col gap-6 w-full mt-4">
              {/* 언어별 범례(Legend) - 3열 Grid 전체 나열 */}
              <div className="grid grid-cols-3 w-full gap-2">
                {languageData.map((lang, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 bg-[#1b202c] px-2 py-1.5 rounded-lg border border-slate-800/50 justify-center min-w-0 overflow-hidden hover:bg-slate-800 hover:border-slate-600 transition-colors cursor-default">
                    <div className="w-2.5 h-2.5 rounded-full shadow-sm flex-shrink-0" style={{ backgroundColor: lang.color }}></div>
                    <div className="flex gap-1.5 items-center truncate">
                      <span className="text-xs font-bold text-slate-200 truncate">{lang.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{lang.value}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* 5. Daily Streak */}
        <ContributionGraph title="Daily Streak" activeColorClass="emerald" />

        {/* 5. 힌트보기 설정 */}
        <Card className="bg-[#151922] border-slate-800 p-8 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-200">힌트보기 설정</h2>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-xs text-slate-500 mr-2">문제 풀이 시 힌트 표시 여부</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${hintSettings === 'on' ? 'border-indigo-500' : 'border-slate-600'}`}>
                {hintSettings === 'on' && <div className="w-2 h-2 rounded-full bg-indigo-500"></div>}
              </div>
              <span className={`text-sm font-bold ${hintSettings === 'on' ? 'text-slate-200' : 'text-slate-500'}`}>On</span>
              <input type="radio" className="hidden" checked={hintSettings === 'on'} onChange={() => setHintSettings('on')} />
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${hintSettings === 'off' ? 'border-indigo-500' : 'border-slate-600'}`}>
                {hintSettings === 'off' && <div className="w-2 h-2 rounded-full bg-indigo-500"></div>}
              </div>
              <span className={`text-sm font-bold ${hintSettings === 'off' ? 'text-slate-200' : 'text-slate-500'}`}>Off</span>
              <input type="radio" className="hidden" checked={hintSettings === 'off'} onChange={() => setHintSettings('off')} />
            </label>
          </div>
        </Card>

      </div>
    </div>
  );
};
