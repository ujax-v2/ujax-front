import React, { useState } from 'react';
import { Card, Button, Badge } from '../../components/ui/Base';
import { useSetRecoilState } from 'recoil';
import { navigationState } from '../../store/atoms';
import { User, Lock, Bell, Shield, LogOut, Trash2, ArrowLeft } from 'lucide-react';

export const Settings = () => {
  const setPage = useSetRecoilState(navigationState);
  const [activeTab, setActiveTab] = useState('account');

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Bell },
    { id: 'membership', label: 'Membership', icon: Shield },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#0F1117] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => setPage('profile')} className="-ml-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Tabs */}
          <div className="w-full md:w-64 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-slate-800 text-emerald-400' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1">
            <Card className="p-6 bg-[#141820] border-slate-800 min-h-[400px]">
              {/* Account Tab */}
              {activeTab === 'account' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-200 mb-1">Public Profile</h2>
                    <p className="text-sm text-slate-500">Manage how others see you on the platform.</p>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 border border-slate-800 rounded-lg bg-slate-900/50">
                    <div className="w-16 h-16 rounded-full bg-slate-700 overflow-hidden">
                      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" />
                    </div>
                    <div>
                      <Button variant="secondary" size="sm" className="mr-2">Change Avatar</Button>
                      <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">Remove</Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-400">Display Name</label>
                      <input type="text" defaultValue="지훈 성" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-slate-200" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-400">Email</label>
                      <input type="email" defaultValue="user@example.com" disabled className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-slate-500 cursor-not-allowed" />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-800">
                    <h3 className="font-bold text-slate-200 mb-4">Password</h3>
                    <Button variant="secondary" className="gap-2">
                      <Lock className="w-4 h-4" /> Change Password
                    </Button>
                  </div>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-lg font-bold text-slate-200 mb-1">Preferences</h2>
                    <p className="text-sm text-slate-500">Customize your experience.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-slate-800 rounded-lg bg-slate-900/50">
                      <div>
                        <div className="font-medium text-slate-200">Show Algorithm Hints</div>
                        <div className="text-xs text-slate-500">Display category hints on problem lists</div>
                      </div>
                      <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                         <input type="checkbox" id="toggle-hints" className="peer absolute opacity-0 w-0 h-0" />
                         <label htmlFor="toggle-hints" className="block w-12 h-6 bg-slate-700 rounded-full cursor-pointer peer-checked:bg-emerald-600 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:left-[26px]"></label>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-slate-800 rounded-lg bg-slate-900/50">
                      <div>
                        <div className="font-medium text-slate-200">Email Notifications</div>
                        <div className="text-xs text-slate-500">Receive updates about challenges and replies</div>
                      </div>
                       <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                         <input type="checkbox" id="toggle-email" defaultChecked className="peer absolute opacity-0 w-0 h-0" />
                         <label htmlFor="toggle-email" className="block w-12 h-6 bg-slate-700 rounded-full cursor-pointer peer-checked:bg-emerald-600 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:left-[26px]"></label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Membership Tab */}
              {activeTab === 'membership' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-lg font-bold text-slate-200 mb-1">Manage Membership</h2>
                    <p className="text-sm text-slate-500">Control your account status and subscription.</p>
                  </div>

                  <div className="p-4 border border-slate-800 rounded-lg bg-slate-900/50 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-200">Free Plan</div>
                      <div className="text-xs text-slate-500">Basic features included</div>
                    </div>
                    <Button variant="secondary" className="border-emerald-500 text-emerald-500 hover:bg-emerald-500/10">Upgrade to Pro</Button>
                  </div>

                  <div className="pt-6 border-t border-slate-800 space-y-4">
                    <h3 className="font-bold text-red-400">Danger Zone</h3>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-400">Withdraw from all challenges</div>
                      <Button variant="ghost" className="text-slate-400 hover:text-slate-200">Withdraw</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-400">Permanently delete account</div>
                      <Button className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 gap-2">
                         <Trash2 className="w-4 h-4" /> Delete Account
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
