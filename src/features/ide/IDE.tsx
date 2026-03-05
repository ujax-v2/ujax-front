import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Badge } from '@/components/ui/Base';
import { Play, RotateCcw, Settings, CheckCircle2, AlertCircle, Loader2, ArrowLeft, Timer, Plus, Code2, Clock, HardDrive, X } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useParams } from 'react-router-dom';
import { useWorkspaceNavigate } from '@/hooks/useWorkspaceNavigate';
import { ideCodeState, ideLanguageState, ideIsExecutingState, ideTestCasesState, ideTestResultsState, currentWorkspaceState, problemContextState } from '@/store/atoms';
import type { IdeTestCase, IdeTestResult } from '@/store/atoms';
import { getProblemByNumber } from '@/api/problem';
import type { ProblemResponse } from '@/api/problem';
import { createSubmission, getSubmissionResults } from '@/api/submission';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useIsDark } from '@/App';
import { useExtensionProblemContext } from '@/hooks/useExtensionProblemContext';
import { parseApiError } from '@/utils/error';

// Language ID mapping for Judge0
const LANGUAGE_OPTIONS = [
  { id: 63, name: 'JavaScript (Node.js 12.14.0)', value: 'javascript', monaco: 'javascript' },
  { id: 71, name: 'Python (3.8.1)', value: 'python', monaco: 'python' },
  { id: 54, name: 'C++ (GCC 9.2.0)', value: 'cpp', monaco: 'cpp' },
  { id: 62, name: 'Java (OpenJDK 13.0.1)', value: 'java', monaco: 'java' },
];

const LANG_TO_BACKEND: Record<string, string> = {
  javascript: 'JAVASCRIPT',
  python: 'PYTHON',
  cpp: 'CPP',
  java: 'JAVA',
};

const CODE_TEMPLATES: Record<string, string> = {
  javascript: `const fs = require('fs');
const input = fs.readFileSync('/dev/stdin').toString().trim().split(' ');

function solve() {
  const a = parseInt(input[0]);
  const b = parseInt(input[1]);
  console.log(a + b);
}

solve();`,
  python: `import sys
input = sys.stdin.readline

def solve():
    a, b = map(int, input().split())
    print(a + b)

if __name__ == '__main__':
    solve()`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << endl;
    return 0;
}`,
  java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        System.out.println(a + b);
    }
}`
};

const POLL_INTERVAL = 1500;
const MAX_POLL_ATTEMPTS = 40;

