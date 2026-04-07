import React from 'react';
import { Button } from '@/components/ui/Base';
import { CheckCircle2, AlertCircle, Loader2, Clock, X, TriangleAlert } from 'lucide-react';

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

  const isJudging = status === 'submitted';
  const wrongMessage = result || '다시 시도해주세요.';
  const isJudgeWrongVerdict = /(틀렸|wrong|오답|time limit|runtime|compile|메모리|시간 초과|런타임|컴파일)/i.test(wrongMessage);
  const wrongTitle = isJudgeWrongVerdict ? '틀렸습니다' : '제출 확인 실패';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[1px]"
      onClick={isJudging ? undefined : onClose}
    >
      <div
        className="relative bg-surface border border-border-default rounded-2xl shadow-xl w-full max-w-lg mx-4 py-12 flex flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-faint hover:text-text-primary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {status === 'submitted' && (
          <>
            <Loader2 className="w-16 h-16 text-amber-500 animate-spin" />
            <p className="text-base font-semibold text-text-secondary">{problemLabel}</p>
            <p className="text-2xl font-bold text-amber-500">채점 중입니다...</p>
            <div className="flex items-center gap-2 text-sm text-text-faint mt-1 px-6 text-center">
              <TriangleAlert className="w-4 h-4 shrink-0 text-amber-500/70" />
              <span>채점 중 창 이동 또는 닫기 시 결과를 가져오지 못할 수 있습니다</span>
            </div>
          </>
        )}
        {status === 'accepted' && (
          <>
            <CheckCircle2 className="w-16 h-16 text-emerald-500" />
            <p className="text-base font-semibold text-text-secondary">{problemLabel}</p>
            <p className="text-2xl font-bold text-emerald-500">맞았습니다!!</p>
            <Button variant="primary" onClick={onClose} className="mt-2 text-sm px-6 py-2">확인</Button>
          </>
        )}
        {status === 'wrong' && (
          <>
            <AlertCircle className="w-14 h-14 text-red-500" />
            <p className="text-base font-semibold text-text-secondary">{problemLabel}</p>
            <p className="text-xl font-bold text-red-500 tracking-tight">{wrongTitle}</p>
            <div className="mt-0.5 w-full px-8">
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm leading-relaxed text-red-300">
                {wrongMessage}
              </p>
            </div>
            <Button variant="secondary" onClick={onClose} className="mt-2 text-sm px-6 py-2">확인</Button>
          </>
        )}
        {status === 'timeout' && (
          <>
            <Clock className="w-16 h-16 text-text-faint" />
            <p className="text-base font-semibold text-text-secondary">{problemLabel}</p>
            <p className="text-2xl font-bold text-text-secondary">결과를 확인할 수 없습니다</p>
            <Button variant="secondary" onClick={onClose} className="mt-2 text-sm px-6 py-2">닫기</Button>
          </>
        )}
      </div>
    </div>
  );
}
