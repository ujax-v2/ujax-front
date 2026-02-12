import React, { useState } from 'react';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { isCreateWorkspaceModalOpenState, workspacesState, currentWorkspaceState } from '../../store/atoms';
import { Button } from '../ui/Base';
import { X, Check } from 'lucide-react';
import { createPortal } from 'react-dom';

export const CreateWorkspaceModal = () => {
  const [isOpen, setIsOpen] = useRecoilState(isCreateWorkspaceModalOpenState);
  const [workspaces, setWorkspaces] = useRecoilState(workspacesState);
  const setCurrentWorkspaceId = useSetRecoilState(currentWorkspaceState);
  
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleCreate = () => {
    if (!name) return;
    
    // Simulate creation
    const newWorkspace = {
      id: `ws-${Date.now()}`,
      name: name,
      icon: name.charAt(0).toUpperCase(),
      role: 'owner',
      members: 1
    };
    setWorkspaces([...workspaces, newWorkspace]);
    setCurrentWorkspaceId(newWorkspace.id);
    
    // Show success message
    setShowSuccess(true);
    
    // Close after delay
    setTimeout(() => {
        setShowSuccess(false);
        setIsOpen(false);
        setName('');
        setLanguage('');
    }, 2000);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed top-6 right-6 z-[210] bg-[#1e2330] border border-emerald-500/30 rounded-lg p-4 shadow-2xl flex items-start gap-3 w-80 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-emerald-500/20 p-1 rounded-full text-emerald-500 mt-0.5">
            <Check className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-slate-100 text-sm">워크스페이스가 생성되었습니다</div>
            <div className="text-xs text-slate-400 mt-1">이제 멤버가 초대장을 통해 참여할 수 있어요.</div>
          </div>
          <Button size="sm" className="h-7 px-3 text-xs bg-indigo-500 hover:bg-indigo-600 text-white" onClick={() => setIsOpen(false)}>
            확인
          </Button>
        </div>
      )}

      <div className="w-full max-w-lg bg-[#141820] border border-slate-700/50 rounded-2xl shadow-2xl p-8 relative">
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-6 left-6 p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <span className="sr-only">Close</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className="text-center mt-8 mb-10">
          <h2 className="text-3xl font-bold text-white mb-2">워크스페이스 생성</h2>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">워크스페이스 이름</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-12 bg-slate-900/50 border border-slate-700 rounded-lg px-4 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">사용 언어</label>
            <div className="relative">
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full h-12 bg-slate-900/50 border border-slate-700 rounded-lg px-4 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
              >
                <option value="" disabled>언어 선택</option>
                <option value="Python 3">Python 3</option>
                <option value="PyPy3">PyPy3</option>
                <option value="C99">C99</option>
                <option value="Java 11">Java 11</option>
                <option value="Ruby">Ruby</option>
                <option value="Kotlin (JVM)">Kotlin (JVM)</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="h-24 overflow-y-auto pr-2 custom-scrollbar space-y-2 mt-2">
             {/* Language list preview simulation if needed, but select handles it */}
          </div>

          <Button 
            onClick={handleCreate}
            disabled={!name}
            className="w-full h-12 text-base font-semibold bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            생성하기
          </Button>

          <p className="text-center text-xs text-slate-500 mt-4">
            생성 후에도 워크스페이스 이름, 사용 언어는 언제든 변경할 수 있습니다.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};
