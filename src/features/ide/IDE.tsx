import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Badge } from '@/components/ui/Base';
import { Play, Pause, RotateCcw, CheckCircle2, AlertCircle, Loader2, ArrowLeft, Timer, Plus, Code2, Clock, HardDrive, X, ExternalLink, Pencil } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useParams } from 'react-router-dom';
import { useWorkspaceNavigate } from '@/hooks/useWorkspaceNavigate';
import { ideCodeState, ideLanguageState, currentWorkspaceState, problemContextState, userState } from '@/store/atoms';
import type { IdeTestResult } from '@/store/atoms';
import { getProblemByNumber } from '@/api/problem';
import type { ProblemResponse } from '@/api/problem';
import { createSubmission, getSubmissionResults } from '@/api/submission';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useIsDark } from '@/App';
import { useExtensionProblemContext } from '@/hooks/useExtensionProblemContext';
import { parseApiError } from '@/utils/error';
import { sanitizeProblemHtml } from '@/utils/sanitizeHtml';
import { IDESubmitModal } from './IDESubmitModal';
import { IDEAddTestCaseModal } from './IDEAddTestCaseModal';
import { useSubmitLogic } from './hooks/useSubmitLogic';
import { useTestCaseManagement } from './hooks/useTestCaseManagement';

// Language ID mapping for Judge0
const LANGUAGE_OPTIONS = [
  { id: 63, name: 'JavaScript (Node.js 12.14.0)', value: 'javascript', monaco: 'javascript' },
  { id: 71, name: 'Python (3.8.1)',               value: 'python',     monaco: 'python' },
  { id: 54, name: 'C++ (GCC 9.2.0)',              value: 'cpp',        monaco: 'cpp' },
  { id: 50, name: 'C (GCC 9.2.0)',                value: 'c',          monaco: 'c' },
  { id: 62, name: 'Java (OpenJDK 13.0.1)',        value: 'java',       monaco: 'java' },
  { id: 51, name: 'C# (Mono 6.6.0.161)',          value: 'csharp',     monaco: 'csharp' },
  { id: 78, name: 'Kotlin (1.3.70)',              value: 'kotlin',     monaco: 'kotlin' },
];

const LANG_TO_BACKEND: Record<string, string> = {
  javascript: 'JAVASCRIPT',
  python:     'PYTHON',
  cpp:        'CPP',
  c:          'C',
  java:       'JAVA',
  csharp:     'CSHARP',
  kotlin:     'KOTLIN',
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
  c: `#include <stdio.h>

int main() {
    int a, b;
    scanf("%d %d", &a, &b);
    printf("%d\\n", a + b);
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
}`,
  csharp: `using System;

class Main {
    static void Main(string[] args) {
        string[] parts = Console.ReadLine().Split(' ');
        int a = int.Parse(parts[0]);
        int b = int.Parse(parts[1]);
        Console.WriteLine(a + b);
    }
}`,
  kotlin: `import java.util.Scanner

fun main() {
    val sc = Scanner(System.\`in\`)
    val a = sc.nextInt()
    val b = sc.nextInt()
    println(a + b)
}`
};

const POLL_INTERVAL = 1500;
const MAX_POLL_ATTEMPTS = 160;

