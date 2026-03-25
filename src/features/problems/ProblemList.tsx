import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Button, Modal } from '@/components/ui/Base';
import { Search, FolderPlus, ArrowLeft, Plus, MoreVertical, Pencil, Trash2, Loader2, ExternalLink, Code2, Eye, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { PageNav } from '@/components/ui/PageNav';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useRecoilState } from 'recoil';
import { useWorkspaceNavigate } from '@/hooks/useWorkspaceNavigate';
import { currentProblemBoxState, problemContextState } from '@/store/atoms';
import { getProblemBoxes, getProblemBox, createProblemBox, updateProblemBox, deleteProblemBox } from '@/api/problemBox';
import type { ProblemBoxListData } from '@/api/problemBox';
import { getWorkspaceProblems, updateWorkspaceProblem, deleteWorkspaceProblem } from '@/api/workspaceProblem';
import type { WorkspaceProblemListData } from '@/api/workspaceProblem';
import { getMyMembership } from '@/api/workspace';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { useT, useLang } from '@/i18n';
import { useExtensionBatchContext } from '@/hooks/useExtensionProblemContext';
import { useSolutionPolling } from '@/hooks/useSolutionPolling';
import { parseApiError } from '@/utils/error';

type MemberRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER';

function relativeTime(dateStr: string, t: (key: string, vars?: Record<string, string | number>) => string): string {
  const now = Date.now();
  const then = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z').getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return t('time.justNow');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t('time.minutesAgo', { n: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('time.hoursAgo', { n: hours });
  const days = Math.floor(hours / 24);
  if (days < 30) return t('time.daysAgo', { n: days });
  const months = Math.floor(days / 30);
  if (months < 12) return t('time.monthsAgo', { n: months });
  return t('time.yearsAgo', { n: Math.floor(months / 12) });
}

