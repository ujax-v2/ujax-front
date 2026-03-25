import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { currentWorkspaceState } from '@/store/atoms';
import { useWorkspaceNavigate } from '@/hooks/useWorkspaceNavigate';
import { Card, Button, Badge } from '@/components/ui/Base';
import { parseApiError } from '@/utils/error';
import { PageNav } from '@/components/ui/PageNav';
import {
  getBoardDetail,
  likeBoard,
  unlikeBoard,
  getComments,
  createComment,
  deleteComment,
  deleteBoard,
  pinBoard,
  BOARD_TYPE_LABEL,
} from '@/api/board';
import { useT } from '@/i18n';
import type { BoardDetailResponse, CommentResponse, MemberRole } from '@/api/board';
import { getMyMembership } from '@/api/workspace';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowLeft,
  ThumbsUp,
  Eye,
  MessageCircle,
  Send,
  Trash2,
  Edit3,
  Loader2,
  Clock,
  User,
  Pin,
  PinOff,
} from 'lucide-react';

export const PostDetail = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const wsId = useRecoilValue(currentWorkspaceState);
  const { toWs, navigate } = useWorkspaceNavigate();
  const t = useT();

  const location = useLocation();
  const passedPost = (location.state as { post?: BoardDetailResponse } | null)?.post;

  const [post, setPost] = useState<BoardDetailResponse | null>(passedPost ?? null);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [commentPage, setCommentPage] = useState(0);
  const [commentTotalPages, setCommentTotalPages] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [myRole, setMyRole] = useState<MemberRole>('MEMBER');
  const [myMemberId, setMyMemberId] = useState<number | null>(null);
  const [loading, setLoading] = useState(!passedPost);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [error, setError] = useState('');

  const numericBoardId = Number(boardId);

  useEffect(() => {
    if (!wsId || !numericBoardId) return;
    let cancelled = false;
    (async () => {
      if (!passedPost) setLoading(true);
      try {
        // state로 게시글 데이터가 전달된 경우 getBoardDetail 생략 (조회수 증가 방지)
        const [detail, membership] = passedPost
          ? [passedPost, await getMyMembership(wsId)]
          : await Promise.all([getBoardDetail(wsId, numericBoardId), getMyMembership(wsId)]);
        if (cancelled) return;
        setPost(detail);
        if (membership.role) setMyRole(membership.role as MemberRole);
        if (membership.workspaceMemberId) setMyMemberId(membership.workspaceMemberId);
      } catch {
        if (!cancelled) setError(t('post.detail.loadFailed'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [wsId, numericBoardId]);

  const loadComments = useCallback(async (page = 0) => {
    if (!wsId || !numericBoardId) return;
    try {
      const res = await getComments(wsId, numericBoardId, { page, size: 20 });
      setComments(res.items ?? []);
      setCommentPage(res.page?.page ?? 0);
      setCommentTotalPages(res.page?.totalPages ?? 0);
    } catch { /* ignore */ }
  }, [wsId, numericBoardId]);

  useEffect(() => { loadComments(0); }, [loadComments]);

  const handleLikeToggle = async () => {
    if (!post) return;
    try {
      if (post.myLike) {
        await unlikeBoard(wsId, numericBoardId);
        setPost(prev => prev ? { ...prev, myLike: false, likeCount: (prev.likeCount ?? 0) - 1 } : prev);
      } else {
        await likeBoard(wsId, numericBoardId);
        setPost(prev => prev ? { ...prev, myLike: true, likeCount: (prev.likeCount ?? 0) + 1 } : prev);
      }
    } catch { /* ignore */ }
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim() || commentSubmitting) return;
    setCommentSubmitting(true);
    try {
      await createComment(wsId, numericBoardId, newComment.trim());
      setNewComment('');
      await loadComments(0);
      setPost(prev => prev ? { ...prev, commentCount: (prev.commentCount ?? 0) + 1 } : prev);
    } catch (err: any) {
      alert(parseApiError(err, t('common.error')));
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleCommentDelete = async (commentId: number) => {
    if (!confirm(t('post.detail.confirmDeleteComment'))) return;
    try {
      await deleteComment(wsId, numericBoardId, commentId);
      await loadComments(commentPage);
      setPost(prev => prev ? { ...prev, commentCount: Math.max(0, (prev.commentCount ?? 0) - 1) } : prev);
    } catch { /* ignore */ }
  };

  const handlePostDelete = async () => {
    if (!confirm(t('post.detail.confirmDeletePost'))) return;
    try {
      await deleteBoard(wsId, numericBoardId);
      toWs('community');
    } catch (err: any) {
      alert(parseApiError(err, t('common.error')));
    }
  };

  const handleTogglePin = async () => {
    if (!post || post.type !== 'NOTICE') return;
    try {
      await pinBoard(wsId, numericBoardId, !post.pinned);
      setPost(prev => prev ? { ...prev, pinned: !prev.pinned } : prev);
    } catch (err: any) {
      alert(parseApiError(err, t('common.error')));
    }
  };

  const isAuthor = myMemberId !== null && post?.author?.workspaceMemberId === myMemberId;
  const canManage = myRole === 'OWNER' || myRole === 'ADMIN';
  const isNotice = post?.type === 'NOTICE';
  const canEdit = isNotice ? myRole === 'OWNER' : isAuthor;
  const canDelete = isNotice ? myRole === 'OWNER' : (isAuthor || canManage);
  const canPin = myRole === 'OWNER' && post?.type === 'NOTICE';

  const getTagBadge = (type: string) => {
    const labelKey = BOARD_TYPE_LABEL[type as keyof typeof BOARD_TYPE_LABEL] || type;
    const label = t(labelKey);
    switch (type) {
      case 'NOTICE': return <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20">{label}</Badge>;
      case 'FREE': return <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10">{label}</Badge>;
      case 'QNA': return <Badge variant="outline" className="border-orange-500/30 text-orange-400 bg-orange-500/10">{label}</Badge>;
      case 'DATA': return <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">{label}</Badge>;
      default: return <Badge variant="outline">{label}</Badge>;
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso.endsWith('Z') ? iso : iso + 'Z');
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-page h-full">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex-1 p-8 bg-page h-full">
        <div className="max-w-4xl mx-auto text-center py-20">
          <p className="text-text-muted text-lg mb-4">{error || t('post.detail.notFound')}</p>
          <Button variant="outline" onClick={() => toWs('community')} className="border-border-subtle text-text-secondary">
            <ArrowLeft className="w-4 h-4 mr-2" /> {t('post.detail.backToList')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-page h-full">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Back */}
        <button
          onClick={() => toWs('community')}
          className="flex items-center gap-2 text-text-muted hover:text-text-secondary transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> {t('post.detail.backToList')}
        </button>

        {/* ─── 게시물 본문 카드 ─── */}
        <Card className="bg-surface border-border-default shadow-sm overflow-hidden">

          {/* Header 영역 */}
          <div className="px-7 pt-6 pb-5 space-y-3">
            {/* 태그 + 고정 뱃지 + 관리 버튼 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {getTagBadge(post.type ?? 'FREE')}
                {post.pinned && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-yellow-500/10 text-yellow-400 text-xs font-semibold border border-yellow-500/20">
                    <Pin className="w-3 h-3" /> {t('post.detail.pin')}
                  </span>
                )}
              </div>
              {(canDelete || canPin) && (
                <div className="flex items-center gap-1">
                  {canPin && (
                    <button
                      onClick={handleTogglePin}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-yellow-400 hover:bg-yellow-500/10 transition-colors"
                    >
                      {post.pinned ? <><PinOff className="w-3.5 h-3.5" /> {t('post.detail.unpin')}</> : <><Pin className="w-3.5 h-3.5" /> {t('post.detail.pinnedPost')}</>}
                    </button>
                  )}
                  {canEdit && (
                    <button
                      onClick={() => navigate(`/ws/${wsId}/community/${numericBoardId}/edit`, { state: { post } })}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:text-text-secondary hover:bg-surface-subtle transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> {t('post.detail.edit')}
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={handlePostDelete}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> {t('post.detail.delete')}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 제목 */}
            <h1 className="text-[1.6rem] font-extrabold text-text-primary leading-snug tracking-tight">
              {post.title}
            </h1>

            {/* 메타 정보 */}
            <div className="flex items-center gap-4 text-[13px] text-text-faint">
              <span className="flex items-center gap-1.5 font-medium text-text-secondary">
                <User className="w-3.5 h-3.5 text-text-faint" /> {post.author?.nickname}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> {formatDate(post.createdAt ?? '')}
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" /> {post.viewCount}
              </span>
              <span className="flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5" /> {post.commentCount}
              </span>
            </div>
          </div>

          {/* 구분선 */}
          <div className="border-t border-border-default" />

          {/* 본문 마크다운 */}
          <div className="px-7 pt-4 pb-6">
            <div className="prose dark:prose-invert max-w-none
              prose-headings:text-text-primary prose-headings:font-bold prose-headings:tracking-tight
              prose-h1:text-2xl prose-h1:mt-8 prose-h1:mb-4
              prose-h2:text-xl prose-h2:mt-7 prose-h2:mb-3
              prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2
              prose-p:text-[15px] prose-p:text-text-secondary prose-p:leading-[1.8] prose-p:my-3
              prose-a:text-emerald-600 dark:prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-text-primary prose-strong:font-bold
              prose-em:text-text-secondary
              prose-code:text-emerald-600 dark:prose-code:text-emerald-300 prose-code:bg-surface-subtle/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[13px] prose-code:font-normal prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-page-deep prose-pre:border prose-pre:border-border-subtle/50 prose-pre:rounded-xl prose-pre:my-4
              prose-blockquote:border-l-emerald-500/40 prose-blockquote:bg-emerald-500/5 prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:text-text-muted prose-blockquote:not-italic
              prose-ul:my-3 prose-ol:my-3
              prose-li:text-[15px] prose-li:text-text-secondary prose-li:leading-[1.8] prose-li:my-0.5
              prose-hr:border-border-subtle/50 prose-hr:my-6
              prose-img:rounded-xl prose-img:border prose-img:border-border-default
              prose-table:text-sm
              prose-th:text-text-secondary prose-th:bg-surface-subtle/50 prose-th:px-3 prose-th:py-2
              prose-td:text-text-muted prose-td:px-3 prose-td:py-2 prose-td:border-border-subtle/50
            ">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content ?? ''}</ReactMarkdown>
            </div>
          </div>

          {/* 추천 바 — 본문 카드 하단에 자연스럽게 */}
          <div className="border-t border-border-default px-7 py-4 flex items-center justify-between">
            <button
              onClick={handleLikeToggle}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                post.myLike
                  ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                  : 'text-text-muted hover:bg-surface-subtle hover:text-text-secondary'
              }`}
            >
              <ThumbsUp className={`w-[18px] h-[18px] ${post.myLike ? 'fill-emerald-400' : ''}`} />
              {t('post.detail.recommend')} {(post.likeCount ?? 0) > 0 && <span className="tabular-nums">{post.likeCount}</span>}
            </button>
            <span className="text-xs text-text-faint">
              {post.updatedAt !== post.createdAt && `수정됨 ${formatDate(post.updatedAt ?? '')}`}
            </span>
          </div>
        </Card>

        {/* ─── 댓글 섹션 ─── */}
        <Card className="bg-surface border-border-default shadow-sm overflow-hidden">
          <div className="px-7 py-5">
            <h3 className="text-[15px] font-bold text-text-primary flex items-center gap-2 mb-5">
              <MessageCircle className="w-[18px] h-[18px] text-emerald-500" />
              {t('post.detail.comments')} <span className="text-emerald-500 tabular-nums">{post.commentCount}</span>
            </h3>

            {/* 댓글 입력 */}
            <div className="flex gap-2.5 mb-5">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCommentSubmit(); } }}
                placeholder={t('post.detail.commentPlaceholder')}
                maxLength={255}
                className="flex-1 bg-input-bg/80 border border-border-subtle/50 rounded-lg py-2.5 px-4 text-sm text-text-secondary focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-text-faint"
              />
              <Button
                onClick={handleCommentSubmit}
                disabled={!newComment.trim() || commentSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 px-4 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {commentSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>

            {/* 댓글 목록 */}
            <div className="divide-y divide-border-default">
              {comments.length === 0 ? (
                <p className="text-text-faint text-sm py-8 text-center">{t('post.detail.noComments')}</p>
              ) : (
                comments.map(c => {
                  const isCommentAuthor = myMemberId !== null && c.author?.workspaceMemberId === myMemberId;
                  const canDeleteComment = isCommentAuthor || canManage;
                  return (
                    <div key={c.boardCommentId} className="py-3.5 group first:pt-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 mb-1.5">
                            <span className="text-[13px] font-bold text-text-secondary">{c.author?.nickname}</span>
                            <span className="text-[11px] text-text-faint tabular-nums">{formatDate(c.createdAt ?? '')}</span>
                          </div>
                          <p className="text-[14px] text-text-secondary leading-relaxed whitespace-pre-wrap break-words">{c.content}</p>
                        </div>
                        {canDeleteComment && (
                          <button
                            onClick={() => handleCommentDelete(c.boardCommentId!)}

                            className="p-1.5 text-text-faint hover:text-red-600 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                            title={t('common.delete')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* 댓글 페이지네이션 */}
            <div className="flex justify-center pt-4 mt-2 border-t border-border-default/40">
              <PageNav page={commentPage} totalPages={commentTotalPages} onPageChange={loadComments} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
