import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Base';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { useNavigate } from 'react-router-dom';
import { userState, workspacesState, currentWorkspaceState } from '@/store/atoms';
import { getMe, updateMe, deleteMe } from '@/api/user';
import { extractErrorDetail } from './utils';
import { AlertTriangle } from 'lucide-react';

export const ProfileTab = () => {
  const navigate = useNavigate();
  const [user, setUser] = useRecoilState(userState);
  const setWorkspaces = useSetRecoilState(workspacesState);
  const setCurrentWorkspaceId = useSetRecoilState(currentWorkspaceState);

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
  const [imageRemoved, setImageRemoved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<'success' | 'error' | null>(null);
  const [saveError, setSaveError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Account deletion state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Load user profile on mount
  useEffect(() => {
    getMe().then(data => {
      setName(data.name);
      setEmail(data.email);
      setProfileImageUrl(data.profileImageUrl ?? '');
      setBaekjoonId(data.baekjoonId ?? '');
      setOriginalName(data.name);
      setOriginalBaekjoonId(data.baekjoonId ?? '');
      setOriginalImageUrl(data.profileImageUrl ?? '');
      // Recoil + localStorage도 동기화
      setUser(prev => {
        const next = {
          ...prev,
          name: data.name,
          profileImageUrl: data.profileImageUrl ?? '',
          baekjoonId: data.baekjoonId ?? '',
        };
        try {
          const stored = localStorage.getItem('auth');
          if (stored) {
            const parsed = JSON.parse(stored);
            localStorage.setItem('auth', JSON.stringify({
              ...parsed,
              name: next.name,
              profileImageUrl: next.profileImageUrl,
              baekjoonId: next.baekjoonId,
            }));
          }
        } catch { /* ignore */ }
        return next;
      });
    }).catch(err => {
      console.error('Failed to load profile:', err);
    });
  }, [setUser]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPreviewUrl('');
    setProfileImageUrl('');
    setImageRemoved(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveResult(null);
    setSaveError('');
    try {
      // 변경된 필드만 전송
      const requestBody: Record<string, string | null> = {};
      if (name !== originalName) requestBody.name = name;
      if (baekjoonId !== originalBaekjoonId) requestBody.baekjoonId = baekjoonId || null;
      if (imageRemoved) {
        requestBody.profileImageUrl = null;
      } else if (profileImageUrl !== originalImageUrl) {
        requestBody.profileImageUrl = profileImageUrl || null;
      }
      const updated = await updateMe(requestBody);
      // API 성공 → Recoil + localStorage 동기화
      setUser(prev => {
        const next = {
          ...prev,
          name: updated.name,
          profileImageUrl: updated.profileImageUrl ?? '',
          baekjoonId: updated.baekjoonId ?? '',
        };
        try {
          const stored = localStorage.getItem('auth');
          if (stored) {
            const parsed = JSON.parse(stored);
            localStorage.setItem('auth', JSON.stringify({
              ...parsed,
              name: next.name,
              profileImageUrl: next.profileImageUrl,
              baekjoonId: next.baekjoonId,
            }));
          }
        } catch { /* ignore */ }
        return next;
      });
      setProfileImageUrl(updated.profileImageUrl ?? '');
      setPreviewUrl('');
      setImageRemoved(false);
      // 원본값 갱신
      setOriginalName(updated.name);
      setOriginalBaekjoonId(updated.baekjoonId ?? '');
      setOriginalImageUrl(updated.profileImageUrl ?? '');
      setSaveResult('success');
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      setSaveResult('error');
      setSaveError(err?.message || String(err));
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
      localStorage.removeItem('auth');
      setUser({ isLoggedIn: false, name: 'Guest', email: '', avatar: '', profileImageUrl: '', baekjoonId: '', accessToken: '', refreshToken: '' });
      setWorkspaces([]);
      setCurrentWorkspaceId(0);
      navigate('/login');
    } catch (err: any) {
      setDeleteError(extractErrorDetail(err, '계정 삭제에 실패했습니다.'));
    } finally {
      setDeleting(false);
    }
  };

  // Determine avatar display
  const avatarSrc = previewUrl || profileImageUrl;
  const nameInitial = name ? name.charAt(0).toUpperCase() : '?';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 pb-4 border-b border-slate-200 dark:border-slate-800">내 프로필</h2>

      <div className="flex items-start gap-6">
        <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
          {avatarSrc ? (
            <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-bold text-slate-500 dark:text-slate-400">{nameInitial}</span>
          )}
        </div>
        <div className="space-y-4 flex-1">
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>사진 변경</Button>
            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={handleRemovePhoto}>제거</Button>
          </div>
          <p className="text-xs text-slate-500">최대 5MB의 JPG, GIF 또는 PNG 형식을 지원합니다.</p>
        </div>
      </div>

      <div className="space-y-4 max-w-md">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">기본 정보</h3>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">이메일</label>
          <input type="email" value={email} disabled className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-3 py-1.5 text-sm text-slate-500 cursor-not-allowed" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">이름</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-1.5 text-sm text-slate-900 dark:text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" />
        </div>
      </div>

      <div className="pt-2 space-y-4 max-w-md">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">연동 계정</h3>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">백준 아이디</label>
          <input type="text" value={baekjoonId} onChange={e => setBaekjoonId(e.target.value)} placeholder="백준 아이디를 입력하세요" className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-1.5 text-sm text-slate-900 dark:text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" />
          <p className="text-[11px] text-slate-400 mt-1">solved.ac 티어 연동에 사용됩니다.</p>
        </div>
        <div className="space-y-2 pt-2">
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '저장 중...' : saveResult === 'success' ? '저장됨' : saveResult === 'error' ? '저장 실패' : '저장'}
          </Button>
          {saveError && (
            <p className="text-xs text-red-500">{saveError}</p>
          )}
        </div>
      </div>

      <div className="pt-6 border-t border-red-200 dark:border-red-500/20">
        <h3 className="text-sm font-bold text-red-500 mb-4">위험 구역</h3>
        <div className="rounded-lg border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5 p-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-slate-900 dark:text-slate-200">계정 삭제</div>
            <div className="text-xs text-slate-500 mt-0.5">계정을 삭제하면 모든 데이터가 영구적으로 제거됩니다.</div>
          </div>
          <Button
            variant="ghost"
            className="text-red-500 hover:text-white hover:bg-red-600 border border-red-300 dark:border-red-500/30 ml-4 flex-shrink-0"
            onClick={() => { setShowDeleteModal(true); setDeleteConfirmEmail(''); setDeleteError(''); }}
          >
            계정 삭제
          </Button>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => !deleting && setShowDeleteModal(false)}>
          <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-2xl border border-slate-700/50 w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">계정 삭제</h3>
            </div>

            <p className="text-sm text-slate-500">
              이 작업은 되돌릴 수 없습니다. 모든 데이터가 영구 삭제됩니다.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                확인을 위해 이메일(<span className="font-bold text-slate-700 dark:text-slate-300">{email}</span>)을 입력하세요
              </label>
              <input
                type="email"
                value={deleteConfirmEmail}
                onChange={e => setDeleteConfirmEmail(e.target.value)}
                placeholder={email}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-1.5 text-sm text-slate-900 dark:text-slate-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                autoFocus
              />
            </div>

            {deleteError && (
              <p className="text-xs text-red-500 bg-red-50 dark:bg-red-500/10 rounded px-3 py-2">{deleteError}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                취소
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={deleteConfirmEmail !== email || deleting}
                onClick={handleDeleteAccount}
              >
                {deleting ? '삭제 중...' : '계정 삭제'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
