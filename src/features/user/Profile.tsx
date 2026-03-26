import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, Tooltip } from 'recharts';
import { Card } from '@/components/ui/Base';
import { useIsDark } from '@/App';
import { useT } from '@/i18n';
import { useRecoilValue } from 'recoil';
import { currentWorkspaceState } from '@/store/atoms';
import { getMyWorkspaceProfile, getMyWorkspaceProfileActivity, type WorkspaceMemberProfileResponse, type WorkspaceMemberProfileActivityResponse } from '@/api/user';

const LANG_COLORS = ['#3b82f6', '#eab308', '#ef4444', '#8b5cf6', '#10b981', '#f97316', '#06b6d4'];

// ── 잔디 그래프 ─────────────────────────────────────────────────
const ContributionGraph = ({
  title,
  activeColorClass = 'emerald',
  joinDate = '2024-01-01',
  activityMap,
  onYearChange,
}: {
  title: string;
  activeColorClass?: string;
  joinDate?: string;
  activityMap: Record<string, number>;
  onYearChange: (year: number | null) => void;
}) => {
  const t = useT();
  const days = 7;
  const currentYear = new Date().getFullYear();
  const joinYear = new Date(joinDate).getFullYear();
  const availableYears = Array.from({ length: currentYear - joinYear + 1 }, (_, i) => currentYear - i);

  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [hoverInfo, setHoverInfo] = useState({ show: false, x: 0, y: 0, count: 0, date: '' });

  const getLevel = (count: number) => {
    if (count === 0) return 0;
    if (count <= 2) return 1;
    if (count <= 5) return 2;
    if (count <= 9) return 3;
    return 4;
  };

  const activityData = useMemo(() => {
    if (selectedYear === null) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const start = new Date(today); start.setDate(today.getDate() - 364);
      start.setDate(start.getDate() - start.getDay());
      const weeks: { level: number; count: number; dateStr: string }[][] = [];
      const cur = new Date(start);
      while (cur <= today) {
        const week = Array.from({ length: days }).map((_, d) => {
          const day = new Date(cur); day.setDate(cur.getDate() + d);
          const inRange = day >= new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()) && day <= today;
          const dateStr = day.toISOString().split('T')[0];
          const count = inRange ? (activityMap[dateStr] ?? 0) : 0;
          return { level: inRange ? getLevel(count) : -1, count, dateStr };
        });
        weeks.push(week);
        cur.setDate(cur.getDate() + 7);
      }
      return weeks;
    } else {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const startDate = new Date(selectedYear, 0, 1);
      startDate.setDate(startDate.getDate() - startDate.getDay());
      const endDate = new Date(selectedYear, 11, 31);
      const weeks: { level: number; count: number; dateStr: string }[][] = [];
      const cur = new Date(startDate);
      while (cur <= endDate) {
        const week = Array.from({ length: days }).map((_, d) => {
          const day = new Date(cur); day.setDate(cur.getDate() + d);
          const inYear = day.getFullYear() === selectedYear;
          const isFuture = day > today;
          const dateStr = day.toISOString().split('T')[0];
          const count = inYear && !isFuture ? (activityMap[dateStr] ?? 0) : 0;
          return { level: inYear && !isFuture ? getLevel(count) : -1, count, dateStr };
        });
        weeks.push(week);
        cur.setDate(cur.getDate() + 7);
      }
      return weeks;
    }
  }, [selectedYear, activityMap]);

  const handleYearChange = (year: number | null) => {
    setSelectedYear(year);
    onYearChange(year);
  };

  const getActivityColor = (level: number) => {
    if (level === -1) return 'bg-transparent';
    const isEmerald = activeColorClass === 'emerald';
    switch (level) {
      case 0: return 'bg-surface-subtle';
      case 1: return isEmerald ? 'bg-emerald-900/40' : 'bg-indigo-900/40';
      case 2: return isEmerald ? 'bg-emerald-700/60' : 'bg-indigo-800/60';
      case 3: return isEmerald ? 'bg-emerald-500' : 'bg-indigo-600';
      case 4: return isEmerald ? 'bg-emerald-400' : 'bg-indigo-500';
      default: return 'bg-surface-subtle';
    }
  };

  const totalContributions = activityData.flat().reduce((sum, d) => sum + d.count, 0);

  return (
    <Card className="bg-surface-raised border-border-default p-6 flex flex-col relative w-full overflow-hidden">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-text-primary">{title}</h2>
          <p className="text-xs text-text-faint mt-0.5">
            {selectedYear === null ? `최근 39주 활동 기록` : `${selectedYear}년 활동 기록`}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xl font-extrabold text-text-secondary">{totalContributions}</div>
          <div className="text-[10px] text-text-faint">총 기여</div>
        </div>
      </div>

      <div className="w-full relative flex gap-3">
        {hoverInfo.show && createPortal(
          <div
            className="fixed z-[9999] px-3 py-2 bg-surface-inset text-xs text-text-primary rounded shadow-xl border border-border-subtle pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-8px]"
            style={{ left: hoverInfo.x, top: hoverInfo.y }}
          >
            <div className="font-bold text-text-secondary">{t('profile.contribution.count', { count: hoverInfo.count })}</div>
            <div className="text-text-faint">{hoverInfo.date}</div>
            <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-surface-inset border-r border-b border-border-subtle transform rotate-45"></div>
          </div>,
          document.body
        )}

        <div className="flex-1 overflow-hidden">
          <div className="flex w-full justify-between mb-1">
            {activityData.map((week, weekIndex) => {
              const year = new Date(week[0].dateStr).getFullYear();
              const prevYear = weekIndex > 0 ? new Date(activityData[weekIndex - 1][0].dateStr).getFullYear() : null;
              const showYear = weekIndex === 0 || year !== prevYear;
              return (
                <div key={weekIndex} className="flex flex-col" style={{ width: 14 }}>
                  {showYear ? (
                    <span className="text-[9px] text-text-faint font-medium whitespace-nowrap">{year}</span>
                  ) : (
                    <span className="text-[9px] invisible">.</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex w-full justify-between">
            {activityData.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[4px]">
                {week.map((day, dayIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className={`w-[14px] h-[14px] rounded-[3px] ${getActivityColor(day.level)} transition-colors hover:ring-1 hover:ring-white/50 cursor-pointer`}
                    onMouseEnter={(e) => {
                      const rect = (e.target as HTMLElement).getBoundingClientRect();
                      setHoverInfo({ show: true, x: rect.left + rect.width / 2, y: rect.top, count: day.count, date: day.dateStr });
                    }}
                    onMouseLeave={() => setHoverInfo(prev => ({ ...prev, show: false }))}
                  />
                ))}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-1.5 mt-3">
            <span className="text-[10px] text-text-faint">적음</span>
            {[0, 1, 2, 3, 4].map(level => (
              <div key={level} className={`w-[12px] h-[12px] rounded-[2px] ${getActivityColor(level)}`} />
            ))}
            <span className="text-[10px] text-text-faint">많음</span>
          </div>
        </div>

        <div className="flex flex-col gap-1 pt-4 flex-shrink-0 overflow-y-auto max-h-[140px] scrollbar-hide [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => handleYearChange(null)}
            className={`px-2.5 py-1 rounded text-base font-bold transition-colors text-left ${selectedYear === null ? 'bg-surface-subtle text-text-secondary' : 'text-text-faint hover:text-text-secondary hover:bg-surface-subtle'}`}
          >
            최근
          </button>
          {availableYears.map(year => (
            <button
              key={year}
              onClick={() => handleYearChange(year)}
              className={`px-2.5 py-1 rounded text-sm font-medium transition-colors text-left ${selectedYear === year ? 'bg-surface-subtle text-text-secondary' : 'text-text-faint hover:text-text-secondary hover:bg-surface-subtle'}`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
};

// ── 메인 Profile ───────────────────────────────────────────────
export const Profile = () => {
  const t = useT();
  const isDark = useIsDark();
  const currentWsId = useRecoilValue(currentWorkspaceState);

  const [profileData, setProfileData] = useState<WorkspaceMemberProfileResponse | null>(null);
  const [activityData, setActivityData] = useState<WorkspaceMemberProfileActivityResponse | null>(null);

  useEffect(() => {
    if (!currentWsId) return;
    getMyWorkspaceProfile(currentWsId).then(setProfileData).catch(() => {});
    getMyWorkspaceProfileActivity(currentWsId).then(setActivityData).catch(() => {});
  }, [currentWsId]);

  const handleYearChange = useCallback((year: number | null) => {
    if (!currentWsId) return;
    getMyWorkspaceProfileActivity(currentWsId, year ?? undefined).then(setActivityData).catch(() => {});
  }, [currentWsId]);

  // 활동 데이터를 date → count 맵으로 변환
  const activityMap = useMemo<Record<string, number>>(() => {
    if (!activityData) return {};
    return Object.fromEntries(activityData.days.map(d => [d.date, d.count]));
  }, [activityData]);

  // 차트 데이터 변환
  const accuracyRate = profileData?.accuracy.rate ?? 0;
  const chartData = [
    { name: 'Correct', value: accuracyRate },
    { name: 'Incorrect', value: Math.max(0, 100 - accuracyRate) },
  ];
  const COLORS = ['#34D399', isDark ? '#1b202c' : '#e2e8f0'];

  const algorithmData = (profileData?.algorithmStats ?? []).map(s => ({
    subject: s.name,
    A: Math.round(s.ratio),
    fullMark: 100,
  }));

  const languageData = (profileData?.languageStats ?? []).map((s, i) => ({
    name: s.name,
    value: Math.round(s.ratio),
    color: LANG_COLORS[i % LANG_COLORS.length],
  }));

  const totalSolved = profileData?.summary.solvedCount ?? 0;
  const mainLanguage = profileData?.summary.mainLanguage ?? '-';
  const streakDays = profileData?.summary.streakDays ?? 0;
  const joinDate = profileData?.member.joinedAt ?? '2024-01-01';
  const userName = profileData?.member.nickname ?? '-';
  const userEmail = profileData?.member.email ?? '-';

  return (
    <div className="flex-1 overflow-y-auto bg-page p-8 pb-12 font-sans text-text-primary">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="border-b border-border-default pb-8 mt-2">
          <h1 className="text-4xl font-extrabold text-text-primary tracking-tight mb-3">{t('profile.title')}</h1>
          <p className="text-base text-text-muted font-medium leading-relaxed">{t('profile.subtitle')}</p>
        </div>

        {/* ROW 1: 내 정보 & 정답률 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. 내 정보 상세 */}
          <Card className="bg-surface-raised border-border-default p-4 relative flex flex-col lg:col-span-1">
            <h2 className="text-lg font-bold text-text-primary mb-3">{t('profile.detailInfo')}</h2>
            <div className="flex flex-col gap-2 justify-end flex-1 pb-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-faint">{t('profile.nickname')}</span>
                <span className="text-sm font-medium text-text-primary">{userName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-faint">{t('profile.email')}</span>
                <span className="text-sm font-medium text-text-primary truncate max-w-[60%] text-right">{userEmail}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-faint">{t('profile.mainLanguage')}</span>
                <span className="text-sm font-medium text-text-primary">{mainLanguage}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-faint">{t('profile.solvedCount')}</span>
                <span className="text-base font-bold text-emerald-400">{totalSolved}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-faint">{t('profile.streak')}</span>
                <span className="text-base font-bold text-blue-400">{streakDays}</span>
              </div>
            </div>
          </Card>

          {/* 2. 정답률 */}
          <Card className="bg-surface-raised border-border-default p-4 flex flex-col justify-center lg:col-span-1">
            <h2 className="text-lg font-bold text-text-primary mb-3">정답률</h2>
            <div className="flex items-center justify-center flex-1 h-[180px]">
              <div className="relative w-full h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip contentStyle={{ backgroundColor: isDark ? '#1b202c' : '#ffffff', borderColor: isDark ? '#334155' : '#e2e8f0', borderRadius: '8px', color: isDark ? '#f1f5f9' : '#0f172a', fontSize: '12px' }} itemStyle={{ color: isDark ? '#f1f5f9' : '#0f172a', fontWeight: 'bold' }} cursor={{ fill: 'transparent' }} />
                    <Pie data={chartData} innerRadius={68} outerRadius={88} cornerRadius={6} paddingAngle={3} dataKey="value" stroke="none">
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-extrabold text-text-primary">{accuracyRate}%</span>
                  <span className="text-xs text-text-faint mt-1">정답률</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* ROW 2: 주력 알고리즘 & 사용 언어 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 3. 주력 알고리즘 */}
          <Card className="bg-surface-raised border-border-default p-6 flex flex-col justify-between shadow-md">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold text-text-primary">{t('profile.mainAlgorithm')}</h2>
              <span className="text-[10px] text-text-faint">{t('profile.charts.solutionTypes')}</span>
            </div>
            <div className="w-full h-[320px] flex items-center justify-center mt-4">
              {algorithmData.length === 0 ? (
                <span className="text-sm text-text-faint">아직 풀이 데이터가 없습니다.</span>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="90%" data={algorithmData}>
                    <PolarGrid stroke={isDark ? '#334155' : '#e2e8f0'} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 13, fontWeight: 'bold' }} />
                    <Tooltip contentStyle={{ backgroundColor: isDark ? '#1b202c' : '#ffffff', borderColor: isDark ? '#334155' : '#e2e8f0', borderRadius: '8px', color: isDark ? '#f1f5f9' : '#0f172a', fontSize: '12px' }} itemStyle={{ color: isDark ? '#f1f5f9' : '#0f172a', fontWeight: 'bold' }} cursor={{ fill: 'transparent' }} />
                    <Radar name="User" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* 4. 주력 언어 */}
          <Card className="bg-surface-raised border-border-default p-6 flex flex-col justify-between shadow-md">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold text-text-primary">{t('profile.mainLanguage')}</h2>
              <span className="text-[10px] text-text-faint">{t('profile.charts.languageDistribution')}</span>
            </div>
            <div className="w-full flex-1 min-h-[250px] flex items-center justify-center mt-2 relative">
              {languageData.length === 0 ? (
                <span className="text-sm text-text-faint">아직 제출 데이터가 없습니다.</span>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip contentStyle={{ backgroundColor: isDark ? '#1b202c' : '#ffffff', borderColor: isDark ? '#334155' : '#e2e8f0', borderRadius: '8px', color: isDark ? '#f1f5f9' : '#0f172a', fontSize: '12px' }} itemStyle={{ color: isDark ? '#f1f5f9' : '#0f172a', fontWeight: 'bold' }} cursor={{ fill: 'transparent' }} />
                    <Pie data={languageData} cx="50%" cy="50%" outerRadius="90%" dataKey="value" stroke={isDark ? '#151922' : '#ffffff'} strokeWidth={2}>
                      {languageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            {languageData.length > 0 && (
              <div className="grid grid-cols-3 w-full gap-2 mt-4">
                {languageData.map((lang, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 bg-surface-inset px-2 py-1.5 rounded-lg border border-border-default/50 justify-center min-w-0 overflow-hidden hover:bg-surface-subtle hover:border-border-subtle transition-colors cursor-default">
                    <div className="w-2.5 h-2.5 rounded-full shadow-sm flex-shrink-0" style={{ backgroundColor: lang.color }}></div>
                    <div className="flex gap-1.5 items-center truncate">
                      <span className="text-xs font-bold text-text-secondary truncate">{lang.name}</span>
                      <span className="text-[10px] text-text-muted font-medium whitespace-nowrap">{lang.value}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* 5. Daily Streak */}
        <ContributionGraph
          title="Daily Streak"
          activeColorClass="emerald"
          joinDate={joinDate}
          activityMap={activityMap}
          onYearChange={handleYearChange}
        />

      </div>
    </div>
  );
};