const Stopwatch = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isRunning) {
      interval = setInterval(() => setTime((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const fmt = (s: number) => {
    const ss = `0${s % 60}`.slice(-2);
    const mm = `0${Math.floor(s / 60) % 60}`.slice(-2);
    const hh = `0${Math.floor(s / 3600)}`.slice(-2);
    return `${hh}:${mm}:${ss}`;
  };

  return (
    <div className="flex items-center gap-2 bg-surface-subtle rounded px-3 py-1.5 text-sm font-mono text-text-secondary">
      <Timer className="w-3.5 h-3.5 text-emerald-500" />
      <span>{fmt(time)}</span>
      <button onClick={() => setIsRunning(!isRunning)} className="hover:text-text-primary">
        {isRunning ? 'II' : '▶'}
      </button>
    </div>
  );
};


export const IDE = () => {
  const isDark = useIsDark();
  const [code, setCode] = useRecoilState(ideCodeState);
  const [language, setLanguage] = useRecoilState(ideLanguageState);
  const [isExecuting, setIsExecuting] = useRecoilState(ideIsExecutingState);
  const [testCases, setTestCases] = useRecoilState(ideTestCasesState);
  const [testResults, setTestResults] = useRecoilState(ideTestResultsState);
  const currentWsId = useRecoilValue(currentWorkspaceState);
  const problemCtxMap = useRecoilValue(problemContextState);
  const { navigate, toWs } = useWorkspaceNavigate();
  const { problemId } = useParams();
  const ctx = problemId ? problemCtxMap[problemId] : undefined;

  const [problem, setProblem] = useState<ProblemResponse | null>(null);
  const [problemLoading, setProblemLoading] = useState(false);
  const [problemError, setProblemError] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Bottom panel tab: 'cases' | 'results'
  const [bottomTab, setBottomTab] = useState<'cases' | 'results'>('cases');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  // Add test case modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalInput, setModalInput] = useState('');
  const [modalExpected, setModalExpected] = useState('');

  // Extension에 problemContext 전달
  useExtensionProblemContext(
    problem?.problemNumber ?? null,
    ctx?.workspaceProblemId ?? null,
  );

  // Polling cancel ref
  const cancelledRef = useRef(false);

  useEffect(() => {
    return () => { cancelledRef.current = true; };
  }, []);

  // ─── Load problem & init test cases ───
  useEffect(() => {
    if (!problemId) return;
    const num = parseInt(problemId, 10);
    if (!num || num <= 0) return;
    setProblemLoading(true);
    setProblemError('');
    getProblemByNumber(num)
      .then((data) => {
        setProblem(data);
        // Initialize test cases from problem samples
        const sampleCases: IdeTestCase[] = data.samples.map((s) => ({
          id: `sample-${s.id}`,
          input: s.input || '',
          expected: s.output || '',
          isCustom: false,
        }));
        setTestCases(sampleCases);
        if (sampleCases.length > 0) setSelectedCaseId(sampleCases[0].id);
      })
      .catch((err) => {
        setProblemError(parseApiError(err));
      })
      .finally(() => setProblemLoading(false));
  }, [problemId]);

  useEffect(() => {
    if (code.includes('Hello, World!') || code.trim() === '') {
      setCode(CODE_TEMPLATES[language] || '');
    }
  }, []);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = LANGUAGE_OPTIONS.find(l => l.value === e.target.value);
    if (lang) { setLanguage(lang.value); setCode(CODE_TEMPLATES[lang.value] || ''); }
  };

  // ─── Test case management ───
  const openAddModal = useCallback(() => {
    setModalInput('');
    setModalExpected('');
    setShowAddModal(true);
  }, []);

  const confirmAddTestCase = useCallback(() => {
    const newCase: IdeTestCase = {
      id: `custom-${Date.now()}`,
      input: modalInput,
      expected: modalExpected,
      isCustom: true,
    };
    setTestCases((prev) => [...prev, newCase]);
    setSelectedCaseId(newCase.id);
    setBottomTab('cases');
    setShowAddModal(false);
  }, [setTestCases, modalInput, modalExpected]);

  const updateTestCase = useCallback((id: string, field: 'input' | 'expected', value: string) => {
    setTestCases((prev) => prev.map((tc) => tc.id === id ? { ...tc, [field]: value } : tc));
  }, [setTestCases]);

  const deleteTestCase = useCallback((id: string) => {
    setTestCases((prev) => {
      const next = prev.filter((tc) => tc.id !== id);
      if (selectedCaseId === id) {
        setSelectedCaseId(next.length > 0 ? next[0].id : null);
      }
      return next;
    });
  }, [setTestCases, selectedCaseId]);

  // ─── Polling logic ───
  const pollResults = useCallback(async (token: string) => {
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      if (cancelledRef.current) return;
      await new Promise((r) => setTimeout(r, POLL_INTERVAL));
      if (cancelledRef.current) return;

      try {
        const results = await getSubmissionResults(token);
        const mapped: IdeTestResult[] = results.map((r) => ({
          input: r.input,
          expected: r.expected,
          stdout: r.stdout ?? null,
          statusDescription: r.statusDescription,
          statusId: r.statusId,
          isCorrect: r.isCorrect,
          time: r.time ?? null,
          memory: r.memory ?? null,
          token: r.token,
        }));
        setTestResults(mapped);

        // statusId <= 2 means "In Queue" or "Processing"
        const allDone = mapped.every((r) => r.statusId > 2);
        if (allDone) return mapped;
      } catch {
        // polling error — keep going
      }
    }
    // Timeout
    setErrorMsg('채점 시간이 초과되었습니다. 부분 결과를 표시합니다.');
    return null;
  }, [setTestResults]);

  // ─── Execute (실행) ───
  const executeCode = async () => {
    if (!problem || isExecuting) return;
    if (testCases.length === 0) {
      setErrorMsg('테스트 케이스가 없습니다. 테스트를 추가해주세요.');
      return;
    }

    setIsExecuting(true);
    setTestResults([]);
    setErrorMsg('');
    setBottomTab('results');
    cancelledRef.current = false;

    try {
      const res = await createSubmission(currentWsId, problem.id, {
        sourceCode: code,
        language: LANG_TO_BACKEND[language] || 'JAVASCRIPT',
        testCases: testCases.map((tc) => ({ input: tc.input, expected: tc.expected })),
      });
      await pollResults(res!.submissionToken);
    } catch {
      setErrorMsg('실행에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsExecuting(false);
    }
  };

  // ─── Submit (제출) → Extension을 통해 백준 자동 제출 ───
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitted' | 'accepted' | 'wrong' | 'timeout'>('idle');
  const [submitResult, setSubmitResult] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const submitTimeoutRef = useRef<number | null>(null);

  // Extension에서 채점 결과 수신
  useEffect(() => {
    const handleExtResult = (event: MessageEvent) => {
      if (event.source !== window) return;
      if (event.data?.type !== 'ujaxSubmissionResult') return;
      if (!problem || String(event.data.problemNum) !== String(problem.problemNumber)) return;

      const verdict = event.data.verdict || '';
      const ACCEPTED_KEYWORDS = ['맞았습니다', 'Accepted'];
      const isAccepted = ACCEPTED_KEYWORDS.some((kw) => verdict.includes(kw));

      if (isAccepted) {
        setSubmitStatus('accepted');
        setSubmitResult('맞았습니다!!');
      } else {
        setSubmitStatus('wrong');
        setSubmitResult(verdict);
      }

      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
        submitTimeoutRef.current = null;
      }
    };

    window.addEventListener('message', handleExtResult);
    return () => window.removeEventListener('message', handleExtResult);
  }, [problem]);

  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
    };
  }, []);

  const handleSubmit = () => {
    if (!problem) return;

    window.postMessage({
      type: 'ujaxSubmitRequest',
      problemNum: problem.problemNumber,
      code,
      language,
    }, '*');

    setSubmitStatus('submitted');
    setSubmitResult(null);
    setShowSubmitModal(true);

    // 60초 타임아웃
    if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
    submitTimeoutRef.current = window.setTimeout(() => {
      setSubmitStatus(prev => prev === 'submitted' ? 'timeout' : prev);
    }, 60000);
  };

  const closeSubmitModal = () => {
    setShowSubmitModal(false);
    setSubmitStatus('idle');
    setSubmitResult(null);
  };

  // ─── Derived state for results summary ───
  const passedCount = testResults.filter((r) => r.isCorrect).length;
  const totalCount = testResults.length;
  const allDone = testResults.length > 0 && testResults.every((r) => r.statusId > 2);
  const selectedCase = testCases.find((tc) => tc.id === selectedCaseId) || null;

  return (
    <div className="flex h-full flex-col bg-page text-text-secondary">
      {/* Header */}
      <div className="h-14 border-b border-border-default flex items-center justify-between px-5 bg-page shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => toWs('problems')} className="text-sm">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> 돌아가기
          </Button>
          <div className="h-5 w-px bg-surface-subtle" />
          <div className="flex items-center gap-2">
            {problem?.tier && <Badge variant="success">{problem.tier}</Badge>}
            <h1 className="font-semibold text-text-primary text-base">
              {problem ? `${problem.problemNumber}. ${problem.title}` : problemId ? `#${problemId}` : '문제'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Stopwatch />
          <div className="h-5 w-px bg-surface-subtle" />
          <select
            value={language}
            onChange={handleLanguageChange}
            className="bg-input-bg border border-border-subtle rounded px-3 py-1.5 text-sm font-medium text-text-secondary focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            {LANGUAGE_OPTIONS.map(opt => (
              <option key={opt.id} value={opt.value}>{opt.name}</option>
            ))}
          </select>
          <Button variant="ghost" onClick={() => setCode(CODE_TEMPLATES[language])}>
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button variant="secondary"><Settings className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Main: Resizable Left (Problem) | Right (Editor + Test) */}
      <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
        {/* ─── Left: Problem ─── */}
        <ResizablePanel defaultSize={38} minSize={25} maxSize={60}>
          <div className="h-full flex flex-col bg-page overflow-y-auto custom-scrollbar">
            <div className="px-5 py-3 bg-surface border-b border-border-default shrink-0">
              <span className="font-bold text-text-secondary text-sm uppercase tracking-wider">문제 설명</span>
            </div>

            <div className="p-6 space-y-6">
              {problemLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-5 h-5 text-text-faint animate-spin" />
                </div>
              ) : problemError ? (
                <div className="text-center py-12 text-red-400 text-sm">{problemError}</div>
              ) : problem ? (
                <>
                  {/* 제한 정보 */}
                  {(problem.timeLimit || problem.memoryLimit) && (
                    <div className="flex gap-3">
                      {problem.timeLimit && (
                        <div className="flex items-center gap-2 text-sm text-text-muted bg-surface-subtle/60 rounded-md px-3 py-2 border border-border-subtle/50">
                          <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>{problem.timeLimit}</span>
                        </div>
                      )}
                      {problem.memoryLimit && (
                        <div className="flex items-center gap-2 text-sm text-text-muted bg-surface-subtle/60 rounded-md px-3 py-2 border border-border-subtle/50">
                          <HardDrive className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>{problem.memoryLimit}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {problem.description && (
                    <section>
                      <h3 className="text-base font-bold text-text-primary mb-2">문제</h3>
                      <hr className="border-border-subtle mb-3" />
                      <div className="text-text-secondary text-[15px] leading-[1.9] prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: problem.description }} />
                    </section>
                  )}

                  {problem.inputDescription && (
                    <section>
                      <h3 className="text-base font-bold text-text-primary mb-2">입력</h3>
                      <hr className="border-border-subtle mb-3" />
                      <div className="text-text-secondary text-[15px] leading-[1.9] prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: problem.inputDescription }} />
                    </section>
                  )}

                  {problem.outputDescription && (
                    <section>
                      <h3 className="text-base font-bold text-text-primary mb-2">출력</h3>
                      <hr className="border-border-subtle mb-3" />
                      <div className="text-text-secondary text-[15px] leading-[1.9] prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: problem.outputDescription }} />
                    </section>
                  )}

                  {problem.samples && problem.samples.length > 0 && (
                    <div className="space-y-3">
                      {problem.samples.map((s) => (
                        <div key={s.id} className="grid grid-cols-2 gap-3">
                          <div className="bg-input-bg/80 border border-border-default rounded-lg p-3">
                            <h4 className="text-xs font-bold text-text-faint mb-2 uppercase tracking-wider">예제 입력 {s.sampleIndex}</h4>
                            <pre className="text-sm font-mono text-text-secondary whitespace-pre-wrap leading-relaxed">{s.input || ''}</pre>
                          </div>
                          <div className="bg-input-bg/80 border border-border-default rounded-lg p-3">
                            <h4 className="text-xs font-bold text-text-faint mb-2 uppercase tracking-wider">예제 출력 {s.sampleIndex}</h4>
                            <pre className="text-sm font-mono text-text-secondary whitespace-pre-wrap leading-relaxed">{s.output || ''}</pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </>
              ) : (
                <div className="text-center py-12 text-text-faint text-sm">문제를 선택해주세요.</div>
              )}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-surface-subtle hover:bg-indigo-500/50 transition-colors w-[3px]" />

        {/* ─── Right: Editor (top) + Test Panel (bottom) ─── */}
        <ResizablePanel defaultSize={62} minSize={40}>
          <ResizablePanelGroup direction="vertical">
            {/* Editor */}
            <ResizablePanel defaultSize={65} minSize={30}>
              <div className="h-full bg-surface-overlay">
                <Editor
                  height="100%"
                  theme={isDark ? 'vs-dark' : 'light'}
                  language={LANGUAGE_OPTIONS.find(l => l.value === language)?.monaco || 'javascript'}
                  value={code}
                  onChange={(v) => v !== undefined && setCode(v)}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 15,
                    lineNumbers: 'on',
                    roundedSelection: false,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 16 },
                  }}
                />
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-surface-subtle hover:bg-indigo-500/50 transition-colors h-[3px]" />

            {/* Bottom Panel: Test Cases / Results */}
            <ResizablePanel defaultSize={35} minSize={15}>
              <div className="h-full flex flex-col bg-page overflow-hidden">
                {/* Tab bar */}
                <div className="flex items-center border-b border-border-default bg-surface shrink-0">
                  <button
                    onClick={() => setBottomTab('cases')}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${bottomTab === 'cases' ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500' : 'text-text-secondary hover:text-text-primary'}`}
                  >
                    테스트 케이스
                  </button>
                  <button
                    onClick={() => setBottomTab('results')}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${bottomTab === 'results' ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500' : 'text-text-secondary hover:text-text-primary'}`}
                  >
                    테스트 결과
                    {testResults.length > 0 && (
                      <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${allDone && passedCount === totalCount ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : allDone ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'}`}>
                        {passedCount}/{totalCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* Tab content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {bottomTab === 'cases' ? (
                    /* ─── Test Cases Tab ─── */
                    <div className="flex flex-col h-full">
                      {/* Case number tabs */}
                      <div className="flex items-center gap-1 px-3 py-2 border-b border-border-default bg-surface-subtle/50 overflow-x-auto shrink-0">
                        {testCases.map((tc, idx) => {
                          const label = tc.isCustom
                            ? `사용자 ${testCases.filter((t, i) => t.isCustom && i <= idx).length}`
                            : `예제 ${idx + 1}`;
                          return (
                            <button
                              key={tc.id}
                              onClick={() => setSelectedCaseId(tc.id)}
                              className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${selectedCaseId === tc.id ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'text-text-secondary hover:bg-hover-bg'}`}
                            >
                              {label}
                              {tc.isCustom && (
                                <X
                                  className="w-3 h-3 ml-0.5 opacity-60 hover:opacity-100"
                                  onClick={(e) => { e.stopPropagation(); deleteTestCase(tc.id); }}
                                />
                              )}
                            </button>
                          );
                        })}
                        <button
                          onClick={openAddModal}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs text-text-faint hover:text-text-primary hover:bg-hover-bg transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Selected case viewer / editor */}
                      {selectedCase ? (
                        <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                          <div>
                            <label className="text-[10px] font-bold text-text-faint uppercase tracking-wider mb-1 block">입력</label>
                            <textarea
                              value={selectedCase.input}
                              onChange={(e) => updateTestCase(selectedCase.id, 'input', e.target.value)}
                              readOnly={!selectedCase.isCustom}
                              className={`w-full bg-input-bg border border-border-default rounded-md p-2.5 text-sm font-mono text-text-secondary resize-none focus:outline-none min-h-[60px] ${selectedCase.isCustom ? 'focus:border-emerald-500' : 'opacity-70 cursor-default'}`}
                              rows={3}
                              placeholder="입력값을 입력하세요..."
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-text-faint uppercase tracking-wider mb-1 block">기대 출력</label>
                            <textarea
                              value={selectedCase.expected}
                              onChange={(e) => updateTestCase(selectedCase.id, 'expected', e.target.value)}
                              readOnly={!selectedCase.isCustom}
                              className={`w-full bg-input-bg border border-border-default rounded-md p-2.5 text-sm font-mono text-text-secondary resize-none focus:outline-none min-h-[60px] ${selectedCase.isCustom ? 'focus:border-emerald-500' : 'opacity-70 cursor-default'}`}
                              rows={3}
                              placeholder="기대 출력값을 입력하세요..."
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center text-text-faint text-xs">
                          테스트 케이스를 추가해주세요.
                        </div>
                      )}
                    </div>
                  ) : (
                    /* ─── Test Results Tab ─── */
                    <div className="p-4 space-y-3">
                      {/* Error banner */}
                      {errorMsg && (
                        <div className="flex items-center gap-2 p-2.5 rounded-md bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-300 text-xs">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {errorMsg}
                        </div>
                      )}

                      {isExecuting && testResults.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-text-faint">
                          <Loader2 className="w-6 h-6 animate-spin mb-3 text-emerald-500" />
                          <p className="text-xs">실행 중...</p>
                        </div>
                      ) : testResults.length > 0 ? (
                        <>
                          {/* Summary */}
                          <div className="flex items-center gap-3">
                            {allDone && passedCount === totalCount ? (
                              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="font-bold text-sm">전체 통과</span>
                              </div>
                            ) : allDone ? (
                              <div className="flex items-center gap-1.5 text-red-400">
                                <AlertCircle className="w-4 h-4" />
                                <span className="font-bold text-sm">{passedCount}/{totalCount} 통과</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="font-bold text-sm">채점 중... ({testResults.filter(r => r.statusId > 2).length}/{totalCount})</span>
                              </div>
                            )}
                          </div>

                          {/* Result rows */}
                          <div className="space-y-1.5">
                            {testResults.map((r, idx) => {
                              const isPending = r.statusId <= 2;
                              const isPass = r.isCorrect;
                              return (
                                <div
                                  key={r.token || idx}
                                  className={`flex items-center justify-between px-3 py-2 rounded-md border ${isPending ? 'border-yellow-300/50 dark:border-yellow-600/20 bg-yellow-50/30 dark:bg-yellow-900/5' : isPass ? 'border-emerald-300/50 dark:border-emerald-600/20 bg-emerald-50/30 dark:bg-emerald-900/5' : 'border-red-300/50 dark:border-red-600/20 bg-red-50/30 dark:bg-red-900/5'}`}
                                >
                                  <div className="flex items-center gap-2">
                                    {isPending ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin text-yellow-500" />
                                    ) : isPass ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                    ) : (
                                      <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                                    )}
                                    <span className={`text-xs font-bold ${isPending ? 'text-yellow-600 dark:text-yellow-400' : isPass ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                                      케이스 {idx + 1}
                                    </span>
                                    {!isPending && (
                                      <span className="text-xs text-text-secondary">{r.statusDescription}</span>
                                    )}
                                  </div>
                                  {!isPending && (r.time != null || r.memory != null) && (
                                    <span className="text-[10px] text-text-faint">
                                      {r.time != null ? `${r.time}s` : ''}{r.time != null && r.memory != null ? ' / ' : ''}{r.memory != null ? `${r.memory}KB` : ''}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-text-faint">
                          <Play className="w-8 h-8 mb-2 opacity-15" />
                          <p className="text-xs">코드를 실행하여 결과를 확인하세요.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* ─── Bottom Action Bar (고정) ─── */}
      <div className="h-14 border-t border-border-default bg-surface px-5 flex items-center justify-between shrink-0">
        <Button
          variant="ghost"
          onClick={openAddModal}
          className="text-text-secondary hover:text-text-primary hover:bg-hover-bg text-sm border border-border-subtle px-3 py-1.5"
        >
          <Plus className="w-4 h-4 mr-1.5" /> 테스트 추가
        </Button>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              if (ctx) toWs(`problems/${ctx.workspaceProblemId}/solutions?boxId=${ctx.problemBoxId}`);
            }}
            disabled={!ctx}
            className="bg-surface-subtle hover:bg-border-subtle text-text-secondary border border-border-subtle text-sm px-4 py-2"
          >
            <Code2 className="w-4 h-4 mr-1.5" /> 풀이 보기
          </Button>
          <Button
            variant="primary"
            onClick={executeCode}
            disabled={isExecuting}
            className="text-sm px-5 py-2"
          >
            {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Play className="w-4 h-4 mr-1.5" />실행</>}
          </Button>
          <Button
            className="text-white text-sm px-5 py-2 font-semibold bg-emerald-600 hover:bg-emerald-700"
            onClick={handleSubmit}
            disabled={!problem || submitStatus === 'submitted'}
          >
            제출
          </Button>
        </div>
      </div>

      {/* ─── Submit Status Modal ─── */}
      {showSubmitModal && submitStatus !== 'idle' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={closeSubmitModal}
        >
          <div
            className="relative bg-surface border border-border-default rounded-xl shadow-xl w-full max-w-sm mx-4 py-10 flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeSubmitModal}
              className="absolute top-3 right-3 text-text-faint hover:text-text-primary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            {submitStatus === 'submitted' && (
              <>
                <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
                <p className="text-sm font-semibold text-text-secondary">
                  {problem ? `${problem.problemNumber}번 문제` : ''}
                </p>
                <p className="text-lg font-bold text-amber-500">채점 중입니다...</p>
              </>
            )}
            {submitStatus === 'accepted' && (
              <>
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                <p className="text-sm font-semibold text-text-secondary">
                  {problem ? `${problem.problemNumber}번 문제` : ''}
                </p>
                <p className="text-lg font-bold text-emerald-500">맞았습니다!!</p>
                <Button variant="primary" onClick={closeSubmitModal} className="mt-2 text-sm px-6 py-2">
                  확인
                </Button>
              </>
            )}
            {submitStatus === 'wrong' && (
              <>
                <AlertCircle className="w-12 h-12 text-red-500" />
                <p className="text-sm font-semibold text-text-secondary">
                  {problem ? `${problem.problemNumber}번 문제` : ''}
                </p>
                <p className="text-lg font-bold text-red-500">{submitResult || '틀렸습니다'}</p>
                <Button variant="primary" onClick={closeSubmitModal} className="mt-2 text-sm px-6 py-2">
                  확인
                </Button>
              </>
            )}
            {submitStatus === 'timeout' && (
              <>
                <Clock className="w-12 h-12 text-text-faint" />
                <p className="text-sm font-semibold text-text-secondary">
                  {problem ? `${problem.problemNumber}번 문제` : ''}
                </p>
                <p className="text-lg font-bold text-text-secondary">결과를 확인할 수 없습니다</p>
                <Button variant="secondary" onClick={closeSubmitModal} className="mt-2 text-sm px-6 py-2">
                  닫기
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ─── Add Test Case Modal ─── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAddModal(false)}>
          <div className="bg-surface border border-border-default rounded-xl shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-default">
              <h3 className="font-bold text-text-primary text-sm">테스트 케이스 추가</h3>
              <button onClick={() => setShowAddModal(false)} className="text-text-faint hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-text-secondary mb-1.5 block">입력</label>
                <textarea
                  value={modalInput}
                  onChange={(e) => setModalInput(e.target.value)}
                  className="w-full bg-input-bg border border-border-default rounded-md p-2.5 text-sm font-mono text-text-secondary resize-none focus:outline-none focus:border-emerald-500"
                  rows={4}
                  placeholder="입력값을 입력하세요..."
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-bold text-text-secondary mb-1.5 block">기대 출력</label>
                <textarea
                  value={modalExpected}
                  onChange={(e) => setModalExpected(e.target.value)}
                  className="w-full bg-input-bg border border-border-default rounded-md p-2.5 text-sm font-mono text-text-secondary resize-none focus:outline-none focus:border-emerald-500"
                  rows={4}
                  placeholder="기대 출력값을 입력하세요..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-border-default">
              <Button variant="secondary" onClick={() => setShowAddModal(false)} className="text-sm px-4 py-2">
                취소
              </Button>
              <Button variant="primary" onClick={confirmAddTestCase} className="text-sm px-4 py-2">
                추가
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
