import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Modal } from '@/components/ui/Base';
import { Search, FolderPlus, ArrowLeft, Plus, MoreVertical, Pencil, Trash2, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useRecoilState } from 'recoil';
import { useWorkspaceNavigate } from '@/hooks/useWorkspaceNavigate';
import { currentProblemBoxState } from '@/store/atoms';
import { getProblemBoxes, getProblemBox, createProblemBox, updateProblemBox, deleteProblemBox } from '@/api/problemBox';
import type { ProblemBoxListData } from '@/api/problemBox';
import { getMyMembership } from '@/api/workspace';

type MemberRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER';

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return '방금 전';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}개월 전`;
  return `${Math.floor(months / 12)}년 전`;
}

function parseApiError(err: any, fallback: string): string {
  const msg = err?.message || '';
  const jsonMatch = msg.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.detail || fallback;
    } catch { /* ignore */ }
  }
  return fallback;
}

export const ProblemList = () => {
  const { navigate, toWs, currentWsId } = useWorkspaceNavigate();
  const [currentBox, setCurrentBox] = useRecoilState(currentProblemBoxState);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // 권한
  const [myRole, setMyRole] = useState<MemberRole>('MEMBER');
  const canManage = myRole === 'OWNER' || myRole === 'ADMIN' || myRole === 'MANAGER';

  // API 상태
  const [boxes, setBoxes] = useState<ProblemBoxListData['content']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // 수정 모달 상태
  const [editTarget, setEditTarget] = useState<{ id: number; title: string; description: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState('');

  // 문제집 목록 + 권한 조회
  const fetchBoxes = useCallback(async () => {
    if (!currentWsId) return;
    setLoading(true);
    setError('');
    try {
      const [data, membership] = await Promise.all([
        getProblemBoxes(currentWsId),
        getMyMembership(currentWsId),
      ]);
      setBoxes(data.content);
      if (membership.role) setMyRole(membership.role as MemberRole);
    } catch (err: any) {
      setError(parseApiError(err, '문제집 목록을 불러오는 데 실패했습니다.'));
    } finally {
      setLoading(false);
    }
  }, [currentWsId]);

  useEffect(() => {
    fetchBoxes();
  }, [fetchBoxes]);

  // Mock data for problems inside a box (추후 API 연동)
  const problems = Array.from({ length: 10 }).map((_, i) => ({
    id: 1000 + i,
    title: i % 2 === 0 ? 'A+B' : '행렬 곱셈 순서',
    difficulty: i % 3 === 0 ? 'Gold' : i % 3 === 1 ? 'Silver' : 'Bronze',
    tier: i % 5 + 1,
    tags: ['DP', 'Math', 'Implementation'].slice(0, (i % 3) + 1),
    rate: '45%',
    solved: i % 4 === 0
  }));

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Gold': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'Silver': return 'text-slate-300 bg-slate-400/10 border-slate-400/20';
      case 'Bronze': return 'text-amber-700 bg-amber-700/10 border-amber-700/20';
      default: return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    }
  };

  // Create Box
  const [newBox, setNewBox] = useState({ title: '', description: '' });

  const handleCreateBox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWsId) return;
    setCreating(true);
    setCreateError('');
    try {
      await createProblemBox(currentWsId, {
        title: newBox.title,
        description: newBox.description || undefined,
      });
      setIsCreateModalOpen(false);
      setNewBox({ title: '', description: '' });
      await fetchBoxes();
    } catch (err: any) {
      setCreateError(parseApiError(err, '문제집 생성에 실패했습니다.'));
    } finally {
      setCreating(false);
    }
  };

  // Edit Box — 수정 모달 열기 (단건 조회로 description 가져오기)
  const openEditModal = async (boxId: number) => {
    if (!currentWsId) return;
    try {
      const data = await getProblemBox(currentWsId, boxId);
      setEditTarget({ id: data.id, title: data.title, description: data.description || '' });
      setEditError('');
    } catch (err: any) {
      alert(parseApiError(err, '문제집 정보를 불러오는 데 실패했습니다.'));
    }
  };

  const handleEditBox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWsId || !editTarget) return;
    setEditing(true);
    setEditError('');
    try {
      await updateProblemBox(currentWsId, editTarget.id, {
        title: editTarget.title,
        description: editTarget.description || undefined,
      });
      setEditTarget(null);
      await fetchBoxes();
    } catch (err: any) {
      setEditError(parseApiError(err, '문제집 수정에 실패했습니다.'));
    } finally {
      setEditing(false);
    }
  };

  // Delete Box
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDeleteBox = async (boxId: number) => {
    if (!currentWsId) return;
    setDeletingId(boxId);
    try {
      await deleteProblemBox(currentWsId, boxId);
      await fetchBoxes();
    } catch (err: any) {
      alert(parseApiError(err, '삭제에 실패했습니다.'));
    } finally {
      setDeletingId(null);
    }
  };

  // 카드 클릭 → 문제집 내부로 (단건 조회해서 description 포함)
  const handleOpenBox = async (box: ProblemBoxListData['content'][number]) => {
    if (!currentWsId) return;
    try {
      const data = await getProblemBox(currentWsId, box.id);
      setCurrentBox({
        id: data.id,
        title: data.title,
        description: data.description,
        createdAt: data.createdAt,
      });
    } catch {
      setCurrentBox({
        id: box.id,
        title: box.title,
        description: undefined,
        createdAt: box.createdAt,
      });
    }
  };

  // ─── View: Problem Box List ───
  if (!currentBox) {
    return (
      <div className="flex-1 overflow-y-auto bg-[#0a0c10] p-8 pb-12 font-sans text-slate-100 relative">
        <div className="max-w-6xl mx-auto space-y-10">

          {/* 헤더 */}
          <div className="border-b border-slate-800 pb-8 mt-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-4xl font-extrabold text-white tracking-tight mb-3">나의 문제집</h1>
              <p className="text-base text-slate-400 font-medium leading-relaxed max-w-3xl">
                풀고 싶은 문제들을 테마별 그룹으로 분류하여 체계적으로 학습하고 관리해보세요.
              </p>
            </div>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shrink-0 items-center justify-center py-2 px-4 shadow-sm transition-all"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <FolderPlus className="w-5 h-5 mr-1" /> 문제집 생성
            </Button>
          </div>

          {/* 로딩 */}
          {loading && (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
            </div>
          )}

          {/* 에러 */}
          {!loading && error && (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">{error}</p>
              <Button variant="ghost" onClick={fetchBoxes}>다시 시도</Button>
            </div>
          )}

          {/* 문제집 그리드 */}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {boxes.map((box) => (
                <Card
                  key={box.id}
                  onClick={() => handleOpenBox(box)}
                  className="group bg-[#151922] border-slate-800 p-6 cursor-pointer hover:border-slate-600 transition-all shadow-md flex flex-col min-h-[180px]"
                >
                  {/* 상단: 제목 + 더보기 메뉴 */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="text-xl font-bold text-slate-200 group-hover:text-white line-clamp-1 flex-1">{box.title}</h3>
                    {canManage && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="text-slate-500 hover:text-slate-300 transition-colors p-1 shrink-0 -mr-1 -mt-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onClick={() => openEditModal(box.id)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          수정
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          disabled={deletingId === box.id}
                          onClick={() => {
                            if (confirm('이 문제집을 삭제하시겠습니까?')) {
                              handleDeleteBox(box.id);
                            }
                          }}
                        >
                          {deletingId === box.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 mr-2" />
                          )}
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    )}
                  </div>

                  {/* 하단: 상대 시간 */}
                  <div className="flex items-center text-xs text-slate-500 mt-auto pt-4 border-t border-slate-800/50">
                    <span className="font-medium">{relativeTime(box.updatedAt)} 업데이트</span>
                  </div>
                </Card>
              ))}

              {/* 빈 상태 */}
              {boxes.length === 0 && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="border-2 border-dashed border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center gap-4 text-slate-500 hover:text-indigo-400 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all min-h-[180px]"
                >
                  <div className="w-12 h-12 rounded-full bg-[#1b202c] border border-slate-800 flex items-center justify-center transition-all shadow-inner">
                    <Plus className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-sm">첫 문제집 만들기</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* 생성 모달 */}
        <Modal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); setCreateError(''); }} title="새 문제집 만들기">
          <form onSubmit={handleCreateBox} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-400">문제집 이름</label>
              <input
                type="text"
                required
                value={newBox.title}
                onChange={(e) => setNewBox({ ...newBox, title: e.target.value })}
                placeholder="예: 코딩테스트 대비 100제"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-400">설명</label>
              <textarea
                value={newBox.description}
                onChange={(e) => setNewBox({ ...newBox, description: e.target.value })}
                placeholder="문제집에 대한 설명을 적어주세요."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 min-h-[80px]"
              />
            </div>
            {createError && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                {createError}
              </div>
            )}
            <div className="flex justify-end gap-3 mt-6">
              <Button type="button" variant="ghost" onClick={() => { setIsCreateModalOpen(false); setCreateError(''); }}>취소</Button>
              <Button type="submit" disabled={creating}>
                {creating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                생성하기
              </Button>
            </div>
          </form>
        </Modal>

        {/* 수정 모달 */}
        <Modal isOpen={!!editTarget} onClose={() => { setEditTarget(null); setEditError(''); }} title="문제집 수정">
          <form onSubmit={handleEditBox} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-400">문제집 이름</label>
              <input
                type="text"
                required
                value={editTarget?.title || ''}
                onChange={(e) => setEditTarget(prev => prev ? { ...prev, title: e.target.value } : prev)}
                placeholder="문제집 이름"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-400">설명</label>
              <textarea
                value={editTarget?.description || ''}
                onChange={(e) => setEditTarget(prev => prev ? { ...prev, description: e.target.value } : prev)}
                placeholder="문제집에 대한 설명을 적어주세요."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 min-h-[80px]"
              />
            </div>
            {editError && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                {editError}
              </div>
            )}
            <div className="flex justify-end gap-3 mt-6">
              <Button type="button" variant="ghost" onClick={() => { setEditTarget(null); setEditError(''); }}>취소</Button>
              <Button type="submit" disabled={editing}>
                {editing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                저장
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  // ─── View: Problems Inside a Box ───
  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0c10] p-8 pb-12 font-sans text-slate-100 relative">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Navigation & Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium tracking-wide">
            <button onClick={() => setCurrentBox(null)} className="hover:text-slate-300 transition-colors">문제집</button>
            <span className="text-slate-700">/</span>
            <span className="text-slate-300 font-semibold">{currentBox.title}</span>
          </div>

          <div className="border-b border-slate-800 pb-8 mt-4">
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentBox(null)}
                  className="p-2 -ml-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">{currentBox.title}</h1>
              </div>
              <Button
                className="bg-emerald-600 border border-emerald-500 text-white font-bold hover:bg-emerald-700 shrink-0 shadow-sm transition-all"
                onClick={() => toWs('problems/new')}
              >
                <Plus className="w-4 h-4 mr-1" /> 문제 가져오기
              </Button>
            </div>
            {currentBox.description && (
              <p className="text-slate-400 text-sm mt-4 leading-relaxed">{currentBox.description}</p>
            )}
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="문제 검색..."
              className="w-full h-12 bg-[#151922] border border-slate-800 rounded-xl pl-12 pr-4 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Problem List */}
        <Card className="bg-[#151922] border-slate-800 overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-[80px_1fr_120px_200px_100px] gap-4 p-4 border-b border-slate-800 bg-[#0f1117] text-sm font-bold text-slate-400">
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
                    onClick={() => navigate(`/ide/${problem.id}`)}
                    className="grid grid-cols-[80px_1fr_120px_200px_100px] gap-4 p-4 items-center hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <div className="text-center text-slate-500 font-mono text-xs">{problem.id}</div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-200 font-bold group-hover:text-emerald-400 transition-colors">{problem.title}</span>
                    </div>
                    <div>
                      <span className={`px-2 py-1 rounded text-xs font-extrabold border shadow-sm ${getDifficultyColor(problem.difficulty)}`}>
                        {problem.difficulty} {problem.tier}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {problem.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded bg-[#1b202c] text-slate-400 text-[10px] font-bold border border-slate-700/50">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="text-center">
                      {problem.solved ? (
                        <span className="text-emerald-500 text-[11px] font-extrabold bg-emerald-500/10 px-2 py-1.5 rounded-full border border-emerald-500/20">해결됨</span>
                      ) : (
                        <span className="text-slate-600 text-[11px] font-bold">-</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
