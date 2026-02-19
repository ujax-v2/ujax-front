import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Base';
import { useRecoilValue } from 'recoil';
import { currentWorkspaceState } from '@/store/atoms';
import { getWorkspaceMembers, getMyMembership, inviteMember, updateMemberRole, removeMember } from '@/api/workspace';
import type { WorkspaceMemberResponse } from '@/api/workspace';
import { extractErrorDetail } from './utils';
import { UserPlus, AlertTriangle, MoreHorizontal } from 'lucide-react';

export const WsMembersTab = () => {
  const currentWorkspaceId = useRecoilValue(currentWorkspaceState);

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

  const loadMembers = useCallback(async () => {
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
  }, [currentWorkspaceId]);

  useEffect(() => {
    if (!currentWorkspaceId) return;
    loadMembers();
  }, [currentWorkspaceId, loadMembers]);

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

  return (
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
  );
};
