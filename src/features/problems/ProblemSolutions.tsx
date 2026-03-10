import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { currentWorkspaceState } from '@/store/atoms';
import { useWorkspaceNavigate } from '@/hooks/useWorkspaceNavigate';
import { Button } from '@/components/ui/Base';
import {
  ThumbsUp,
  Calendar,
  MessageSquare,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  History,
  User,
  Send,
  Loader2,
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useIsDark } from '@/App';
import { useT } from '@/i18n';
import {
  getSolutionSummaries,
  getSolutionVersions,
  getSolutionComments,
  createSolutionComment,
  likeSolution,
  unlikeSolution,
} from '@/api/solution';
import type { components } from '@ujax/api-spec/types';
import type { SolutionSummary, SolutionVersion, SolutionComment } from '@/api/solution';

type SolutionVersionPageData = components['schemas']['ApiResponse-SolutionVersionList']['data'];

const LANG_MONACO: Record<string, string> = {
  JAVA: 'java',
  PYTHON: 'python',
  CPP: 'cpp',
  JAVASCRIPT: 'javascript',
};

const STATUS_LABEL: Record<string, string> = {
  ACCEPTED: '맞았습니다',
  WRONG_ANSWER: '틀렸습니다',
  TIME_LIMIT_EXCEEDED: '시간 초과',
  MEMORY_LIMIT_EXCEEDED: '메모리 초과',
  COMPILE_ERROR: '컴파일 에러',
  RUNTIME_ERROR: '런타임 에러',
};

function StatusBadge({ status }: { status: string }) {
  const colorClass =
    status === 'ACCEPTED'
      ? 'bg-emerald-500/20 text-emerald-500'
      : status === 'WRONG_ANSWER'
      ? 'bg-red-500/20 text-red-400'
      : status === 'TIME_LIMIT_EXCEEDED'
      ? 'bg-yellow-500/20 text-yellow-500'
      : 'bg-surface-subtle text-text-faint';
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${colorClass}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function parseApiError(err: unknown): string {
  const msg = (err as any)?.message || '';
  const jsonMatch = msg.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.detail || '요청에 실패했습니다.';
    } catch {
      return '요청에 실패했습니다.';
    }
  }
  return '요청에 실패했습니다.';
}

