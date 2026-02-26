import React, { useState, useEffect, useCallback } from 'react';
import { useWorkspaceNavigate } from '@/hooks/useWorkspaceNavigate';
import { useRecoilValue } from 'recoil';
import { currentWorkspaceState } from '@/store/atoms';
import { Button, Badge } from '@/components/ui/Base';
import {
  getBoards,
  BOARD_TYPE_LABEL,
  LABEL_TO_BOARD_TYPE,
} from '@/api/board';
import type { BoardListItemResponse, BoardType } from '@/api/board';
import {
  PenSquare,
  MessageCircle,
  Eye,
  Filter,
  Check,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';

type TagLabel = '전체' | '자유' | '질문' | '자료';

export const Community = () => {
  const { toWs } = useWorkspaceNavigate();
  const wsId = useRecoilValue(currentWorkspaceState);

  const [posts, setPosts] = useState<BoardListItemResponse[]>([]);
  const [selectedTag, setSelectedTag] = useState<TagLabel>('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

  const filterTags: TagLabel[] = ['전체', '자유', '질문', '자료'];

  const fetchPosts = useCallback(async (p: number, tag: TagLabel, keyword: string) => {
    if (!wsId) return;
    setLoading(true);
    try {
      const typeParam: BoardType | undefined = tag !== '전체' ? LABEL_TO_BOARD_TYPE[tag] : undefined;
      const res = await getBoards(wsId, {
        type: typeParam,
        keyword: keyword || undefined,
        page: p,
        size: 20,
        sort: 'createdAt,DESC',
        pinnedFirst: true,
      });
      setPosts(res.items ?? []);
      setTotalPages(res.page?.totalPages ?? 0);
      setTotalElements(res.page?.totalElements ?? 0);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [wsId]);

  useEffect(() => {
    fetchPosts(page, selectedTag, searchQuery);
  }, [page, selectedTag, searchQuery, fetchPosts]);

  const handleTagChange = (tag: TagLabel) => {
    setSelectedTag(tag);
    setPage(0);
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setPage(0);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const getTagBadge = (type: BoardType | undefined, pinned: boolean | undefined) => {
    if (!type) return null;
    const label = BOARD_TYPE_LABEL[type];
    if (type === 'NOTICE') return <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20 w-12 justify-center">{label}</Badge>;
    if (type === 'FREE') return <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10 w-12 justify-center">{label}</Badge>;
    if (type === 'QNA') return <Badge variant="outline" className="border-orange-500/30 text-orange-400 bg-orange-500/10 w-12 justify-center">{label}</Badge>;
    if (type === 'DATA') return <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 w-12 justify-center">{label}</Badge>;
    return null;
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-page h-full">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-border-default pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-text-primary tracking-tight mb-2">커뮤니티</h1>
            <p className="text-text-muted text-sm">팀원들과 자유롭게 이야기를 나누고 지식을 공유하세요.</p>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2 font-bold px-5" onClick={() => toWs('community/new')}>
            <PenSquare className="w-4 h-4" /> 새 게시물 작성
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-2">
          {/* Tags */}
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-text-faint" />
            <span className="text-sm font-medium text-text-muted mr-2">태그 필터:</span>
            {filterTags.map(tag => (
              <button
                key={tag}
                onClick={() => handleTagChange(tag)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${selectedTag === tag
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-sm'
                  : 'bg-surface-subtle/50 text-text-muted border-transparent hover:bg-border-subtle hover:text-text-secondary'
                }`}
              >
                {selectedTag === tag && <Check className="w-3 h-3" />}
                {tag}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />
            <input
              type="text"
              placeholder="게시물 검색..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full bg-input-bg border border-border-subtle rounded-lg py-1.5 pl-9 pr-4 text-sm text-text-secondary focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-text-faint"
            />
          </div>
        </div>

        {/* Board Table */}
        <div className="bg-surface border border-border-default rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-default bg-surface-raised text-text-muted text-xs uppercase tracking-wider">
                <th className="p-4 font-bold w-20 text-center">분류</th>
                <th className="p-4 font-bold">제목</th>
                <th className="p-4 font-bold w-32">작성자</th>
                <th className="p-4 font-bold w-32 text-center">작성일</th>
                <th className="p-4 font-bold w-20 text-center">조회</th>
                <th className="p-4 font-bold w-20 text-center">추천</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <Loader2 className="w-6 h-6 mx-auto text-emerald-500 animate-spin" />
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-text-faint">
                    <MessageCircle className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    게시글이 없습니다.
                  </td>
                </tr>
              ) : (
                posts.map(post => {
                  const isNotice = post.type === 'NOTICE';
                  return (
                    <tr
                      key={post.boardId}
                      onClick={() => toWs(`community/${post.boardId}`)}
                      className={`cursor-pointer group transition-colors ${
                        isNotice
                          ? 'bg-red-500/5 hover:bg-red-500/10'
                          : 'hover:bg-hover-bg'
                      }`}
                    >
                      <td className="p-4 text-center">{getTagBadge(post.type, post.pinned)}</td>
                      <td className={`p-4 font-medium transition-colors ${
                        isNotice
                          ? 'text-text-primary group-hover:text-red-600 dark:group-hover:text-red-400'
                          : 'text-text-secondary group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
                      }`}>
                        {post.title}
                        {(post.commentCount ?? 0) > 0 && (
                          <span className={`ml-2 text-xs font-mono ${isNotice ? 'text-red-500/70' : 'text-emerald-500/70'}`}>
                            [{post.commentCount}]
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-text-muted">{post.author?.nickname}</td>
                      <td className="p-4 text-center text-text-faint font-mono text-xs">{formatDate(post.createdAt ?? '')}</td>
                      <td className="p-4 text-center text-text-faint font-mono">{post.viewCount}</td>
                      <td className="p-4 text-center text-emerald-500 font-bold font-mono">{post.likeCount}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-faint">총 {totalElements}개 게시물</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-2 text-text-muted hover:text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                    page === i
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                      : 'text-text-faint hover:bg-surface-subtle hover:text-text-secondary'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 text-text-muted hover:text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
