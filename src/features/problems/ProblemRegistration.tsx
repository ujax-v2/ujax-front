import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Base';
import { ArrowLeft, Search, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRecoilValue } from 'recoil';
import { useWorkspaceNavigate } from '@/hooks/useWorkspaceNavigate';
import { useExtensionCrawl } from '@/hooks/useExtensionCrawl';
import { currentProblemBoxState } from '@/store/atoms';
import { findProblemByNumber } from '@/api/problem';
import { createWorkspaceProblem } from '@/api/workspaceProblem';
import type { ProblemResponse } from '@/api/problem';

type FlowStatus = 'idle' | 'loading' | 'found' | 'crawling' | 'registering' | 'done' | 'error' | 'timeout';

function parseApiError(err: any): { detail: string; status?: number } {
  const msg = err?.message || '';
  const jsonMatch = msg.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return { detail: parsed.detail || '요청에 실패했습니다.', status: parsed.status };
    } catch { /* ignore */ }
  }
  return { detail: '요청에 실패했습니다.' };
}

export const ProblemRegistration = () => {
  const { toWs, currentWsId } = useWorkspaceNavigate();
  const currentBox = useRecoilValue(currentProblemBoxState);
  const { status: crawlStatus, requestCrawl, reset: resetCrawl } = useExtensionCrawl();

  const [problemNumber, setProblemNumber] = useState('');
  const [flowStatus, setFlowStatus] = useState<FlowStatus>('idle');
  const [problem, setProblem] = useState<ProblemResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // 크롤링 완료 시 → 재등록 시도
  useEffect(() => {
    if (crawlStatus === 'success' && currentBox && currentWsId) {
      resetCrawl();
      registerProblem(parseInt(problemNumber, 10));
    } else if (crawlStatus === 'error') {
      setFlowStatus('error');
      setErrorMsg('크롤링에 실패했습니다. 다시 시도해주세요.');
      resetCrawl();
    } else if (crawlStatus === 'timeout') {
      setFlowStatus('timeout');
      setErrorMsg('응답 시간이 초과되었습니다. 확장 프로그램이 설치되어 있는지 확인해주세요.');
      resetCrawl();
    }
  }, [crawlStatus]);

  // 문제 번호로 조회 (미리보기)
  const handleLookup = async () => {
    const num = parseInt(problemNumber, 10);
    if (!num || num <= 0) return;

    setProblem(null);
    setErrorMsg('');
    setFlowStatus('loading');
    resetCrawl();

    const data = await findProblemByNumber(num);
    if (data) {
      setProblem(data);
      setFlowStatus('found');
    } else {
      // DB에 없음 → 크롤링 시작
      setFlowStatus('crawling');
      requestCrawl(num);
    }
  };

  // 실제 등록 (문제집에 추가)
  const registerProblem = async (num: number) => {
    if (!currentWsId || !currentBox) return;
    setFlowStatus('registering');
    setErrorMsg('');

    try {
      await createWorkspaceProblem(currentWsId, currentBox.id, {
        problemNumber: num,
        deadline: null,
        scheduledAt: null,
      });
      // 등록 성공 → 문제 정보 가져오기
      const data = await findProblemByNumber(num);
      if (data) setProblem(data);
      setFlowStatus('done');
    } catch (err: any) {
      const { detail, status } = parseApiError(err);
      if (status === 404) {
        // 아직 DB에 없음 → 크롤링
        setFlowStatus('crawling');
        requestCrawl(num);
      } else {
        setFlowStatus('error');
        setErrorMsg(detail);
      }
    }
  };

  const handleRegister = () => {
    const num = parseInt(problemNumber, 10);
    if (!num || num <= 0) return;
    if (!currentBox) {
      setErrorMsg('문제집을 먼저 선택해주세요.');
      setFlowStatus('error');
      return;
    }
    registerProblem(num);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLookup();
  };

  const handleReset = () => {
    setProblemNumber('');
    setProblem(null);
    setFlowStatus('idle');
    setErrorMsg('');
    resetCrawl();
  };

  const tags = problem?.algorithmTags?.map((t: any) => t.name).join(', ') || '';
  const isProcessing = flowStatus === 'loading' || flowStatus === 'crawling' || flowStatus === 'registering';

  return (
    <div className="flex-1 overflow-y-auto bg-[#0F1117] p-8 pb-24">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-100">문제 등록</h1>
            {currentBox && (
              <p className="text-sm text-slate-500 mt-1">
                <span className="text-slate-400 font-medium">{currentBox.title}</span>에 문제 추가
              </p>
            )}
          </div>
          <Button variant="secondary" onClick={() => toWs('problems')} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> 돌아가기
          </Button>
        </div>

        <div className="bg-[#141820] border border-slate-800 rounded-xl p-8 space-y-8">

          {/* 문제 번호 입력 */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400">백준 문제 번호</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={problemNumber}
                onChange={(e) => {
                  setProblemNumber(e.target.value);
                  if (flowStatus !== 'idle') {
                    handleReset();
                    setProblemNumber(e.target.value);
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder="예: 2504"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <Button
                onClick={handleLookup}
                disabled={isProcessing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 disabled:opacity-50"
              >
                {flowStatus === 'loading'
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Search className="w-4 h-4" />}
              </Button>
            </div>

            {/* 상태 메시지 */}
            <div className="min-h-[20px]">
              {flowStatus === 'loading' && (
                <span className="text-slate-400 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> 조회 중...</span>
              )}
              {flowStatus === 'crawling' && (
                <span className="text-yellow-400 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> DB에 없는 문제입니다. 백준에서 수집 중...</span>
              )}
              {flowStatus === 'registering' && (
                <span className="text-indigo-400 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> 문제집에 등록 중...</span>
              )}
              {flowStatus === 'found' && (
                <span className="text-green-400 text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> 문제를 찾았습니다</span>
              )}
              {flowStatus === 'done' && (
                <span className="text-green-400 text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> 등록 완료!</span>
              )}
              {(flowStatus === 'error' || flowStatus === 'timeout') && (
                <span className="text-red-400 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {errorMsg}</span>
              )}
            </div>
          </div>

          {/* 문제 정보 미리보기 */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400">문제 제목</label>
            <div className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 min-h-[48px]">
              {problem?.title || <span className="text-slate-600">문제 번호를 조회하면 자동으로 채워집니다</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400">티어</label>
              <div className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 min-h-[48px]">
                {problem?.tier || <span className="text-slate-600">-</span>}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400">태그</label>
              <div className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 min-h-[48px]">
                {tags
                  ? <span className="text-slate-200">{tags}</span>
                  : <span className="text-slate-600">문제 번호를 조회하면 자동으로 채워집니다</span>}
              </div>
            </div>
          </div>

          {/* 하단 버튼 */}
          <div className="flex gap-3 pt-4">
            {flowStatus === 'done' ? (
              <>
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6"
                  onClick={handleReset}
                >
                  다른 문제 등록
                </Button>
                <Button
                  variant="secondary"
                  className="bg-white hover:bg-slate-100 text-slate-900 font-bold px-6 border-none"
                  onClick={() => toWs('problems')}
                >
                  문제집으로 돌아가기
                </Button>
              </>
            ) : (
              <>
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 disabled:opacity-50"
                  onClick={handleRegister}
                  disabled={isProcessing || !problemNumber}
                >
                  {flowStatus === 'registering'
                    ? <><Loader2 className="w-4 h-4 animate-spin mr-1" /> 등록 중...</>
                    : '등록'}
                </Button>
                <Button
                  variant="secondary"
                  className="bg-white hover:bg-slate-100 text-slate-900 font-bold px-6 border-none"
                  onClick={() => toWs('problems')}
                >
                  취소
                </Button>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
