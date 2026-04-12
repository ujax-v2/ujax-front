import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRecoilState, useSetRecoilState, useRecoilValue } from 'recoil';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  sidebarOpenState,
  workspacesState,
  currentWorkspaceState,
  userState,
  settingsTabState,
  isCreateWorkspaceModalOpenState,
  myWorkspaceRoleState,
  currentProblemBoxState,
  problemContextState,
} from '@/store/atoms';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  SlidersHorizontal,
  PanelLeftClose,
  ChevronsUpDown,
  Plus,
  Check,
  LogOut,
  Settings,
  UserPlus,
  MoreHorizontal,
  Compass,
  UserCircle
} from 'lucide-react';
import { cn } from '../ui/Base';
import { useT } from '@/i18n';
import { getMyMembership } from '@/api/workspace';

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const t = useT();
  const setSettingsTab = useSetRecoilState(settingsTabState);
  const [isOpen, setIsOpen] = useRecoilState(sidebarOpenState);
  const [workspaces, setWorkspaces] = useRecoilState(workspacesState);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useRecoilState(currentWorkspaceState);
  const setIsCreateWorkspaceModalOpen = useSetRecoilState(isCreateWorkspaceModalOpenState);
  const setCurrentProblemBox = useSetRecoilState(currentProblemBoxState);
  const setProblemContext = useSetRecoilState(problemContextState);
  const [user] = useRecoilState(userState);
  const { logout } = useAuth();
  const myWorkspaceRole = useRecoilValue(myWorkspaceRoleState);
  const setMyWorkspaceRole = useSetRecoilState(myWorkspaceRoleState);

  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId) || workspaces[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsWorkspaceMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchMyRole = useCallback(() => {
    if (!currentWorkspaceId) return;
    getMyMembership(currentWorkspaceId)
      .then(data => setMyWorkspaceRole(data.role ?? 'MEMBER'))
      .catch(() => setMyWorkspaceRole('MEMBER'));
  }, [currentWorkspaceId, setMyWorkspaceRole]);

  // 워크스페이스 진입 시
  useEffect(() => {
    fetchMyRole();
  }, [fetchMyRole]);

  // 탭 복귀 시 (다른 사람이 권한 변경했을 수 있음)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchMyRole();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [fetchMyRole]);

  // 403 응답 시 즉각 반영 (차단당한 시점에 role 갱신)
  useEffect(() => {
    window.addEventListener('ujaxForbidden', fetchMyRole);
    return () => window.removeEventListener('ujaxForbidden', fetchMyRole);
  }, [fetchMyRole]);

  const handleLogout = () => logout(user.refreshToken);

  // 메뉴 항목의 path는 wsId 없이 상대 경로만 정의
  // 실제 navigate 시 /ws/:wsId/ 접두사를 붙여줌
  const menuItems = [
    { type: 'ws', subpath: 'dashboard', label: t('nav.workspace'), icon: LayoutDashboard },
    { type: 'global', path: '/profile', label: t('nav.mypage'), icon: UserCircle },
    { type: 'ws', subpath: 'problems', label: t('nav.problems'), icon: BookOpen },
    { type: 'ws', subpath: 'community', label: t('nav.community'), icon: Users },
  ];

  // wsId 포함된 전체 경로 생성
  const getWsPath = (subpath: string, wsId?: string) => {
    const id = wsId || currentWorkspaceId;
    return `/ws/${id}/${subpath}`;
  };

  // 현재 URL이 해당 메뉴의 활성 상태인지 확인
  const isMenuActive = (item: typeof menuItems[0]) => {
    if (item.type === 'global') return location.pathname.startsWith(item.path!);
    const fullPath = getWsPath(item.subpath!);
    return location.pathname === fullPath || location.pathname.startsWith(fullPath + '/');
  };

  const handleCreateWorkspace = () => {
    setIsWorkspaceMenuOpen(false);
    setIsCreateWorkspaceModalOpen(true);
  };

  // 워크스페이스 전환 시 → 워크스페이스 전용 상태 초기화 후 새 WS 대시보드로 이동
  const handleSwitchWorkspace = (id: number) => {
    setCurrentProblemBox(null);
    setProblemContext({});
    setMyWorkspaceRole('MEMBER');
    setCurrentWorkspaceId(id);
    setIsWorkspaceMenuOpen(false);
    navigate(`/ws/${id}/dashboard`);
  };

  if (!isOpen) return null;

  return (
    <div className="w-64 h-full bg-[#f0f1f4] dark:bg-[#0a0c10] border-r border-border-subtle/50 shadow-[1px_0_4px_rgba(0,0,0,0.03)] dark:shadow-[1px_0_4px_rgba(0,0,0,0.2)] flex flex-col flex-shrink-0 transition-all duration-300 relative z-50">
      {/* Header with Workspace Switcher */}
      <div className="p-3 relative" ref={menuRef}>
        <div
          onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
          className="h-10 flex items-center justify-between px-2 hover:bg-hover-bg transition-colors cursor-pointer rounded-lg group select-none"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-5 h-5 rounded bg-emerald-600 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden">
              {currentWorkspace?.imageUrl ? (
                <img src={currentWorkspace.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                currentWorkspace?.name?.charAt(0) ?? ''
              )}
            </div>
            <span className="font-semibold text-sm text-text-secondary truncate">{currentWorkspace.name}</span>
            <ChevronsUpDown className="w-3 h-3 text-text-faint" />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
            className="p-1 text-text-muted hover:text-text-primary hover:bg-border-subtle/50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Workspace Switcher Popover */}
        {isWorkspaceMenuOpen && (
          <div className="absolute top-14 left-3 w-[260px] bg-surface-overlay border border-border-subtle rounded-xl shadow-2xl overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-100">
            {/* Current Workspace Header */}
            <div className="p-4 bg-hover-bg border-b border-border-subtle/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-lg font-bold text-white overflow-hidden">
                  {currentWorkspace?.imageUrl ? (
                    <img src={currentWorkspace.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    currentWorkspace?.name?.charAt(0) ?? ''
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="font-bold text-text-secondary text-sm truncate">{currentWorkspace?.name}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSettingsTab('general');
                    navigate('/settings');
                    setIsWorkspaceMenuOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs text-text-secondary bg-border-subtle/50 hover:bg-border-subtle rounded border border-border-subtle/50 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" /> {t('nav.settings')}
                </button>
                {myWorkspaceRole === 'OWNER' && (
                  <button
                    onClick={() => {
                      setSettingsTab('ws-members');
                      navigate('/settings');
                      setIsWorkspaceMenuOpen(false);
                    }}
                    className="px-3 py-1.5 text-xs text-text-secondary bg-border-subtle/50 hover:bg-border-subtle rounded border border-border-subtle/50 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> {t('nav.inviteMember')}
                  </button>
                )}
              </div>
            </div>

            {/* Workspace List */}
            <div className="py-2 max-h-[240px] overflow-y-auto">
              <div className="px-3 py-1.5 text-xs font-medium text-text-faint">{user.email}</div>
              {workspaces.map(ws => (
                <div
                  key={ws.id}
                  onClick={() => handleSwitchWorkspace(ws.id)}
                  className="flex items-center justify-between px-3 py-2 hover:bg-hover-bg cursor-pointer group"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-6 h-6 rounded bg-border-subtle flex items-center justify-center text-xs font-medium text-text-secondary overflow-hidden">
                      {ws.imageUrl ? (
                        <img src={ws.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        ws.name.charAt(0)
                      )}
                    </div>
                    <span className={`text-sm truncate ${ws.id === currentWorkspaceId ? 'text-text-primary font-medium' : 'text-text-muted'}`}>
                      {ws.name}
                    </span>
                  </div>
                  {ws.id === currentWorkspaceId ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <MoreHorizontal className="w-4 h-4 text-text-faint opacity-0 group-hover:opacity-100" />
                  )}
                </div>
              ))}

              <div
                onClick={handleCreateWorkspace}
                className="flex items-center gap-2 px-3 py-2 hover:bg-hover-bg cursor-pointer text-text-muted hover:text-text-secondary mt-1"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-sm">{t('nav.newWorkspace')}</span>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Main Navigation — 워크스페이스 스코프 메뉴 */}
      <div className="flex-1 px-2 py-4 overflow-y-auto flex flex-col">
        <div>
          <div className="text-xs font-bold text-text-muted mb-2 px-2 tracking-widest uppercase">{t('nav.menu')}</div>
          <div className="space-y-1">
            {menuItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => navigate(item.type === 'global' ? item.path! : getWsPath(item.subpath!))}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[15px] font-medium transition-colors group',
                  isMenuActive(item)
                    ? 'bg-surface-subtle text-text-primary'
                    : 'text-text-muted hover:text-text-primary hover:bg-hover-bg'
                )}
              >
                <item.icon className={cn("w-5 h-5", isMenuActive(item) ? "text-text-primary" : "text-text-faint group-hover:text-text-muted")} />
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 탐색 섹션 (글로벌) — 임시 비노출 */}
        {/* <div className="mt-8">
          <div className="text-xs font-bold text-text-muted mb-2 px-2 tracking-widest uppercase">{t('nav.explore')}</div>
          <button
            onClick={() => navigate('/explore')}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[15px] font-medium transition-colors group',
              location.pathname.startsWith('/explore')
                ? 'bg-surface-subtle text-text-primary'
                : 'text-text-muted hover:text-text-primary hover:bg-hover-bg'
            )}
          >
            <Compass className={cn("w-5 h-5", location.pathname.startsWith('/explore') ? "text-text-primary" : "text-text-faint group-hover:text-text-muted")} />
            <span className="flex-1 text-left">{t('nav.exploreWorkspaces')}</span>
          </button>
        </div> */}
      </div>

      {/* Bottom Settings Section */}
      <div className="p-2 border-t border-border-default/50 space-y-0.5">
        <button
          onClick={() => {
            setSettingsTab('general');
            navigate('/settings');
          }}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm font-medium text-text-muted hover:text-text-primary hover:bg-hover-bg transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="flex-1 text-left">{t('nav.settings')}</span>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm font-medium text-text-muted hover:text-red-600 dark:hover:text-red-400 hover:bg-hover-bg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="flex-1 text-left">{t('nav.logout')}</span>
        </button>
      </div>
    </div>
  );
};
