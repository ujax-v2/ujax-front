import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { currentWorkspaceState } from '@/store/atoms';
import { useWorkspaceNavigate } from '@/hooks/useWorkspaceNavigate';
import { Card, Button, Badge } from '@/components/ui/Base';
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
  const { toWs } = useWorkspaceNavigate();

  const [post, setPost] = useState<BoardDetailResponse | null>(null);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [commentPage, setCommentPage] = useState(0);
  const [commentTotalPages, setCommentTotalPages] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [myRole, setMyRole] = useState<MemberRole>('MEMBER');
  const [myMemberId, setMyMemberId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [error, setError] = useState('');

  const numericBoardId = Number(boardId);

  useEffect(() => {
    if (!wsId || !numericBoardId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [detail, membership] = await Promise.all([
          getBoardDetail(wsId, numericBoardId),
          getMyMembership(wsId),
        ]);
        if (cancelled) return;
        setPost(detail);
        if (membership.role) setMyRole(membership.role as MemberRole);
        if (membership.workspaceMemberId) setMyMemberId(membership.workspaceMemberId);
      } catch {
        if (!cancelled) setError('게시물을 불러올 수 없습니다.');
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
      const msg = err?.message || '';
      const jsonMatch = msg.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try { alert(JSON.parse(jsonMatch[0]).detail || '댓글 작성에 실패했습니다.'); }
        catch { alert('댓글 작성에 실패했습니다.'); }
      } else { alert('댓글 작성에 실패했습니다.'); }
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleCommentDelete = async (commentId: number) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    try {
      await deleteComment(wsId, numericBoardId, commentId);
      await loadComments(commentPage);
      setPost(prev => prev ? { ...prev, commentCount: Math.max(0, (prev.commentCount ?? 0) - 1) } : prev);
    } catch { /* ignore */ }
  };

  const handlePostDelete = async () => {
    if (!confirm('게시물을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    try {
      await deleteBoard(wsId, numericBoardId);
      toWs('community');
    } catch (err: any) {
      const msg = err?.message || '';
      const jsonMatch = msg.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try { alert(JSON.parse(jsonMatch[0]).detail || '삭제에 실패했습니다.'); }
        catch { alert('삭제에 실패했습니다.'); }
      } else { alert('삭제에 실패했습니다.'); }
    }
  };

  const handleTogglePin = async () => {
    if (!post || post.type !== 'NOTICE') return;
    try {
      await pinBoard(wsId, numericBoardId, !post.pinned);
      setPost(prev => prev ? { ...prev, pinned: !prev.pinned } : prev);
    } catch (err: any) {
      const msg = err?.message || '';
      const jsonMatch = msg.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try { alert(JSON.parse(jsonMatch[0]).detail || '고정 상태 변경에 실패했습니다.'); }
        catch { alert('고정 상태 변경에 실패했습니다.'); }
      } else { alert('고정 상태 변경에 실패했습니다.'); }
    }
  };

  const isAuthor = myMemberId !== null && post?.author?.workspaceMemberId === myMemberId;
  const canManage = myRole === 'OWNER' || myRole === 'ADMIN';
  const canDelete = isAuthor || canManage;
  const canPin = myRole === 'OWNER' && post?.type === 'NOTICE';

  const getTagBadge = (type: string) => {
    const label = BOARD_TYPE_LABEL[type as keyof typeof BOARD_TYPE_LABEL] || type;
    switch (type) {
      case 'NOTICE': return <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20">{label}</Badge>;
      case 'FREE': return <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10">{label}</Badge>;
      case 'QNA': return <Badge variant="outline" className="border-orange-500/30 text-orange-400 bg-orange-500/10">{label}</Badge>;
      case 'DATA': return <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">{label}</Badge>;
      default: return <Badge variant="outline">{label}</Badge>;
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0F1117] h-full">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex-1 p-8 bg-[#0F1117] h-full">
        <div className="max-w-4xl mx-auto text-center py-20">
          <p className="text-slate-400 text-lg mb-4">{error || '게시물을 찾을 수 없습니다.'}</p>
          <Button variant="outline" onClick={() => toWs('community')} className="border-slate-700 text-slate-300">
            <ArrowLeft className="w-4 h-4 mr-2" /> 목록으로
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#0F1117] h-full">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Back */}
        <button
          onClick={() => toWs('community')}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> 목록으로
        </button>

        {/* ─── 게시물 본문 카드 ─── */}
        <Card className="bg-[#141820] border-slate-800 shadow-sm overflow-hidden">

          {/* Header 영역 */}
          <div className="px-7 pt-6 pb-5 space-y-3">
            {/* 태그 + 고정 뱃지 + 관리 버튼 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {getTagBadge(post.type ?? 'FREE')}
                {post.pinned && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-yellow-500/10 text-yellow-400 text-xs font-semibold border border-yellow-500/20">
                    <Pin className="w-3 h-3" /> 고정
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
                      {post.pinned ? <><PinOff className="w-3.5 h-3.5" /> 고정 해제</> : <><Pin className="w-3.5 h-3.5" /> 상단 고정</>}
                    </button>
                  )}
                  {isAuthor && (
                    <button
                      onClick={() => toWs(`community/${numericBoardId}/edit`)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> 수정
                    </button>
                  )}
                  <button
                    onClick={handlePostDelete}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> 삭제
                  </button>
                </div>
              )}
            </div>

            {/* 제목 */}
            <h1 className="text-[1.6rem] font-extrabold text-white leading-snug tracking-tight">
              {post.title}
            </h1>

            {/* 메타 정보 */}
            <div className="flex items-center gap-4 text-[13px] text-slate-500">
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <User className="w-3.5 h-3.5 text-slate-500" /> {post.author?.nickname}
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
          <div className="border-t border-slate-800" />

          {/* 본문 마크다운 */}
          <div className="px-7 pt-4 pb-6">
            <div className="prose prose-invert max-w-none
              prose-headings:text-slate-100 prose-headings:font-bold prose-headings:tracking-tight
              prose-h1:text-2xl prose-h1:mt-8 prose-h1:mb-4
              prose-h2:text-xl prose-h2:mt-7 prose-h2:mb-3
              prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2
              prose-p:text-[15px] prose-p:text-slate-300 prose-p:leading-[1.8] prose-p:my-3
              prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-slate-100 prose-strong:font-bold
              prose-em:text-slate-300
              prose-code:text-emerald-300 prose-code:bg-slate-800/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[13px] prose-code:font-normal prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-[#0D1017] prose-pre:border prose-pre:border-slate-700/50 prose-pre:rounded-xl prose-pre:my-4
              prose-blockquote:border-l-emerald-500/40 prose-blockquote:bg-emerald-500/5 prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:text-slate-400 prose-blockquote:not-italic
              prose-ul:my-3 prose-ol:my-3
              prose-li:text-[15px] prose-li:text-slate-300 prose-li:leading-[1.8] prose-li:my-0.5
              prose-hr:border-slate-700/50 prose-hr:my-6
              prose-img:rounded-xl prose-img:border prose-img:border-slate-800
              prose-table:text-sm
              prose-th:text-slate-300 prose-th:bg-slate-800/50 prose-th:px-3 prose-th:py-2
              prose-td:text-slate-400 prose-td:px-3 prose-td:py-2 prose-td:border-slate-700/50
            ">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content ?? ''}</ReactMarkdown>
            </div>
          </div>

          {/* 추천 바 — 본문 카드 하단에 자연스럽게 */}
          <div className="border-t border-slate-800 px-7 py-4 flex items-center justify-between">
            <button
              onClick={handleLikeToggle}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                post.myLike
                  ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <ThumbsUp className={`w-[18px] h-[18px] ${post.myLike ? 'fill-emerald-400' : ''}`} />
              추천 {(post.likeCount ?? 0) > 0 && <span className="tabular-nums">{post.likeCount}</span>}
            </button>
            <span className="text-xs text-slate-600">
              {post.updatedAt !== post.createdAt && `수정됨 ${formatDate(post.updatedAt ?? '')}`}
            </span>
          </div>
        </Card>

        {/* ─── 댓글 섹션 ─── */}
        <Card className="bg-[#141820] border-slate-800 shadow-sm overflow-hidden">
          <div className="px-7 py-5">
            <h3 className="text-[15px] font-bold text-white flex items-center gap-2 mb-5">
              <MessageCircle className="w-[18px] h-[18px] text-emerald-500" />
              댓글 <span className="text-emerald-500 tabular-nums">{post.commentCount}</span>
            </h3>

            {/* 댓글 입력 */}
            <div className="flex gap-2.5 mb-5">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCommentSubmit(); } }}
                placeholder="댓글을 입력하세요..."
                maxLength={255}
                className="flex-1 bg-slate-900/80 border border-slate-700/50 rounded-lg py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-slate-600"
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
            <div className="divide-y divide-slate-800/40">
              {comments.length === 0 ? (
                <p className="text-slate-600 text-sm py-8 text-center">아직 댓글이 없습니다. 첫 댓글을 남겨보세요!</p>
              ) : (
                comments.map(c => {
                  const isCommentAuthor = myMemberId !== null && c.author?.workspaceMemberId === myMemberId;
                  const canDeleteComment = isCommentAuthor || canManage;
                  return (
                    <div key={c.boardCommentId} className="py-3.5 group first:pt-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 mb-1.5">
                            <span className="text-[13px] font-bold text-slate-200">{c.author?.nickname}</span>
                            <span className="text-[11px] text-slate-600 tabular-nums">{formatDate(c.createdAt ?? '')}</span>
                          </div>
                          <p className="text-[14px] text-slate-300 leading-relaxed whitespace-pre-wrap break-words">{c.content}</p>
                        </div>
                        {canDeleteComment && (
                          <button
                            onClick={() => handleCommentDelete(c.boardCommentId!)}

                            className="p-1.5 text-slate-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                            title="삭제"
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
            {commentTotalPages > 1 && (
              <div className="flex justify-center gap-1.5 pt-4 mt-2 border-t border-slate-800/40">
                {Array.from({ length: commentTotalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => loadComments(i)}
                    className={`w-7 h-7 rounded-md text-xs font-bold transition-colors ${
                      commentPage === i
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'text-slate-600 hover:bg-slate-800 hover:text-slate-400'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
