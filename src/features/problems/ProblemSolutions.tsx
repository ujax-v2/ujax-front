import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspaceNavigate } from '@/hooks/useWorkspaceNavigate';
import { Button } from '@/components/ui/Base';
import {
  ThumbsUp,
  Eye,
  Calendar,
  MessageSquare,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  History,
  User,
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useIsDark } from '@/App';
import { useT } from '@/i18n';
import { getSolutionVersions } from '@/api/solution';
import type { SolutionVersion } from '@/api/solution';

const LANG_MONACO: Record<string, string> = {
  JAVA: 'java',
  PYTHON: 'python',
  CPP: 'cpp',
  JAVASCRIPT: 'javascript',
};

// 사이드바에 표시할 풀이 목록 (mock)
const SOLUTIONS = [
  {
    id: 1,
    title: 'BufferedReader를 활용한 빠른 입출력',
    memberName: '알고리즘마스터',
    time: '3시간 전',
    lang: 'JAVA',
    likes: 42,
    views: 128,
    versionCount: 2,
  },
  {
    id: 2,
    title: 'Python 한 줄 코딩 (Short coding)',
    memberName: 'pythonista',
    time: '5시간 전',
    lang: 'PYTHON',
    likes: 38,
    views: 95,
    versionCount: 1,
  },
  {
    id: 3,
    title: 'C++ ios_base::sync_with_stdio 입출력 최적화',
    memberName: 'cppNinja',
    time: '1일 전',
    lang: 'CPP',
    likes: 29,
    views: 150,
    versionCount: 3,
  },
];

const comments = [
  { id: 1, user: 'user123', content: '깔끔한 풀이네요! 배웠습니다.', time: '2시간 전' },
  { id: 2, user: 'coder99', content: 'Scanner 대신 BufferedReader를 쓰면 더 빠르지 않을까요?', time: '1시간 전' },
];

