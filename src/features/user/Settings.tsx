import { useEffect } from 'react';
import { useRecoilValue, useRecoilState } from 'recoil';
import { useNavigate } from 'react-router-dom';
import { currentWorkspaceState, workspacesState, settingsTabState, userState } from '@/store/atoms';
import {
  User,
  Bell,
  Settings as SettingsIcon,
  Users,
  Globe,
  Database,
  X,
} from 'lucide-react';
import { ProfileTab } from './settings/ProfileTab';
import { GeneralTab } from './settings/GeneralTab';
import { NotificationsTab } from './settings/NotificationsTab';
import { ConnectionsTab } from './settings/ConnectionsTab';
import { WsGeneralTab } from './settings/WsGeneralTab';
import { WsMembersTab } from './settings/WsMembersTab';
import { WsImportTab } from './settings/WsImportTab';

export const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useRecoilState(settingsTabState);
  const currentWorkspaceId = useRecoilValue(currentWorkspaceState);
  const workspaces = useRecoilValue(workspacesState);
  const user = useRecoilValue(userState);

  // Reset activeTab to 'profile' if on ws-* tab and no workspaces
  useEffect(() => {
    if (workspaces.length === 0 && activeTab.startsWith('ws-')) {
      setActiveTab('profile');
    }
  }, [workspaces.length, activeTab, setActiveTab]);

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
            {activeTab === 'profile' && <ProfileTab />}
            {activeTab === 'general' && <GeneralTab />}
            {activeTab === 'notifications' && <NotificationsTab />}
            {activeTab === 'connections' && <ConnectionsTab />}
            {activeTab === 'ws-general' && <WsGeneralTab />}
            {activeTab === 'ws-members' && <WsMembersTab />}
            {activeTab === 'ws-import' && <WsImportTab />}
          </div>
        </div>
      </div>
    </div>
  );
};
