import React, { useState } from 'react';
import { Card, Button, Badge, Modal } from '../../components/ui/Base';
import { Search, Filter, FolderPlus, Folder, ArrowLeft, Plus, MoreVertical, X } from 'lucide-react';
import { useSetRecoilState, useRecoilState } from 'recoil';
import { navigationState, currentProblemBoxState } from '../../store/atoms';

export const ProblemList = () => {
  const setPage = useSetRecoilState(navigationState);
  const [currentBox, setCurrentBox] = useRecoilState(currentProblemBoxState);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Mock data for Boxes
  const [boxes, setBoxes] = useState([
    { id: 1, title: '코딩테스트 기초 100제', count: 15, category: 'Basic', color: 'bg-emerald-500' },
    { id: 2, title: '삼성 SW 역량 테스트 기출', count: 8, category: 'Advanced', color: 'bg-blue-500' },
    { id: 3, title: '카카오 블라인드 2024', count: 5, category: 'Intermediate', color: 'bg-yellow-500' },
  ]);

  // Mock data for problems inside a box
  const problems = Array.from({ length: 10 }).map((_, i) => ({
    id: 1000 + i,
    title: i % 2 === 0 ? 'A+B' : '행렬 곱셈 순서',
    difficulty: i % 3 === 0 ? 'Gold' : i % 3 === 1 ? 'Silver' : 'Bronze',
    tier: i % 5 + 1,
    tags: ['DP', 'Math', 'Implementation'].slice(0, (i % 3) + 1),
    rate: '45%',
    solved: i % 4 === 0
  }));

  const getDifficultyColor = (diff) => {
    switch (diff) {
      case 'Gold': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'Silver': return 'text-slate-300 bg-slate-400/10 border-slate-400/20';
      case 'Bronze': return 'text-amber-700 bg-amber-700/10 border-amber-700/20';
      default: return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    }
  };

  // Create Box Form State
  const [newBox, setNewBox] = useState({ title: '', category: 'Algorithm' });

  const handleCreateBox = (e) => {
    e.preventDefault();
    const box = {
      id: boxes.length + 1,
      title: newBox.title,
      category: newBox.category,
      count: 0,
      color: 'bg-purple-500'
    };
    setBoxes([...boxes, box]);
    setIsModalOpen(false);
    setNewBox({ title: '', category: 'Algorithm' });
  };

  // View: Problem Box List
  if (!currentBox) {
    return (
      <div className="flex-1 overflow-y-auto bg-[#0F1117] p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-100">나의 문제집</h1>
              <p className="text-slate-400 mt-1">풀고 싶은 문제들을 그룹으로 관리해보세요.</p>
            </div>
            <Button className="gap-2" onClick={() => setIsModalOpen(true)}>
              <FolderPlus className="w-4 h-4" /> 문제집 생성
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boxes.map((box) => (
              <div 
                key={box.id}
                onClick={() => setCurrentBox(box)}
                className="group bg-slate-900/50 border border-slate-800 rounded-xl p-6 cursor-pointer hover:bg-slate-800/50 hover:border-slate-700 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-10 h-10 rounded-lg ${box.color} bg-opacity-20 flex items-center justify-center`}>
                    <Folder className={`w-5 h-5 ${box.color.replace('bg-', 'text-')}`} />
                  </div>
                  <button className="text-slate-500 hover:text-slate-300">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-lg font-semibold text-slate-200 mb-1 group-hover:text-white">{box.title}</h3>
                <div className="flex justify-between items-center text-sm text-slate-500">
                   <span>{box.count} 문제</span>
                   <span className="text-xs bg-slate-800 px-2 py-0.5 rounded">{box.category}</span>
                </div>
              </div>
            ))}
            
              <button 
                onClick={() => setPage('problem-registration')}
                className="border border-dashed border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center gap-3 text-slate-500 hover:text-emerald-500 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all min-h-[160px]"
              >
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-emerald-500/20">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="font-medium">문제 등록하기</span>
              </button>
          </div>
        </div>

        {/* Create Box Modal */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="새 문제집 만들기">
          <form onSubmit={handleCreateBox} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-400">문제집 이름</label>
              <input 
                type="text" 
                required
                value={newBox.title}
                onChange={(e) => setNewBox({...newBox, title: e.target.value})}
                placeholder="예: 코딩테스트 대비 100제"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-400">분류</label>
              <select 
                value={newBox.category}
                onChange={(e) => setNewBox({...newBox, category: e.target.value})}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="Algorithm">알고리즘</option>
                <option value="Interview">면접 대비</option>
                <option value="CS">CS 지식</option>
                <option value="Language">언어 학습</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>취소</Button>
              <Button type="submit">생성하기</Button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  // View: Problems Inside a Box
  return (
    <div className="flex-1 overflow-y-auto bg-[#0F1117] p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <button onClick={() => setCurrentBox(null)} className="hover:text-slate-300">문제집</button>
            <span className="text-slate-700">/</span>
            <span className="text-slate-300">{currentBox.title}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setCurrentBox(null)}
                className="p-2 -ml-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold text-slate-100">{currentBox.title}</h1>
            </div>
            <Button variant="primary" className="gap-2" onClick={() => setPage('problem-registration')}>
              <Plus className="w-4 h-4" /> 문제 가져오기
            </Button>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="text" 
                placeholder="문제 검색..." 
                className="w-full h-12 bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Problem List */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
            <div className="grid grid-cols-[80px_1fr_120px_200px_100px] gap-4 p-4 border-b border-slate-800 bg-[#141820] text-sm font-semibold text-slate-400">
              <div className="text-center">#</div>
              <div>제목</div>
              <div>난이도</div>
              <div>알고리즘 분류</div>
              <div className="text-center">상태</div>
            </div>
            
            <div className="divide-y divide-slate-800/50">
              {problems.map((problem) => (
                <div 
                  key={problem.id}
                  onClick={() => setPage('ide')}
                  className="grid grid-cols-[80px_1fr_120px_200px_100px] gap-4 p-4 items-center hover:bg-slate-800/30 transition-colors cursor-pointer group"
                >
                  <div className="text-center text-slate-500 font-mono">{problem.id}</div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-200 font-medium group-hover:text-emerald-400 transition-colors">{problem.title}</span>
                  </div>
                  <div>
                    <span className={`px-2 py-1 rounded text-xs font-bold border ${getDifficultyColor(problem.difficulty)}`}>
                      {problem.difficulty} {problem.tier}
                    </span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {problem.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-xs border border-slate-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="text-center">
                    {problem.solved ? (
                      <span className="text-emerald-500 text-xs font-bold">Solved</span>
                    ) : (
                      <span className="text-slate-600 text-xs">-</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
