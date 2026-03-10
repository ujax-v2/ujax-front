import React from 'react';
import { Button } from '@/components/ui/Base';
import { CheckCircle2, AlertCircle, Loader2, Clock, X } from 'lucide-react';

export type SubmitStatus = 'idle' | 'submitted' | 'accepted' | 'wrong' | 'timeout';

interface IDESubmitModalProps {
  show: boolean;
  status: SubmitStatus;
  result: string | null;
  problemNumber?: number;
  onClose: () => void;
}

export function IDESubmitModal({ show, status, result, problemNumber, onClose }: IDESubmitModalProps) {
  if (!show || status === 'idle') return null;

  const problemLabel = problemNumber ? `${problemNumber}번 문제` : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative bg-surface border border-border-default rounded-xl shadow-xl w-full max-w-sm mx-4 py-10 flex flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-text-faint hover:text-text-primary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {status === 'submitted' && (
          <>
            <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
            <p className="text-sm font-semibold text-text-secondary">{problemLabel}</p>
            <p className="text-lg font-bold text-amber-500">채점 중입니다...</p>
          </>
        )}
        {status === 'accepted' && (
          <>
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            <p className="text-sm font-semibold text-text-secondary">{problemLabel}</p>
            <p className="text-lg font-bold text-emerald-500">맞았습니다!!</p>
            <Button variant="primary" onClick={onClose} className="mt-2 text-sm px-6 py-2">확인</Button>
          </>
        )}
        {status === 'wrong' && (
          <>
            <AlertCircle className="w-12 h-12 text-red-500" />
            <p className="text-sm font-semibold text-text-secondary">{problemLabel}</p>
            <p className="text-lg font-bold text-red-500">{result || '틀렸습니다'}</p>
            <Button variant="primary" onClick={onClose} className="mt-2 text-sm px-6 py-2">확인</Button>
          </>
        )}
        {status === 'timeout' && (
          <>
            <Clock className="w-12 h-12 text-text-faint" />
            <p className="text-sm font-semibold text-text-secondary">{problemLabel}</p>
            <p className="text-lg font-bold text-text-secondary">결과를 확인할 수 없습니다</p>
            <Button variant="secondary" onClick={onClose} className="mt-2 text-sm px-6 py-2">닫기</Button>
          </>
        )}
      </div>
    </div>
  );
}
