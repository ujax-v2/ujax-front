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
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';

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
  const { status: crawlStatus, reason: crawlReason, requestCrawl, reset: resetCrawl } = useExtensionCrawl();

  const [problemNumber, setProblemNumber] = useState('');
  const [deadline, setDeadline] = useState<Dayjs | null>(null);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderHours, setReminderHours] = useState<number>(1);
  const [flowStatus, setFlowStatus] = useState<FlowStatus>('idle');
  const [problem, setProblem] = useState<ProblemResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // 크롤링 완료 시 → 문제 데이터만 조회 (등록은 버튼 클릭 시)
  useEffect(() => {
    if (crawlStatus === 'success') {
      resetCrawl();
      (async () => {
        const num = parseInt(problemNumber, 10);
        const data = await findProblemByNumber(num);
        if (data) {
          setProblem(data);
          setFlowStatus('found');
        } else {
          setFlowStatus('error');
          setErrorMsg('크롤링은 완료되었으나 문제 데이터를 찾을 수 없습니다.');
        }
      })();
    } else if (crawlStatus === 'error') {
      setFlowStatus('error');
      if (crawlReason === 'NOT_FOUND') {
        setErrorMsg('존재하지 않는 문제 번호입니다.');
      } else if (crawlReason === 'NETWORK_ERROR') {
        setErrorMsg('네트워크 연결에 실패했습니다. 다시 시도해주세요.');
      } else {
        setErrorMsg('크롤링에 실패했습니다. 다시 시도해주세요.');
      }
      resetCrawl();
    } else if (crawlStatus === 'timeout') {
      setFlowStatus('timeout');
      setErrorMsg('확장 프로그램이 설치되어 있는지 확인해주세요.');
      resetCrawl();
    }
  }, [crawlStatus]);

  // 문제 번호로 조회 (미리보기)
  const handleLookup = async () => {
    const trimmed = problemNumber.trim();
    if (!trimmed || !/^\d+$/.test(trimmed)) {
      setFlowStatus('error');
      setErrorMsg('문제 번호는 숫자만 입력할 수 있습니다.');
      return;
    }
    const num = parseInt(trimmed, 10);
    if (num <= 0) {
      setFlowStatus('error');
      setErrorMsg('문제 번호는 숫자만 입력할 수 있습니다.');
      return;
    }

    setProblem(null);
    setErrorMsg('');
    setFlowStatus('loading');
    resetCrawl();

    try {
      const data = await findProblemByNumber(num);
      if (data) {
        setProblem(data);
        setFlowStatus('found');
      } else {
        // DB에 없음 → 크롤링 시작
        setFlowStatus('crawling');
        requestCrawl(num);
      }
    } catch (err: any) {
      const { detail } = parseApiError(err);
      setFlowStatus('error');
      setErrorMsg(detail);
    }
  };

  // 등록 버튼 → 조회된 문제 데이터로 문제집에 등록
  const handleRegister = async () => {
    if (!problem || !currentWsId || !currentBox) {
      if (!currentBox) {
        setErrorMsg('문제집을 먼저 선택해주세요.');
        setFlowStatus('error');
      }
      return;
    }

    setFlowStatus('registering');
    setErrorMsg('');

    try {
      await createWorkspaceProblem(currentWsId, currentBox.id, {
        problemId: problem.id,
        deadline: deadline ? deadline.toISOString() : null,
        scheduledAt: (deadline && reminderEnabled)
          ? deadline.subtract(reminderHours, 'hour').toISOString()
          : null,
      });
      setFlowStatus('done');
    } catch (err: any) {
      const { detail } = parseApiError(err);
      setFlowStatus('error');
      setErrorMsg(detail);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLookup();
  };

  const handleReset = () => {
    setProblemNumber('');
    setDeadline(null);
    setReminderEnabled(false);
    setReminderHours(1);
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
                <span className="text-yellow-400 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> 백준에서 문제를 수집하고 있습니다...</span>
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

          {/* 마감일 & 알림 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400">마감일</label>
              <div className="relative">
                <DateTimePicker
                  value={deadline}
                  onChange={(v) => setDeadline(v)}
                  minDateTime={dayjs()}
                  ampm={false}
                  format="YYYY년 MM월 DD일 HH:mm"
                  slotProps={{
                    textField: { fullWidth: true, size: 'small' },
                  }}
                  sx={!deadline ? {
                    '& .MuiPickersSectionList-root': { color: 'transparent' },
                  } : undefined}
                />
                {!deadline && (
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-sm">
                    마감일을 선택하세요
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={reminderEnabled}
                  onCheckedChange={setReminderEnabled}
                  disabled={!deadline}
                />
                <label className="text-sm text-slate-300">마감 전 알림</label>
              </div>

              {reminderEnabled && deadline && (
                <Select
                  value={String(reminderHours)}
                  onValueChange={(v) => setReminderHours(Number(v))}
                >
                  <SelectTrigger className="w-40 bg-slate-900 border-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1시간 전</SelectItem>
                    <SelectItem value="2">2시간 전</SelectItem>
                    <SelectItem value="3">3시간 전</SelectItem>
                    <SelectItem value="6">6시간 전</SelectItem>
                    <SelectItem value="12">12시간 전</SelectItem>
                    <SelectItem value="24">24시간 전</SelectItem>
                  </SelectContent>
                </Select>
              )}
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
                  disabled={!problem || isProcessing}
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
