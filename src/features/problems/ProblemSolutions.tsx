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
import { getSolutionSummaries, getSolutionVersions } from '@/api/solution';
import type { SolutionSummary, SolutionVersion, PagedResult } from '@/api/solution';

const LANG_MONACO: Record<string, string> = {
  JAVA: 'java',
  PYTHON: 'python',
  CPP: 'cpp',
  JAVASCRIPT: 'javascript',
};

const comments = [
  { id: 1, user: 'user123', content: '깔끔한 풀이네요! 배웠습니다.', time: '2시간 전' },
  { id: 2, user: 'coder99', content: 'Scanner 대신 BufferedReader를 쓰면 더 빠르지 않을까요?', time: '1시간 전' },
];

export const ProblemSolutions = () => {
  const { toWs } = useWorkspaceNavigate();
  const isDark = useIsDark();
  const { id } = useParams();
  const t = useT();

  const [summaries, setSummaries] = useState<SolutionSummary[]>([]);
  const [activeSolutionId, setActiveSolutionId] = useState<number | null>(null);
  const [versionPage, setVersionPage] = useState(0);
  const [versionResult, setVersionResult] = useState<PagedResult<SolutionVersion> | null>(null);
  const [versionsLoading, setVersionsLoading] = useState(false);

  const activeSolution = summaries.find((s) => s.solutionId === activeSolutionId) ?? null;
  const activeVersion = versionResult?.content[0] ?? null;
  const totalVersions = versionResult?.totalElements ?? 0;
  // 최신이 Version N, 오래된 게 Version 1
  const displayVersionNum = totalVersions - versionPage;

  // 사람 목록 로드
  useEffect(() => {
    getSolutionSummaries(0, 0, 0).then((data) => {
      setSummaries(data);
      if (data.length > 0) setActiveSolutionId(data[0].solutionId);
    });
  }, []);

  // 사람 선택 or 페이지 변경 시 제출 목록 로드 (size=1: 1페이지 = 제출 1건)
  useEffect(() => {
    if (activeSolutionId === null) return;
    setVersionsLoading(true);
    getSolutionVersions(0, 0, 0, activeSolutionId, versionPage, 1)
      .then(setVersionResult)
      .finally(() => setVersionsLoading(false));
  }, [activeSolutionId, versionPage]);

  const handleSolutionChange = (solutionId: number) => {
    setActiveSolutionId(solutionId);
    setVersionPage(0);
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
          <p className="text-xs text-text-faint mt-1">총 {summaries.length}개의 풀이가 있습니다.</p>
        </div>

        <div className="p-4 border-b border-border-default">
          <input
            type="text"
            placeholder="작성자 검색"
            className="w-full h-9 bg-input-bg border border-border-default rounded-lg pl-3 pr-3 text-sm text-text-secondary focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {summaries.map((sol) => {
            const isActive = sol.solutionId === activeSolutionId;
            return (
              <div
                key={sol.solutionId}
                onClick={() => handleSolutionChange(sol.solutionId)}
                className={`p-4 border-b border-border-default/50 cursor-pointer transition-all hover:bg-hover-bg border-l-4 ${
                  isActive ? 'bg-surface-subtle/40 border-l-emerald-500' : 'border-l-transparent'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                    <User className="w-3 h-3 text-text-faint" />
                    <span className={isActive ? 'text-emerald-500' : ''}>{sol.memberName}</span>
                  </div>
                  <span className="text-[10px] text-text-faint">
                    {new Date(sol.updatedAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <h3 className={`text-sm mb-2 line-clamp-2 ${isActive ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}>
                  {sol.title}
                </h3>

                <div className="flex items-center justify-between text-xs text-text-faint">
                  <span className="px-1.5 py-0.5 rounded bg-surface-subtle text-[10px] font-medium">
                    {sol.programmingLanguage}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-0.5">
                      <ThumbsUp className="w-3 h-3" /> {sol.latestLikes}
                    </span>
                    {sol.submissionCount > 1 && (
                      <span className="flex items-center gap-0.5" title={`${sol.submissionCount}번 제출`}>
                        <History className="w-3 h-3" /> {sol.submissionCount}
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
          {activeSolution ? (
            <>
              <div>
                <h1 className="text-lg font-bold text-text-primary">{activeSolution.title}</h1>
                <div className="flex items-center gap-3 text-xs text-text-faint mt-1">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" /> {activeSolution.memberName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(activeSolution.updatedAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {activeSolution.views}
                  </span>
                </div>
              </div>
              <Button size="sm" className={`gap-2 ${activeVersion?.isLiked ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-surface-subtle hover:bg-border-subtle text-text-secondary border border-border-subtle'}`}>
                <ThumbsUp className="w-3 h-3" /> {activeVersion?.likes ?? 0}
              </Button>
            </>
          ) : (
            <div className="text-text-faint text-sm">풀이를 선택해주세요.</div>
          )}
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
              onClick={() => setVersionPage((p) => p + 1)}
              disabled={versionResult?.last ?? true}
              className="p-1 rounded hover:bg-border-subtle text-text-muted disabled:opacity-30 disabled:hover:bg-transparent"
              title="이전 제출"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setVersionPage((p) => p - 1)}
              disabled={versionResult?.first ?? true}
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
              language={activeSolution ? (LANG_MONACO[activeSolution.programmingLanguage] ?? 'plaintext') : 'plaintext'}
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
