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
  { id: 1, name: '고스디님', count: '98.5 %' },
  { id: 2, name: '이서형', count: '94.2 %' },
  { id: 3, name: '박민수', count: '91.8 %' },
  { id: 4, name: '김지우', count: '88.4 %' },
  { id: 5, name: '최유진', count: '85.1 %' },
];

const mockRankingsSolved = [
  { id: 1, name: '고스디님', count: '1,284 문제' },
  { id: 2, name: '이서형', count: '1,102 문제' },
  { id: 3, name: '박민수', count: '942 문제' },
  { id: 4, name: '김지우', count: '730 문제' },
  { id: 5, name: '최유진', count: '612 문제' },
];

const mockRankingsComments = [
  { id: 1, name: '정하늘', count: '142 일' },
  { id: 2, name: '박민수', count: '128 일' },
  { id: 3, name: '최유진', count: '94 일' },
  { id: 4, name: '고스디님', count: '63 일' },
  { id: 5, name: '이서형', count: '55 일' },
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
  const [activeRankingTab, setActiveRankingTab] = useState<'정답률' | '풀이 수' | '연속 출석'>('정답률');

  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId);

  if (!currentWorkspace) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-page text-text-muted p-8">
        <div className="text-center space-y-4">
          <p className="text-lg">선택된 워크스페이스가 없습니다.</p>
          <Button onClick={() => setCreateWorkspaceOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            새 워크스페이스 생성하기
          </Button>
          <div className="mt-4">
            <Button variant="ghost" onClick={() => navigate('/explore')} className="text-text-faint hover:text-text-secondary">
              워크스페이스 탐색하기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-page p-8 pb-12 relative font-sans text-text-primary">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* 워크스페이스 헤더 (Notion Style) */}
        <div className="border-b border-border-default pb-8 mt-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-4xl font-extrabold text-text-primary tracking-tight mb-3">{currentWorkspace.name}</h1>
            <p className="text-base text-text-muted font-medium leading-relaxed max-w-3xl">
              {currentWorkspace.description || '알고리즘 문제 풀이와 코딩 테스트 대비를 위한 공용 스터디 워크스페이스입니다. 다같이 목표를 달성해봅시다!'}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/profile')}
            className="border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-500 dark:hover:text-indigo-300 font-bold shrink-0 items-center justify-center py-2 px-4 shadow-sm transition-all"
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
              <h2 className="text-lg font-bold text-text-secondary flex items-center gap-2">
                <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
                최근 공지사항
              </h2>
              <span onClick={() => toWs('community')} className="text-xs text-indigo-600 dark:text-indigo-400 font-medium cursor-pointer hover:underline">더보기</span>
            </div>
            <div className="flex flex-col gap-2.5 flex-1 w-full relative">
              {mockNotices.map(notice => (
                <Card
                  key={notice.id}
                  className="bg-surface-raised border-border-default p-4 cursor-pointer hover:border-border-subtle transition-colors flex flex-col justify-between flex-1"
                  onClick={() => setSelectedNotice(notice)}
                >
                  <h3 className="text-sm font-bold text-text-secondary mb-3 truncate">{notice.title}</h3>
                  <div className="flex items-center justify-between text-[10px] text-text-faint">
                    <div className="flex items-center gap-2">
                      <span className="text-text-muted font-medium">{notice.author}</span>
                      <span>{notice.date}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-surface-subtle border border-border-subtle rounded text-text-secondary">{notice.type}</span>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* 기한 만료 임박 문제 */}
          <section className="flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold text-text-secondary flex items-center gap-2">
                <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                기한 만료 임박 문제
              </h2>
              <span onClick={() => toWs('problems')} className="text-xs text-emerald-600 dark:text-emerald-400 font-medium cursor-pointer hover:underline">문제 보러가기</span>
            </div>
            <div className="flex flex-col gap-2.5 flex-1 w-full relative">
              {mockProblems.slice(0, 3).map((problem) => (
                <Card key={problem.id} className="bg-surface-raised border-border-default p-4 flex flex-col justify-between cursor-pointer flex-1 hover:border-border-subtle transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-text-secondary truncate">{problem.title}</h3>
                    <div className="flex gap-1 shrink-0">
                      <span className="px-2 py-0.5 text-[10px] font-medium bg-surface-subtle text-text-secondary rounded border border-border-subtle">{problem.source}</span>
                      <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded border border-emerald-200 dark:border-emerald-800/50">{problem.difficulty}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-text-faint">
                    <div className="flex gap-1 overflow-hidden">
                      {problem.tags.map(tag => (
                        <span key={tag}>#{tag}</span>
                      ))}
                    </div>
                    <span className="shrink-0 font-medium text-emerald-600 dark:text-emerald-400">{problem.date}</span>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* 워크스페이스 통계 */}
          <section className="flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold text-text-secondary flex items-center gap-2">
                <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                요약 통계
              </h2>
            </div>
            <div className="flex flex-col gap-2.5 flex-1 w-full relative">
              <Card className="bg-surface-raised border-border-default p-4 flex-1 flex flex-col justify-center shadow-md hover:border-border-subtle transition-colors cursor-pointer">
                <h3 className="text-sm font-medium text-text-muted mb-1">이번 달 해결</h3>
                <div className="text-2xl font-extrabold text-text-primary tracking-tight">342<span className="text-xs ml-1 text-text-faint font-medium">문제</span></div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-bold">+15% (상승곡선 유지 중)</div>
              </Card>
              <Card className="bg-surface-raised border-border-default p-4 flex-1 flex flex-col justify-center shadow-md hover:border-border-subtle transition-colors cursor-pointer">
                <h3 className="text-sm font-medium text-text-muted mb-1">전체 평균 정답률</h3>
                <div className="text-2xl font-extrabold text-text-primary tracking-tight">87<span className="text-xs ml-1 text-text-faint font-medium">%</span></div>
                <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-bold">오답 노트 적극 활용 요망</div>
              </Card>
            </div>
          </section>
        </div>



        {/* 워크스페이스 명예의 전당 (Top 5 랭킹 3종) */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-text-secondary flex items-center gap-2">
              <span className="w-1.5 h-6 bg-yellow-500 rounded-full"></span>
              명예의 전당
            </h2>
            <span className="text-xs text-text-faint font-medium">Top 5 순위표</span>
          </div>

          <Card className="bg-surface-raised border-border-default p-0 overflow-hidden shadow-md">
            {/* 탭 헤더 영역 */}
            <div className="flex border-b border-border-default/60 bg-page/50">
              {(['정답률', '풀이 수', '연속 출석'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveRankingTab(tab)}
                  className={`flex-1 py-4 text-sm font-bold transition-all ${activeRankingTab === tab
                    ? 'text-yellow-500 border-b-2 border-yellow-500 bg-surface-raised'
                    : 'text-text-faint hover:text-text-secondary hover:bg-surface-raised/50'
                    }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {tab === '정답률' && <Trophy className="w-4 h-4" />}
                    {tab === '풀이 수' && <Activity className="w-4 h-4" />}
                    {tab === '연속 출석' && <CheckCircle2 className="w-4 h-4" />}
                    {tab}
                  </div>
                </button>
              ))}
            </div>

            {/* 리스트 렌더링 영역 (Clean & Modern) */}
            <div className="p-6">
              <div className="flex flex-col">
                {(activeRankingTab === '정답률' ? mockRankingsLevel
                  : activeRankingTab === '풀이 수' ? mockRankingsSolved
                    : mockRankingsComments).map((rank, idx) => (
                      <div key={rank.id} className="flex items-center justify-between py-3.5 border-b border-border-default/40 last:border-0 group hover:px-2 rounded-lg hover:bg-hover-bg transition-all duration-200 cursor-default">
                        <div className="flex items-center gap-4">
                          {/* 순위 하이라이트 */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-sm ${idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-600 text-yellow-950 shadow-[0_0_12px_rgba(234,179,8,0.4)]' :
                            idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-900 shadow-[0_0_8px_rgba(148,163,184,0.3)]' :
                              idx === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-amber-50 shadow-[0_0_8px_rgba(180,83,9,0.3)]' :
                                'bg-transparent text-text-faint border border-border-subtle/50'
                            }`}>
                            {idx + 1}
                          </div>

                          {/* 유저 아바타 및 이름 */}
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-text-secondary ${idx === 0 ? 'bg-surface-subtle border-2 border-yellow-500/50' : 'bg-surface-subtle'}`}>
                              {rank.name.charAt(0)}
                            </div>
                            <span className={`font-semibold tracking-tight ${idx === 0 ? 'text-text-primary text-base' : 'text-text-secondary text-[15px]'}`}>
                              {rank.name}
                            </span>
                          </div>
                        </div>

                        {/* 기록 데이터 */}
                        <span className={`font-black tracking-tight ${idx === 0 && activeRankingTab === '정답률' ? 'text-yellow-600 dark:text-yellow-400 text-lg' :
                          idx === 0 && activeRankingTab === '풀이 수' ? 'text-emerald-600 dark:text-emerald-400 text-lg' :
                            idx === 0 && activeRankingTab === '연속 출석' ? 'text-blue-600 dark:text-blue-400 text-lg' :
                              'text-text-muted text-sm'
                          }`}>
                          {rank.count}
                        </span>
                      </div>
                    ))}
              </div>
            </div>
          </Card>
        </section>

      </div>

      {/* 모달: 공지글 상세 */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-raised border border-border-subtle rounded-xl w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setSelectedNotice(null)}
              className="absolute top-4 right-4 text-text-faint hover:text-text-primary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-6 border-b border-border-default">
              <h3 className="text-xl font-bold text-text-primary pr-8">{selectedNotice.title}</h3>
              <div className="flex items-center gap-2 mt-3 text-sm text-text-muted">
                <span>{selectedNotice.date}</span>
                <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                <span>작성자: {selectedNotice.author}</span>
              </div>
            </div>
            <div className="p-6 text-text-secondary leading-relaxed whitespace-pre-line text-sm min-h-[150px]">
              {selectedNotice.content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
