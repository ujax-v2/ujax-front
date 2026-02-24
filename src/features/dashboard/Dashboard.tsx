import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSetRecoilState, useRecoilValue } from 'recoil';
import { workspacesState, currentWorkspaceState, isCreateWorkspaceModalOpenState } from '@/store/atoms';
import { useWorkspaceNavigate } from '@/hooks/useWorkspaceNavigate';
import { Button, Card, Badge } from '@/components/ui/Base';
import { ChevronLeft, ChevronRight, X, Trophy, Activity, CheckCircle2, Clock, UserCircle } from 'lucide-react';

const mockNotices = [
  { id: 1, title: '이번 주 스터디 진행 방식 안내', author: '고스디님', date: '2025. 01. 18', type: '공지사항', content: '이번 주는 각자 온라인으로 진행됩니다. 각자 과제를 마친 뒤, 오후 2시에 화상 회의 방에 들어와 주시기 바랍니다.\\n\\n불참 시 사전에 꼭 말씀해 주세요!' },
  { id: 2, title: '일일 줌 등록 가이드', author: '이서형', date: '2025. 01. 16', type: '안내', content: '새로운 줌 링크는 메신저 공지를 참고하세요.' },
  { id: 3, title: '게시판 이용 규칙', author: '박민수', date: '2025. 01. 10', type: '규칙', content: '서로를 존중하고 예의를 지켜주세요.' },
];

const mockRankingsLevel = [
  { id: 1, name: '고스디님', count: 'LV.42' },
  { id: 2, name: '이서형', count: 'LV.39' },
  { id: 3, name: '박민수', count: 'LV.35' },
  { id: 4, name: '김지우', count: 'LV.30' },
  { id: 5, name: '최유진', count: 'LV.28' },
];

const mockRankingsSolved = [
  { id: 1, name: '고스디님', count: '1,284 문제' },
  { id: 2, name: '이서형', count: '1,102 문제' },
  { id: 3, name: '박민수', count: '942 문제' },
  { id: 4, name: '김지우', count: '730 문제' },
  { id: 5, name: '최유진', count: '612 문제' },
];

const mockRankingsComments = [
  { id: 1, name: '정하늘', count: '142 개' },
  { id: 2, name: '박민수', count: '128 개' },
  { id: 3, name: '최유진', count: '94 개' },
  { id: 4, name: '고스디님', count: '63 개' },
  { id: 5, name: '이서형', count: '55 개' },
];

const mockProblems = [
  { id: 1, title: '숨바꼭질', source: '백준', difficulty: '실버 1', tags: ['BFS', '그래프'], date: '마감 2025. 01. 22', submitters: 3, author: '이서형' },
  { id: 2, title: '동전 0', source: '백준', difficulty: '실버 4', tags: ['그리디', '수학'], date: '마감 2025. 01. 23', submitters: 1, author: '고스디님' },
  { id: 3, title: '미로 탐색', source: '백준', difficulty: '실버 1', tags: ['BFS', '그래프'], date: '마감 2025. 01. 24', submitters: 4, author: '박민수' },
];



