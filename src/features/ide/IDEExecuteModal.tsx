import React from 'react';
import { Button } from '@/components/ui/Base';
import { CheckCircle2, AlertCircle, Loader2, X, TriangleAlert } from 'lucide-react';
import type { IdeTestResult } from '@/store/atoms';

interface IDEExecuteModalProps {
  show: boolean;
  status: 'idle' | 'executing' | 'done';
  testResults: IdeTestResult[];
  problemNumber?: number;
  onClose: () => void;
}

export function IDEExecuteModal({ show, status, testResults, problemNumber, onClose }: IDEExecuteModalProps) {
  if (!show || status === 'idle') return null;

  const problemLabel = problemNumber ? `${problemNumber}번 문제` : '';

  const passed = testResults.filter((r) => r.isCorrect).length;
  const total = testResults.length;
  const allPass = passed === total && total > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={status === 'done' ? onClose : undefined}
    >
      <div
        className="relative bg-surface border border-border-default rounded-xl shadow-xl w-full max-w-lg mx-4 py-16 flex flex-col items-center gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-text-faint hover:text-text-primary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {status === 'executing' && (
          <>
            <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
            <p className="text-base font-semibold text-text-secondary">{problemLabel}</p>
            <p className="text-2xl font-bold text-indigo-500">실행 중입니다...</p>
            <div className="flex items-center gap-2 text-sm text-text-faint mt-1 px-6 text-center">
              <TriangleAlert className="w-4 h-4 shrink-0 text-indigo-400/70" />
              <span>실행 중 창 이동 또는 닫기 시 결과를 가져오지 못할 수 있습니다</span>
            </div>
          </>
        )}

        {status === 'done' && allPass && (
          <>
            <CheckCircle2 className="w-16 h-16 text-emerald-500" />
            <p className="text-base font-semibold text-text-secondary">{problemLabel}</p>
            <p className="text-2xl font-bold text-emerald-500">전체 통과 ({passed}/{total})</p>
            <Button variant="primary" onClick={onClose} className="mt-2 text-sm px-6 py-2">확인</Button>
          </>
        )}

        {status === 'done' && !allPass && (
          <>
            <AlertCircle className="w-16 h-16 text-red-500" />
            <p className="text-base font-semibold text-text-secondary">{problemLabel}</p>
            <p className="text-2xl font-bold text-red-500">{passed}/{total} 통과</p>
            <Button variant="secondary" onClick={onClose} className="mt-2 text-sm px-6 py-2">닫기</Button>
          </>
        )}
      </div>
    </div>
  );
}
