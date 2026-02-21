import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Card, Button, Badge } from '@/components/ui/Base';
import { useNavigate } from 'react-router-dom';

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

  // Mock User Data
  const user = {
    nickname: 'test2',
    email: 'test2@kosta.com',
    reward: '10,000원',
    xp: 1240,
    maxXp: 2000,
    accuracy: 74,
    level: 3
  };

  const chartData = [
    { name: 'Correct', value: user.accuracy },
    { name: 'Incorrect', value: 100 - user.accuracy },
  ];
  const COLORS = ['#34D399', '#1b202c']; // emerald-400 and dark shade

  const [hintSettings, setHintSettings] = useState<'on' | 'off'>('on');

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0c10] p-8 pb-12 font-sans text-slate-100">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header Title */}
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">내 프로필 (My Page)</h1>
          <div className="flex gap-3">
            <Button variant="outline" className="text-sm font-medium border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white" onClick={() => navigate('/settings')}>개인정보 변경</Button>
            <Button variant="outline" className="text-sm font-medium border-slate-700 text-slate-300 hover:bg-red-900/40 hover:text-red-400 hover:border-red-900/50">회원 탈퇴</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. 내 정보 상세 */}
          <Card className="bg-[#151922] border-slate-800 p-8 relative flex flex-col justify-center">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-lg font-bold text-slate-200">내 정보 상세</h2>
              <div className="px-3 py-1 bg-slate-800 rounded-full border border-slate-700 text-xs font-bold text-slate-300 shadow-sm">
                LV.{user.level}
              </div>
            </div>
            <div className="grid grid-cols-[80px_1fr] gap-y-4 text-sm">
              <div className="text-slate-500">닉네임</div>
              <div className="text-slate-200 font-medium">{user.nickname}</div>

              <div className="text-slate-500">이메일</div>
              <div className="text-slate-200">{user.email}</div>

              <div className="text-slate-500">리워드</div>
              <div className="text-slate-200 font-bold">{user.reward}</div>

              <div className="text-slate-500">경험치</div>
              <div className="text-slate-200">{user.xp} / {user.maxXp}</div>

              <div className="text-slate-500">정답률</div>
              <div className="text-slate-200">{user.accuracy}%</div>
            </div>
          </Card>

          {/* 2. 활동 지표 */}
          <Card className="bg-[#151922] border-slate-800 p-8 flex flex-col justify-center">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-200">활동 지표</h2>
              <span className="text-xs text-slate-500">EXP & 정답률</span>
            </div>

            <div className="grid grid-cols-1 gap-6 items-center">
              {/* Top: EXP Progress */}
              <div className="bg-[#1b202c] p-5 rounded-xl border border-slate-800">
                <h3 className="text-sm font-bold text-slate-200 mb-3">경험치 진행률</h3>
                <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${(user.xp / user.maxXp) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>{user.xp} / {user.maxXp}</span>
                  <span>{Math.round((user.xp / user.maxXp) * 100)}%</span>
                </div>
              </div>

              {/* Bottom: Accuracy Donut Chart */}
              <div className="flex items-center justify-center relative h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      innerRadius={45}
                      outerRadius={60}
                      cornerRadius={5}
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
                  <span className="text-xl font-extrabold text-white">{user.accuracy}%</span>
                  <span className="text-[10px] text-slate-400 mt-1">평균 정답률</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* 3. Daily Streak */}
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
