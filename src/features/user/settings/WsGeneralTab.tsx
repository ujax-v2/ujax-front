import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Base';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { currentWorkspaceState, workspacesState, settingsTabState } from '@/store/atoms';
import { getWorkspaceSettings, updateWorkspace, deleteWorkspace, leaveWorkspace, getMyMembership, updateMyNickname } from '@/api/workspace';
import { extractErrorDetail } from './utils';
import { AlertTriangle, LogOut } from 'lucide-react';
import { useT } from '@/i18n';

export const WsGeneralTab = () => {
  const currentWorkspaceId = useRecoilValue(currentWorkspaceState);
  const workspaces = useRecoilValue(workspacesState);
  const setWorkspaces = useSetRecoilState(workspacesState);
  const setCurrentWorkspaceId = useSetRecoilState(currentWorkspaceState);
  const setActiveTab = useSetRecoilState(settingsTabState);
  const t = useT();

  // Workspace general settings state
  const [wsName, setWsName] = useState('');
  const [wsDescription, setWsDescription] = useState('');
  const [wsMmWebhookUrl, setWsMmWebhookUrl] = useState('');
  const [wsOriginalName, setWsOriginalName] = useState('');
  const [wsOriginalDescription, setWsOriginalDescription] = useState('');
  const [wsOriginalMmWebhookUrl, setWsOriginalMmWebhookUrl] = useState('');
  const [wsNickname, setWsNickname] = useState('');
  const [wsOriginalNickname, setWsOriginalNickname] = useState('');
  const [wsNickSaving, setWsNickSaving] = useState(false);
  const [wsNickSaveResult, setWsNickSaveResult] = useState<'success' | 'error' | null>(null);
  const [wsNickSaveError, setWsNickSaveError] = useState('');
  const [wsSaving, setWsSaving] = useState(false);
  const [wsSaveResult, setWsSaveResult] = useState<'success' | 'error' | null>(null);
  const [wsSaveError, setWsSaveError] = useState('');
  const [showWsDeleteModal, setShowWsDeleteModal] = useState(false);
  const [wsDeleteConfirmName, setWsDeleteConfirmName] = useState('');
  const [wsDeleting, setWsDeleting] = useState(false);
  const [wsDeleteError, setWsDeleteError] = useState('');
  const [showWsLeaveModal, setShowWsLeaveModal] = useState(false);
  const [wsLeaving, setWsLeaving] = useState(false);
  const [wsLeaveError, setWsLeaveError] = useState('');

  // Load workspace settings + my nickname
  useEffect(() => {
    if (!currentWorkspaceId) return;
    getWorkspaceSettings(currentWorkspaceId).then(data => {
      setWsName(data.name ?? '');
      setWsDescription(data.description ?? '');
      setWsMmWebhookUrl(data.mmWebhookUrl ?? '');
      setWsOriginalName(data.name ?? '');
      setWsOriginalDescription(data.description ?? '');
      setWsOriginalMmWebhookUrl(data.mmWebhookUrl ?? '');
    }).catch(err => {
      console.error('Failed to load workspace settings:', err);
    });
    getMyMembership(currentWorkspaceId).then(data => {
      setWsNickname(data.nickname ?? '');
      setWsOriginalNickname(data.nickname ?? '');
    }).catch(err => {
      console.error('Failed to load membership:', err);
    });
  }, [currentWorkspaceId]);

  const handleWsSave = async () => {
    if (!currentWorkspaceId) return;
    setWsSaving(true);
    setWsSaveResult(null);
    setWsSaveError('');
    try {
      const body: Record<string, string | null> = {};
      if (wsName !== wsOriginalName) body.name = wsName;
      if (wsDescription !== wsOriginalDescription) body.description = wsDescription || null;
      if (wsMmWebhookUrl !== wsOriginalMmWebhookUrl) body.mmWebhookUrl = wsMmWebhookUrl || null;
      if (Object.keys(body).length === 0) {
        setWsSaveResult('success');
        setWsSaving(false);
        setTimeout(() => setWsSaveResult(null), 3000);
        return;
      }
      const updated = await updateWorkspace(currentWorkspaceId, body);
      setWsOriginalName(updated.name ?? '');
      setWsOriginalDescription(updated.description ?? '');
      setWsOriginalMmWebhookUrl(wsMmWebhookUrl);
      setWorkspaces(prev => prev.map(w => w.id === currentWorkspaceId ? { ...w, name: updated.name ?? w.name, description: updated.description ?? null } : w));
      setWsSaveResult('success');
    } catch (err: any) {
      setWsSaveResult('error');
      setWsSaveError(extractErrorDetail(err, '저장에 실패했습니다.'));
    } finally {
      setWsSaving(false);
      setTimeout(() => setWsSaveResult(null), 3000);
    }
  };

  const handleWsNickSave = async () => {
    if (!currentWorkspaceId) return;
    setWsNickSaving(true);
    setWsNickSaveResult(null);
    setWsNickSaveError('');
    try {
      if (wsNickname === wsOriginalNickname) {
        setWsNickSaveResult('success');
        setWsNickSaving(false);
        setTimeout(() => setWsNickSaveResult(null), 3000);
        return;
      }
      const memberUpdated = await updateMyNickname(currentWorkspaceId, wsNickname);
      setWsOriginalNickname(memberUpdated.nickname ?? '');
      setWsNickSaveResult('success');
    } catch (err: any) {
      setWsNickSaveResult('error');
      setWsNickSaveError(extractErrorDetail(err, '닉네임 저장에 실패했습니다.'));
    } finally {
      setWsNickSaving(false);
      setTimeout(() => setWsNickSaveResult(null), 3000);
    }
  };

  const handleWsDelete = async () => {
    if (!currentWorkspaceId) return;
    setWsDeleting(true);
    setWsDeleteError('');
    try {
      await deleteWorkspace(currentWorkspaceId);
      setWorkspaces(prev => prev.filter(w => w.id !== currentWorkspaceId));
      const remaining = workspaces.filter(w => w.id !== currentWorkspaceId);
      setCurrentWorkspaceId(remaining[0]?.id ?? 0);
      setShowWsDeleteModal(false);
      setActiveTab('profile');
    } catch (err: any) {
      setWsDeleteError(extractErrorDetail(err, '워크스페이스 삭제에 실패했습니다.'));
    } finally {
      setWsDeleting(false);
    }
  };

  const handleWsLeave = async () => {
    if (!currentWorkspaceId) return;
    setWsLeaving(true);
    setWsLeaveError('');
    try {
      await leaveWorkspace(currentWorkspaceId);
      setWorkspaces(prev => prev.filter(w => w.id !== currentWorkspaceId));
      const remaining = workspaces.filter(w => w.id !== currentWorkspaceId);
      setCurrentWorkspaceId(remaining[0]?.id ?? 0);
      setShowWsLeaveModal(false);
      setActiveTab('profile');
    } catch (err: any) {
      setWsLeaveError(extractErrorDetail(err, '워크스페이스 나가기에 실패했습니다.'));
    } finally {
      setWsLeaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <h2 className="text-xl font-bold text-text-primary pb-4 border-b border-border-default">{t('settings.wsGeneral.title')}</h2>

      <div className="space-y-4 max-w-md">
        <h3 className="text-sm font-bold text-text-secondary">{t('settings.wsGeneral.wsInfo')}</h3>
        <div>
          <label className="block text-xs font-bold text-text-faint mb-1">{t('settings.wsGeneral.name')}</label>
          <input type="text" value={wsName} onChange={e => setWsName(e.target.value)} className="w-full bg-input-bg border border-border-subtle rounded px-3 py-1.5 text-sm text-text-secondary focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" />
        </div>
        <div>
          <label className="block text-xs font-bold text-text-faint mb-1">{t('settings.wsGeneral.description')}</label>
          <input type="text" value={wsDescription} onChange={e => setWsDescription(e.target.value)} placeholder={t('settings.wsGeneral.descPlaceholder')} className="w-full bg-input-bg border border-border-subtle rounded px-3 py-1.5 text-sm text-text-secondary focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" />
        </div>
      </div>

      <div className="pt-2 space-y-4 max-w-md">
        <h3 className="text-sm font-bold text-text-secondary">{t('settings.wsGeneral.integration')}</h3>
        <div>
          <label className="block text-xs font-bold text-text-faint mb-1">Mattermost Webhook URL</label>
          <input type="text" value={wsMmWebhookUrl} onChange={e => setWsMmWebhookUrl(e.target.value)} placeholder="https://mattermost.example.com/hooks/..." className="w-full bg-input-bg border border-border-subtle rounded px-3 py-1.5 text-sm text-text-secondary focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" />
          <p className="text-[11px] text-text-faint mt-1">{t('settings.wsGeneral.mmWebhookDesc')}</p>
        </div>
        <div className="space-y-2 pt-2">
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6"
            onClick={handleWsSave}
            disabled={wsSaving}
          >
            {wsSaving ? t('common.saving') : wsSaveResult === 'success' ? t('common.saved') : wsSaveResult === 'error' ? t('common.saveFailed') : t('common.save')}
          </Button>
          {wsSaveError && (
            <p className="text-xs text-red-500">{wsSaveError}</p>
          )}
        </div>
      </div>

      <div className="pt-6 border-t border-border-default space-y-4 max-w-md">
        <h3 className="text-sm font-bold text-text-secondary">{t('settings.wsGeneral.mySettings')}</h3>
        <div>
          <label className="block text-xs font-bold text-text-faint mb-1">{t('settings.wsGeneral.nickname')}</label>
          <input type="text" value={wsNickname} onChange={e => setWsNickname(e.target.value)} placeholder={t('settings.wsGeneral.nicknamePlaceholder')} className="w-full bg-input-bg border border-border-subtle rounded px-3 py-1.5 text-sm text-text-secondary focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" />
          <p className="text-[11px] text-text-faint mt-1">{t('settings.wsGeneral.nicknameDesc')}</p>
        </div>
        <div className="space-y-2 pt-2">
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6"
            onClick={handleWsNickSave}
            disabled={wsNickSaving}
          >
            {wsNickSaving ? t('common.saving') : wsNickSaveResult === 'success' ? t('common.saved') : wsNickSaveResult === 'error' ? t('common.saveFailed') : t('common.save')}
          </Button>
          {wsNickSaveError && (
            <p className="text-xs text-red-500">{wsNickSaveError}</p>
          )}
        </div>
      </div>

      <div className="pt-6 border-t border-red-500/20">
        <h3 className="text-sm font-bold text-red-500 mb-4">{t('settings.wsGeneral.dangerZone')}</h3>
        <div className="space-y-3">
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-text-secondary">{t('settings.wsGeneral.leaveWorkspace')}</div>
              <div className="text-xs text-text-faint mt-0.5">{t('settings.wsGeneral.leaveWorkspaceDesc')}</div>
            </div>
            <Button
              variant="ghost"
              className="text-red-500 hover:text-white hover:bg-red-600 border border-red-500/30 ml-4 flex-shrink-0"
              onClick={() => { setShowWsLeaveModal(true); setWsLeaveError(''); }}
            >
              <LogOut className="w-4 h-4 mr-1.5" />{t('settings.wsGeneral.leave')}
            </Button>
          </div>
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-text-secondary">{t('settings.wsGeneral.deleteWorkspace')}</div>
              <div className="text-xs text-text-faint mt-0.5">{t('settings.wsGeneral.wsDeleteDesc')}</div>
            </div>
            <Button
              variant="ghost"
              className="text-red-500 hover:text-white hover:bg-red-600 border border-red-500/30 ml-4 flex-shrink-0"
              onClick={() => { setShowWsDeleteModal(true); setWsDeleteConfirmName(''); setWsDeleteError(''); }}
            >
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </div>

      {/* 워크스페이스 나가기 모달 */}
      {showWsLeaveModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => !wsLeaving && setShowWsLeaveModal(false)}>
          <div className="bg-surface-overlay rounded-xl shadow-2xl border border-border-subtle/50 w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <LogOut className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">{t('settings.wsGeneral.leaveConfirm')}</h3>
            </div>

            <p className="text-sm text-text-faint">
              {t('settings.wsGeneral.leaveNameConfirm', { name: wsName })}
            </p>

            {wsLeaveError && (
              <p className="text-xs text-red-500 bg-red-500/10 rounded px-3 py-2">{wsLeaveError}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setShowWsLeaveModal(false)} disabled={wsLeaving}>{t('common.cancel')}</Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleWsLeave}
                disabled={wsLeaving}
              >
                {wsLeaving ? t('settings.wsGeneral.leaving') : t('settings.wsGeneral.leave')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 워크스페이스 삭제 모달 */}
      {showWsDeleteModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => !wsDeleting && setShowWsDeleteModal(false)}>
          <div className="bg-surface-overlay rounded-xl shadow-2xl border border-border-subtle/50 w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">{t('settings.wsGeneral.deleteConfirm')}</h3>
            </div>

            <p className="text-sm text-text-faint">
              {t('settings.wsGeneral.deleteConfirmIrreversible')}
            </p>

            <div>
              <label className="block text-xs font-medium text-text-faint mb-1.5">
                {t('settings.wsGeneral.deleteConfirmLabel', { name: wsName })}
              </label>
              <input
                type="text"
                value={wsDeleteConfirmName}
                onChange={e => setWsDeleteConfirmName(e.target.value)}
                placeholder={wsName}
                className="w-full bg-input-bg border border-border-subtle rounded px-3 py-1.5 text-sm text-text-secondary focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                autoFocus
              />
            </div>

            {wsDeleteError && (
              <p className="text-xs text-red-500 bg-red-500/10 rounded px-3 py-2">{wsDeleteError}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setShowWsDeleteModal(false)} disabled={wsDeleting}>{t('common.cancel')}</Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={wsDeleteConfirmName !== wsName || wsDeleting}
                onClick={handleWsDelete}
              >
                {wsDeleting ? t('settings.wsGeneral.deleting') : t('settings.wsGeneral.deleteButton')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
