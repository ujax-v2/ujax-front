import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSetRecoilState, useRecoilValue } from 'recoil';
import { workspacesState, currentWorkspaceState, isCreateWorkspaceModalOpenState } from '@/store/atoms';
import { useWorkspaceNavigate } from '@/hooks/useWorkspaceNavigate';
import { Button, Card, Badge } from '@/components/ui/Base';
import { ChevronLeft, ChevronRight, X, Trophy, Activity, CheckCircle2, Clock } from 'lucide-react';

const mockNotices = [
  { id: 1, title: '이번 주 스터디 진행 방식 안내', author: '고스디님', date: '2025. 01. 18', type: '공지사항', content: '이번 주는 각자 온라인으로 진행됩니다. 각자 과제를 마친 뒤, 오후 2시에 화상 회의 방에 들어와 주시기 바랍니다.\\n\\n불참 시 사전에 꼭 말씀해 주세요!' },
  { id: 2, title: '일일 줌 등록 가이드', author: '이서형', date: '2025. 01. 16', type: '안내', content: '새로운 줌 링크는 메신저 공지를 참고하세요.' },
  { id: 3, title: '게시판 이용 규칙', author: '박민수', date: '2025. 01. 10', type: '규칙', content: '서로를 존중하고 예의를 지켜주세요.' },
];

const mockRankings = [
  { id: 1, name: '고스디님', count: 18 },
  { id: 2, name: '이서형', count: 15 },
  { id: 3, name: '박민수', count: 12 },
  { id: 4, name: '김지우', count: 10 },
  { id: 5, name: '최유진', count: 9 },
  { id: 6, name: '정하늘', count: 7 },
];

const mockProblems = [
  { id: 1, title: '숨바꼭질', source: '백준', difficulty: '실버 1', tags: ['BFS', '그래프'], date: '마감 2025. 01. 22', submitters: 3, author: '이서형' },
  { id: 2, title: '동전 0', source: '백준', difficulty: '실버 4', tags: ['그리디', '수학'], date: '마감 2025. 01. 23', submitters: 1, author: '고스디님' },
  { id: 3, title: '미로 탐색', source: '백준', difficulty: '실버 1', tags: ['BFS', '그래프'], date: '마감 2025. 01. 24', submitters: 4, author: '박민수' },
];

// Contribution Graph Component
const ContributionGraph = () => {
  const weeks = 20;
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
        const level = Math.random() > 0.7 ? Math.floor(Math.random() * 5) : 0;
        const count = level === 0 ? 0 : level * 2 + Math.floor(Math.random() * 3);
        const dateStr = getDate(weekIndex, dayIndex);
        return { level, count, dateStr };
      })
    );
  }, [weeks, days]);

  const getActivityColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-[#1e2330]';
      case 1: return 'bg-emerald-900/40';
      case 2: return 'bg-emerald-700/60';
      case 3: return 'bg-emerald-500';
      case 4: return 'bg-emerald-400';
      default: return 'bg-[#1e2330]';
    }
  };

  return (
    <div className="w-full overflow-x-auto pb-2 relative">
      {hoverInfo.show && createPortal(
        <div
          className="fixed z-[9999] px-3 py-2 bg-[#151922] text-xs text-white rounded shadow-xl border border-slate-800 pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-8px]"
          // @ts-ignore
          style={{ left: hoverInfo.x, top: hoverInfo.y }}
        >
          <div className="font-bold text-slate-200">{hoverInfo.count} 문제 해결</div>
          <div className="text-slate-500">{hoverInfo.date}</div>
          <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-[#151922] border-r border-b border-slate-800 transform rotate-45"></div>
        </div>,
        document.body
      )}

      <div className="flex gap-[4px] min-w-fit">
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
      <div className="flex items-center gap-2 mt-4 text-[10px] text-slate-500 justify-end">
        <span>적음</span>
        <div className="w-[14px] h-[14px] bg-[#1e2330] rounded-[3px]"></div>
        <div className="w-[14px] h-[14px] bg-emerald-900/40 rounded-[3px]"></div>
        <div className="w-[14px] h-[14px] bg-emerald-700/60 rounded-[3px]"></div>
        <div className="w-[14px] h-[14px] bg-emerald-500 rounded-[3px]"></div>
        <div className="w-[14px] h-[14px] bg-emerald-400 rounded-[3px]"></div>
        <span>많은</span>
      </div>
    </div>
  );
};

