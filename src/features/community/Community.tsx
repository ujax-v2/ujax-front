import React, { useState } from 'react';
import { useRecoilState } from 'recoil';
import { communityTabState } from '../../store/atoms';
import { Button, Badge } from '../../components/ui/Base';
import { 
  MessageCircle,
  Megaphone,
  PenSquare,
  Eye
} from 'lucide-react';

// Sub-component: Free Board
const FreeBoard = () => {
  const posts = [
    { id: 1, title: "이번 주 챌린지 같이 하실 분?", author: "CodeWarrior", date: "2024.02.10", likes: 5, comments: 2 },
    { id: 2, title: "BFS랑 DFS 중에 뭐가 더 어렵나요?", author: "Newbie", date: "2024.02.09", likes: 12, comments: 8 },
    { id: 3, title: "취업 준비하면서 알고리즘 공부 팁 공유합니다", author: "DevMaster", date: "2024.02.08", likes: 45, comments: 15 },
    { id: 4, title: "파이썬 시간초과 해결 방법 좀...", author: "PyLover", date: "2024.02.08", likes: 2, comments: 4 },
  ];

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#0F1117]">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-100">자유 게시판</h2>
            <p className="text-slate-400 text-sm mt-1">자유롭게 이야기를 나누어 보세요.</p>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
            <PenSquare className="w-4 h-4" /> 글쓰기
          </Button>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#141820] text-slate-400 text-sm">
                <th className="p-4 font-medium w-16 text-center">#</th>
                <th className="p-4 font-medium">제목</th>
                <th className="p-4 font-medium w-32">작성자</th>
                <th className="p-4 font-medium w-32 text-center">날짜</th>
                <th className="p-4 font-medium w-20 text-center">추천</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {posts.map(post => (
                <tr key={post.id} className="hover:bg-slate-800/30 transition-colors cursor-pointer group">
                  <td className="p-4 text-center text-slate-500 text-sm">{post.id}</td>
                  <td className="p-4 text-slate-200 group-hover:text-emerald-400 transition-colors">
                    {post.title}
                    {post.comments > 0 && (
                      <span className="ml-2 text-xs text-slate-500 font-mono">[{post.comments}]</span>
                    )}
                  </td>
                  <td className="p-4 text-slate-400 text-sm">{post.author}</td>
                  <td className="p-4 text-center text-slate-500 text-xs">{post.date}</td>
                  <td className="p-4 text-center text-emerald-500 text-sm font-medium">{post.likes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Sub-component: Notice Board
const NoticeBoard = () => {
  const notices = [
    { id: 1, title: "시스템 점검 안내 (02/10 02:00 ~ 04:00)", date: "2024.02.08", views: 1250 },
    { id: 2, title: "새로운 챌린지 시즌 5가 시작됩니다!", date: "2024.02.05", views: 3400 },
    { id: 3, title: "IDE 다크 모드 가독성 개선 업데이트", date: "2024.02.01", views: 890 },
  ];

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#0F1117]">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-100">공지사항</h2>
            <p className="text-slate-400 text-sm mt-1">새로운 소식과 업데이트를 확인하세요.</p>
          </div>
        </div>

        <div className="space-y-4">
          {notices.map(notice => (
            <div 
              key={notice.id} 
              className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20">공지</Badge>
                <span className="text-slate-500 text-xs">{notice.date}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-200 mb-2">{notice.title}</h3>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {notice.views}</span>
                <span>작성자: 관리자</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Main Community Container
export const Community = () => {
  const [activeTab, setActiveTab] = useRecoilState(communityTabState);

  const tabs = [
    { id: 'notices', label: '공지사항', icon: Megaphone },
    { id: 'free', label: '자유 게시판', icon: MessageCircle },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0F1117]">
      {/* Top Navigation Tabs */}
      <div className="h-14 border-b border-slate-800 flex items-center px-4 bg-[#0F1117]">
        <div className="flex space-x-1 bg-slate-900/50 p-1 rounded-lg border border-slate-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'notices' && <NoticeBoard />}
        {activeTab === 'free' && <FreeBoard />}
      </div>
    </div>
  );
};