export const ProblemList = () => {
  const { navigate, toWs, currentWsId } = useWorkspaceNavigate();
  const [currentBox, setCurrentBox] = useRecoilState(currentProblemBoxState);
  const [, setProblemCtxMap] = useRecoilState(problemContextState);
  const t = useT();
  const lang = useLang();
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
    } catch {
      // 현재 워크스페이스에 존재하지 않는 박스(ex. 다른 계정 로컬스토리지 잔류)면 초기화
      setCurrentBox(null);
    }
    finally { setProblemsLoading(false); }
  }, [currentWsId, currentBox, problemPage]);

  useEffect(() => {
    if (currentBox) fetchProblems();
  }, [currentBox, fetchProblems]);

  // Extension batch context: 문제 목록이 로드되면 extension에 전달
  const batchContextProblems = useMemo(
    () => problems.map(p => ({ problemNumber: p.problemNumber, workspaceProblemId: p.id })),
    [problems],
  );
  useExtensionBatchContext(batchContextProblems);

  // 인라인 알림 (직접 렌더링)
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);
  const notifTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotification = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    setNotification({ message, type });
    notifTimerRef.current = setTimeout(() => setNotification(null), 5000);
  }, []);

  // Solution polling
  const { solutionMap, loading: solutionLoading, pendingProblems, markPending, lastCheckedAt, refreshNow } = useSolutionPolling(
    currentWsId,
    currentBox?.id ?? null,
    useMemo(() => problems.map(p => ({ id: p.id, problemNumber: p.problemNumber })), [problems]),
    showNotification,
  );
  const [refreshing, setRefreshing] = useState(false);

  const toUtcDayjs = (iso: string) => dayjs(iso.endsWith('Z') ? iso : iso + 'Z');

  const openEditProblemModal = (p: WorkspaceProblemListData['content'][number]) => {
    setEditProblemTarget({ id: p.id, problemNumber: p.problemNumber, title: p.title });
    setEditDeadline(p.deadline ? toUtcDayjs(p.deadline) : null);
    if (p.deadline && p.scheduledAt) {
      const diff = toUtcDayjs(p.deadline).diff(toUtcDayjs(p.scheduledAt), 'hour');
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
    if (!tier) return 'text-text-faint bg-surface-subtle border-border-subtle';
    const tl = tier.toLowerCase();
    if (tl.includes('gold')) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    if (tl.includes('silver')) return 'text-text-secondary bg-surface-subtle border-border-subtle';
    if (tl.includes('bronze')) return 'text-amber-700 dark:text-amber-500 bg-amber-500/10 border-amber-500/20';
    if (tl.includes('platinum')) return 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
    if (tl.includes('diamond')) return 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20';
    if (tl.includes('ruby')) return 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20';
    return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
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

  // Delete Confirm Modal
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'box' | 'problem'; id: number } | null>(null);

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
      <div className="flex-1 overflow-y-auto bg-page p-8 pb-12 font-sans text-text-primary relative">
        <div className="max-w-6xl mx-auto space-y-10">

          {/* 헤더 */}
          <div className="border-b border-border-default pb-8 mt-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-4xl font-extrabold text-text-primary tracking-tight mb-3">{t('problems.myProblemBoxes')}</h1>
              <p className="text-base text-text-muted font-medium leading-relaxed max-w-3xl">
                {t('problems.myProblemBoxesDesc')}
              </p>
            </div>
            {canManage && (
              <Button
                className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold shrink-0 items-center justify-center py-2 px-4 shadow-sm transition-all"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <FolderPlus className="w-5 h-5 mr-1" /> {t('problems.createBox')}
              </Button>
            )}
          </div>

          {/* 로딩 */}
          {loading && (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-text-faint animate-spin" />
            </div>
          )}

          {/* 에러 */}
          {!loading && error && (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">{error}</p>
              <Button variant="ghost" onClick={fetchBoxes}>{t('common.retry')}</Button>
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
                  className="group bg-surface-raised border-border-default p-6 cursor-pointer hover:border-border-subtle transition-all shadow-md flex flex-col min-h-[180px]"
                >
                  {/* 상단: 제목 + 더보기 메뉴 */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="text-xl font-bold text-text-secondary group-hover:text-text-primary line-clamp-1 flex-1">{box.title}</h3>
                    {canManage && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="text-text-faint hover:text-text-secondary transition-colors p-1 shrink-0 -mr-1 -mt-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onClick={() => openEditModal(box.id)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          disabled={deletingId === box.id}
                          onClick={() => setDeleteConfirm({ type: 'box', id: box.id })}
                        >
                          {deletingId === box.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 mr-2" />
                          )}
                          {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    )}
                  </div>

                  {/* 하단: 상대 시간 */}
                  <div className="flex items-center text-xs text-text-faint mt-auto pt-4 border-t border-border-default/50">
                    <span className="font-medium">{relativeTime(box.updatedAt, t)} {t('problems.updated')}</span>
                  </div>
                </Card>
              ))}

              {/* 빈 상태 - 관리자 이상 */}
              {boxes.length === 0 && canManage && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="border-2 border-dashed border-border-default rounded-xl p-6 flex flex-col items-center justify-center gap-4 text-text-faint hover:text-indigo-700 dark:hover:text-indigo-500 hover:border-indigo-600/50 hover:bg-indigo-600/5 transition-all min-h-[180px]"
                >
                  <div className="w-12 h-12 rounded-full bg-surface-inset border border-border-default flex items-center justify-center transition-all shadow-inner">
                    <Plus className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-sm">{t('problems.firstBox')}</span>
                </button>
              )}

              {/* 빈 상태 - 멤버 */}
              {boxes.length === 0 && !canManage && (
                <div className="border border-border-default rounded-xl p-8 flex flex-col items-center justify-center gap-3 text-text-faint min-h-[180px]">
                  <div className="w-12 h-12 rounded-full bg-surface-inset border border-border-default flex items-center justify-center shadow-inner">
                    <FolderPlus className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-sm">{t('problems.noBoxesMember')}</p>
                  <p className="text-xs text-text-faint">{t('problems.noBoxesMemberDesc')}</p>
                </div>
              )}
            </div>

            {/* 문제집 페이지네이션 */}
            <div className="flex items-center justify-center">
              <PageNav page={boxPage} totalPages={boxTotalPages} onPageChange={setBoxPage} />
            </div>
            </>
          )}
        </div>

        {/* 생성 모달 */}
        <Modal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); setCreateError(''); }} title={t('problems.newBox')}>
          <form onSubmit={handleCreateBox} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-text-muted">{t('problems.boxName')}</label>
              <input
                type="text"
                required
                value={newBox.title}
                onChange={(e) => setNewBox({ ...newBox, title: e.target.value })}
                placeholder={t('problems.boxNamePlaceholder')}
                className="w-full bg-input-bg border border-border-default rounded-lg px-4 py-2.5 text-text-secondary focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-text-muted">{t('problems.boxDesc')}</label>
              <textarea
                value={newBox.description}
                onChange={(e) => setNewBox({ ...newBox, description: e.target.value })}
                placeholder={t('problems.boxDescPlaceholder')}
                className="w-full bg-input-bg border border-border-default rounded-lg px-4 py-2.5 text-text-secondary focus:outline-none focus:border-emerald-500 min-h-[80px]"
              />
            </div>
            {createError && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                {createError}
              </div>
            )}
            <div className="flex justify-end gap-3 mt-6">
              <Button type="button" variant="ghost" onClick={() => { setIsCreateModalOpen(false); setCreateError(''); }}>{t('common.cancel')}</Button>
              <Button type="submit" disabled={creating}>
                {creating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                {creating ? t('common.creating') : t('common.createButton')}
              </Button>
            </div>
          </form>
        </Modal>

        {/* 수정 모달 */}
        <Modal isOpen={!!editTarget} onClose={() => { setEditTarget(null); setEditError(''); }} title={t('problems.editBox')}>
          <form onSubmit={handleEditBox} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-text-muted">{t('problems.boxName')}</label>
              <input
                type="text"
                required
                value={editTarget?.title || ''}
                onChange={(e) => setEditTarget(prev => prev ? { ...prev, title: e.target.value } : prev)}
                placeholder={t('problems.boxNamePlaceholder')}
                className="w-full bg-input-bg border border-border-default rounded-lg px-4 py-2.5 text-text-secondary focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-text-muted">{t('problems.boxDesc')}</label>
              <textarea
                value={editTarget?.description || ''}
                onChange={(e) => setEditTarget(prev => prev ? { ...prev, description: e.target.value } : prev)}
                placeholder={t('problems.boxDescPlaceholder')}
                className="w-full bg-input-bg border border-border-default rounded-lg px-4 py-2.5 text-text-secondary focus:outline-none focus:border-emerald-500 min-h-[80px]"
              />
            </div>
            {editError && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                {editError}
              </div>
            )}
            <div className="flex justify-end gap-3 mt-6">
              <Button type="button" variant="ghost" onClick={() => { setEditTarget(null); setEditError(''); }}>{t('common.cancel')}</Button>
              <Button type="submit" disabled={editing}>
                {editing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                {editing ? t('common.saving') : t('common.save')}
              </Button>
            </div>
          </form>
        </Modal>

        {/* 삭제 확인 모달 */}
        {deleteConfirm?.type === 'box' && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
            <div className="bg-surface-overlay rounded-xl shadow-2xl border border-border-subtle/50 w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-text-primary">{t('common.deleteConfirmTitle')}</h3>
              </div>
              <p className="text-sm text-text-secondary font-medium">{t('problems.confirmDeleteBox')}</p>
              <p className="text-sm text-text-faint">{t('problems.confirmDeleteBoxWarning')}</p>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>{t('common.cancel')}</Button>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white font-bold"
                  onClick={() => { handleDeleteBox(deleteConfirm.id); setDeleteConfirm(null); }}
                >
                  {t('common.delete')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── View: Problems Inside a Box ───
  return (
    <div className="flex-1 overflow-y-auto bg-page p-8 pb-12 font-sans text-text-primary relative">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Navigation & Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm text-text-faint font-medium tracking-wide">
            <button onClick={() => setCurrentBox(null)} className="hover:text-text-secondary transition-colors">{t('problems.problemBox')}</button>
            <span className="text-text-faint">/</span>
            <span className="text-text-secondary font-semibold">{currentBox.title}</span>
          </div>

          <div className="border-b border-border-default pb-8 mt-4">
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentBox(null)}
                  className="p-2 -ml-2 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface-subtle transition-all"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">{currentBox.title}</h1>
              </div>
              {canManage && (
                <Button
                  className="bg-emerald-600 border border-emerald-500 text-white font-bold hover:bg-emerald-700 shrink-0 shadow-sm transition-all"
                  onClick={() => toWs('problems/new')}
                >
                  <Plus className="w-4 h-4 mr-1" /> {t('problems.importProblems')}
                </Button>
              )}
            </div>
            {currentBox.description && (
              <p className="text-base text-text-muted font-medium leading-relaxed max-w-3xl mt-4">{currentBox.description}</p>
            )}
          </div>
        </div>

        {/* 인라인 알림 */}
        {notification && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border animate-in fade-in slide-in-from-top-2 ${
            notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
            notification.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
            'bg-indigo-600/10 border-indigo-600/20 text-indigo-400'
          }`}>
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> :
             notification.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> :
             <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
            {notification.message}
            <button onClick={() => setNotification(null)} className="ml-auto text-text-faint hover:text-text-secondary">✕</button>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-faint" />
            <input
              type="text"
              placeholder={t('problems.searchProblems')}
              className="w-full h-12 bg-surface-raised border border-border-default rounded-xl pl-12 pr-4 text-text-secondary placeholder:text-text-faint focus:outline-none focus:border-emerald-500 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Problem List */}
        {problemsLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-text-faint animate-spin" />
          </div>
        ) : problems.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-text-faint mb-4">{t('problems.noProblems')}</p>
            <Button onClick={() => toWs('problems/new')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              <Plus className="w-4 h-4 mr-1" /> {t('problems.firstProblem')}
            </Button>
          </div>
        ) : (
          <>
          <Card className="bg-surface-raised border-border-default shadow-md">
            <div className="overflow-x-auto rounded-xl">
              <div className="min-w-[700px]">
                <div className={`grid ${canManage ? 'grid-cols-[80px_1fr_100px_120px_80px]' : 'grid-cols-[80px_1fr_100px_120px]'} gap-4 p-4 border-b border-border-default bg-page text-sm font-bold text-text-muted`}>
                  <div className="text-center">{t('problems.number')}</div>
                  <div>{t('problems.title')}</div>
                  <div className="text-center">{t('problems.tier')}</div>
                  <div className="text-center">{t('problems.deadline')}</div>
                  {canManage && <div></div>}
                </div>

                <div className="divide-y divide-border-default">
                  {problems.map((p) => {
                    const sol = solutionMap.get(p.id);
                    const isAccepted = sol?.status === 'ACCEPTED';
                    const isWrong = sol && sol.status !== 'ACCEPTED';
                    const isPending = pendingProblems.has(p.id);

                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setProblemCtxMap(prev => ({
                            ...prev,
                            [String(p.problemNumber)]: {
                              workspaceProblemId: p.id,
                              problemBoxId: currentBox!.id,
                            },
                          }));
                          navigate(`/ws/${currentWsId}/ide/${p.problemNumber}`);
                        }}
                        className={`grid ${canManage ? 'grid-cols-[80px_1fr_100px_120px_80px]' : 'grid-cols-[80px_1fr_100px_120px]'} gap-4 p-4 items-center hover:bg-hover-bg transition-colors cursor-pointer group`}
                      >
                        <div className="text-center text-emerald-600 dark:text-emerald-400 font-mono text-sm font-bold">{p.problemNumber}</div>
                        <div className="flex items-center gap-3">
                          <span className="text-text-secondary font-bold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{p.title}</span>
                        </div>
                        <div className="text-center">
                          {p.tier ? (
                            <span className={`px-2 py-1 rounded text-xs font-extrabold border shadow-sm ${getTierColor(p.tier)}`}>
                              {p.tier}
                            </span>
                          ) : (
                            <span className="text-text-faint text-xs">-</span>
                          )}
                        </div>
                        <div className="text-center text-text-muted text-xs">
                          {p.deadline ? new Date(p.deadline.endsWith('Z') ? p.deadline : p.deadline + 'Z').toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US') : '-'}
                        </div>
                        {/* 액션 메뉴: 관리자 이상만 표시 */}
                        <div className="text-center" onClick={(e) => e.stopPropagation()}>
                          {canManage && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  className="text-text-faint hover:text-text-secondary hover:bg-hover-bg rounded-lg transition-colors p-2"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => openEditProblemModal(p)}>
                                  <Pencil className="w-4 h-4 mr-2" />
                                  {t('common.edit')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  variant="destructive"
                                  disabled={deletingProblemId === p.id}
                                  onSelect={() => setDeleteConfirm({ type: 'problem', id: p.id })}
                                >
                                  {deletingProblemId === p.id ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4 mr-2" />
                                  )}
                                  {t('common.delete')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>

          {/* 문제 페이지네이션 */}
          <div className="flex items-center justify-center mt-6">
            <PageNav page={problemPage} totalPages={problemTotalPages} onPageChange={setProblemPage} />
          </div>
          </>
        )}
      </div>

      {/* 삭제 확인 모달 */}
      {deleteConfirm?.type === 'problem' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-surface-overlay rounded-xl shadow-2xl border border-border-subtle/50 w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">{t('common.deleteConfirmTitle')}</h3>
            </div>
            <p className="text-sm text-text-faint">{t('problems.confirmDeleteProblem')}</p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>{t('common.cancel')}</Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
                onClick={() => { handleDeleteProblem(deleteConfirm.id); setDeleteConfirm(null); }}
              >
                {t('common.delete')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 문제 수정 모달 */}
      <Modal isOpen={!!editProblemTarget} onClose={closeEditProblemModal} title={t('problems.editProblem')}>
        <div className="space-y-6">
          <div className="flex items-center gap-3 bg-surface-subtle/50 rounded-lg px-4 py-3">
            <span className="text-xs font-bold text-text-muted bg-surface-subtle rounded px-2 py-1 font-mono">{editProblemTarget?.problemNumber}</span>
            <span className="text-base font-bold text-text-secondary">{editProblemTarget?.title}</span>
          </div>

          {/* 마감일 */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-text-muted">{t('problems.deadlineLabel')}</label>
            <div className="relative">
              <DateTimePicker
                value={editDeadline}
                onChange={(v) => setEditDeadline(v)}
                ampm={false}
                format={t('problems.dateFormat')}
                minDateTime={dayjs()}
                slotProps={{
                  textField: { fullWidth: true, size: 'small' },
                }}
                sx={!editDeadline ? {
                  '& .MuiPickersSectionList-root': { color: 'transparent' },
                } : undefined}
              />
              {!editDeadline && (
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-faint pointer-events-none text-sm">
                  {t('problems.deadlinePlaceholder')}
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
              <label className="text-sm text-text-secondary">{t('problems.reminderLabel')}</label>
            </div>

            {editReminderEnabled && editDeadline && (
              <Select
                value={String(editReminderHours)}
                onValueChange={(v) => setEditReminderHours(Number(v))}
              >
                <SelectTrigger className="w-40 bg-input-bg border-border-default">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{t('reminder.1hour')}</SelectItem>
                  <SelectItem value="2">{t('reminder.2hours')}</SelectItem>
                  <SelectItem value="3">{t('reminder.3hours')}</SelectItem>
                  <SelectItem value="6">{t('reminder.6hours')}</SelectItem>
                  <SelectItem value="12">{t('reminder.12hours')}</SelectItem>
                  <SelectItem value="24">{t('reminder.24hours')}</SelectItem>
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
            <Button type="button" variant="ghost" onClick={closeEditProblemModal}>{t('common.cancel')}</Button>
            <Button onClick={handleEditProblem} disabled={editingProblem}>
              {editingProblem ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              {editingProblem ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