export const Dashboard = () => {
  const { navigate } = useWorkspaceNavigate();
  const workspaces = useRecoilValue(workspacesState);
  const currentWorkspaceId = useRecoilValue(currentWorkspaceState);
  const setCreateWorkspaceOpen = useSetRecoilState(isCreateWorkspaceModalOpenState);

  const [selectedNotice, setSelectedNotice] = useState<any>(null);
  const [isRankingModalOpen, setIsRankingModalOpen] = useState(false);
  const [problemScrollIndex, setProblemScrollIndex] = useState(0);

  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId);

  if (!currentWorkspace) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0B0E14] text-slate-400 p-8">
        <div className="text-center space-y-4">
          <p className="text-lg">선택된 워크스페이스가 없습니다.</p>
          <Button onClick={() => setCreateWorkspaceOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            새 워크스페이스 생성하기
          </Button>
          <div className="mt-4">
            <Button variant="ghost" onClick={() => navigate('/explore')} className="text-slate-500 hover:text-slate-300">
              워크스페이스 탐색하기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#0B0E14] p-8 pb-8 relative font-sans text-slate-100">
      <div className="max-w-6xl mx-auto space-y-5">

        {/* 공지 섹션 */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-200">공지</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockNotices.map(notice => (
              <Card
                key={notice.id}
                className="bg-[#151922] border-slate-800 p-5 cursor-pointer hover:border-slate-600 transition-colors"
                onClick={() => setSelectedNotice(notice)}
              >
                <h3 className="text-base font-semibold mb-6 line-clamp-1">{notice.title}</h3>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">{notice.author}</span>
                    <span>{notice.date}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-[#1B202D] border border-slate-800 rounded-md text-slate-300">{notice.type}</span>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* 1단 통계 묶음: 랭킹, 출석률, 제출율 + 총 해결 문제, 총 코딩 시간 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

          {/* 랭킹 */}
          <section className="col-span-1 md:col-span-1">
            <Card
              className="bg-[#151922] border-slate-800 p-4 cursor-pointer hover:border-slate-600 transition-colors h-full flex flex-col justify-center min-h-[170px]"
              onClick={() => setIsRankingModalOpen(true)}
            >
              <div className="space-y-3">
                {mockRankings.slice(0, 3).map((rank, idx) => (
                  <div key={rank.id} className="flex items-center justify-between p-2 rounded-lg bg-[#0F1117]">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-500/10 text-yellow-500' :
                        idx === 1 ? 'bg-slate-300/10 text-slate-300' :
                          'bg-amber-700/10 text-amber-500'
                        }`}>
                        {idx + 1}
                      </div>
                      <span className="text-sm font-medium">{rank.name}</span>
                    </div>
                    <span className="text-xs text-emerald-400 font-medium bg-emerald-400/10 px-2 py-1 rounded-full">{rank.count} 문제</span>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          {/* 참석율 */}
          <section className="col-span-1 md:col-span-1">
            <Card className="bg-[#151922] border-slate-800 p-6 h-full flex flex-col justify-center relative min-h-[170px]">
              <h3 className="text-sm text-slate-400 mb-2">참석율</h3>
              <div className="text-4xl font-extrabold text-white tracking-tight mb-2">92%</div>
              <p className="text-xs text-slate-500 mt-auto">직전 4주 기준</p>
            </Card>
          </section>

          {/* 정답율 */}
          <section className="col-span-1 md:col-span-1">
            <Card className="bg-[#151922] border-slate-800 p-6 h-full flex flex-col justify-center relative min-h-[170px]">
              <h3 className="text-sm text-slate-400 mb-2">정답율</h3>
              <div className="text-4xl font-extrabold text-white tracking-tight mb-2">68%</div>
              <p className="text-xs text-slate-500 mt-auto">제출 기준</p>
            </Card>
          </section>

          {/* 총 푼 문제 */}
          <section className="col-span-1 md:col-span-1">
            <Card className="bg-[#151922] border-slate-800 p-6 h-full flex flex-col relative min-h-[170px]">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-emerald-500/10 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <Badge variant="success" className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">+12%</Badge>
              </div>
              <div className="text-3xl font-bold text-white mb-1">1,284</div>
              <div className="text-xs text-slate-400 mt-auto">총 해결 문제</div>
            </Card>
          </section>

          {/* 총 코딩 시간 */}
          <section className="col-span-1 md:col-span-1">
            <Card className="bg-[#151922] border-slate-800 p-6 h-full flex flex-col relative min-h-[170px]">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-blue-500/10 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border border-blue-500/20">Active</Badge>
              </div>
              <div className="text-3xl font-bold text-white mb-1">24h<span className="text-xl ml-1 text-slate-400">12m</span></div>
              <div className="text-xs text-slate-400 mt-auto">총 코딩 시간</div>
            </Card>
          </section>

        </div>

        {/* 잔디 (Contribution Graph) 섹션 */}
        <section className="pt-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-200">팀 전체 활동</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <Card className="bg-[#151922] border-slate-800 p-4 lg:col-span-3 w-full overflow-hidden flex items-center justify-center">
              <ContributionGraph />
            </Card>
            <div className="flex flex-col gap-4 lg:col-span-1">
              <Card className="bg-[#151922] border-slate-800 p-5 flex-1 flex flex-col justify-center min-h-[100px]">
                <h3 className="text-sm text-slate-400 mb-2">이번 달 해결</h3>
                <div className="text-2xl font-bold text-white">42<span className="text-xs ml-1 text-slate-500 font-normal">문제</span></div>
              </Card>
              <Card className="bg-[#151922] border-slate-800 p-5 flex-1 flex flex-col justify-center min-h-[100px]">
                <h3 className="text-sm text-slate-400 mb-2">평균 정답률</h3>
                <div className="text-2xl font-bold text-emerald-400">87<span className="text-sm ml-1 text-emerald-500/50 font-normal">%</span></div>
              </Card>
            </div>
          </div>
        </section>

        {/* 이번 주 문제 섹션 */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-200">이번 주 문제</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setProblemScrollIndex(Math.max(0, problemScrollIndex - 1))}
                className="w-7 h-7 rounded-sm bg-[#1B202D] border border-slate-800 hover:bg-slate-800 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => setProblemScrollIndex(Math.min(mockProblems.length - 2, problemScrollIndex + 1))}
                className="w-7 h-7 rounded-sm bg-[#1B202D] border border-slate-800 hover:bg-slate-800 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          <div className="flex gap-4 overflow-hidden relative" style={{ scrollBehavior: 'smooth' }}>
            {mockProblems.slice(problemScrollIndex, problemScrollIndex + 2).map((problem, idx) => (
              <Card key={problem.id} className="bg-[#151922] border-slate-800 p-5 flex-1 min-w-[300px]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-[#1e2330] text-slate-300 rounded-sm border border-slate-800">{problem.source}</span>
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-[#1e2330] text-emerald-400 rounded-sm border border-slate-800">{problem.difficulty}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-bold text-slate-200">{problem.title}</h3>
                  <div className="flex gap-1">
                    {problem.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 text-[10px] bg-slate-800/50 text-slate-400 rounded-sm border border-slate-700/50">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                  <div className="flex gap-4">
                    <span>{problem.date}</span>
                    <span>제출자 {problem.submitters}명</span>
                  </div>
                  <span>제시자 {problem.author}</span>
                </div>
              </Card>
            ))}
          </div>
        </section>

      </div>

      {/* 모달: 공지글 상세 */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#151922] border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setSelectedNotice(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-xl font-bold text-slate-100 pr-8">{selectedNotice.title}</h3>
              <div className="flex items-center gap-2 mt-3 text-sm text-slate-400">
                <span>{selectedNotice.date}</span>
                <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                <span>작성자: {selectedNotice.author}</span>
              </div>
            </div>
            <div className="p-6 text-slate-300 leading-relaxed whitespace-pre-line text-sm min-h-[150px]">
              {selectedNotice.content}
            </div>
          </div>
        </div>
      )}

      {/* 모달: 전체 랭킹 */}
      {isRankingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#151922] border border-slate-700 rounded-xl w-full max-w-sm shadow-2xl relative animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <button
              onClick={() => setIsRankingModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-5 border-b border-slate-800 shrink-0">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                전체 랭킹
              </h3>
              <p className="text-xs text-slate-400 mt-1">문제 풀이 수 기준</p>
            </div>
            <div className="p-4 flex flex-col gap-2 overflow-y-auto">
              {mockRankings.map((rank) => (
                <div key={rank.id} className="flex items-center justify-between p-3 rounded-xl bg-[#0F1117] border border-slate-800 hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${rank.id === 1 ? 'bg-yellow-500 text-white shadow-[0_0_10px_rgba(234,179,8,0.3)]' :
                      rank.id === 2 ? 'bg-slate-300 text-slate-800 shadow-[0_0_10px_rgba(203,213,225,0.3)]' :
                        rank.id === 3 ? 'bg-amber-700 text-white shadow-[0_0_10px_rgba(180,83,9,0.3)]' :
                          'bg-slate-800 text-slate-400'
                      }`}>
                      {rank.id}
                    </div>
                    <span className="font-medium text-slate-200">{rank.name}</span>
                  </div>
                  <span className="text-sm text-emerald-400 font-bold bg-emerald-400/10 px-3 py-1 rounded-full">{rank.count} 문제</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
