import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Base';
import { useRecoilState } from 'recoil';
import { userState } from '@/store/atoms';
import { getMe, updateMe, deleteMe, getProfileImagePresignedUrl } from '@/api/user';
import { parseApiError } from '@/utils/error';
import { AlertTriangle } from 'lucide-react';
import { useT } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';

export const ProfileTab = () => {
  const [user, setUser] = useRecoilState(userState);
  const { logout } = useAuth();

  // Profile form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [baekjoonId, setBaekjoonId] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  // 원본값 (변경 감지용)
  const [originalName, setOriginalName] = useState('');
  const [originalBaekjoonId, setOriginalBaekjoonId] = useState('');
  const [originalImageUrl, setOriginalImageUrl] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<'success' | 'error' | null>(null);
  const [saveError, setSaveError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useT();

  // Account deletion state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const normalizeBojId = (value?: string | null) => String(value ?? '').trim();

  // Load user profile on mount
  useEffect(() => {
    getMe().then(data => {
      const normalizedBojId = normalizeBojId(data.baekjoonId);
      setName(data.name);
      setEmail(data.email);
      setProfileImageUrl(data.profileImageUrl ?? '');
      setBaekjoonId(normalizedBojId);
      setOriginalName(data.name);
      setOriginalBaekjoonId(normalizedBojId);
      setOriginalImageUrl(data.profileImageUrl ?? '');
      // Recoil 업데이트 → authStorageEffect가 localStorage 자동 동기화
      setUser(prev => ({
        ...prev,
        id: data.id,
        name: data.name,
        email: data.email,
        profileImageUrl: data.profileImageUrl ?? '',
        baekjoonId: normalizedBojId,
        provider: data.provider,
      }));
    }).catch(err => {
      console.error('Failed to load profile:', err);
    });
  }, [setUser]);

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setSaveResult('error');
      setSaveError(t('settings.profile.fileTypeError'));
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (file.size > MAX_SIZE) {
      setSaveResult('error');
      setSaveError(t('settings.profile.fileSizeError'));
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setPendingFile(file);
    setImageRemoved(false);
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPreviewUrl('');
    setProfileImageUrl('');
    setPendingFile(null);
    setImageRemoved(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveResult(null);
    setSaveError('');
    try {
      const normalizedBaekjoonId = baekjoonId.trim();
      const normalizedOriginalBaekjoonId = originalBaekjoonId.trim();

      // 공백-only 입력은 프론트에서 즉시 차단
      if (baekjoonId.length > 0 && !normalizedBaekjoonId) {
        setSaveResult('error');
        setSaveError(t('settings.profile.baekjoonWhitespaceError'));
        return;
      }

      // 변경된 필드만 전송
      const requestBody: Record<string, string | null> = {};
      if (name !== originalName) requestBody.name = name;
      if (normalizedBaekjoonId !== normalizedOriginalBaekjoonId) {
        requestBody.baekjoonId = normalizedBaekjoonId || null;
      }

      if (imageRemoved) {
        requestBody.profileImageUrl = null;
      } else if (pendingFile) {
        // 1. presigned URL 발급
        const { presignedUrl, imageUrl } = await getProfileImagePresignedUrl(
          pendingFile.size,
          pendingFile.type,
        );
        // 2. S3에 직접 업로드
        const uploadRes = await fetch(presignedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': pendingFile.type },
          body: pendingFile,
        });
        if (!uploadRes.ok) {
          throw new Error('이미지 업로드에 실패했습니다.');
        }
        // 3. 반환받은 imageUrl을 updateMe에 전달
        requestBody.profileImageUrl = imageUrl;
      }

      const updated = await updateMe(requestBody);
      // Recoil 업데이트 → authStorageEffect가 localStorage 자동 동기화
      const updatedBojId = normalizeBojId(updated.baekjoonId);
      setUser(prev => ({
        ...prev,
        name: updated.name,
        profileImageUrl: updated.profileImageUrl ?? '',
        baekjoonId: updatedBojId,
      }));
      setProfileImageUrl(updated.profileImageUrl ?? '');
      setBaekjoonId(updatedBojId);
      setPreviewUrl('');
      setPendingFile(null);
      setImageRemoved(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      // 원본값 갱신
      setOriginalName(updated.name);
      setOriginalBaekjoonId(updatedBojId);
      setOriginalImageUrl(updated.profileImageUrl ?? '');
      setSaveResult('success');
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      setSaveResult('error');
      setSaveError(parseApiError(err, '요청에 실패했습니다.'));
    } finally {
      setSaving(false);
      setTimeout(() => setSaveResult(null), 3000);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteMe();
      await logout();
    } catch (err: any) {
      setDeleteError(parseApiError(err, '계정 삭제에 실패했습니다.'));
    } finally {
      setDeleting(false);
    }
  };

  // Determine avatar display
  const avatarSrc = previewUrl || profileImageUrl;
  const nameInitial = name ? name.charAt(0).toUpperCase() : '?';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <h2 className="text-xl font-bold text-text-primary pb-4 border-b border-border-default">{t('settings.profile.title')}</h2>

      <div className="flex items-start gap-6">
        <div className="w-24 h-24 rounded-full bg-surface-subtle overflow-hidden flex-shrink-0 flex items-center justify-center">
          {avatarSrc ? (
            <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-bold text-text-muted">{nameInitial}</span>
          )}
        </div>
        <div className="space-y-4 flex-1">
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>{t('settings.profile.changePhoto')}</Button>
            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={handleRemovePhoto}>{t('settings.profile.removePhoto')}</Button>
          </div>
          <p className="text-xs text-text-faint">{t('settings.profile.photoDesc')}</p>
        </div>
      </div>

      <div className="space-y-4 max-w-md">
        <h3 className="text-sm font-bold text-text-secondary">{t('settings.profile.basicInfo')}</h3>
        <div>
          <label className="block text-xs font-bold text-text-faint mb-1">{t('settings.profile.email')}</label>
          <input type="email" value={email} disabled className="w-full bg-surface-subtle border border-border-subtle rounded px-3 py-1.5 text-sm text-text-faint cursor-not-allowed" />
        </div>
        <div>
          <label className="block text-xs font-bold text-text-faint mb-1">{t('settings.profile.name')}</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-input-bg border border-border-subtle rounded px-3 py-1.5 text-sm text-text-secondary focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" />
        </div>
      </div>

      <div className="pt-2 space-y-4 max-w-md">
        <h3 className="text-sm font-bold text-text-secondary">{t('settings.profile.linkedAccounts')}</h3>
        <div>
          <label className="block text-xs font-bold text-text-faint mb-1">{t('settings.profile.baekjoonId')}</label>
          <input
            type="text"
            value={baekjoonId}
            onChange={e => setBaekjoonId(e.target.value)}
            onBlur={() => setBaekjoonId(prev => prev.trim())}
            placeholder={t('settings.profile.baekjoonPlaceholder')}
            className="w-full bg-input-bg border border-border-subtle rounded px-3 py-1.5 text-sm text-text-secondary focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
          />
          <p className="text-[11px] text-text-faint mt-1">{t('settings.profile.baekjoonDesc')}</p>
        </div>
        <div className="space-y-2 pt-2">
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? t('common.saving') : saveResult === 'success' ? t('common.saved') : saveResult === 'error' ? t('common.saveFailed') : t('common.save')}
          </Button>
          {saveError && (
            <p className="text-xs text-red-500">{saveError}</p>
          )}
        </div>
      </div>

      <div className="pt-6 border-t border-red-500/20">
        <h3 className="text-sm font-bold text-red-500 mb-4">{t('settings.profile.dangerZone')}</h3>
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-text-secondary">{t('settings.profile.deleteAccount')}</div>
            <div className="text-xs text-text-faint mt-0.5">{t('settings.profile.deleteAccountDesc')}</div>
          </div>
          <Button
            variant="ghost"
            className="text-red-500 hover:text-white hover:bg-red-600 border border-red-500/30 ml-4 flex-shrink-0"
            onClick={() => { setShowDeleteModal(true); setDeleteConfirmEmail(''); setDeleteError(''); }}
          >
            {t('settings.profile.deleteAccount')}
          </Button>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => !deleting && setShowDeleteModal(false)}>
          <div className="bg-surface-overlay rounded-xl shadow-2xl border border-border-subtle/50 w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">{t('settings.profile.deleteAccount')}</h3>
            </div>

            <p className="text-sm text-text-faint">
              {t('settings.profile.irreversible')}
            </p>

            <div>
              <label className="block text-xs font-medium text-text-faint mb-1.5">
                {t('settings.profile.deleteEmailLabel', { email })}
              </label>
              <input
                type="email"
                value={deleteConfirmEmail}
                onChange={e => setDeleteConfirmEmail(e.target.value)}
                placeholder={email}
                className="w-full bg-input-bg border border-border-subtle rounded px-3 py-1.5 text-sm text-text-secondary focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                autoFocus
              />
            </div>

            {deleteError && (
              <p className="text-xs text-red-500 bg-red-500/10 rounded px-3 py-2">{deleteError}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                {t('common.cancel')}
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={deleteConfirmEmail !== email || deleting}
                onClick={handleDeleteAccount}
              >
                {deleting ? t('settings.profile.deleting') : t('settings.profile.deleteAccount')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
