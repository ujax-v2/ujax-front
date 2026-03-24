import { useState, useEffect } from 'react';
import { useSetRecoilState, useRecoilValue } from 'recoil';
import { workspacesState, currentWorkspaceState, isCreateWorkspaceModalOpenState } from '@/store/atoms';
import { useWorkspaceNavigate } from '@/hooks/useWorkspaceNavigate';
import { Button, Card } from '@/components/ui/Base';
import { X, Trophy, Activity, CheckCircle2, UserCircle, Pin, Loader2 } from 'lucide-react';
import { useT } from '@/i18n';
import { getWorkspaceDashboard, WorkspaceDashboardResponse } from '@/api/workspace';
import { getBoardDetail } from '@/api/board';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function formatDeadline(deadline: string) {
  const d = new Date(deadline.endsWith('Z') ? deadline : deadline + 'Z');
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  const diffD = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffMs < 0) return '마감';
  if (diffH < 24) return `${diffH}시간 후 마감`;
  return `${diffD}일 후 마감`;
}

function formatDate(isoStr: string) {
  const d = new Date(isoStr.endsWith('Z') ? isoStr : isoStr + 'Z');
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}

function getTierColor(tier: string | null | undefined) {
  if (!tier) return 'text-text-faint bg-surface-subtle border-border-subtle';
  const tl = tier.toLowerCase();
  if (tl.includes('gold')) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
  if (tl.includes('silver')) return 'text-text-secondary bg-surface-subtle border-border-subtle';
  if (tl.includes('bronze')) return 'text-amber-700 dark:text-amber-500 bg-amber-500/10 border-amber-500/20';
  if (tl.includes('platinum')) return 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
  if (tl.includes('diamond')) return 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20';
  if (tl.includes('ruby')) return 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20';
  return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
}

