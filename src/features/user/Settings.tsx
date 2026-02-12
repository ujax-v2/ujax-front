import React, { useState } from 'react';
import { Card, Button, Badge, Avatar } from '../../components/ui/Base';
import { useSetRecoilState, useRecoilValue, useRecoilState } from 'recoil';
import { navigationState, currentWorkspaceState, workspacesState, settingsTabState } from '../../store/atoms';
import { 
  User, 
  Lock, 
  Bell, 
  Shield, 
  LogOut, 
  Trash2, 
  ArrowLeft,
  Settings as SettingsIcon,
  Users,
  Globe,
  Database,
  Building,
  X,
  UserPlus,
  Link,
  Github,
  Trello,
  Slack,
  FileUp,
  Download
} from 'lucide-react';

export const Settings = () => {
  const setPage = useSetRecoilState(navigationState);
  const [activeTab, setActiveTab] = useRecoilState(settingsTabState);
  const currentWorkspaceId = useRecoilValue(currentWorkspaceState);
  const workspaces = useRecoilValue(workspacesState);
  
  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId) || workspaces[0];

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-8">
      <div className="w-full max-w-5xl h-[85vh] bg-white dark:bg-[#1e1e1e] rounded-xl shadow-2xl flex overflow-hidden border border-slate-700/50">
        
        {/* Sidebar */}
        <div className="w-64 bg-[#f7f7f5] dark:bg-[#252525] border-r border-slate-200 dark:border-slate-800 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
             <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-6 h-6 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-xs">
                    <User className="w-4 h-4 text-slate-500" />
                </div>
                <span className="font-medium text-sm text-slate-700 dark:text-slate-200 truncate">지훈 성</span>
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
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id 
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Workspace Section */}
            <div className="px-3">
              <div className="text-[11px] font-bold text-slate-500 mb-1 px-2">워크스페이스</div>
              {workspaceTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id 
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-[#1e1e1e] relative">
          <button 
             onClick={() => setPage('dashboard')}
             className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex-1 overflow-y-auto p-12 max-w-3xl">
            {activeTab === 'profile' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 pb-4 border-b border-slate-200 dark:border-slate-800">내 프로필</h2>
                
                <div className="flex items-start gap-6">
                  <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex-shrink-0">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Profile" className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-4 flex-1">
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm">사진 변경</Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">제거</Button>
                    </div>
                    <p className="text-xs text-slate-500">최대 5MB의 JPG, GIF 또는 PNG 형식을 지원합니다.</p>
                  </div>
                </div>

                <div className="space-y-4 max-w-md">
                   <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1">이메일</label>
                     <input type="email" value="bookandpapers717@gmail.com" disabled className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-3 py-1.5 text-sm text-slate-500 cursor-not-allowed" />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1">이름</label>
                     <input type="text" defaultValue="지훈 성" className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-1.5 text-sm text-slate-900 dark:text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" />
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'general' && (
               <div className="space-y-8 animate-in fade-in duration-300">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 pb-4 border-b border-slate-200 dark:border-slate-800">기본 설정</h2>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-200">테마</div>
                      <div className="text-xs text-slate-500">내 기기에서 Notion의 모습을 마음껏 바꿔보세요.</div>
                    </div>
                    <select className="bg-transparent border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-sm text-slate-700 dark:text-slate-300">
                      <option>시스템 설정 사용</option>
                      <option>라이트 모드</option>
                      <option>다크 모드</option>
                    </select>
                  </div>

                  <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">언어 및 시간</h3>
                    
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-200">언어</div>
                        <div className="text-xs text-slate-500">Notion에서 사용하는 언어를 변경하세요.</div>
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
                    <p className="text-sm text-slate-500">다른 서비스와 연결하여 Notion의 기능을 확장하세요.</p>
                    
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
                 <div className="space-y-6">
                    <div className="flex items-center gap-4">
                       <div className="w-16 h-16 rounded bg-emerald-600 flex items-center justify-center text-2xl font-bold text-white">
                         {currentWorkspace.icon}
                       </div>
                       <div className="space-y-2">
                         <div className="text-sm font-medium text-slate-500">아이콘 변경</div>
                         <div className="flex gap-2">
                           <Button variant="secondary" size="sm">업로드</Button>
                           <Button variant="secondary" size="sm">랜덤</Button>
                         </div>
                       </div>
                    </div>
                    
                    <div className="space-y-2">
                       <label className="block text-xs font-bold text-slate-500">워크스페이스 이름</label>
                       <input type="text" defaultValue={currentWorkspace.name} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-sm text-slate-900 dark:text-slate-200 focus:border-emerald-500 outline-none" />
                    </div>

                    <div className="space-y-2">
                       <label className="block text-xs font-bold text-slate-500">도메인</label>
                       <div className="flex items-center">
                         <span className="bg-slate-100 dark:bg-slate-800 border border-r-0 border-slate-300 dark:border-slate-700 rounded-l px-3 py-2 text-sm text-slate-500">notion.so/</span>
                         <input type="text" defaultValue="bookandpapers" className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-r px-3 py-2 text-sm text-slate-900 dark:text-slate-200 focus:border-emerald-500 outline-none" />
                       </div>
                    </div>

                    <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                       <h3 className="text-xs font-bold text-red-500 uppercase mb-4">위험 구역</h3>
                       <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 w-full justify-start">
                         워크스페이스 삭제
                       </Button>
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'ws-members' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                   <div>
                     <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">멤버</h2>
                     <p className="text-sm text-slate-500 mt-1">워크스페이스의 멤버를 관리하세요.</p>
                   </div>
                   <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                     <UserPlus className="w-4 h-4" /> 멤버 초대
                   </Button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase">워크스페이스 멤버</h3>
                    
                    {/* Member Item */}
                    <div className="flex items-center justify-between py-2">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700 overflow-hidden">
                             <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900 dark:text-slate-200">지훈 성 <span className="text-xs text-slate-400 font-normal">(나)</span></div>
                            <div className="text-xs text-slate-500">bookandpapers717@gmail.com</div>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          <span className="text-xs text-slate-500">소유자</span>
                       </div>
                    </div>

                    {/* Additional Members if any */}
                    {currentWorkspace.members > 1 && (
                      <div className="flex items-center justify-between py-2">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700 overflow-hidden flex items-center justify-center text-xs text-white bg-indigo-500">
                               JD
                            </div>
                            <div>
                              <div className="text-sm font-medium text-slate-900 dark:text-slate-200">John Doe</div>
                              <div className="text-xs text-slate-500">john.doe@example.com</div>
                            </div>
                         </div>
                         <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">멤버</span>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">제거</Button>
                         </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">게스트</h3>
                    <div className="text-sm text-slate-500 bg-slate-100 dark:bg-slate-800/50 p-4 rounded-lg text-center">
                       아직 초대된 게스트가 없습니다.
                    </div>
                  </div>
                </div>
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
                          <div className="text-xs text-slate-500 mt-1">다른 앱의 데이터를 Notion으로 쉽게 이동하세요.</div>
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
