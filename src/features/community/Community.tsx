import React, { useState } from 'react';
import { useWorkspaceNavigate } from '@/hooks/useWorkspaceNavigate';
import { Button, Badge } from '@/components/ui/Base';
import {
  PenSquare,
  MessageCircle,
  Megaphone,
  Eye,
  Filter,
  Check,
  Search
} from 'lucide-react';

type TagType = '전체' | '공지' | '자유' | '질문' | '꿀팁';

interface Post {
  id: number;
  title: string;
  author: string;
  date: string;
  likes: number;
  comments: number;
  views: number;
  tag: TagType;
  isNotice: boolean;
}

const MOCK_POSTS: Post[] = [
  { id: 6, title: "시스템 점검 안내 (02/10 02:00 ~ 04:00)", author: "관리자", date: "2024.02.08", likes: 10, comments: 0, views: 1250, tag: "공지", isNotice: true },
  { id: 5, title: "새로운 챌린지 시즌 5가 시작됩니다!", author: "관리자", date: "2024.02.05", likes: 45, comments: 12, views: 3400, tag: "공지", isNotice: true },
  { id: 4, title: "이번 주 챌린지 같이 하실 분?", author: "CodeWarrior", date: "2024.02.10", likes: 5, comments: 2, views: 42, tag: "자유", isNotice: false },
  { id: 3, title: "BFS랑 DFS 중에 뭐가 더 어렵나요?", author: "Newbie", date: "2024.02.09", likes: 12, comments: 8, views: 150, tag: "질문", isNotice: false },
  { id: 2, title: "취업 준비하면서 알고리즘 공부 팁 공유합니다", author: "DevMaster", date: "2024.02.08", likes: 45, comments: 15, views: 500, tag: "꿀팁", isNotice: false },
  { id: 1, title: "파이썬 시간초과 해결 방법 좀...", author: "PyLover", date: "2024.02.08", likes: 2, comments: 4, views: 30, tag: "질문", isNotice: false },
];

export const Community = () => {
  const { toWs } = useWorkspaceNavigate();
  const [selectedTag, setSelectedTag] = useState<TagType>('전체');
  const [searchQuery, setSearchQuery] = useState('');

  // Tag Filter Options
  const filterTags: TagType[] = ['전체', '자유', '질문', '꿀팁'];

  // Filtering Logic
  let notices = MOCK_POSTS.filter(p => p.isNotice);
  let normalPosts = MOCK_POSTS.filter(p => !p.isNotice);

  if (selectedTag !== '전체') {
    normalPosts = normalPosts.filter(p => p.tag === selectedTag);
  }

  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase();
    notices = notices.filter(p => p.title.toLowerCase().includes(q));
    normalPosts = normalPosts.filter(p => p.title.toLowerCase().includes(q));
  }

  const getTagBadge = (tag: TagType, isNotice: boolean) => {
    if (isNotice) return <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20 w-12 justify-center">공지</Badge>;
    if (tag === '자유') return <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10 w-12 justify-center">자유</Badge>;
    if (tag === '질문') return <Badge variant="outline" className="border-orange-500/30 text-orange-400 bg-orange-500/10 w-12 justify-center">질문</Badge>;
    if (tag === '꿀팁') return <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 w-12 justify-center">꿀팁</Badge>;
    return null;
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#0F1117] h-full">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">커뮤니티</h1>
            <p className="text-slate-400 text-sm">팀원들과 자유롭게 이야기를 나누고 지식을 공유하세요.</p>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2 font-bold px-5" onClick={() => toWs('community/new')}>
            <PenSquare className="w-4 h-4" /> 새 게시물 작성
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-2">
          {/* Tags */}
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-400 mr-2">태그 필터:</span>
            {filterTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${selectedTag === tag
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-sm'
                  : 'bg-slate-800/50 text-slate-400 border-transparent hover:bg-slate-700 hover:text-slate-200'
                  }`}
              >
                {selectedTag === tag && <Check className="w-3 h-3" />}
                {tag}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="게시물 제목 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg py-1.5 pl-9 pr-4 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Board Table */}
        <div className="bg-[#141820] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#151922] text-slate-400 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold w-20 text-center">분류</th>
                <th className="p-4 font-bold">제목</th>
                <th className="p-4 font-bold w-32">작성자</th>
                <th className="p-4 font-bold w-32 text-center">작성일</th>
                <th className="p-4 font-bold w-20 text-center">조회</th>
                <th className="p-4 font-bold w-20 text-center">추천</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-sm">
              {/* 공지사항 (항상 상단 픽스) */}
              {notices.map(post => (
                <tr key={`notice-${post.id}`} className="bg-red-500/5 hover:bg-red-500/10 transition-colors cursor-pointer group">
                  <td className="p-4 text-center">{getTagBadge(post.tag, post.isNotice)}</td>
                  <td className="p-4 text-slate-100 font-medium group-hover:text-red-400 transition-colors">
                    {post.title}
                    {post.comments > 0 && <span className="ml-2 text-xs text-red-500/70 font-mono">[{post.comments}]</span>}
                  </td>
                  <td className="p-4 text-slate-400">{post.author}</td>
                  <td className="p-4 text-center text-slate-500 font-mono text-xs">{post.date}</td>
                  <td className="p-4 text-center text-slate-500 font-mono">{post.views}</td>
                  <td className="p-4 text-center text-emerald-500 font-bold font-mono">{post.likes}</td>
                </tr>
              ))}

              {/* 일반 포스트 (필터링 적용) */}
              {normalPosts.map(post => (
                <tr key={`post-${post.id}`} className="hover:bg-slate-800/50 transition-colors cursor-pointer group">
                  <td className="p-4 text-center">{getTagBadge(post.tag, post.isNotice)}</td>
                  <td className="p-4 text-slate-200 group-hover:text-emerald-400 transition-colors">
                    {post.title}
                    {post.comments > 0 && <span className="ml-2 text-xs text-emerald-500/70 font-mono">[{post.comments}]</span>}
                  </td>
                  <td className="p-4 text-slate-400">{post.author}</td>
                  <td className="p-4 text-center text-slate-500 font-mono text-xs">{post.date}</td>
                  <td className="p-4 text-center text-slate-500 font-mono">{post.views}</td>
                  <td className="p-4 text-center text-emerald-500 font-bold font-mono">{post.likes}</td>
                </tr>
              ))}

              {normalPosts.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500">
                    <MessageCircle className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    해당 태그의 게시글이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