const Stopwatch = ({ storageKey }: { storageKey: string }) => {

  const loadState = (): { startedAt: number | null; elapsed: number } => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { startedAt: null, elapsed: 0 };
  };

  const [timerState, setTimerState] = useState(loadState);

  const getDisplayTime = () => {
    if (timerState.startedAt !== null) {
      return timerState.elapsed + Math.floor((Date.now() - timerState.startedAt) / 1000);
    }
    return timerState.elapsed;
  };

  const [displayTime, setDisplayTime] = useState(getDisplayTime);

  useEffect(() => {
    if (timerState.startedAt === null) {
      setDisplayTime(timerState.elapsed);
      return;
    }
    const interval = setInterval(() => {
      setDisplayTime(timerState.elapsed + Math.floor((Date.now() - timerState.startedAt!) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [timerState]);

  const toggle = () => {
    setTimerState((prev) => {
      const next = prev.startedAt !== null
        ? { startedAt: null, elapsed: prev.elapsed + Math.floor((Date.now() - prev.startedAt) / 1000) }
        : { ...prev, startedAt: Date.now() };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  const reset = () => {
    const next = { startedAt: null, elapsed: 0 };
    localStorage.setItem(storageKey, JSON.stringify(next));
    setTimerState(next);
  };

  const isRunning = timerState.startedAt !== null;

  const fmt = (s: number) => {
    const ss = `0${s % 60}`.slice(-2);
    const mm = `0${Math.floor(s / 60) % 60}`.slice(-2);
    const hh = `0${Math.floor(s / 3600)}`.slice(-2);
    return `${hh}:${mm}:${ss}`;
  };

  return (
    <div className="flex items-center gap-2 bg-surface-subtle rounded px-3 py-1.5 text-sm font-mono text-text-secondary">
      <Timer className="w-3.5 h-3.5 text-emerald-500" />
      <span>{fmt(displayTime)}</span>
      <button onClick={toggle} className="hover:text-text-primary">
        {isRunning ? <Pause className="w-3.5 h-3.5" fill="currentColor" /> : <Play className="w-3.5 h-3.5" fill="currentColor" />}
      </button>
      <button onClick={reset} className="hover:text-text-primary">
        <RotateCcw className="w-3 h-3" />
      </button>
    </div>
  );
};


export const IDE = () => {
  const isDark = useIsDark();
  const [code, setCode] = useRecoilState(ideCodeState);
  const [language, setLanguage] = useRecoilState(ideLanguageState);
  const currentWsId = useRecoilValue(currentWorkspaceState);
  const user = useRecoilValue(userState);
  const problemCtxMap = useRecoilValue(problemContextState);
  const { toWs } = useWorkspaceNavigate();
  const { problemId } = useParams();
  const ctx = problemId ? problemCtxMap[problemId] : undefined;

  const [problem, setProblem] = useState<ProblemResponse | null>(null);
  const [problemLoading, setProblemLoading] = useState(false);
  const [problemError, setProblemError] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [isExecuting, setIsExecuting] = useState(false);
  const [testResults, setTestResults] = useState<IdeTestResult[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);

  // Bottom panel tab: 'cases' | 'results'
  const [bottomTab, setBottomTab] = useState<'cases' | 'results'>('cases');

  // Custom test case edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState('');
  const [editExpected, setEditExpected] = useState('');

  // Hooks
  const {
    testCases,
    selectedCaseId,
    setSelectedCaseId,
    showAddModal,
    setShowAddModal,
    modalInput,
    setModalInput,
    modalExpected,
    setModalExpected,
    initTestCases,
    openAddModal,
    confirmAddTestCase,
    updateTestCase,
    deleteTestCase,
  } = useTestCaseManagement(`custom_${currentWsId}_${ctx?.problemBoxId ?? 0}_${problemId ?? ''}`);

  const { submitStatus, submitResult, showSubmitModal, handleSubmit, closeSubmitModal } = useSubmitLogic(problem);

  // Extension에 problemContext 전달
  useExtensionProblemContext(
    problem?.problemNumber ?? null,
    ctx?.workspaceProblemId ?? null,
  );

  // Polling cancel ref
  const cancelledRef = useRef(false);

  // 코드 자동 저장용 debounce ref
  const saveCodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 문제별 코드+언어 저장 키 (타이머와 동일한 패턴)
  const codeStorageKey = `ide_code_${currentWsId}_${ctx?.problemBoxId ?? 0}_${problemId ?? ''}`;

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
        initTestCases(data.samples.map((s) => ({
          id: `sample-${s.id}`,
          input: s.input || '',
          expected: s.output || '',
          isCustom: false,
        })));
      })
      .catch((err) => {
        setProblemError(parseApiError(err));
      })
      .finally(() => setProblemLoading(false));
  }, [problemId]);

  // 문제 변경 시 저장된 코드+언어 복원, 없으면 템플릿
  useEffect(() => {
    if (!problemId) return;
    try {
      const saved = localStorage.getItem(codeStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.code) {
          setLanguage(parsed.language || language);
          setCode(parsed.code);
          return;
        }
      }
    } catch { /* ignore */ }
    setCode(CODE_TEMPLATES[language] || CODE_TEMPLATES['javascript']);
  }, [problemId]);

  // 코드/언어 변경 시 debounce 저장 (1초)
  useEffect(() => {
    if (!problemId) return;
    if (saveCodeTimerRef.current) clearTimeout(saveCodeTimerRef.current);
    saveCodeTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(codeStorageKey, JSON.stringify({ code, language }));
      } catch { /* ignore */ }
    }, 1000);
    return () => {
      if (saveCodeTimerRef.current) clearTimeout(saveCodeTimerRef.current);
    };
  }, [code, language, codeStorageKey]);

  useEffect(() => {
    if (testResults.length === 0) {
      setSelectedResultIndex(0);
      return;
    }
    if (selectedResultIndex >= testResults.length) {
      setSelectedResultIndex(0);
    }
  }, [testResults.length, selectedResultIndex]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = LANGUAGE_OPTIONS.find(l => l.value === e.target.value);
    if (lang) { setLanguage(lang.value); setCode(CODE_TEMPLATES[lang.value] || ''); }
  };

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
  }, []);

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

  // ─── Derived state for results summary ───
  const passedCount = testResults.filter((r) => r.isCorrect).length;
  const totalCount = testResults.length;
  const doneCount = testResults.filter((r) => r.statusId > 2).length;
  const allDone = testResults.length > 0 && testResults.every((r) => r.statusId > 2);
  const selectedCase = testCases.find((tc) => tc.id === selectedCaseId) || null;
  const selectedResult = testResults[selectedResultIndex] || null;
  const safeDescription = sanitizeProblemHtml(problem?.description);
  const safeInputDescription = sanitizeProblemHtml(problem?.inputDescription);
  const safeOutputDescription = sanitizeProblemHtml(problem?.outputDescription);

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
          <Stopwatch storageKey={`timer_${currentWsId}_${ctx?.problemBoxId ?? 0}_${problemId ?? ''}`} />
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
                  <div className="flex items-center gap-3 flex-wrap">
                    {problem.timeLimit && (
                      <div className="flex items-center gap-2 text-sm text-text-muted bg-surface-subtle/60 rounded-md px-3 py-2 border border-border-subtle/50">
                        <Clock className="w-3.5 h-3.5 text-indigo-700 dark:text-indigo-500" />
                        <span>{problem.timeLimit}</span>
                      </div>
                    )}
                    {problem.memoryLimit && (
                      <div className="flex items-center gap-2 text-sm text-text-muted bg-surface-subtle/60 rounded-md px-3 py-2 border border-border-subtle/50">
                        <HardDrive className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{problem.memoryLimit}</span>
                      </div>
                    )}
                    <a
                      href={`https://www.acmicpc.net/problem/${problem.problemNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-border-subtle/50 bg-surface-subtle/60 hover:bg-hover-bg hover:border-emerald-500/50 text-text-muted hover:text-emerald-400 text-sm transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      백준 바로가기
                    </a>
                  </div>

                  {safeDescription && (
                    <section>
                      <h3 className="text-base font-bold text-text-primary mb-2">문제</h3>
                      <hr className="border-border-subtle mb-3" />
                      <div className="text-text-secondary text-[15px] leading-[1.9] prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: safeDescription }} />
                    </section>
                  )}

                  {safeInputDescription && (
                    <section>
                      <h3 className="text-base font-bold text-text-primary mb-2">입력</h3>
                      <hr className="border-border-subtle mb-3" />
                      <div className="text-text-secondary text-[15px] leading-[1.9] prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: safeInputDescription }} />
                    </section>
                  )}

                  {safeOutputDescription && (
                    <section>
                      <h3 className="text-base font-bold text-text-primary mb-2">출력</h3>
                      <hr className="border-border-subtle mb-3" />
                      <div className="text-text-secondary text-[15px] leading-[1.9] prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: safeOutputDescription }} />
                    </section>
                  )}

                  {problem.samples && problem.samples.length > 0 && (
                    <div className="space-y-3">
                      {problem.samples.map((s) => (
                        <div key={s.id} className="grid grid-cols-2 gap-3">
                          <div className="bg-input-bg/80 border border-border-default rounded-lg p-3 overflow-x-auto custom-scrollbar">
                            <h4 className="text-xs font-bold text-text-faint mb-2 uppercase tracking-wider">예제 입력 {s.sampleIndex}</h4>
                            <pre className="text-sm font-mono text-text-secondary whitespace-pre leading-relaxed">{s.input || ''}</pre>
                          </div>
                          <div className="bg-input-bg/80 border border-border-default rounded-lg p-3 overflow-x-auto custom-scrollbar">
                            <h4 className="text-xs font-bold text-text-faint mb-2 uppercase tracking-wider">예제 출력 {s.sampleIndex}</h4>
                            <pre className="text-sm font-mono text-text-secondary whitespace-pre leading-relaxed">{s.output || ''}</pre>
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

        <ResizableHandle withHandle className="bg-surface-subtle hover:bg-indigo-600/50 transition-colors w-[3px]" />

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

            <ResizableHandle withHandle className="bg-surface-subtle hover:bg-indigo-600/50 transition-colors h-[3px]" />

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
                          const label = `예제 ${idx + 1}`;
                          return (
                            <button
                              key={tc.id}
                              onClick={() => setSelectedCaseId(tc.id)}
                              className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${selectedCaseId === tc.id ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'text-text-secondary hover:bg-hover-bg'}`}
                            >
                              {label}
                              {tc.isCustom && (
                                <>
                                  <Pencil
                                    className="w-3 h-3 ml-0.5 opacity-60 hover:opacity-100"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingCaseId(tc.id);
                                      setEditInput(tc.input);
                                      setEditExpected(tc.expected);
                                      setShowEditModal(true);
                                    }}
                                  />
                                  <X
                                    className="w-3 h-3 ml-0.5 opacity-60 hover:opacity-100"
                                    onClick={(e) => { e.stopPropagation(); deleteTestCase(tc.id); }}
                                  />
                                </>
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

                      {/* Selected case viewer */}
                      {selectedCase ? (
                        <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                          <div>
                            <label className="text-[10px] font-bold text-text-faint uppercase tracking-wider mb-1 block">입력</label>
                            <textarea
                              value={selectedCase.input}
                              readOnly
                              className="w-full bg-input-bg border border-border-default rounded-md p-2.5 text-sm font-mono text-text-secondary resize-none focus:outline-none opacity-70 cursor-default"
                              rows={Math.max(3, selectedCase.input.split('\n').length)}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-text-faint uppercase tracking-wider mb-1 block">기대 출력</label>
                            <textarea
                              value={selectedCase.expected}
                              readOnly
                              className="w-full bg-input-bg border border-border-default rounded-md p-2.5 text-sm font-mono text-text-secondary resize-none focus:outline-none opacity-70 cursor-default"
                              rows={Math.max(3, selectedCase.expected.split('\n').length)}
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
                        <div className="space-y-4">
                          {/* Summary */}
                          <div className="flex items-center justify-between">
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
                                <span className="font-bold text-sm">채점 중... ({doneCount}/{totalCount})</span>
                              </div>
                            )}
                            <span className="text-xs text-text-faint">테스트 결과 {passedCount}/{totalCount}</span>
                          </div>

                          {/* Case selector */}
                          <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            {testResults.map((r, idx) => {
                              const isPending = r.statusId <= 2;
                              const isPass = r.isCorrect;
                              const isActive = selectedResultIndex === idx;
                              return (
                                <button
                                  key={r.token || idx}
                                  onClick={() => setSelectedResultIndex(idx)}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap transition-colors ${isActive
                                    ? 'bg-border-subtle border-border-default text-text-primary'
                                    : 'bg-surface-subtle/40 border-border-subtle text-text-secondary hover:text-text-primary hover:bg-hover-bg'
                                    }`}
                                >
                                  {isPending ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-yellow-500" />
                                  ) : isPass ? (
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                  ) : (
                                    <span className="w-2 h-2 rounded-full bg-red-500" />
                                  )}
                                  Case {idx + 1}
                                </button>
                              );
                            })}
                          </div>

                          {/* Selected case detail */}
                          {selectedResult && (
                            <div className="rounded-xl border border-border-default bg-surface-subtle/30 p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-lg font-bold ${selectedResult.statusId <= 2
                                    ? 'text-yellow-600 dark:text-yellow-400'
                                    : selectedResult.isCorrect
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-red-500'
                                    }`}
                                >
                                  {selectedResult.statusId <= 2
                                    ? '채점 중...'
                                    : selectedResult.isCorrect
                                      ? '맞았습니다!'
                                      : '틀렸습니다'}
                                </span>
                              </div>

                              <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-text-faint mb-1.5">입력</p>
                                <pre className="bg-input-bg/80 border border-border-default rounded-lg p-3 text-sm text-text-secondary whitespace-pre-wrap break-words leading-relaxed">{selectedResult.input || '(빈 입력)'}</pre>
                              </div>

                              <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-text-faint mb-1.5">나의 출력</p>
                                <pre className="bg-input-bg/80 border border-border-default rounded-lg p-3 text-sm text-text-secondary whitespace-pre-wrap break-words leading-relaxed">{selectedResult.stdout ?? '(출력 없음)'}</pre>
                              </div>

                              <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-text-faint mb-1.5">정답</p>
                                <pre className="bg-input-bg/80 border border-border-default rounded-lg p-3 text-sm text-text-secondary whitespace-pre-wrap break-words leading-relaxed">{selectedResult.expected || '(빈 정답)'}</pre>
                              </div>

                              <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-text-faint mb-1.5">상세 정보</p>
                                <div className="bg-input-bg/80 border border-border-default rounded-lg p-3 text-sm text-text-secondary space-y-1.5">
                                  <p>채점 상태: <span className="font-semibold">{selectedResult.statusDescription}</span></p>
                                  <p>실행 시간: <span className="font-semibold">{selectedResult.time != null ? `${selectedResult.time}s` : '-'}</span></p>
                                  <p>메모리: <span className="font-semibold">{selectedResult.memory != null ? `${selectedResult.memory}KB` : '-'}</span></p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
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
              if (ctx) toWs(`problems/${ctx.workspaceProblemId}/solutions?boxId=${ctx.problemBoxId}&ideId=${problemId}`);
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
            onClick={() => handleSubmit(code, language, user.baekjoonId)}
            disabled={!problem || submitStatus === 'submitted' || !user.baekjoonId?.trim()}
          >
            제출
          </Button>
        </div>
      </div>

      {/* ─── Modals ─── */}
      <IDESubmitModal
        show={showSubmitModal}
        status={submitStatus}
        result={submitResult}
        problemNumber={problem?.problemNumber}
        onClose={closeSubmitModal}
      />
      <IDEAddTestCaseModal
        show={showAddModal}
        input={modalInput}
        expected={modalExpected}
        onInputChange={setModalInput}
        onExpectedChange={setModalExpected}
        onClose={() => setShowAddModal(false)}
        onConfirm={confirmAddTestCase}
      />
      <IDEAddTestCaseModal
        show={showEditModal}
        input={editInput}
        expected={editExpected}
        onInputChange={setEditInput}
        onExpectedChange={setEditExpected}
        onClose={() => setShowEditModal(false)}
        onConfirm={() => {
          if (editingCaseId) {
            updateTestCase(editingCaseId, 'input', editInput);
            updateTestCase(editingCaseId, 'expected', editExpected);
          }
          setShowEditModal(false);
        }}
        title="테스트 케이스 수정"
        confirmLabel="저장"
      />
    </div>
  );
};
