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
  BOARD_TYPE_LABEL,
} from '@/api/board';
import type { BoardDetail as BoardDetailType, CommentItem, MemberRole } from '@/api/board';
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
} from 'lucide-react';

export const PostDetail = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const wsId = useRecoilValue(currentWorkspaceState);
  const { toWs } = useWorkspaceNavigate();

  const [post, setPost] = useState<BoardDetailType | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentPage, setCommentPage] = useState(0);
  const [commentTotalPages, setCommentTotalPages] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [myRole, setMyRole] = useState<MemberRole>('MEMBER');
  const [myMemberId, setMyMemberId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [error, setError] = useState('');

  const numericBoardId = Number(boardId);

  // 게시물 상세 + 내 멤버 정보 로드
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
      } catch (err: any) {
        if (!cancelled) setError('게시물을 불러올 수 없습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [wsId, numericBoardId]);

  // 댓글 로드
  const loadComments = useCallback(async (page = 0) => {
    if (!wsId || !numericBoardId) return;
    try {
      const res = await getComments(wsId, numericBoardId, { page, size: 20 });
      setComments(res.items);
      setCommentPage(res.page.page ?? 0);
      setCommentTotalPages(res.page.totalPages ?? 0);
    } catch { /* ignore */ }
  }, [wsId, numericBoardId]);

  useEffect(() => {
    loadComments(0);
  }, [loadComments]);

  // 좋아요 토글
  const handleLikeToggle = async () => {
    if (!post) return;
    try {
      if (post.myLike) {
        await unlikeBoard(wsId, numericBoardId);
        setPost(prev => prev ? { ...prev, myLike: false, likeCount: prev.likeCount - 1 } : prev);
      } else {
        await likeBoard(wsId, numericBoardId);
        setPost(prev => prev ? { ...prev, myLike: true, likeCount: prev.likeCount + 1 } : prev);
      }
    } catch { /* ignore */ }
  };

  // 댓글 작성
  const handleCommentSubmit = async () => {
    if (!newComment.trim() || commentSubmitting) return;
    setCommentSubmitting(true);
    try {
      await createComment(wsId, numericBoardId, newComment.trim());
      setNewComment('');
      await loadComments(0);
      setPost(prev => prev ? { ...prev, commentCount: prev.commentCount + 1 } : prev);
    } catch (err: any) {
      const msg = err?.message || '';
      const jsonMatch = msg.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          alert(parsed.detail || '댓글 작성에 실패했습니다.');
        } catch { alert('댓글 작성에 실패했습니다.'); }
      } else { alert('댓글 작성에 실패했습니다.'); }
    } finally {
      setCommentSubmitting(false);
    }
  };

  // 댓글 삭제
  const handleCommentDelete = async (commentId: number) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    try {
      await deleteComment(wsId, numericBoardId, commentId);
      await loadComments(commentPage);
      setPost(prev => prev ? { ...prev, commentCount: Math.max(0, prev.commentCount - 1) } : prev);
    } catch { /* ignore */ }
  };

  // 게시물 삭제
  const handlePostDelete = async () => {
    if (!confirm('게시물을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    try {
      await deleteBoard(wsId, numericBoardId);
      toWs('community');
    } catch (err: any) {
      const msg = err?.message || '';
      const jsonMatch = msg.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          alert(parsed.detail || '삭제에 실패했습니다.');
        } catch { alert('삭제에 실패했습니다.'); }
      } else { alert('삭제에 실패했습니다.'); }
    }
  };

  const isAuthor = myMemberId !== null && post?.author.workspaceMemberId === myMemberId;
  const canManage = myRole === 'OWNER' || myRole === 'ADMIN';
  const canDelete = isAuthor || canManage;

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
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Back Button */}
        <button
          onClick={() => toWs('community')}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> 목록으로
        </button>

        {/* Post Header */}
        <Card className="bg-[#141820] border-slate-800 p-6 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {getTagBadge(post.type)}
              {post.pinned && (
                <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 bg-yellow-500/10 text-xs">고정</Badge>
              )}
            </div>

            <h1 className="text-2xl font-extrabold text-white leading-tight">{post.title}</h1>

            <div className="flex items-center justify-between border-t border-slate-800 pt-4">
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> {post.author.nickname}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> {formatDate(post.createdAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> {post.viewCount}
                </span>
              </div>

              {/* 관리 버튼: 작성자 or ADMIN/OWNER */}
              {canDelete && (
                <div className="flex gap-2">
                  {isAuthor && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-slate-400 hover:text-slate-200 gap-1.5"
                      onClick={() => toWs(`community/${numericBoardId}/edit`)}
                    >
                      <Edit3 className="w-3.5 h-3.5" /> 수정
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1.5"
                    onClick={handlePostDelete}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> 삭제
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Post Content — Markdown */}
        <Card className="bg-[#141820] border-slate-800 p-8 shadow-sm">
          <div className="prose prose-invert prose-sm max-w-none
            prose-headings:text-slate-100 prose-headings:font-bold
            prose-p:text-slate-300 prose-p:leading-relaxed
            prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-slate-100
            prose-code:text-emerald-300 prose-code:bg-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-[#0F1117] prose-pre:border prose-pre:border-slate-800 prose-pre:rounded-lg
            prose-blockquote:border-emerald-500/50 prose-blockquote:text-slate-400
            prose-li:text-slate-300
            prose-hr:border-slate-700
            prose-img:rounded-lg
            prose-th:text-slate-300 prose-td:text-slate-400
          ">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
          </div>
        </Card>

        {/* Like Button */}
        <div className="flex justify-center">
          <button
            onClick={handleLikeToggle}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all border ${
              post.myLike
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <ThumbsUp className={`w-5 h-5 ${post.myLike ? 'fill-emerald-400' : ''}`} />
            추천 {post.likeCount}
          </button>
        </div>

        {/* Comments Section */}
        <Card className="bg-[#141820] border-slate-800 p-6 shadow-sm space-y-5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-emerald-500" />
            댓글 {post.commentCount}
          </h3>

          {/* Comment Input */}
          <div className="flex gap-3">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCommentSubmit(); } }}
              placeholder="댓글을 입력하세요... (최대 255자)"
              maxLength={255}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-500"
            />
            <Button
              onClick={handleCommentSubmit}
              disabled={!newComment.trim() || commentSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {commentSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>

          {/* Comment List */}
          <div className="space-y-1 divide-y divide-slate-800/50">
            {comments.length === 0 ? (
              <p className="text-slate-600 text-sm py-6 text-center">아직 댓글이 없습니다. 첫 댓글을 남겨보세요!</p>
            ) : (
              comments.map(c => {
                const isCommentAuthor = myMemberId !== null && c.author.workspaceMemberId === myMemberId;
                const canDeleteComment = isCommentAuthor || canManage;
                return (
                  <div key={c.boardCommentId} className="py-3 group">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-sm font-bold text-slate-200">{c.author.nickname}</span>
                          <span className="text-xs text-slate-600">{formatDate(c.createdAt)}</span>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap break-words">{c.content}</p>
                      </div>
                      {canDeleteComment && (
                        <button
                          onClick={() => handleCommentDelete(c.boardCommentId)}
                          className="p-1.5 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                          title="댓글 삭제"
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

          {/* Comment Pagination */}
          {commentTotalPages > 1 && (
            <div className="flex justify-center gap-2 pt-2">
              {Array.from({ length: commentTotalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => loadComments(i)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                    commentPage === i
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                      : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
