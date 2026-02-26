import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Modal } from '@/components/ui/Base';
import { Search, FolderPlus, ArrowLeft, Plus, MoreVertical, Pencil, Trash2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useRecoilState } from 'recoil';
import { useWorkspaceNavigate } from '@/hooks/useWorkspaceNavigate';
import { currentProblemBoxState } from '@/store/atoms';
import { getProblemBoxes, getProblemBox, createProblemBox, updateProblemBox, deleteProblemBox } from '@/api/problemBox';
import type { ProblemBoxListData } from '@/api/problemBox';
import { getWorkspaceProblems, updateWorkspaceProblem, deleteWorkspaceProblem } from '@/api/workspaceProblem';
import type { WorkspaceProblemListData } from '@/api/workspaceProblem';
import { getMyMembership } from '@/api/workspace';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';

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

  // 페이지네이션
  const [boxPage, setBoxPage] = useState(0);
  const [boxTotalPages, setBoxTotalPages] = useState(0);
  const [problemPage, setProblemPage] = useState(0);
  const [problemTotalPages, setProblemTotalPages] = useState(0);

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
        getProblemBoxes(currentWsId, boxPage),
        getMyMembership(currentWsId),
      ]);
      setBoxes(data.content);
      setBoxTotalPages(data.page?.totalPages ?? 0);
      if (membership.role) setMyRole(membership.role as MemberRole);
    } catch (err: any) {
      setError(parseApiError(err, '문제집 목록을 불러오는 데 실패했습니다.'));
    } finally {
      setLoading(false);
    }
  }, [currentWsId, boxPage]);

  useEffect(() => {
    fetchBoxes();
  }, [fetchBoxes]);

  // 문제집 내부 문제 목록
  const [problems, setProblems] = useState<WorkspaceProblemListData['content']>([]);
  const [problemsLoading, setProblemsLoading] = useState(false);
  const [deletingProblemId, setDeletingProblemId] = useState<number | null>(null);

  // 문제 수정 모달
  const [editProblemTarget, setEditProblemTarget] = useState<{ id: number; problemNumber: number; title: string } | null>(null);
  const [editDeadline, setEditDeadline] = useState<Dayjs | null>(null);
  const [editReminderEnabled, setEditReminderEnabled] = useState(false);
  const [editReminderHours, setEditReminderHours] = useState<number>(1);
  const [editingProblem, setEditingProblem] = useState(false);
  const [editProblemError, setEditProblemError] = useState('');

  const fetchProblems = useCallback(async () => {
    if (!currentWsId || !currentBox) return;
    setProblemsLoading(true);
    try {
      const data = await getWorkspaceProblems(currentWsId, currentBox.id, problemPage);
      setProblems(data.content);
      setProblemTotalPages(data.page?.totalPages ?? 0);
    } catch { /* ignore */ }
    finally { setProblemsLoading(false); }
  }, [currentWsId, currentBox, problemPage]);

  useEffect(() => {
    if (currentBox) fetchProblems();
  }, [currentBox, fetchProblems]);

  const openEditProblemModal = (p: WorkspaceProblemListData['content'][number]) => {
    setEditProblemTarget({ id: p.id, problemNumber: p.problemNumber, title: p.title });
    setEditDeadline(p.deadline ? dayjs(p.deadline) : null);
    if (p.deadline && p.scheduledAt) {
      const diff = dayjs(p.deadline).diff(dayjs(p.scheduledAt), 'hour');
      const validHours = [1, 2, 3, 6, 12, 24];
      setEditReminderEnabled(true);
      setEditReminderHours(validHours.includes(diff) ? diff : 1);
    } else {
      setEditReminderEnabled(false);
      setEditReminderHours(1);
    }
    setEditProblemError('');
  };

  const closeEditProblemModal = () => {
    setEditProblemTarget(null);
    setEditProblemError('');
  };

  const handleEditProblem = async () => {
    if (!currentWsId || !currentBox || !editProblemTarget) return;
    setEditingProblem(true);
    setEditProblemError('');
    try {
      await updateWorkspaceProblem(currentWsId, currentBox.id, editProblemTarget.id, {
        deadline: editDeadline ? editDeadline.toISOString() : null,
        scheduledAt: (editDeadline && editReminderEnabled)
          ? editDeadline.subtract(editReminderHours, 'hour').toISOString()
          : null,
      });
      closeEditProblemModal();
      await fetchProblems();
    } catch (err: any) {
      setEditProblemError(parseApiError(err, '문제 수정에 실패했습니다.'));
    } finally {
      setEditingProblem(false);
    }
  };

  const handleDeleteProblem = async (problemId: number) => {
    if (!currentWsId || !currentBox) return;
    setDeletingProblemId(problemId);
    try {
      await deleteWorkspaceProblem(currentWsId, currentBox.id, problemId);
      await fetchProblems();
    } catch (err: any) {
      alert(parseApiError(err, '문제 삭제에 실패했습니다.'));
    } finally {
      setDeletingProblemId(null);
    }
  };

  const getTierColor = (tier: string | null) => {
    if (!tier) return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    const t = tier.toLowerCase();
    if (t.includes('gold')) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    if (t.includes('silver')) return 'text-slate-300 bg-slate-400/10 border-slate-400/20';
    if (t.includes('bronze')) return 'text-amber-700 bg-amber-700/10 border-amber-700/20';
    if (t.includes('platinum')) return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
    if (t.includes('diamond')) return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    if (t.includes('ruby')) return 'text-red-400 bg-red-400/10 border-red-400/20';
    return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
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
    setProblemPage(0);
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
            <>
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

            {/* 문제집 페이지네이션 */}
            {boxTotalPages > 1 && (
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setBoxPage(p => Math.max(0, p - 1))}
                    disabled={boxPage === 0}
                    className="p-2 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: boxTotalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setBoxPage(i)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                        boxPage === i
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                          : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setBoxPage(p => Math.min(boxTotalPages - 1, p + 1))}
                    disabled={boxPage >= boxTotalPages - 1}
                    className="p-2 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            </>
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
        {problemsLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
          </div>
        ) : problems.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500 mb-4">아직 등록된 문제가 없습니다.</p>
            <Button onClick={() => toWs('problems/new')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              <Plus className="w-4 h-4 mr-1" /> 첫 문제 등록하기
            </Button>
          </div>
        ) : (
          <>
          <Card className="bg-[#151922] border-slate-800 overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                <div className="grid grid-cols-[80px_1fr_120px_120px_80px] gap-4 p-4 border-b border-slate-800 bg-[#0f1117] text-sm font-bold text-slate-400">
                  <div className="text-center">번호</div>
                  <div>제목</div>
                  <div>티어</div>
                  <div>마감일</div>
                  {canManage && <div></div>}
                </div>

                <div className="divide-y divide-slate-800/50">
                  {problems.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => navigate(`/ide/${p.problemNumber}`)}
                      className="grid grid-cols-[80px_1fr_120px_120px_80px] gap-4 p-4 items-center hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      <div className="text-center text-slate-500 font-mono text-xs">{p.problemNumber}</div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-200 font-bold group-hover:text-emerald-400 transition-colors">{p.title}</span>
                      </div>
                      <div>
                        {p.tier ? (
                          <span className={`px-2 py-1 rounded text-xs font-extrabold border shadow-sm ${getTierColor(p.tier)}`}>
                            {p.tier}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs">-</span>
                        )}
                      </div>
                      <div className="text-slate-400 text-xs">
                        {p.deadline ? new Date(p.deadline).toLocaleDateString('ko-KR') : '-'}
                      </div>
                      {canManage && (
                        <div className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="text-slate-600 hover:text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors p-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuItem onClick={() => openEditProblemModal(p)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                수정
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                disabled={deletingProblemId === p.id}
                                onClick={() => {
                                  if (confirm('이 문제를 삭제하시겠습니까?')) handleDeleteProblem(p.id);
                                }}
                              >
                                {deletingProblemId === p.id ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4 mr-2" />
                                )}
                                삭제
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* 문제 페이지네이션 */}
          {problemTotalPages > 1 && (
            <div className="flex items-center justify-center mt-6">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setProblemPage(p => Math.max(0, p - 1))}
                  disabled={problemPage === 0}
                  className="p-2 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: problemTotalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setProblemPage(i)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                      problemPage === i
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                        : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setProblemPage(p => Math.min(problemTotalPages - 1, p + 1))}
                  disabled={problemPage >= problemTotalPages - 1}
                  className="p-2 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          </>
        )}
      </div>

      {/* 문제 수정 모달 */}
      <Modal isOpen={!!editProblemTarget} onClose={closeEditProblemModal} title="문제 수정">
        <div className="space-y-6">
          <div className="flex items-center gap-3 bg-slate-800/50 rounded-lg px-4 py-3">
            <span className="text-xs font-bold text-slate-400 bg-slate-700/60 rounded px-2 py-1 font-mono">{editProblemTarget?.problemNumber}</span>
            <span className="text-base font-bold text-slate-200">{editProblemTarget?.title}</span>
          </div>

          {/* 마감일 */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400">마감일</label>
            <div className="relative">
              <DateTimePicker
                value={editDeadline}
                onChange={(v) => setEditDeadline(v)}
                ampm={false}
                format="YYYY년 MM월 DD일 HH:mm"
                slotProps={{
                  textField: { fullWidth: true, size: 'small' },
                }}
                sx={!editDeadline ? {
                  '& .MuiPickersSectionList-root': { color: 'transparent' },
                } : undefined}
              />
              {!editDeadline && (
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-sm">
                  마감일을 선택하세요
                </span>
              )}
            </div>
          </div>

          {/* 알림 */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={editReminderEnabled}
                onCheckedChange={setEditReminderEnabled}
                disabled={!editDeadline}
              />
              <label className="text-sm text-slate-300">마감 전 알림</label>
            </div>

            {editReminderEnabled && editDeadline && (
              <Select
                value={String(editReminderHours)}
                onValueChange={(v) => setEditReminderHours(Number(v))}
              >
                <SelectTrigger className="w-40 bg-slate-900 border-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1시간 전</SelectItem>
                  <SelectItem value="2">2시간 전</SelectItem>
                  <SelectItem value="3">3시간 전</SelectItem>
                  <SelectItem value="6">6시간 전</SelectItem>
                  <SelectItem value="12">12시간 전</SelectItem>
                  <SelectItem value="24">24시간 전</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {editProblemError && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
              {editProblemError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={closeEditProblemModal}>취소</Button>
            <Button onClick={handleEditProblem} disabled={editingProblem}>
              {editingProblem ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              저장
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
