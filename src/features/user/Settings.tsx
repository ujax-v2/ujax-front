import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Base';
import { useRecoilValue, useRecoilState, useSetRecoilState } from 'recoil';
import { useNavigate } from 'react-router-dom';
import { currentWorkspaceState, workspacesState, settingsTabState, userState } from '@/store/atoms';
import { getMe, updateMe, deleteMe } from '@/api/user';
import { getWorkspaceSettings, updateWorkspace, deleteWorkspace, leaveWorkspace, getMyMembership, updateMyNickname, getWorkspaceMembers, inviteMember, updateMemberRole, removeMember } from '@/api/workspace';
import type { WorkspaceMemberResponse } from '@/api/workspace';
import {
  User,
  Bell,
  Settings as SettingsIcon,
  Users,
  Globe,
  Database,
  X,
  UserPlus,
  Github,
  Trello,
  Slack,
  FileUp,
  AlertTriangle,
  LogOut,
  MoreHorizontal,
} from 'lucide-react';

export const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useRecoilState(settingsTabState);
  const currentWorkspaceId = useRecoilValue(currentWorkspaceState);
  const workspaces = useRecoilValue(workspacesState);
  const setWorkspaces = useSetRecoilState(workspacesState);
  const setCurrentWorkspaceId = useSetRecoilState(currentWorkspaceState);
  const [user, setUser] = useRecoilState(userState);

  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId) || workspaces[0];

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

  // Members tab state
  const [members, setMembers] = useState<WorkspaceMemberResponse[]>([]);
  const [myMemberId, setMyMemberId] = useState<number>(0);
  const [myRole, setMyRole] = useState<string>('MEMBER');
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberMenuOpen, setMemberMenuOpen] = useState<number | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);
  const [removingMember, setRemovingMember] = useState<WorkspaceMemberResponse | null>(null);
  const [removingLoading, setRemovingLoading] = useState(false);
  const [removeMemberError, setRemoveMemberError] = useState('');
  const [showRoleChangeModal, setShowRoleChangeModal] = useState(false);
  const [roleChangeMember, setRoleChangeMember] = useState<WorkspaceMemberResponse | null>(null);
  const [roleChangeTarget, setRoleChangeTarget] = useState<string>('MEMBER');
  const [roleChangeLoading, setRoleChangeLoading] = useState(false);
  const [roleChangeError, setRoleChangeError] = useState('');

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

  // Reset activeTab to 'profile' if on ws-* tab and no workspaces
  useEffect(() => {
    if (workspaces.length === 0 && activeTab.startsWith('ws-')) {
      setActiveTab('profile');
    }
  }, [workspaces.length, activeTab, setActiveTab]);

  // Load workspace settings + my nickname when ws-general tab is active
  useEffect(() => {
    if (activeTab !== 'ws-general' || !currentWorkspaceId) return;
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
  }, [activeTab, currentWorkspaceId]);

  // Load members when ws-members tab is active
  const loadMembers = async () => {
    if (!currentWorkspaceId) return;
    setMembersLoading(true);
    try {
      const [membersData, myData] = await Promise.all([
        getWorkspaceMembers(currentWorkspaceId),
        getMyMembership(currentWorkspaceId),
      ]);
      setMembers(membersData.items ?? []);
      setMyMemberId(myData.workspaceMemberId ?? 0);
      setMyRole(myData.role ?? 'MEMBER');
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'ws-members' || !currentWorkspaceId) return;
    loadMembers();
  }, [activeTab, currentWorkspaceId]);

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

  /** authFetch 에러에서 detail 메시지를 추출한다 (CLAUDE.md 규칙) */
  const extractErrorDetail = (err: any, fallback: string): string => {
    const msg = err?.message || '';
    const jsonMatch = msg.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]).detail || fallback;
      } catch { /* ignore */ }
    }
    return fallback;
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

  const handleInvite = async () => {
    if (!currentWorkspaceId || !inviteEmail.trim()) return;
    setInviting(true);
    setInviteError('');
    setInviteSuccess(false);
    try {
      await inviteMember(currentWorkspaceId, inviteEmail.trim());
      setInviteSuccess(true);
      setInviteEmail('');
      await loadMembers();
      setTimeout(() => { setShowInviteModal(false); setInviteSuccess(false); }, 1200);
    } catch (err: any) {
      setInviteError(extractErrorDetail(err, '초대에 실패했습니다.'));
    } finally {
      setInviting(false);
    }
  };

  const confirmRoleChange = (member: WorkspaceMemberResponse, newRole: string) => {
    setRoleChangeMember(member);
    setRoleChangeTarget(newRole);
    setRoleChangeError('');
    setShowRoleChangeModal(true);
  };

  const handleRoleChange = async () => {
    if (!currentWorkspaceId || !roleChangeMember) return;
    setRoleChangeLoading(true);
    setRoleChangeError('');
    try {
      await updateMemberRole(currentWorkspaceId, roleChangeMember.workspaceMemberId!, roleChangeTarget as 'OWNER' | 'ADMIN' | 'MEMBER');
      setShowRoleChangeModal(false);
      await loadMembers();
    } catch (err: any) {
      setRoleChangeError(extractErrorDetail(err, '역할 변경에 실패했습니다.'));
    } finally {
      setRoleChangeLoading(false);
    }
  };

  const confirmRemoveMember = (member: WorkspaceMemberResponse) => {
    setRemovingMember(member);
    setRemoveMemberError('');
    setShowRemoveMemberModal(true);
  };

  const handleRemoveMember = async () => {
    if (!currentWorkspaceId || !removingMember) return;
    setRemovingLoading(true);
    setRemoveMemberError('');
    try {
      await removeMember(currentWorkspaceId, removingMember.workspaceMemberId!);
      setShowRemoveMemberModal(false);
      await loadMembers();
    } catch (err: any) {
      setRemoveMemberError(extractErrorDetail(err, '멤버 제거에 실패했습니다.'));
    } finally {
      setRemovingLoading(false);
    }
  };

  const roleLabel = (role?: string) => {
    switch (role) {
      case 'OWNER': return '소유자';
      case 'MANAGER': return '매니저';
      default: return '멤버';
    }
  };

  const roleBadgeClass = (role?: string) => {
    switch (role) {
      case 'OWNER': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
      case 'MANAGER': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400';
      default: return 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400';
    }
  };

  // Determine avatar display
  const avatarSrc = previewUrl || profileImageUrl;
  const nameInitial = name ? name.charAt(0).toUpperCase() : '?';

  const accountTabs = [
    { id: 'profile', label: '내 프로필', icon: User },
    { id: 'general', label: '기본 설정', icon: SettingsIcon },
    { id: 'notifications', label: '알림', icon: Bell },
    { id: 'connections', label: '연결', icon: Globe },
  ];

  const workspaceTabs = [
    { id: 'ws-general', label: '일반', icon: SettingsIcon },
    { id: 'ws-members', label: '멤버', icon: Users },
    { id: 'ws-import', label: '가져오기', icon: Database },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-8" onClick={() => navigate(-1)}>
      <div className="w-full max-w-5xl h-[85vh] bg-white dark:bg-[#1e1e1e] rounded-xl shadow-2xl flex overflow-hidden border border-slate-700/50" onClick={e => e.stopPropagation()}>

        {/* Sidebar */}
        <div className="w-64 bg-[#f7f7f5] dark:bg-[#252525] border-r border-slate-200 dark:border-slate-800 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-6 h-6 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-xs overflow-hidden">
                {user.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {(user.name || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="font-medium text-sm text-slate-700 dark:text-slate-200 truncate">{user.name || 'User'}</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {/* Account Section */}
            <div className="px-3 mb-4">
              <div className="text-[11px] font-bold text-slate-500 mb-1 px-2">계정</div>
              {accountTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Workspace Section - only show when workspaces exist */}
            {workspaces.length > 0 && (
              <div className="px-3">
                <div className="text-[11px] font-bold text-slate-500 mb-1 px-2">워크스페이스</div>
                {workspaceTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-[#1e1e1e] relative">
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex-1 overflow-y-auto p-12 max-w-3xl">
            {activeTab === 'profile' && (
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
            )}

            {activeTab === 'general' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 pb-4 border-b border-slate-200 dark:border-slate-800">기본 설정</h2>

                <div className="space-y-6">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-200">테마</div>
                      <div className="text-xs text-slate-500">내 기기에서 UJAX의 모습을 마음껏 바꿔보세요.</div>
                    </div>
                    <select className="bg-transparent border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-sm text-slate-700 dark:text-slate-300">
                      <option>시스템 설정 사용</option>
                      <option>라이트 모드</option>
                      <option>다크 모드</option>
                    </select>
                  </div>

                  <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">언어 및 시간</h3>

                    <div className="flex items-center justify-between py-2">
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-200">언어</div>
                        <div className="text-xs text-slate-500">UJAX에서 사용하는 언어를 변경하세요.</div>
                      </div>
                      <select className="bg-transparent border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-sm text-slate-700 dark:text-slate-300">
                        <option>한국어</option>
                        <option>English</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between py-2 mt-4">
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-200">텍스트 방향 제어 항상 표시</div>
                        <div className="text-xs text-slate-500 max-w-md">언어가 왼쪽에서 오른쪽으로 표시되는 경우에도 편집기 메뉴에 텍스트 방향(LTR/RTL)을 변경하는 옵션을 표시합니다.</div>
                      </div>
                      <div className="relative inline-block w-10 h-5 transition duration-200 ease-in-out">
                        <input type="checkbox" className="peer absolute opacity-0 w-0 h-0" />
                        <label className="block w-10 h-5 bg-slate-300 dark:bg-slate-700 rounded-full cursor-pointer peer-checked:bg-emerald-500 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:left-[22px]"></label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 pb-4 border-b border-slate-200 dark:border-slate-800">알림 설정</h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-200">이메일 알림</div>
                      <div className="text-xs text-slate-500">새로운 멘션, 페이지 초대 등에 대한 알림을 받습니다.</div>
                    </div>
                    <div className="relative inline-block w-10 h-5">
                      <input type="checkbox" defaultChecked className="peer absolute opacity-0 w-0 h-0" />
                      <label className="block w-10 h-5 bg-slate-300 dark:bg-slate-700 rounded-full cursor-pointer peer-checked:bg-emerald-500 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:left-[22px]"></label>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-200">모바일 푸시 알림</div>
                      <div className="text-xs text-slate-500">모바일 기기로 중요 알림을 전송합니다.</div>
                    </div>
                    <div className="relative inline-block w-10 h-5">
                      <input type="checkbox" className="peer absolute opacity-0 w-0 h-0" />
                      <label className="block w-10 h-5 bg-slate-300 dark:bg-slate-700 rounded-full cursor-pointer peer-checked:bg-emerald-500 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:left-[22px]"></label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'connections' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 pb-4 border-b border-slate-200 dark:border-slate-800">연결된 계정</h2>
                <div className="space-y-4">
                  <p className="text-sm text-slate-500">다른 서비스와 연결하여 UJAX의 기능을 확장하세요.</p>

                  <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded flex items-center justify-center text-black">
                        <Github className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">GitHub</div>
                        <div className="text-xs text-slate-500">PR 및 이슈 상태 동기화</div>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm">연결하기</Button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#0079BF] rounded flex items-center justify-center text-white">
                        <Trello className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">Trello</div>
                        <div className="text-xs text-slate-500">보드 가져오기 및 동기화</div>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm">연결하기</Button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#4A154B] rounded flex items-center justify-center text-white">
                        <Slack className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">Slack</div>
                        <div className="text-xs text-slate-500">알림 전송 및 미리보기</div>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm">연결하기</Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ws-general' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 pb-4 border-b border-slate-200 dark:border-slate-800">워크스페이스 일반 설정</h2>

                <div className="space-y-4 max-w-md">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">워크스페이스 정보</h3>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">이름</label>
                    <input type="text" value={wsName} onChange={e => setWsName(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-1.5 text-sm text-slate-900 dark:text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">설명</label>
                    <input type="text" value={wsDescription} onChange={e => setWsDescription(e.target.value)} placeholder="워크스페이스 설명을 입력하세요" className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-1.5 text-sm text-slate-900 dark:text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" />
                  </div>
                </div>

                <div className="pt-2 space-y-4 max-w-md">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">연동</h3>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Mattermost Webhook URL</label>
                    <input type="text" value={wsMmWebhookUrl} onChange={e => setWsMmWebhookUrl(e.target.value)} placeholder="https://mattermost.example.com/hooks/..." className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-1.5 text-sm text-slate-900 dark:text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" />
                    <p className="text-[11px] text-slate-400 mt-1">알림을 받을 Mattermost 채널의 Webhook URL을 입력하세요.</p>
                  </div>
                  <div className="space-y-2 pt-2">
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-6"
                      onClick={handleWsSave}
                      disabled={wsSaving}
                    >
                      {wsSaving ? '저장 중...' : wsSaveResult === 'success' ? '저장됨' : wsSaveResult === 'error' ? '저장 실패' : '저장'}
                    </Button>
                    {wsSaveError && (
                      <p className="text-xs text-red-500">{wsSaveError}</p>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4 max-w-md">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">내 설정</h3>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">닉네임</label>
                    <input type="text" value={wsNickname} onChange={e => setWsNickname(e.target.value)} placeholder="이 워크스페이스에서 사용할 닉네임" className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-1.5 text-sm text-slate-900 dark:text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" />
                    <p className="text-[11px] text-slate-400 mt-1">이 워크스페이스에서 다른 멤버에게 보이는 이름입니다.</p>
                  </div>
                  <div className="space-y-2 pt-2">
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-6"
                      onClick={handleWsNickSave}
                      disabled={wsNickSaving}
                    >
                      {wsNickSaving ? '저장 중...' : wsNickSaveResult === 'success' ? '저장됨' : wsNickSaveResult === 'error' ? '저장 실패' : '저장'}
                    </Button>
                    {wsNickSaveError && (
                      <p className="text-xs text-red-500">{wsNickSaveError}</p>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-red-200 dark:border-red-500/20">
                  <h3 className="text-sm font-bold text-red-500 mb-4">위험 구역</h3>
                  <div className="space-y-3">
                    <div className="rounded-lg border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5 p-4 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-200">워크스페이스 나가기</div>
                        <div className="text-xs text-slate-500 mt-0.5">이 워크스페이스에서 나갑니다. 다시 참여하려면 초대가 필요합니다.</div>
                      </div>
                      <Button
                        variant="ghost"
                        className="text-red-500 hover:text-white hover:bg-red-600 border border-red-300 dark:border-red-500/30 ml-4 flex-shrink-0"
                        onClick={() => { setShowWsLeaveModal(true); setWsLeaveError(''); }}
                      >
                        <LogOut className="w-4 h-4 mr-1.5" />나가기
                      </Button>
                    </div>
                    <div className="rounded-lg border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5 p-4 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-200">워크스페이스 삭제</div>
                        <div className="text-xs text-slate-500 mt-0.5">워크스페이스와 모든 데이터가 영구적으로 삭제됩니다.</div>
                      </div>
                      <Button
                        variant="ghost"
                        className="text-red-500 hover:text-white hover:bg-red-600 border border-red-300 dark:border-red-500/30 ml-4 flex-shrink-0"
                        onClick={() => { setShowWsDeleteModal(true); setWsDeleteConfirmName(''); setWsDeleteError(''); }}
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 워크스페이스 나가기 모달 */}
                {showWsLeaveModal && (
                  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => !wsLeaving && setShowWsLeaveModal(false)}>
                    <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-2xl border border-slate-700/50 w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center">
                          <LogOut className="w-5 h-5 text-red-500" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">워크스페이스 나가기</h3>
                      </div>

                      <p className="text-sm text-slate-500">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{wsName}</span> 워크스페이스에서 나가시겠습니까? 다시 참여하려면 초대가 필요합니다.
                      </p>

                      {wsLeaveError && (
                        <p className="text-xs text-red-500 bg-red-50 dark:bg-red-500/10 rounded px-3 py-2">{wsLeaveError}</p>
                      )}

                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" onClick={() => setShowWsLeaveModal(false)} disabled={wsLeaving}>취소</Button>
                        <Button
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={handleWsLeave}
                          disabled={wsLeaving}
                        >
                          {wsLeaving ? '나가는 중...' : '나가기'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 워크스페이스 삭제 모달 */}
                {showWsDeleteModal && (
                  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => !wsDeleting && setShowWsDeleteModal(false)}>
                    <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-2xl border border-slate-700/50 w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">워크스페이스 삭제</h3>
                      </div>

                      <p className="text-sm text-slate-500">
                        이 작업은 되돌릴 수 없습니다. 워크스페이스의 모든 데이터가 영구 삭제됩니다.
                      </p>

                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">
                          확인을 위해 워크스페이스 이름(<span className="font-bold text-slate-700 dark:text-slate-300">{wsName}</span>)을 입력하세요
                        </label>
                        <input
                          type="text"
                          value={wsDeleteConfirmName}
                          onChange={e => setWsDeleteConfirmName(e.target.value)}
                          placeholder={wsName}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-1.5 text-sm text-slate-900 dark:text-slate-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                          autoFocus
                        />
                      </div>

                      {wsDeleteError && (
                        <p className="text-xs text-red-500 bg-red-50 dark:bg-red-500/10 rounded px-3 py-2">{wsDeleteError}</p>
                      )}

                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" onClick={() => setShowWsDeleteModal(false)} disabled={wsDeleting}>취소</Button>
                        <Button
                          className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={wsDeleteConfirmName !== wsName || wsDeleting}
                          onClick={handleWsDelete}
                        >
                          {wsDeleting ? '삭제 중...' : '워크스페이스 삭제'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'ws-members' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">멤버</h2>
                    <p className="text-sm text-slate-500 mt-1">워크스페이스의 멤버를 관리하세요.</p>
                  </div>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                    onClick={() => { setShowInviteModal(true); setInviteEmail(''); setInviteError(''); setInviteSuccess(false); }}
                  >
                    <UserPlus className="w-4 h-4" /> 멤버 초대
                  </Button>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">워크스페이스 멤버 ({members.length})</h3>

                  {membersLoading ? (
                    <div className="text-sm text-slate-500 text-center py-8">불러오는 중...</div>
                  ) : members.length === 0 ? (
                    <div className="text-sm text-slate-500 bg-slate-100 dark:bg-slate-800/50 p-4 rounded-lg text-center">
                      멤버가 없습니다.
                    </div>
                  ) : (
                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden divide-y divide-slate-200 dark:divide-slate-700">
                      {members.map(member => {
                        const isMe = member.workspaceMemberId === myMemberId;
                        const role = member.role as string;
                        const canManage = (myRole === 'OWNER' || myRole === 'MANAGER') && !isMe && role !== 'OWNER';
                        const menuOpen = memberMenuOpen === member.workspaceMemberId;
                        return (
                          <div key={member.workspaceMemberId} className="flex items-center justify-between py-3 px-4 bg-white dark:bg-[#1e1e1e] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                                  {(member.nickname ?? '?').charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-slate-900 dark:text-slate-200">
                                  {member.nickname ?? '(닉네임 없음)'}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${roleBadgeClass(role)}`}>
                                {roleLabel(role)}
                              </span>
                              {canManage && (
                                <div className="relative">
                                  <button
                                    onClick={() => setMemberMenuOpen(menuOpen ? null : member.workspaceMemberId!)}
                                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>
                                  {menuOpen && (
                                    <>
                                      <div className="fixed inset-0 z-[150]" onClick={() => setMemberMenuOpen(null)} />
                                      <div className="absolute right-0 top-full mt-1 z-[151] w-48 bg-white dark:bg-[#252525] rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1">
                                        {role !== 'MANAGER' && (
                                          <button
                                            className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                                            onClick={() => { setMemberMenuOpen(null); confirmRoleChange(member, 'MANAGER'); }}
                                          >
                                            매니저로 변경
                                          </button>
                                        )}
                                        {role !== 'MEMBER' && (
                                          <button
                                            className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                                            onClick={() => { setMemberMenuOpen(null); confirmRoleChange(member, 'MEMBER'); }}
                                          >
                                            멤버로 변경
                                          </button>
                                        )}
                                        {myRole === 'OWNER' && (
                                          <button
                                            className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                                            onClick={() => { setMemberMenuOpen(null); confirmRoleChange(member, 'OWNER'); }}
                                          >
                                            소유자로 변경
                                          </button>
                                        )}
                                        <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
                                        <button
                                          className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                                          onClick={() => { setMemberMenuOpen(null); confirmRemoveMember(member); }}
                                        >
                                          워크스페이스에서 제거
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 초대 모달 */}
                {/* 초대 모달 */}
                {showInviteModal && (
                  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => !inviting && setShowInviteModal(false)}>
                    <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-2xl border border-slate-700/50 w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
                          <UserPlus className="w-5 h-5 text-emerald-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">멤버 초대</h3>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">이메일 주소</label>
                        <input
                          type="email"
                          value={inviteEmail}
                          onChange={e => setInviteEmail(e.target.value)}
                          placeholder="example@email.com"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-1.5 text-sm text-slate-900 dark:text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                          autoFocus
                          onKeyDown={e => e.key === 'Enter' && inviteEmail.trim() && handleInvite()}
                        />
                      </div>

                      {inviteError && (
                        <p className="text-xs text-red-500 bg-red-50 dark:bg-red-500/10 rounded px-3 py-2">{inviteError}</p>
                      )}
                      {inviteSuccess && (
                        <p className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 rounded px-3 py-2">초대가 완료되었습니다.</p>
                      )}

                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" onClick={() => setShowInviteModal(false)} disabled={inviting}>취소</Button>
                        <Button
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={handleInvite}
                          disabled={!inviteEmail.trim() || inviting}
                        >
                          {inviting ? '초대 중...' : '초대하기'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 역할 변경 확인 모달 */}
                {showRoleChangeModal && roleChangeMember && (
                  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => !roleChangeLoading && setShowRoleChangeModal(false)}>
                    <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-2xl border border-slate-700/50 w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">역할 변경</h3>
                      <p className="text-sm text-slate-500">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{roleChangeMember.nickname}</span>의 역할을{' '}
                        <span className="font-bold text-slate-700 dark:text-slate-300">{roleLabel(roleChangeTarget)}</span>(으)로 변경하시겠습니까?
                      </p>

                      {roleChangeError && (
                        <p className="text-xs text-red-500 bg-red-50 dark:bg-red-500/10 rounded px-3 py-2">{roleChangeError}</p>
                      )}

                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" onClick={() => setShowRoleChangeModal(false)} disabled={roleChangeLoading}>취소</Button>
                        <Button
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={handleRoleChange}
                          disabled={roleChangeLoading}
                        >
                          {roleChangeLoading ? '변경 중...' : '변경'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 멤버 제거 확인 모달 */}
                {showRemoveMemberModal && removingMember && (
                  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => !removingLoading && setShowRemoveMemberModal(false)}>
                    <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-2xl border border-slate-700/50 w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">멤버 제거</h3>
                      </div>
                      <p className="text-sm text-slate-500">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{removingMember.nickname}</span>을(를) 워크스페이스에서 제거하시겠습니까? 이 멤버는 더 이상 워크스페이스에 접근할 수 없습니다.
                      </p>

                      {removeMemberError && (
                        <p className="text-xs text-red-500 bg-red-50 dark:bg-red-500/10 rounded px-3 py-2">{removeMemberError}</p>
                      )}

                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" onClick={() => setShowRemoveMemberModal(false)} disabled={removingLoading}>취소</Button>
                        <Button
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={handleRemoveMember}
                          disabled={removingLoading}
                        >
                          {removingLoading ? '제거 중...' : '제거'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'ws-import' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 pb-4 border-b border-slate-200 dark:border-slate-800">가져오기</h2>
                <div className="space-y-4">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3">
                    <FileUp className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-bold text-slate-200">데이터 가져오기</div>
                      <div className="text-xs text-slate-500 mt-1">다른 앱의 데이터를 UJAX로 쉽게 이동하세요.</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="secondary" className="justify-start gap-3 h-auto py-3">
                      <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center text-xs">Txt</div>
                      <div className="text-left">
                        <div className="text-sm font-bold">Text & Markdown</div>
                        <div className="text-[10px] text-slate-500">파일 업로드</div>
                      </div>
                    </Button>
                    <Button variant="secondary" className="justify-start gap-3 h-auto py-3">
                      <div className="w-8 h-8 bg-[#217346] rounded flex items-center justify-center text-white">Xls</div>
                      <div className="text-left">
                        <div className="text-sm font-bold">Excel</div>
                        <div className="text-[10px] text-slate-500">.xls, .xlsx</div>
                      </div>
                    </Button>
                    <Button variant="secondary" className="justify-start gap-3 h-auto py-3">
                      <div className="w-8 h-8 bg-[#4285F4] rounded flex items-center justify-center text-white">W</div>
                      <div className="text-left">
                        <div className="text-sm font-bold">Word</div>
                        <div className="text-[10px] text-slate-500">.docx</div>
                      </div>
                    </Button>
                    <Button variant="secondary" className="justify-start gap-3 h-auto py-3">
                      <div className="w-8 h-8 bg-[#E34F26] rounded flex items-center justify-center text-white">H</div>
                      <div className="text-left">
                        <div className="text-sm font-bold">HTML</div>
                        <div className="text-[10px] text-slate-500">.html</div>
                      </div>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
