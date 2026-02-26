import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '@/components/ui/Base';
import { Play, RotateCcw, Settings, CheckCircle2, AlertCircle, Loader2, ArrowLeft, Timer, ChevronDown, ChevronRight, Plus, Code2, Clock, HardDrive } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useRecoilState } from 'recoil';
import { useParams } from 'react-router-dom';
import { useWorkspaceNavigate } from '@/hooks/useWorkspaceNavigate';
import { ideCodeState, ideLanguageState, ideOutputState, ideIsExecutingState, IdeOutput } from '@/store/atoms';
import { getProblemByNumber } from '@/api/problem';
import type { ProblemResponse } from '@/api/problem';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useIsDark } from '@/App';

// Language ID mapping for Judge0
const LANGUAGE_OPTIONS = [
  { id: 63, name: 'JavaScript (Node.js 12.14.0)', value: 'javascript', monaco: 'javascript' },
  { id: 71, name: 'Python (3.8.1)', value: 'python', monaco: 'python' },
  { id: 54, name: 'C++ (GCC 9.2.0)', value: 'cpp', monaco: 'cpp' },
  { id: 62, name: 'Java (OpenJDK 13.0.1)', value: 'java', monaco: 'java' },
];

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
  const [output, setOutput] = useRecoilState(ideOutputState);
  const [isExecuting, setIsExecuting] = useRecoilState(ideIsExecutingState);
  const { navigate, toWs } = useWorkspaceNavigate();
  const { problemId } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [problem, setProblem] = useState<ProblemResponse | null>(null);
  const [problemLoading, setProblemLoading] = useState(false);
  const [problemError, setProblemError] = useState('');

  const [testOpen, setTestOpen] = useState(false);

  useEffect(() => {
    if (!problemId) return;
    const num = parseInt(problemId, 10);
    if (!num || num <= 0) return;
    setProblemLoading(true);
    setProblemError('');
    getProblemByNumber(num)
      .then((data) => setProblem(data))
      .catch((err) => {
        const msg = err?.message || '';
        const jsonMatch = msg.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try { setProblemError(JSON.parse(jsonMatch[0]).detail || '문제를 불러오는 데 실패했습니다.'); }
          catch { setProblemError('문제를 불러오는 데 실패했습니다.'); }
        } else { setProblemError('문제를 불러오는 데 실패했습니다.'); }
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

  const executeCode = async () => {
    setIsExecuting(true);
    setTestOpen(true);
    setOutput(null);
    try {
      await new Promise(r => setTimeout(r, 1500));
      if (code.includes("error")) {
        setOutput({ stdout: null, stderr: "ReferenceError: error is not defined\n    at Object.<anonymous> (/script.js:1:1)", status: { id: 11, description: "Runtime Error" }, time: "0.050", memory: "13000" });
      } else {
        setOutput({ stdout: "3\n", stderr: null, status: { id: 3, description: "Accepted" }, time: "0.045", memory: "12480" });
      }
    } catch {
      setOutput({ stdout: null, stderr: "Failed to execute code.", status: { id: 0, description: "Network Error" }, time: null, memory: null } as IdeOutput);
    } finally { setIsExecuting(false); }
  };

  const handleSubmit = async () => {
    if (isSubmitting || isExecuting) return;
    setIsSubmitting(true);
    setTestOpen(true);
    setOutput(null);
    try {
      await new Promise(r => setTimeout(r, 1500));
      const res = { stdout: "", stderr: null, status: { id: 3, description: "Accepted" }, time: "0.045", memory: "12480" };
      setOutput(res);
      if (res.status?.id === 3) setTimeout(() => navigate(`/problems/${problemId || '1000'}/solutions`), 1500);
    } catch {
      setOutput({ stdout: null, stderr: "Submission failed.", status: { id: 0, description: "Error" }, time: null, memory: null } as IdeOutput);
    } finally { setIsSubmitting(false); }
  };

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

                  {problem.samples.length > 0 && (
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

        {/* ─── Right: Editor (top) + Test Results (bottom) ─── */}
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

            {/* Test Results */}
            <ResizablePanel defaultSize={35} minSize={15}>
              <div className="h-full flex flex-col bg-page overflow-hidden">
                <button
                  onClick={() => setTestOpen(!testOpen)}
                  className="flex items-center justify-between px-4 py-2 bg-surface hover:bg-hover-bg transition-colors shrink-0 border-b border-border-default"
                >
                  <span className="font-bold text-xs text-text-secondary uppercase tracking-wider">테스트 결과</span>
                  {testOpen ? <ChevronDown className="w-3.5 h-3.5 text-text-faint" /> : <ChevronRight className="w-3.5 h-3.5 text-text-faint" />}
                </button>

                {testOpen && (
                  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {isExecuting ? (
                      <div className="flex flex-col items-center justify-center h-full text-text-faint">
                        <Loader2 className="w-6 h-6 animate-spin mb-3 text-emerald-500" />
                        <p className="text-xs">실행 중...</p>
                      </div>
                    ) : output ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          {output.status?.id === 3 ? (
                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="font-bold text-sm">테스트 통과</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-red-400">
                              <AlertCircle className="w-4 h-4" />
                              <span className="font-bold text-sm">{output.status?.description || 'Error'}</span>
                            </div>
                          )}
                          <div className="h-3 w-px bg-border-subtle" />
                          <span className="text-xs text-text-faint">
                            {output.time || '0'}s / {output.memory || '0'}KB
                          </span>
                        </div>

                        <Card className="p-3 bg-input-bg/80 border-border-default">
                          <h4 className="text-[10px] font-bold text-text-faint mb-1 uppercase tracking-wider">Stdout</h4>
                          <pre className="text-xs font-mono text-text-secondary whitespace-pre-wrap">
                            {output.stdout || <span className="text-text-faint italic">No output</span>}
                          </pre>
                        </Card>

                        {output.stderr && (
                          <Card className="p-3 bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-500/20">
                            <h4 className="text-[10px] font-bold text-red-400 mb-1 uppercase tracking-wider">Stderr</h4>
                            <pre className="text-xs font-mono text-red-600 dark:text-red-300 whitespace-pre-wrap">{output.stderr}</pre>
                          </Card>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-text-faint">
                        <Play className="w-8 h-8 mb-2 opacity-15" />
                        <p className="text-xs">코드를 실행하여 결과를 확인하세요.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* ─── Bottom Action Bar (고정) ─── */}
      <div className="h-14 border-t border-border-default bg-surface px-5 flex items-center justify-between shrink-0">
        <Button variant="ghost" className="text-text-secondary hover:text-text-primary hover:bg-hover-bg text-sm border border-border-subtle px-3 py-1.5">
          <Plus className="w-4 h-4 mr-1.5" /> 테스트 추가
        </Button>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate(`/problems/${problemId || '1000'}/solutions`)}
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
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-5 py-2 font-semibold"
            onClick={handleSubmit}
            disabled={isSubmitting || isExecuting}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : '제출'}
          </Button>
        </div>
      </div>
    </div>
  );
};