export const Dashboard = () => {
  const { navigate, toWs } = useWorkspaceNavigate();
  const workspaces = useRecoilValue(workspacesState);
  const currentWorkspaceId = useRecoilValue(currentWorkspaceState);
  const setCreateWorkspaceOpen = useSetRecoilState(isCreateWorkspaceModalOpenState);

  const [selectedNotice, setSelectedNotice] = useState<any>(null);

  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId);

  if (!currentWorkspace) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0a0c10] text-slate-400 p-8">
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
    <div className="flex-1 overflow-y-auto bg-[#0a0c10] p-8 pb-12 relative font-sans text-slate-100">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* 워크스페이스 헤더 (Notion Style) */}
        <div className="border-b border-slate-800 pb-8 mt-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-4xl font-extrabold text-white tracking-tight mb-3">{currentWorkspace.name}</h1>
            <p className="text-base text-slate-400 font-medium leading-relaxed max-w-3xl">
              {currentWorkspace.description || '알고리즘 문제 풀이와 코딩 테스트 대비를 위한 공용 스터디 워크스페이스입니다. 다같이 목표를 달성해봅시다!'}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/profile')}
            className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 font-bold shrink-0 items-center justify-center py-2 px-4 shadow-sm transition-all"
          >
            <UserCircle className="w-5 h-5 mr-1" />
            마이페이지 이동
          </Button>
        </div>

        {/* 공지, 만료 임박 문제, 요약 통계 (3열 그리드) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* 최근 공지사항 */}
          <section className="flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
                최근 공지사항
              </h2>
              <span onClick={() => toWs('community')} className="text-xs text-indigo-400 font-medium cursor-pointer hover:underline">더보기</span>
            </div>
            <div className="flex flex-col gap-2.5 flex-1 w-full relative">
              {mockNotices.map(notice => (
                <Card
                  key={notice.id}
                  className="bg-[#151922] border-slate-800 p-4 cursor-pointer hover:border-slate-600 transition-colors flex flex-col justify-between flex-1"
                  onClick={() => setSelectedNotice(notice)}
                >
                  <h3 className="text-sm font-bold text-slate-200 mb-3 truncate">{notice.title}</h3>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium">{notice.author}</span>
                      <span>{notice.date}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-[#1e2330] border border-slate-700 rounded text-slate-300">{notice.type}</span>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* 기한 만료 임박 문제 */}
          <section className="flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                기한 만료 임박 문제
              </h2>
              <span onClick={() => toWs('problems')} className="text-xs text-emerald-400 font-medium cursor-pointer hover:underline">문제 보러가기</span>
            </div>
            <div className="flex flex-col gap-2.5 flex-1 w-full relative">
              {mockProblems.slice(0, 3).map((problem) => (
                <Card key={problem.id} className="bg-[#151922] border-slate-800 p-4 flex flex-col justify-between cursor-pointer flex-1 hover:border-slate-600 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-200 truncate">{problem.title}</h3>
                    <div className="flex gap-1 shrink-0">
                      <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-300 rounded border border-slate-700">{problem.source}</span>
                      <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-900/30 text-emerald-400 rounded border border-emerald-800/50">{problem.difficulty}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <div className="flex gap-1 overflow-hidden">
                      {problem.tags.map(tag => (
                        <span key={tag}>#{tag}</span>
                      ))}
                    </div>
                    <span className="shrink-0 font-medium text-emerald-400">{problem.date}</span>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* 워크스페이스 통계 */}
          <section className="flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                요약 통계
              </h2>
            </div>
            <div className="flex flex-col gap-2.5 flex-1 w-full relative">
              <Card className="bg-[#151922] border-slate-800 p-4 flex-1 flex flex-col justify-center shadow-md hover:border-slate-600 transition-colors cursor-pointer">
                <h3 className="text-sm font-medium text-slate-400 mb-1">이번 달 해결</h3>
                <div className="text-2xl font-extrabold text-white tracking-tight">342<span className="text-xs ml-1 text-slate-500 font-medium">문제</span></div>
                <div className="text-[11px] text-emerald-400 mt-1 font-bold">+15% (상승곡선 유지 중)</div>
              </Card>
              <Card className="bg-[#151922] border-slate-800 p-4 flex-1 flex flex-col justify-center shadow-md hover:border-slate-600 transition-colors cursor-pointer">
                <h3 className="text-sm font-medium text-slate-400 mb-1">전체 평균 정답률</h3>
                <div className="text-2xl font-extrabold text-white tracking-tight">87<span className="text-xs ml-1 text-slate-500 font-medium">%</span></div>
                <div className="text-[11px] text-blue-400 mt-1 font-bold">오답 노트 적극 활용 요망</div>
              </Card>
            </div>
          </section>
        </div>



        {/* 워크스페이스 명예의 전당 (Top 5 랭킹 3종) */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-yellow-500 rounded-full"></span>
              명예의 전당
            </h2>
            <span className="text-xs text-slate-500 font-medium">Top 5 순위표</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* 레벨 랭킹 */}
            <Card className="bg-[#151922] border-slate-800 p-6 flex flex-col shadow-md">
              <h3 className="text-sm font-bold text-slate-300 mb-5 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                경험치 (LV) TOP 5
              </h3>
              <div className="flex flex-col gap-3">
                {mockRankingsLevel.map((rank, idx) => (
                  <div key={rank.id} className="flex items-center justify-between p-2.5 rounded-lg bg-[#1b202c] border border-slate-800/50 hover:bg-slate-800/80 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                        idx === 1 ? 'bg-slate-300/20 text-slate-300' :
                          idx === 2 ? 'bg-amber-700/20 text-amber-500' : 'bg-slate-800 text-slate-400'
                        }`}>
                        {idx + 1}
                      </div>
                      <span className="text-sm font-medium text-slate-200">{rank.name}</span>
                    </div>
                    <span className="text-xs font-bold text-indigo-400">{rank.count}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* 문제 풀이 랭킹 */}
            <Card className="bg-[#151922] border-slate-800 p-6 flex flex-col shadow-md">
              <h3 className="text-sm font-bold text-slate-300 mb-5 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                풀이 수 TOP 5
              </h3>
              <div className="flex flex-col gap-3">
                {mockRankingsSolved.map((rank, idx) => (
                  <div key={rank.id} className="flex items-center justify-between p-2.5 rounded-lg bg-[#1b202c] border border-slate-800/50 hover:bg-slate-800/80 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-emerald-500/20 text-emerald-500' :
                        idx === 1 ? 'bg-slate-300/20 text-slate-300' :
                          idx === 2 ? 'bg-amber-700/20 text-amber-500' : 'bg-slate-800 text-slate-400'
                        }`}>
                        {idx + 1}
                      </div>
                      <span className="text-sm font-medium text-slate-200">{rank.name}</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-400">{rank.count}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* 댓글 랭킹 */}
            <Card className="bg-[#151922] border-slate-800 p-6 flex flex-col shadow-md">
              <h3 className="text-sm font-bold text-slate-300 mb-5 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-500" />
                멘토링 기여 TOP 5
              </h3>
              <div className="flex flex-col gap-3">
                {mockRankingsComments.map((rank, idx) => (
                  <div key={rank.id} className="flex items-center justify-between p-2.5 rounded-lg bg-[#1b202c] border border-slate-800/50 hover:bg-slate-800/80 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-blue-500/20 text-blue-500' :
                        idx === 1 ? 'bg-slate-300/20 text-slate-300' :
                          idx === 2 ? 'bg-amber-700/20 text-amber-500' : 'bg-slate-800 text-slate-400'
                        }`}>
                        {idx + 1}
                      </div>
                      <span className="text-sm font-medium text-slate-200">{rank.name}</span>
                    </div>
                    <span className="text-xs font-bold text-blue-400">{rank.count}</span>
                  </div>
                ))}
              </div>
            </Card>

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
    </div>
  );
};
