import React from 'react';
import { Button } from '@/components/ui/Base';
import { X } from 'lucide-react';

interface IDEAddTestCaseModalProps {
  show: boolean;
  input: string;
  expected: string;
  onInputChange: (v: string) => void;
  onExpectedChange: (v: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  confirmLabel?: string;
}

export function IDEAddTestCaseModal({
  show,
  input,
  expected,
  onInputChange,
  onExpectedChange,
  onClose,
  onConfirm,
  title = '테스트 케이스 추가',
  confirmLabel = '추가',
}: IDEAddTestCaseModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-surface border border-border-default rounded-xl shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-default">
          <h3 className="font-bold text-text-primary text-sm">{title}</h3>
          <button onClick={onClose} className="text-text-faint hover:text-text-primary">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-text-secondary mb-1.5 block">입력</label>
            <textarea
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              className="w-full bg-input-bg border border-border-default rounded-md p-2.5 text-sm font-mono text-text-secondary resize-none focus:outline-none focus:border-emerald-500"
              rows={4}
              placeholder="입력값을 입력하세요..."
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-bold text-text-secondary mb-1.5 block">기대 출력</label>
            <textarea
              value={expected}
              onChange={(e) => onExpectedChange(e.target.value)}
              className="w-full bg-input-bg border border-border-default rounded-md p-2.5 text-sm font-mono text-text-secondary resize-none focus:outline-none focus:border-emerald-500"
              rows={4}
              placeholder="기대 출력값을 입력하세요..."
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-border-default">
          <Button variant="secondary" onClick={onClose} className="text-sm px-4 py-2">취소</Button>
          <Button variant="primary" onClick={onConfirm} className="text-sm px-4 py-2">{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