export const ProblemSolutions = () => {
  const { toWs } = useWorkspaceNavigate();
  const isDark = useIsDark();
  const { workspaceProblemId } = useParams<{ workspaceProblemId: string }>();
  const [searchParams] = useSearchParams();
  const wsId = useRecoilValue(currentWorkspaceState);
  const boxId = Number(searchParams.get('boxId') ?? 0);
  const problemId = Number(workspaceProblemId ?? 0);
  const t = useT();

  const [summaries, setSummaries] = useState<SolutionSummary[]>([]);
  const [summariesLoading, setSummariesLoading] = useState(true);
  const [activeWorkspaceMemberId, setActiveWorkspaceMemberId] = useState<number | null>(null);
  const [versionPage, setVersionPage] = useState(0);
  const [versionResult, setVersionResult] = useState<SolutionVersionPageData | null>(null);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [comments, setComments] = useState<SolutionComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const commentInputRef = useRef<HTMLInputElement>(null);

  const activeSolution = summaries.find((s) => s.workspaceMemberId === activeWorkspaceMemberId) ?? null;
  const activeVersion = versionResult?.content[0] ?? null;
  const totalVersions = versionResult?.page.totalElements ?? 0;
  const displayVersionNum = totalVersions - versionPage;

  const filteredSummaries = summaries.filter((s) =>
    s.memberName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Load summaries
  useEffect(() => {
    if (!wsId || !boxId || !problemId) return;
    setSummariesLoading(true);
    getSolutionSummaries(wsId, boxId, problemId)
      .then((data) => {
        setSummaries(data);
        if (data.length > 0) setActiveWorkspaceMemberId(data[0].workspaceMemberId);
      })
      .catch(() => {})
      .finally(() => setSummariesLoading(false));
  }, [wsId, boxId, problemId]);

  // Load versions when member or page changes
  useEffect(() => {
    if (!wsId || !boxId || !problemId || activeWorkspaceMemberId === null) return;
    setVersionsLoading(true);
    getSolutionVersions(wsId, boxId, problemId, activeWorkspaceMemberId, versionPage, 1)
      .then(setVersionResult)
      .catch(() => setVersionResult(null))
      .finally(() => setVersionsLoading(false));
  }, [wsId, boxId, problemId, activeWorkspaceMemberId, versionPage]);

  // Load comments when version changes
  useEffect(() => {
    const submissionId = versionResult?.content[0]?.submissionId;
    if (!wsId || !boxId || !problemId || !activeWorkspaceMemberId || !submissionId) {
      setComments([]);
      return;
    }
    setCommentsLoading(true);
    getSolutionComments(wsId, boxId, problemId, activeWorkspaceMemberId, submissionId)
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setCommentsLoading(false));
  }, [versionResult]);

  const handleSolutionChange = (workspaceMemberId: number) => {
    setActiveWorkspaceMemberId(workspaceMemberId);
    setVersionPage(0);
  };

  const handleLike = async () => {
    if (!wsId || !boxId || !problemId || !activeWorkspaceMemberId || !activeVersion) return;
    setLikeLoading(true);
    try {
      const status = activeVersion.isLiked
        ? await unlikeSolution(wsId, boxId, problemId, activeWorkspaceMemberId, activeVersion.submissionId)
        : await likeSolution(wsId, boxId, problemId, activeWorkspaceMemberId, activeVersion.submissionId);
      setVersionResult((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          content: prev.content.map((v) =>
            v.submissionId === activeVersion.submissionId
              ? { ...v, likes: status.likes, isLiked: status.isLiked }
              : v,
          ),
        };
      });
    } catch {
      // ignore
    } finally {
      setLikeLoading(false);
    }
  };

  const handleCommentSubmit = async () => {
    const trimmed = commentInput.trim();
    if (!trimmed || !wsId || !boxId || !problemId || !activeWorkspaceMemberId || !activeVersion) return;
    setCommentSubmitting(true);
    try {
      const newComment = await createSolutionComment(
        wsId, boxId, problemId, activeWorkspaceMemberId, activeVersion.submissionId, trimmed,
      );
      setComments((prev) => [...prev, newComment]);
      setCommentInput('');
    } catch (err) {
      alert(parseApiError(err));
    } finally {
      setCommentSubmitting(false);
    }
  };

  return (
    <div className="flex h-full bg-page">
      {/* ── Sidebar ── */}
      <div className="w-80 bg-page border-r border-border-subtle flex flex-col">
        <div className="p-4 border-b border-border-default flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toWs(`ide/${workspaceProblemId || ''}`)}
            className="-ml-2 text-text-muted hover:text-text-primary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> {t('problems.solutions.backToProblem')}
          </Button>
        </div>

        <div className="p-4 border-b border-border-default bg-surface">
          <h2 className="font-bold text-text-secondary">{t('problems.solutions.title')}</h2>
          <p className="text-xs text-text-faint mt-1">
            {summariesLoading ? '불러오는 중...' : `총 ${summaries.length}명의 풀이가 있습니다.`}
          </p>
        </div>

        <div className="p-4 border-b border-border-default">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="작성자 검색"
            className="w-full h-9 bg-input-bg border border-border-default rounded-lg pl-3 pr-3 text-sm text-text-secondary focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {summariesLoading ? (
            <div className="flex items-center justify-center h-24 text-text-faint text-sm">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> 불러오는 중...
            </div>
          ) : filteredSummaries.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-text-faint text-sm">
              풀이가 없습니다.
            </div>
          ) : (
            filteredSummaries.map((sol) => {
              const isActive = sol.workspaceMemberId === activeWorkspaceMemberId;
              return (
                <div
                  key={sol.workspaceMemberId}
                  onClick={() => handleSolutionChange(sol.workspaceMemberId)}
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

                  <div className="flex items-center gap-2 mb-2">
                    <StatusBadge status={sol.latestStatus} />
                    <span className="px-1.5 py-0.5 rounded bg-surface-subtle text-[10px] font-medium text-text-faint">
                      {sol.programmingLanguage}
                    </span>
                  </div>

                  <div className="flex items-center justify-end text-xs text-text-faint gap-2">
                    <span className="flex items-center gap-0.5">
                      <ThumbsUp className="w-3 h-3" /> {sol.likes}
                    </span>
                    <span className="flex items-center gap-0.5" title={`${sol.submissionCount}번 제출`}>
                      <History className="w-3 h-3" /> {sol.submissionCount}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Main Panel ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-page">
        {/* Header */}
        <div className="h-16 px-6 border-b border-border-default flex items-center justify-between bg-page">
          {activeSolution ? (
            <>
              <div>
                <h1 className="text-lg font-bold text-text-primary">{activeSolution.memberName}의 풀이</h1>
                <div className="flex items-center gap-3 text-xs text-text-faint mt-1">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" /> {activeSolution.memberName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(activeSolution.updatedAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <StatusBadge status={activeSolution.latestStatus} />
                </div>
              </div>
              <Button
                size="sm"
                disabled={likeLoading || !activeVersion}
                onClick={handleLike}
                className={`gap-2 ${
                  activeVersion?.isLiked
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-surface-subtle hover:bg-border-subtle text-text-secondary border border-border-subtle'
                }`}
              >
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
              <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> 로딩 중...</span>
            ) : (
              <>
                <span>제출 기록 (Version {displayVersionNum} / {totalVersions})</span>
                {activeVersion && (
                  <span className="text-text-faint ml-2">
                    {new Date(activeVersion.createdAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                {activeVersion && <span className="ml-2"><StatusBadge status={activeVersion.status} /></span>}
                {activeVersion && activeVersion.time && (
                  <span className="text-text-faint ml-1">{activeVersion.time}</span>
                )}
                {activeVersion && activeVersion.memory && (
                  <span className="text-text-faint">{activeVersion.memory}</span>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setVersionPage((p) => p + 1)}
              disabled={versionResult?.page.last ?? true}
              className="p-1 rounded hover:bg-border-subtle text-text-muted disabled:opacity-30 disabled:hover:bg-transparent"
              title="이전 제출"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setVersionPage((p) => p - 1)}
              disabled={versionResult?.page.first ?? true}
              className="p-1 rounded hover:bg-border-subtle text-text-muted disabled:opacity-30 disabled:hover:bg-transparent"
              title="최신 제출"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Code editor */}
        <div className="flex-1 bg-surface-overlay relative">
          {versionsLoading || !activeVersion ? (
            <div className="flex items-center justify-center h-full text-text-faint text-sm">
              {versionsLoading
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> 불러오는 중...</>
                : '코드가 없습니다.'}
            </div>
          ) : (
            <Editor
              height="100%"
              theme={isDark ? 'vs-dark' : 'light'}
              language={activeSolution ? (LANG_MONACO[activeSolution.programmingLanguage] ?? 'plaintext') : 'plaintext'}
              value={activeVersion.code ?? ''}
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
            <MessageSquare className="w-4 h-4 text-emerald-500" />
            {t('problems.solutions.comments')}
            {activeVersion && (
              <span className="text-text-faint font-normal text-xs ml-1">({activeVersion.commentCount})</span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {commentsLoading ? (
              <div className="flex items-center text-text-faint text-sm gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> 불러오는 중...
              </div>
            ) : comments.length === 0 ? (
              <div className="text-text-faint text-sm">아직 댓글이 없습니다.</div>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex gap-3 text-sm">
                  <div className="font-bold text-text-secondary shrink-0">{c.authorName}</div>
                  <div className="text-text-muted flex-1">{c.content}</div>
                  <div className="text-text-faint text-xs shrink-0">
                    {new Date(c.createdAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-3 border-t border-border-default bg-surface">
            <div className="relative">
              <input
                ref={commentInputRef}
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCommentSubmit(); } }}
                placeholder={t('problems.solutions.writeComment')}
                disabled={!activeVersion || commentSubmitting}
                className="w-full bg-input-bg border border-border-default rounded-lg py-2 pl-3 pr-10 text-sm text-text-secondary focus:outline-none focus:border-emerald-500 disabled:opacity-50"
              />
              <button
                onClick={handleCommentSubmit}
                disabled={!commentInput.trim() || !activeVersion || commentSubmitting}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-500 hover:text-emerald-400 disabled:opacity-30"
              >
                {commentSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
