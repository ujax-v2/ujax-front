import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Base';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { currentWorkspaceState, myWorkspaceRoleState } from '@/store/atoms';
import { getWorkspaceMembers, getMyMembership, inviteMember, updateMemberRole, removeMember } from '@/api/workspace';
import type { WorkspaceMemberResponse, WorkspaceMemberPageResponse } from '@/api/workspace';

type MemberItem = WorkspaceMemberPageResponse['content'][number];
import { parseApiError } from '@/utils/error';
import { UserPlus, AlertTriangle, MoreHorizontal } from 'lucide-react';
import { PageNav } from '@/components/ui/PageNav';
import { useT } from '@/i18n';

export const WsMembersTab = () => {
  const currentWorkspaceId = useRecoilValue(currentWorkspaceState);
  const setMyWorkspaceRole = useSetRecoilState(myWorkspaceRoleState);
  const t = useT();

  // Members tab state
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [myMemberId, setMyMemberId] = useState<number>(0);
  const [myRole, setMyRole] = useState<string>('MEMBER');
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberMenuOpen, setMemberMenuOpen] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);
  const [removingMember, setRemovingMember] = useState<MemberItem | null>(null);
  const [removingLoading, setRemovingLoading] = useState(false);
  const [removeMemberError, setRemoveMemberError] = useState('');
  const [showRoleChangeModal, setShowRoleChangeModal] = useState(false);
  const [roleChangeMember, setRoleChangeMember] = useState<MemberItem | null>(null);
  const [roleChangeTarget, setRoleChangeTarget] = useState<string>('MEMBER');
  const [roleChangeLoading, setRoleChangeLoading] = useState(false);
  const [roleChangeError, setRoleChangeError] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const loadMembers = useCallback(async (page = 0) => {
    if (!currentWorkspaceId) return;
    setMembersLoading(true);
    try {
      const [membersData, myData] = await Promise.all([
        getWorkspaceMembers(currentWorkspaceId, page),
        getMyMembership(currentWorkspaceId),
      ]);
      setMembers(membersData.content ?? []);
      setCurrentPage(membersData.page.page);
      setTotalPages(membersData.page.totalPages);
      setTotalElements(membersData.page.totalElements);
      setMyMemberId(myData.workspaceMemberId ?? 0);
      const role = myData.role ?? 'MEMBER';
      setMyRole(role);
      setMyWorkspaceRole(role);
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setMembersLoading(false);
    }
  }, [currentWorkspaceId]);

  useEffect(() => {
    if (!currentWorkspaceId) return;
    setCurrentPage(0);
    loadMembers(0);
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
      await loadMembers(currentPage);
      setTimeout(() => { setShowInviteModal(false); setInviteSuccess(false); }, 1200);
    } catch (err: any) {
      setInviteError(parseApiError(err, '초대에 실패했습니다.'));
    } finally {
      setInviting(false);
    }
  };

  const confirmRoleChange = (member: MemberItem, newRole: string) => {
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
      await loadMembers(currentPage);
    } catch (err: any) {
      setRoleChangeError(parseApiError(err, '역할 변경에 실패했습니다.'));
    } finally {
      setRoleChangeLoading(false);
    }
  };

  const confirmRemoveMember = (member: MemberItem) => {
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
      await loadMembers(currentPage);
    } catch (err: any) {
      setRemoveMemberError(parseApiError(err, '멤버 제거에 실패했습니다.'));
    } finally {
      setRemovingLoading(false);
    }
  };

  const roleLabel = (role?: string) => {
    switch (role) {
      case 'OWNER': return t('settings.members.owner');
      case 'MANAGER': return t('settings.members.manager');
      default: return t('settings.members.member');
    }
  };

  const roleBadgeClass = (role?: string) => {
    switch (role) {
      case 'OWNER': return 'bg-amber-500/10 text-amber-400';
      case 'MANAGER': return 'bg-blue-500/10 text-blue-400';
      default: return 'bg-surface-subtle text-text-muted';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between pb-4 border-b border-border-default">
        <div>
          <h2 className="text-xl font-bold text-text-primary">{t('settings.members.title')}</h2>
          <p className="text-sm text-text-faint mt-1">{t('settings.members.titleDesc')}</p>
        </div>
        {myRole === 'OWNER' && (
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            onClick={() => { setShowInviteModal(true); setInviteEmail(''); setInviteError(''); setInviteSuccess(false); }}
          >
            <UserPlus className="w-4 h-4" /> {t('settings.members.invite')}
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-text-secondary">{t('settings.members.wsMembers')} ({totalElements})</h3>

        {membersLoading ? (
          <div className="text-sm text-text-faint text-center py-8">{t('common.loading')}</div>
        ) : members.length === 0 ? (
          <div className="text-sm text-text-faint bg-surface-subtle/50 p-4 rounded-lg text-center">
            {t('settings.members.noMembers')}
          </div>
        ) : (
          <>
          <div className="rounded-lg border border-border-subtle overflow-hidden divide-y-2 divide-border-default">
            {[...members].sort((a, b) => (b.workspaceMemberId === myMemberId ? 1 : 0) - (a.workspaceMemberId === myMemberId ? 1 : 0)).map(member => {
              const isMe = member.workspaceMemberId === myMemberId;
              const role = member.role as string;
              const canManage = myRole === 'OWNER' && !isMe && role !== 'OWNER';
              const menuOpen = memberMenuOpen === member.workspaceMemberId;
              return (
                <div key={member.workspaceMemberId} className={`flex items-center justify-between py-3 px-4 transition-colors ${isMe ? 'bg-emerald-500/5 hover:bg-emerald-500/10' : 'bg-surface-overlay hover:bg-hover-bg'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-surface-subtle flex items-center justify-center">
                      <span className="text-sm font-bold text-text-muted">
                        {(member.nickname ?? '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-text-secondary">
                        {member.nickname ?? t('settings.members.noNickname')}
                      </div>
                      {member.email && (
                        <div className="text-xs text-text-faint">{member.email}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${roleBadgeClass(role)}`}>
                      {roleLabel(role)}
                    </span>
                    {canManage && (
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            if (menuOpen) {
                              setMemberMenuOpen(null);
                              setMenuPosition(null);
                            } else {
                              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                              setMenuPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                              setMemberMenuOpen(member.workspaceMemberId!);
                            }
                          }}
                          className="p-1 rounded hover:bg-hover-bg text-text-muted hover:text-text-secondary transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {menuOpen && menuPosition && createPortal(
                          <>
                            <div className="fixed inset-0 z-[150]" onClick={() => { setMemberMenuOpen(null); setMenuPosition(null); }} />
                            <div
                              className="fixed z-[151] w-48 bg-surface-overlay rounded-lg shadow-lg border border-border-subtle py-1"
                              style={{ top: menuPosition.top, right: menuPosition.right }}
                            >
                              {role !== 'MANAGER' && (
                                <button
                                  className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-hover-bg"
                                  onClick={() => { setMemberMenuOpen(null); setMenuPosition(null); confirmRoleChange(member, 'MANAGER'); }}
                                >
                                  {t('settings.members.changeToManager')}
                                </button>
                              )}
                              {role !== 'MEMBER' && (
                                <button
                                  className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-hover-bg"
                                  onClick={() => { setMemberMenuOpen(null); setMenuPosition(null); confirmRoleChange(member, 'MEMBER'); }}
                                >
                                  {t('settings.members.changeToMember')}
                                </button>
                              )}
                              {myRole === 'OWNER' && (
                                <button
                                  className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-hover-bg"
                                  onClick={() => { setMemberMenuOpen(null); setMenuPosition(null); confirmRoleChange(member, 'OWNER'); }}
                                >
                                  {t('settings.members.changeToOwner')}
                                </button>
                              )}
                              <div className="border-t border-border-subtle my-1" />
                              <button
                                className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-500/10"
                                onClick={() => { setMemberMenuOpen(null); setMenuPosition(null); confirmRemoveMember(member); }}
                              >
                                {t('settings.members.removeFromWs')}
                              </button>
                            </div>
                          </>,
                          document.body
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 페이지네이션 */}
          <div className="flex justify-center pt-3">
            <PageNav page={currentPage} totalPages={totalPages} onPageChange={loadMembers} />
          </div>
          </>
        )}
      </div>

      {/* 초대 모달 */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => !inviting && setShowInviteModal(false)}>
          <div className="bg-surface-overlay rounded-xl shadow-2xl border border-border-subtle/50 w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">{t('settings.members.invite')}</h3>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-faint mb-1.5">{t('settings.members.inviteEmail')}</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full bg-input-bg border border-border-subtle rounded px-3 py-1.5 text-sm text-text-secondary focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && inviteEmail.trim() && handleInvite()}
              />
            </div>

            {inviteError && (
              <p className="text-xs text-red-500 bg-red-500/10 rounded px-3 py-2">{inviteError}</p>
            )}
            {inviteSuccess && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded px-3 py-2">{t('settings.members.inviteSuccess')}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setShowInviteModal(false)} disabled={inviting}>{t('common.cancel')}</Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleInvite}
                disabled={!inviteEmail.trim() || inviting}
              >
                {inviting ? t('settings.members.inviting') : t('settings.members.inviteButton')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 역할 변경 확인 모달 */}
      {showRoleChangeModal && roleChangeMember && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => !roleChangeLoading && setShowRoleChangeModal(false)}>
          <div className="bg-surface-overlay rounded-xl shadow-2xl border border-border-subtle/50 w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-text-primary">{t('settings.members.roleChange')}</h3>
            <p className="text-sm text-text-faint">
              {t('settings.members.roleChangeConfirm', { name: roleChangeMember.nickname ?? '', role: roleLabel(roleChangeTarget) })}
            </p>
            {roleChangeTarget === 'OWNER' && (
              <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-400">{t('settings.members.ownerTransferWarning')}</p>
              </div>
            )}

            {roleChangeError && (
              <p className="text-xs text-red-500 bg-red-500/10 rounded px-3 py-2">{roleChangeError}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setShowRoleChangeModal(false)} disabled={roleChangeLoading}>{t('common.cancel')}</Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleRoleChange}
                disabled={roleChangeLoading}
              >
                {roleChangeLoading ? t('common.changing') : t('common.change')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 멤버 제거 확인 모달 */}
      {showRemoveMemberModal && removingMember && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => !removingLoading && setShowRemoveMemberModal(false)}>
          <div className="bg-surface-overlay rounded-xl shadow-2xl border border-border-subtle/50 w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">{t('settings.members.memberRemove')}</h3>
            </div>
            <p className="text-sm text-text-faint">
              {t('settings.members.memberRemoveDesc', { name: removingMember.nickname ?? '' })}
            </p>

            {removeMemberError && (
              <p className="text-xs text-red-500 bg-red-500/10 rounded px-3 py-2">{removeMemberError}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setShowRemoveMemberModal(false)} disabled={removingLoading}>{t('common.cancel')}</Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleRemoveMember}
                disabled={removingLoading}
              >
                {removingLoading ? t('common.removing') : t('common.remove')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