export const Dashboard = () => {
  const { navigate, toWs } = useWorkspaceNavigate();
  const t = useT();
  const workspaces = useRecoilValue(workspacesState);
  const currentWorkspaceId = useRecoilValue(currentWorkspaceState);
  const setCreateWorkspaceOpen = useSetRecoilState(isCreateWorkspaceModalOpenState);

  const [selectedNotice, setSelectedNotice] = useState<WorkspaceDashboardResponse['recentNotices'][0] | null>(null);
  const [noticeContent, setNoticeContent] = useState<string | null>(null);
  const [noticeContentLoading, setNoticeContentLoading] = useState(false);

  const handleNoticeClick = async (notice: WorkspaceDashboardResponse['recentNotices'][0]) => {
    setSelectedNotice(notice);
    setNoticeContent(null);
    setNoticeContentLoading(true);
    try {
      const detail = await getBoardDetail(currentWorkspaceId, notice.boardId);
      setNoticeContent(detail.content);
    } catch {
      setNoticeContent(null);
    } finally {
      setNoticeContentLoading(false);
    }
  };

  const handleCloseNotice = () => {
    setSelectedNotice(null);
    setNoticeContent(null);
  };
  const [activeRankingTab, setActiveRankingTab] = useState<'monthlySolved' | 'streak' | 'deadlineRate'>('monthlySolved');
  const [dashboard, setDashboard] = useState<WorkspaceDashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId);

  useEffect(() => {
    if (!currentWorkspaceId) return;
    setLoading(true);
    getWorkspaceDashboard(currentWorkspaceId)
      .then(data => setDashboard(data))
      .catch(err => console.error('Failed to load dashboard:', err))
      .finally(() => setLoading(false));
  }, [currentWorkspaceId]);

  if (!currentWorkspace) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-page text-text-muted p-8">
        <div className="text-center space-y-4">
          <p className="text-lg">{t('dashboard.noWorkspace')}</p>
          <Button onClick={() => setCreateWorkspaceOpen(true)} className="bg-indigo-700 hover:bg-indigo-800 text-white">
            {t('dashboard.createWorkspace')}
          </Button>
          <div className="mt-4">
            <Button variant="ghost" onClick={() => navigate('/explore')} className="text-text-faint hover:text-text-secondary">
              {t('dashboard.exploreWorkspace')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const notices = dashboard?.recentNotices ?? [];
  const deadlines = dashboard?.upcomingDeadlines ?? [];
  const summary = dashboard?.summary;
  const rankings = dashboard?.rankings;

  return (
    <div className="flex-1 overflow-y-auto bg-page p-8 pb-12 relative font-sans text-text-primary">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* 워크스페이스 헤더 */}
        <div className="border-b border-border-default pb-8 mt-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-4xl font-extrabold text-text-primary tracking-tight mb-3">{currentWorkspace.name}</h1>
            <p className="text-base text-text-muted font-medium leading-relaxed max-w-3xl">
              {currentWorkspace.description || t('dashboard.defaultDesc')}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/profile')}
            className="border-indigo-600/30 text-indigo-700 dark:text-indigo-500 hover:bg-indigo-600/10 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold shrink-0 items-center justify-center py-2 px-4 shadow-sm transition-all"
          >
            <UserCircle className="w-5 h-5 mr-1" />
            {t('dashboard.goToMypage')}
          </Button>
        </div>

        {/* 공지, 만료 임박 문제, 요약 통계 (3열 그리드) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* 최근 공지사항 */}
          <section className="flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold text-text-secondary flex items-center gap-2">
                <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
                {t('dashboard.recentNotices')}
              </h2>
              <span onClick={() => toWs('community')} className="text-xs text-indigo-700 dark:text-indigo-500 font-medium cursor-pointer hover:underline">{t('common.more')}</span>
            </div>
            <div className="flex flex-col gap-2.5 flex-1 w-full relative">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="bg-surface-raised border-border-default p-4 flex-1 animate-pulse">
                    <div className="h-4 bg-surface-subtle rounded w-3/4 mb-3" />
                    <div className="h-3 bg-surface-subtle rounded w-1/2" />
                  </Card>
                ))
              ) : (
                <>
                  {notices.slice(0, 3).map(notice => (
                    <Card
                      key={notice.boardId}
                      className="bg-surface-raised border-border-default p-4 cursor-pointer hover:border-border-subtle transition-colors flex flex-col justify-between flex-1"
                      onClick={() => handleNoticeClick(notice)}
                    >
                      <div className="flex items-center gap-1.5 mb-3">
                        {notice.pinned && <Pin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
                        <h3 className="text-base font-bold text-text-secondary truncate">{notice.title}</h3>
                      </div>
                      <div className="flex items-center justify-between text-xs text-text-faint">
                        <span className="text-text-muted font-medium">{notice.authorNickname}</span>
                        <span>{formatDate(notice.createdAt)}</span>
                      </div>
                    </Card>
                  ))}
                  {notices.length === 0 && (
                    <div className="flex-1 flex items-center justify-center text-text-faint text-sm">등록된 공지가 없습니다.</div>
                  )}
                  {Array.from({ length: Math.max(0, 3 - (notices.length === 0 ? 1 : notices.length)) }).map((_, i) => (
                    <div key={`spacer-${i}`} className="flex-1" />
                  ))}
                </>
              )}
            </div>
          </section>

          {/* 기한 만료 임박 문제 */}
          <section className="flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold text-text-secondary flex items-center gap-2">
                <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                {t('dashboard.upcomingDeadlines')}
              </h2>
              <span onClick={() => toWs('problems')} className="text-xs text-emerald-600 dark:text-emerald-400 font-medium cursor-pointer hover:underline">{t('dashboard.goToProblems')}</span>
            </div>
            <div className="flex flex-col gap-2.5 flex-1 w-full relative">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="bg-surface-raised border-border-default p-4 flex-1 animate-pulse">
                    <div className="h-4 bg-surface-subtle rounded w-2/3 mb-3" />
                    <div className="h-3 bg-surface-subtle rounded w-1/3" />
                  </Card>
                ))
              ) : (
                <>
                  {deadlines.slice(0, 3).map(problem => (
                    <Card key={problem.workspaceProblemId} className="bg-surface-raised border-border-default p-4 flex flex-col justify-between cursor-pointer flex-1 hover:border-border-subtle transition-colors" onClick={() => toWs(`ide/${problem.problemNumber}`)}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-base font-bold text-text-secondary truncate">{problem.title}</h3>
                        <div className="flex gap-1 shrink-0">
                          <span className="px-2 py-0.5 text-xs font-medium bg-surface-subtle text-text-secondary rounded border border-border-subtle">{problem.problemNumber}</span>
                          {problem.tier && (
                            <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getTierColor(problem.tier)}`}>{problem.tier}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-text-faint">
                        <div className="flex gap-1 overflow-hidden">
                          {(problem.algorithmTags as string[]).slice(0, 2).map(tag => (
                            <span key={tag}>#{tag}</span>
                          ))}
                        </div>
                        <span className="shrink-0 font-medium text-emerald-600 dark:text-emerald-400">{formatDeadline(problem.deadline)}</span>
                      </div>
                    </Card>
                  ))}
                  {deadlines.length === 0 && (
                    <div className="flex-1 flex items-center justify-center text-text-faint text-sm">임박한 마감 문제가 없습니다.</div>
                  )}
                  {Array.from({ length: Math.max(0, 3 - (deadlines.length === 0 ? 1 : deadlines.length)) }).map((_, i) => (
                    <div key={`spacer-${i}`} className="flex-1" />
                  ))}
                </>
              )}
            </div>
          </section>

          {/* 워크스페이스 통계 */}
          <section className="flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold text-text-secondary flex items-center gap-2">
                <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                {t('dashboard.summaryStats')}
              </h2>
            </div>
            <div className="flex flex-col gap-2.5 flex-1 w-full relative">
              <Card className="bg-surface-raised border-border-default p-4 flex-1 flex flex-col justify-center shadow-md hover:border-border-subtle transition-colors cursor-pointer">
                <h3 className="text-base font-medium text-text-muted mb-1">{t('dashboard.weekSubmissions')}</h3>
                {loading ? (
                  <div className="text-sm text-text-faint">불러오는 중...</div>
                ) : (
                  <>
                    <div className="text-2xl font-extrabold text-text-primary tracking-tight">
                      {summary?.weeklySubmissionCount ?? 0}<span className="text-sm ml-1 text-text-faint font-medium">건</span>
                    </div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-bold">이번 주 제출 현황</div>
                  </>
                )}
              </Card>
              <Card className="bg-surface-raised border-border-default p-4 flex-1 flex flex-col justify-center shadow-md hover:border-border-subtle transition-colors cursor-pointer">
                <h3 className="text-base font-medium text-text-muted mb-1">{t('dashboard.hotProblem')}</h3>
                {loading ? (
                  <div className="text-sm text-text-faint">불러오는 중...</div>
                ) : !summary?.hotProblem ? (
                  <div className="text-sm text-text-faint">이번 주 제출 문제가 없습니다.</div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-2xl font-extrabold text-text-primary tracking-tight truncate mr-2">{summary.hotProblem.title}</span>
                      <div className="flex gap-1 shrink-0">
                        <span className="px-2 py-0.5 text-xs font-medium bg-surface-subtle text-text-secondary rounded border border-border-subtle">{summary.hotProblem.problemNumber}</span>
                        {summary.hotProblem.tier && (
                          <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getTierColor(summary.hotProblem.tier)}`}>{summary.hotProblem.tier}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-faint mt-1">
                      {(summary.hotProblem.algorithmTags as string[])?.slice(0, 2).map(tag => (
                        <span key={tag}>#{tag}</span>
                      ))}
                      <span className="ml-auto font-bold text-orange-500 dark:text-orange-400">🔥 이번 주 {summary.hotProblem.weeklySubmissionCount}건</span>
                    </div>
                  </>
                )}
              </Card>
            </div>
          </section>
        </div>

        {/* 명예의 전당 랭킹 */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-text-secondary flex items-center gap-2">
              <span className="w-1.5 h-6 bg-yellow-500 rounded-full"></span>
              {t('dashboard.hallOfFame')}
            </h2>
            <span className="text-xs text-text-faint font-medium">{t('dashboard.top5')}</span>
          </div>

          <Card className="bg-surface-raised border-border-default p-0 overflow-hidden shadow-md">
            <div className="flex border-b border-border-default/60 bg-page/50">
              {(['monthlySolved', 'streak', 'deadlineRate'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveRankingTab(tab)}
                  className={`flex-1 py-4 text-sm font-bold transition-all ${activeRankingTab === tab
                    ? 'text-yellow-500 border-b-2 border-yellow-500 bg-surface-raised'
                    : 'text-text-faint hover:text-text-secondary hover:bg-surface-raised/50'
                    }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {tab === 'monthlySolved' && <Trophy className="w-4 h-4" />}
                    {tab === 'streak' && <Activity className="w-4 h-4" />}
                    {tab === 'deadlineRate' && <CheckCircle2 className="w-4 h-4" />}
                    {tab === 'monthlySolved' ? t('dashboard.rankingMonthSolved') : tab === 'streak' ? t('dashboard.rankingStreak') : t('dashboard.rankingDeadlineRate')}
                  </div>
                </button>
              ))}
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-8 text-text-faint text-sm">불러오는 중...</div>
              ) : (() => {
                const list = activeRankingTab === 'monthlySolved'
                  ? (rankings?.monthlySolved ?? []).map(r => ({ id: r.workspaceMemberId, name: r.nickname, value: `${r.solvedCount} 문제` }))
                  : activeRankingTab === 'streak'
                    ? (rankings?.streak ?? []).map(r => ({ id: r.workspaceMemberId, name: r.nickname, value: `${r.streakDays} 일` }))
                    : (rankings?.deadlineRate ?? []).map(r => ({ id: r.workspaceMemberId, name: r.nickname, value: `${r.ratePercent} %` }));

                if (list.length === 0) {
                  return <div className="flex items-center justify-center py-8 text-text-faint text-sm">데이터가 없습니다.</div>;
                }

                return (
                  <div className="flex flex-col">
                    {list.map((rank, idx) => (
                      <div key={rank.id} className="flex items-center justify-between py-3.5 border-b border-border-default/40 last:border-0 group hover:px-2 rounded-lg hover:bg-hover-bg transition-all duration-200 cursor-default">
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-sm ${idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-600 text-yellow-950 shadow-[0_0_12px_rgba(234,179,8,0.4)]' :
                            idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-900 shadow-[0_0_8px_rgba(148,163,184,0.3)]' :
                              idx === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-amber-50 shadow-[0_0_8px_rgba(180,83,9,0.3)]' :
                                'bg-transparent text-text-faint border border-border-subtle/50'
                            }`}>
                            {idx + 1}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-text-secondary ${idx === 0 ? 'bg-surface-subtle border-2 border-yellow-500/50' : 'bg-surface-subtle'}`}>
                              {rank.name.charAt(0)}
                            </div>
                            <span className={`font-semibold tracking-tight ${idx === 0 ? 'text-text-primary text-base' : 'text-text-secondary text-[15px]'}`}>
                              {rank.name}
                            </span>
                          </div>
                        </div>
                        <span className={`font-black tracking-tight ${idx === 0 && activeRankingTab === 'monthlySolved' ? 'text-yellow-600 dark:text-yellow-400 text-lg' :
                          idx === 0 && activeRankingTab === 'streak' ? 'text-emerald-600 dark:text-emerald-400 text-lg' :
                            idx === 0 && activeRankingTab === 'deadlineRate' ? 'text-blue-600 dark:text-blue-400 text-lg' :
                              'text-text-muted text-sm'
                          }`}>
                          {rank.value}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </Card>
        </section>

      </div>

      {/* 공지 상세 모달 */}
      {selectedNotice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={handleCloseNotice}
        >
          <div
            className="bg-surface-raised border border-border-subtle rounded-xl w-full max-w-2xl shadow-2xl relative animate-in fade-in zoom-in duration-200 flex flex-col max-h-[80vh]"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={handleCloseNotice}
              className="absolute top-4 right-4 text-text-faint hover:text-text-primary transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-6 border-b border-border-default shrink-0">
              <div className="flex items-center gap-1.5 pr-8">
                {selectedNotice.pinned && <Pin className="w-4 h-4 text-indigo-500 shrink-0" />}
                <h3 className="text-xl font-bold text-text-primary leading-tight">{selectedNotice.title}</h3>
              </div>
              <div className="flex items-center gap-2 mt-3 text-sm text-text-muted">
                <span>{formatDate(selectedNotice.createdAt)}</span>
                <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                <span>{t('dashboard.author')} {selectedNotice.authorNickname}</span>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {noticeContentLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-text-faint" />
                </div>
              ) : noticeContent ? (
                <div className="prose dark:prose-invert max-w-none
                  prose-headings:text-text-primary prose-headings:font-bold
                  prose-p:text-[15px] prose-p:text-text-secondary prose-p:leading-[1.8] prose-p:my-3
                  prose-a:text-indigo-500 prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-text-primary
                  prose-code:text-emerald-600 dark:prose-code:text-emerald-300 prose-code:bg-surface-subtle/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[13px] prose-code:before:content-none prose-code:after:content-none
                  prose-pre:bg-page-deep prose-pre:border prose-pre:border-border-subtle/50 prose-pre:rounded-xl
                  prose-blockquote:border-l-indigo-500/40 prose-blockquote:bg-indigo-500/5 prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:text-text-muted prose-blockquote:not-italic
                  prose-ul:my-3 prose-ol:my-3
                  prose-li:text-[15px] prose-li:text-text-secondary prose-li:leading-[1.8]
                  prose-hr:border-border-subtle/50
                  prose-img:rounded-xl">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{noticeContent}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-text-faint text-sm">내용을 불러올 수 없습니다.</p>
              )}
            </div>
            <div className="px-6 pb-4 shrink-0 flex justify-end">
              <button
                onClick={() => { handleCloseNotice(); toWs('community'); }}
                className="text-indigo-500 text-sm hover:underline font-medium"
              >
                커뮤니티에서 보기 →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
