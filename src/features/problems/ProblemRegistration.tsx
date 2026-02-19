import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '@/components/ui/Base';
import { ArrowLeft, Search, Loader2 } from 'lucide-react';
import { useWorkspaceNavigate } from '@/hooks/useWorkspaceNavigate';
import { useExtensionCrawl } from '@/hooks/useExtensionCrawl';
import { findProblemByNumber } from '@/api/problem';
import type { ProblemResponse } from '@/api/problem';

type LookupStatus = 'idle' | 'loading' | 'found' | 'not_found' | 'crawling' | 'error' | 'timeout';

export const ProblemRegistration = () => {
  const { navigate, toWs } = useWorkspaceNavigate();
  const { status: crawlStatus, requestCrawl, reset: resetCrawl } = useExtensionCrawl();

  const [useAlarm, setUseAlarm] = useState(false);
  const [problemNumber, setProblemNumber] = useState('');
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>('idle');
  const [problem, setProblem] = useState<ProblemResponse | null>(null);

  // 크롤링 완료 시 재조회
  useEffect(() => {
    if (crawlStatus === 'success') {
      const num = parseInt(problemNumber, 10);
      if (!num) return;
      setLookupStatus('loading');
      findProblemByNumber(num).then((data) => {
        if (data) {
          setProblem(data);
          setLookupStatus('found');
        } else {
          setLookupStatus('error');
        }
        resetCrawl();
      });
    } else if (crawlStatus === 'error') {
      setLookupStatus('error');
      resetCrawl();
    } else if (crawlStatus === 'timeout') {
      setLookupStatus('timeout');
      resetCrawl();
    }
  }, [crawlStatus]);

  const handleLookup = async () => {
    const num = parseInt(problemNumber, 10);
    if (!num || num <= 0) return;

    setProblem(null);
    setLookupStatus('loading');
    resetCrawl();

    const data = await findProblemByNumber(num);
    if (data) {
      setProblem(data);
      setLookupStatus('found');
    } else {
      setLookupStatus('crawling');
      requestCrawl(num);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLookup();
  };

  const handleRegister = () => {
    if (!problem) {
      alert('문제를 먼저 조회해주세요.');
      return;
    }
    // TODO: API 연동 시 실제 등록 로직 추가
    alert(`문제 "${problem.problemNum}. ${problem.title}"이(가) 등록되었습니다.`);
    toWs('problems');
  };

  const statusMessage = () => {
    switch (lookupStatus) {
      case 'loading':
        return <span className="text-slate-400 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> 조회 중...</span>;
      case 'crawling':
        return <span className="text-yellow-400 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> 크롤링 중... 잠시만 기다려주세요</span>;
      case 'found':
        return <span className="text-green-400 text-sm">문제를 찾았습니다</span>;
      case 'error':
        return <span className="text-red-400 text-sm">크롤링에 실패했습니다. 다시 시도해주세요.</span>;
      case 'timeout':
        return <span className="text-red-400 text-sm">응답 시간이 초과되었습니다. 확장 프로그램이 설치되어 있는지 확인해주세요.</span>;
      default:
        return null;
    }
  };

  const tags = problem?.tags?.map((t: any) => t.name).join(', ') || '';

  return (
    <div className="flex-1 overflow-y-auto bg-[#0F1117] p-8 pb-24">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-100">문제 등록</h1>
          <Button variant="secondary" onClick={() => toWs('problems')} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> 돌아가기
          </Button>
        </div>

        <div className="bg-[#141820] border border-slate-800 rounded-xl p-8 space-y-8">

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400">백준 문제 번호</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={problemNumber}
                  onChange={(e) => {
                    setProblemNumber(e.target.value);
                    if (lookupStatus !== 'idle') {
                      setLookupStatus('idle');
                      setProblem(null);
                      resetCrawl();
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="예: 2504"
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <Button
                  onClick={handleLookup}
                  disabled={lookupStatus === 'loading' || lookupStatus === 'crawling'}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 disabled:opacity-50"
                >
                  {lookupStatus === 'loading' || lookupStatus === 'crawling'
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Search className="w-4 h-4" />}
                </Button>
              </div>
              <div className="min-h-[20px]">{statusMessage()}</div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400">마감일</label>
              <input
                type="text"
                placeholder="25-10-06"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400">문제 제목</label>
            <div className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 min-h-[48px]">
              {problem?.title || <span className="text-slate-600">문제 번호를 조회하면 자동으로 채워집니다</span>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400">티어</label>
              <div className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 min-h-[48px]">
                {problem?.tier || <span className="text-slate-600">-</span>}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400">상태</label>
              <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                <button className="flex-1 py-1.5 text-sm font-medium rounded bg-slate-700 text-white shadow-sm">미제출</button>
                <button className="flex-1 py-1.5 text-sm font-medium rounded text-slate-500 hover:text-slate-300">제출완료</button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400">제출자 수</label>
              <div className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-slate-200">0</div>
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

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-bold text-slate-200 text-sm">알람 설정</div>
                <div className="text-xs text-slate-500">마감 전 알림 (시간 단위)</div>
              </div>
              <div
                className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${useAlarm ? 'bg-indigo-500' : 'bg-slate-700'}`}
                onClick={() => setUseAlarm(!useAlarm)}
              >
                <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${useAlarm ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                defaultValue="2"
                disabled={!useAlarm}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 disabled:opacity-50"
              />
              <Button variant="secondary" className="bg-slate-100 hover:bg-white text-slate-900 font-bold border-none w-24">적용</Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400">메모</label>
            <textarea
              placeholder="(선택) 풀이 포인트"
              className="w-full h-32 bg-slate-900 border border-slate-800 rounded-lg p-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold w-20 disabled:opacity-50"
              onClick={handleRegister}
              disabled={!problem}
            >
              등록
            </Button>
            <Button variant="secondary" className="bg-white hover:bg-slate-100 text-slate-900 font-bold w-20 border-none" onClick={() => toWs('problems')}>취소</Button>
          </div>

        </div>
      </div>
    </div>
  );
};