export const ProblemSolutions = () => {
  const { toWs } = useWorkspaceNavigate();
  const isDark = useIsDark();
  const { id } = useParams();
  const t = useT();

  const [activeSolutionId, setActiveSolutionId] = useState(1);
  const [versionIndex, setVersionIndex] = useState(0); // 0 = 최신
  const [versions, setVersions] = useState<SolutionVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  const activeSolution = SOLUTIONS.find((s) => s.id === activeSolutionId) ?? SOLUTIONS[0];
  const totalVersions = versions.length;
  // versionIndex 0이 최신이므로 표시 번호는 역순
  const displayVersionNum = totalVersions - versionIndex;
  const activeVersion = versions[versionIndex] ?? null;

  useEffect(() => {
    setVersionsLoading(true);
    setVersionIndex(0);
    // wsId, boxId, problemId는 실제 연동 시 props/params에서 받음
    getSolutionVersions(0, 0, 0, activeSolutionId)
      .then(setVersions)
      .finally(() => setVersionsLoading(false));
  }, [activeSolutionId]);

  const handleSolutionChange = (id: number) => {
    setActiveSolutionId(id);
  };

  return (
    <div className="flex h-full bg-page">
      {/* ─── Sidebar ─── */}
      <div className="w-80 bg-page border-r border-border-subtle flex flex-col">
        <div className="p-4 border-b border-border-default flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toWs(`ide/${id || '1000'}`)}
            className="-ml-2 text-text-muted hover:text-text-primary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> {t('problems.solutions.backToProblem')}
          </Button>
        </div>

        <div className="p-4 border-b border-border-default bg-surface">
          <h2 className="font-bold text-text-secondary">1000. A+B 풀이</h2>
          <p className="text-xs text-text-faint mt-1">총 {SOLUTIONS.length}개의 풀이가 있습니다.</p>
        </div>

        <div className="p-4 border-b border-border-default">
          <input
            type="text"
            placeholder="작성자 검색"
            className="w-full h-9 bg-input-bg border border-border-default rounded-lg pl-3 pr-3 text-sm text-text-secondary focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {SOLUTIONS.map((sol) => {
            const isActive = sol.id === activeSolutionId;
            return (
              <div
                key={sol.id}
                onClick={() => handleSolutionChange(sol.id)}
                className={`p-4 border-b border-border-default/50 cursor-pointer transition-all hover:bg-hover-bg border-l-4 ${
                  isActive ? 'bg-surface-subtle/40 border-l-emerald-500' : 'border-l-transparent'
                }`}
              >
                {/* 사람 기준: 작성자 + 시간 */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                    <User className="w-3 h-3 text-text-faint" />
                    <span className={isActive ? 'text-emerald-500' : ''}>{sol.memberName}</span>
                  </div>
                  <span className="text-[10px] text-text-faint">{sol.time}</span>
                </div>

                {/* 제목 */}
                <h3 className={`text-sm mb-2 line-clamp-2 ${isActive ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}>
                  {sol.title}
                </h3>

                {/* 언어 + 좋아요 + 버전 여부 (보조 정보) */}
                <div className="flex items-center justify-between text-xs text-text-faint">
                  <span className="px-1.5 py-0.5 rounded bg-surface-subtle text-[10px] font-medium">
                    {sol.lang}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-0.5">
                      <ThumbsUp className="w-3 h-3" /> {sol.likes}
                    </span>
                    {sol.versionCount > 1 && (
                      <span className="flex items-center gap-0.5" title={`${sol.versionCount}개의 제출 기록`}>
                        <History className="w-3 h-3" /> {sol.versionCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Main ─── */}
      <div className="flex-1 flex flex-col min-w-0 bg-page">
        {/* Header */}
        <div className="h-16 px-6 border-b border-border-default flex items-center justify-between bg-page">
          <div>
            <h1 className="text-lg font-bold text-text-primary">{activeSolution.title}</h1>
            <div className="flex items-center gap-3 text-xs text-text-faint mt-1">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" /> {activeSolution.memberName}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {activeSolution.time}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" /> {activeSolution.views}
              </span>
            </div>
          </div>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 gap-2">
            <ThumbsUp className="w-3 h-3" /> {activeSolution.likes}
          </Button>
        </div>

        {/* Version bar */}
        <div className="h-10 border-b border-border-default bg-surface-overlay flex items-center justify-between px-4">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <History className="w-3.5 h-3.5" />
            {versionsLoading ? (
              <span>로딩 중...</span>
            ) : (
              <>
                <span>
                  제출 기록 (Version {displayVersionNum} / {totalVersions})
                </span>
                {activeVersion && (
                  <span className="text-text-faint ml-2">{new Date(activeVersion.createdAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                )}
                {activeVersion && (
                  <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    activeVersion.status === 'ACCEPTED'
                      ? 'bg-emerald-500/20 text-emerald-500'
                      : activeVersion.status === 'WRONG_ANSWER'
                      ? 'bg-red-500/20 text-red-400'
                      : activeVersion.status === 'TIME_LIMIT_EXCEEDED'
                      ? 'bg-yellow-500/20 text-yellow-500'
                      : 'bg-surface-subtle text-text-faint'
                  }`}>
                    {activeVersion.status}
                  </span>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setVersionIndex((i) => i + 1)}
              disabled={versionIndex >= totalVersions - 1}
              className="p-1 rounded hover:bg-border-subtle text-text-muted disabled:opacity-30 disabled:hover:bg-transparent"
              title="이전 제출"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setVersionIndex((i) => i - 1)}
              disabled={versionIndex <= 0}
              className="p-1 rounded hover:bg-border-subtle text-text-muted disabled:opacity-30 disabled:hover:bg-transparent"
              title="최신 제출"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Code */}
        <div className="flex-1 bg-surface-overlay relative">
          {versionsLoading || !activeVersion ? (
            <div className="flex items-center justify-center h-full text-text-faint text-sm">
              {versionsLoading ? '불러오는 중...' : '코드가 없습니다.'}
            </div>
          ) : (
            <Editor
              height="100%"
              theme={isDark ? 'vs-dark' : 'light'}
              language={LANG_MONACO[activeSolution.lang] ?? 'plaintext'}
              value={activeVersion.code}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                readOnly: true,
                scrollBeyondLastLine: false,
                padding: { top: 16 },
              }}
            />
          )}
        </div>

        {/* Comments */}
        <div className="h-64 border-t border-border-default bg-page flex flex-col">
          <div className="p-3 border-b border-border-default font-bold text-text-secondary text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-500" /> {t('problems.solutions.comments')}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-3 text-sm">
                <div className="font-bold text-text-secondary">{c.user}</div>
                <div className="text-text-muted flex-1">{c.content}</div>
                <div className="text-text-faint text-xs">{c.time}</div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-border-default bg-surface">
            <div className="relative">
              <input
                type="text"
                placeholder={t('problems.solutions.writeComment')}
                className="w-full bg-input-bg border border-border-default rounded-lg py-2 pl-3 pr-10 text-sm text-text-secondary focus:outline-none focus:border-emerald-500"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-500 hover:text-emerald-400">
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
