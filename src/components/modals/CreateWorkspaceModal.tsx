import React, { useState } from 'react';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { isCreateWorkspaceModalOpenState, workspacesState, currentWorkspaceState } from '@/store/atoms';
import { createWorkspace } from '@/api/workspace';
import { Button } from '../ui/Base';
import { X, Check } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

export const CreateWorkspaceModal = () => {
  const [isOpen, setIsOpen] = useRecoilState(isCreateWorkspaceModalOpenState);
  const [workspaces, setWorkspaces] = useRecoilState(workspacesState);
  const setCurrentWorkspaceId = useSetRecoilState(currentWorkspaceState);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!name || isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    try {
      const res = await createWorkspace({
        name,
        description: description || null,
      });

      const newWorkspace = {
        id: res.id!,
        name: res.name!,
        description: res.description ?? null,
      };
      setWorkspaces([...workspaces, newWorkspace]);
      setCurrentWorkspaceId(newWorkspace.id);

      setIsOpen(false);
      setName('');
      setDescription('');
      navigate(`/ws/${newWorkspace.id}/dashboard`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '워크스페이스 생성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">



      <div className="w-full max-w-lg bg-surface border border-border-subtle/50 rounded-2xl shadow-2xl p-8 relative">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-6 left-6 p-2 rounded-lg bg-surface-subtle text-text-muted hover:text-text-primary transition-colors"
        >
          <span className="sr-only">Close</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="text-center mt-8 mb-10">
          <h2 className="text-3xl font-bold text-text-primary mb-2">워크스페이스 생성</h2>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">워크스페이스 이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-12 bg-input-bg/50 border border-border-subtle rounded-lg px-4 text-text-secondary focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">설명 <span className="text-text-faint">(선택)</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-input-bg/50 border border-border-subtle rounded-lg px-4 py-3 text-text-secondary focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              placeholder="워크스페이스에 대한 간단한 설명을 입력하세요"
            />
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
              {error}
            </div>
          )}

          <Button
            onClick={handleCreate}
            disabled={!name || isSubmitting}
            className="w-full h-12 text-base font-semibold bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '생성 중...' : '생성하기'}
          </Button>

          <p className="text-center text-xs text-text-faint mt-4">
            생성 후에도 워크스페이스 이름은 언제든 변경할 수 있습니다.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};
