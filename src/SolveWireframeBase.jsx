// SolveWireframeBase.jsx
import React, { useEffect, useMemo, useState } from "react";
import Editor from "@monaco-editor/react";
import {
  ArrowLeft,
  Clock,
  ExternalLink,
  Play,
  RotateCcw,
  Send,
  X,
} from "lucide-react";

const LANGS = [
  { key: "java", label: "Java" },
  { key: "python", label: "Python" },
  { key: "cpp", label: "C++" },
];

const REF_DOCS = {
  java: { label: "Java Reference", href: "#java-ref" },
  python: { label: "Python Reference", href: "#python-ref" },
  cpp: { label: "C++ Reference", href: "#cpp-ref" },
};

const defaultCodeByLang = {
  java: `class Solution {
  public long solution(String[] grid) {
    long answer = 0;
    return answer;
  }
}
`,
  python: `def solution(grid):
    answer = 0
    return answer
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

long long solution(vector<string> grid) {
  long long answer = 0;
  return answer;
}
`,
};

function Pill({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-[linear-gradient(180deg,rgba(43,67,84,0.65),rgba(32,51,65,0.95))] px-2 py-0.5 text-xs text-white/85 shadow-[0_10px_26px_-22px_rgba(0,0,0,0.95)]">
      {children}
    </span>
  );
}

function IconButton({
  title,
  onClick,
  children,
  variant = "ghost",
  className = "",
}) {
  const base =
    "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition active:scale-[0.99]";
  const styles =
    variant === "primary"
      ? "bg-white text-black hover:bg-white/90"
      : variant === "danger"
        ? "bg-red-500/15 text-red-200 hover:bg-red-500/20 border border-red-500/20"
        : "bg-[#203341] text-white/80 hover:bg-[#2B4354] border border-white/10";
  return (
    <button
      title={title}
      onClick={onClick}
      className={`${base} ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative w-[min(860px,92vw)] rounded-2xl border border-black/10 bg-white text-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-4">
          <div className="text-base font-semibold">{title}</div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-600 hover:bg-black/5"
            aria-label="close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        <div className="flex items-center justify-end gap-2 border-t border-black/10 px-6 py-4">
          {footer}
        </div>
      </div>
    </div>
  );
}

function Select({ value, onChange, options }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-xl border border-white/10 bg-[#203341] px-3 py-2 pr-9 text-sm text-white/90 outline-none hover:bg-[#2B4354] focus:border-white/20"
      >
        {options.map((o) => (
          <option key={o.key} value={o.key} className="bg-[#1D2E3A]">
            {o.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-white/60">
        ▼
      </div>
    </div>
  );
}

function Tabs({ items, activeKey, onChange }) {
  return (
    <div className="flex items-center gap-2">
      {items.map((t) => {
        const active = t.key === activeKey;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`rounded-xl px-3 py-1.5 text-sm transition ${
              active
                ? "bg-white text-black shadow-[0_14px_40px_-28px_rgba(0,0,0,0.8)]"
                : "bg-[#203341] text-white/70 hover:bg-[#2B4354] border border-white/10"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

export default function SolveWireframeBase({ onBack, onOpenSolutions }) {
  const [lang, setLang] = useState("java");
  const [refKey, setRefKey] = useState("java");
  const [code, setCode] = useState(defaultCodeByLang.java);
  const [activeResultTab, setActiveResultTab] = useState("results");

  // timer
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerStartedAt, setTimerStartedAt] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  // toast(간단)
  const [toast, setToast] = useState(null);

  // testcase modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tcInput, setTcInput] = useState('["..#..", "..#.."]');
  const [tcExpected, setTcExpected] = useState("12");
  const [testcases, setTestcases] = useState([
    {
      id: "tc-1",
      input: '["#.##.", ".#..#", "....#", "....#"]',
      expected: "12",
    },
    {
      id: "tc-2",
      input: '["###..", "..#..", "##.##", "..#..", "####."]',
      expected: "15",
    },
  ]);

  const [runState, setRunState] = useState({
    lastRunAt: null,
    summary: "아직 실행하지 않았습니다.",
    items: [],
  });

  const editorLanguage = useMemo(() => {
    if (lang === "java") return "java";
    if (lang === "python") return "python";
    return "cpp";
  }, [lang]);

  const fmt = (ms) => {
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  useEffect(() => {
    if (!timerRunning || !timerStartedAt) return;
    const t = setInterval(() => setElapsedMs(Date.now() - timerStartedAt), 250);
    return () => clearInterval(t);
  }, [timerRunning, timerStartedAt]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const handleLangChange = (next) => {
    setLang(next);
    setRefKey(next);
    setCode((prev) => {
      const looksDefault =
        prev.trim() === (defaultCodeByLang[lang] || "").trim();
      return looksDefault ? defaultCodeByLang[next] : prev;
    });
  };

  const run = () => {
    const now = new Date();
    const items = testcases.map((tc, idx) => {
      const passed = idx % 3 !== 2;
      return {
        id: tc.id,
        name: `테스트 ${idx + 1}`,
        input: tc.input,
        expected: tc.expected,
        actual: passed ? tc.expected : String(Number(tc.expected || 0) + 1),
        passed,
      };
    });
    const passCount = items.filter((i) => i.passed).length;
    setRunState({
      lastRunAt: now,
      summary: `${passCount}/${items.length} 통과`,
      items,
    });
    setActiveResultTab("results");
  };

  const addTestcase = () => {
    setTestcases((prev) => [
      {
        id: `tc-${Date.now()}`,
        input: tcInput.trim() || "(empty)",
        expected: tcExpected.trim() || "(empty)",
      },
      ...prev,
    ]);
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_circle_at_20%_0%,rgba(124,183,255,0.10),transparent_45%),radial-gradient(900px_circle_at_85%_10%,rgba(151,230,176,0.06),transparent_42%),linear-gradient(180deg,#16222B_0%,#1b2b36_35%,#1b2b36_100%)] text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#1b2b36]/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-4 py-3">
          <button
            onClick={onBack}
            className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#203341]/80 px-3 py-2 text-sm text-white/85 hover:bg-[#2B4354]"
          >
            <ArrowLeft className="h-4 w-4" />
            뒤로가기
          </button>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs text-white/60">Reference</span>
              <Select
                value={refKey}
                onChange={setRefKey}
                options={Object.entries(REF_DOCS).map(([key, v]) => ({
                  key,
                  label: v.label,
                }))}
              />
              <a
                href={REF_DOCS[refKey]?.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#203341] px-3 py-2 text-sm text-white/80 hover:bg-[#2B4354]"
              >
                열기 <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            <Select value={lang} onChange={handleLangChange} options={LANGS} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] px-4 py-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Problem */}
          <section className="lg:col-span-4">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#1D2E3A]">
              <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-4">
                <div className="space-y-1">
                  <div className="text-base font-semibold">도서관 탈출</div>
                  <div className="flex items-center gap-2">
                    <Pill>난이도: 중</Pill>
                    <Pill>유형: 그래프/최단거리</Pill>
                  </div>
                </div>
                <div className="text-xs text-white/50">문제 영역</div>
              </div>

              <div className="h-[calc(100vh-190px)] overflow-auto px-4 py-4">
                {/* Baekjoon-style: 문제/입력/출력/예제 */}
                <div className="space-y-6 text-sm leading-7 text-white/80">
                  <section>
                    <div className="mb-3 flex items-end gap-3">
                      <h2 className="text-lg font-semibold text-white">문제</h2>
                      <div className="h-px flex-1 bg-white/10" />
                    </div>
                    <div className="space-y-3 text-white/75">
                      <p>(예시) 백준 본문 렌더링 영역…</p>
                    </div>
                  </section>

                  <section>
                    <div className="mb-3 flex items-end gap-3">
                      <h2 className="text-lg font-semibold text-white">입력</h2>
                      <div className="h-px flex-1 bg-white/10" />
                    </div>
                    <div className="space-y-2 text-white/75">
                      <p>첫째 줄에 …</p>
                    </div>
                  </section>

                  <section>
                    <div className="mb-3 flex items-end gap-3">
                      <h2 className="text-lg font-semibold text-white">출력</h2>
                      <div className="h-px flex-1 bg-white/10" />
                    </div>
                    <div className="space-y-2 text-white/75">
                      <p>출력은 …</p>
                    </div>
                  </section>

                  <section>
                    <div className="mb-3 flex items-end gap-3">
                      <h2 className="text-lg font-semibold text-white">예제</h2>
                      <div className="h-px flex-1 bg-white/10" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-[#203341] p-4">
                        <div className="text-xs font-semibold text-white/70">
                          예제 입력 1
                        </div>
                        <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-[#162732]/60 p-3 text-xs text-white/85">
                          {`5 5
1 3
1 4
4 5
4 3
3 2`}
                        </pre>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-[#203341] p-4">
                        <div className="text-xs font-semibold text-white/70">
                          예제 출력 1
                        </div>
                        <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-[#162732]/60 p-3 text-xs text-white/85">{`3`}</pre>
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              <IconButton title="다른 사람 풀이" onClick={onOpenSolutions}>
                다른 사람 풀이
              </IconButton>
            </div>
          </section>

          {/* Editor + Result */}
          <section className="lg:col-span-8">
            <div className="grid gap-4">
              <div className="rounded-2xl border border-white/10 bg-[#1D2E3A]">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-white/90">
                      Solution.
                      {lang === "python"
                        ? "py"
                        : lang === "cpp"
                          ? "cpp"
                          : "java"}
                    </div>
                    <Pill>Monaco Editor</Pill>
                    <Pill>Theme: navy-dusk</Pill>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {/* Timer */}
                    <div className="flex flex-none items-center gap-2 rounded-2xl border border-white/10 bg-[#203341] px-2 py-1.5">
                      <div className="flex items-center gap-2 px-2">
                        <Clock className="h-4 w-4 text-white/75" />
                        <div className="min-w-[92px] text-center font-mono text-sm tabular-nums text-white/85">
                          {timerStartedAt ? fmt(elapsedMs) : "00:00:00"}
                        </div>
                        {timerRunning ? (
                          <span className="text-[11px] text-emerald-200/80">
                            RUN
                          </span>
                        ) : timerStartedAt ? (
                          <span className="text-[11px] text-white/50">
                            PAUSE
                          </span>
                        ) : (
                          <span className="text-[11px] text-white/50">
                            READY
                          </span>
                        )}
                      </div>

                      <IconButton
                        title={
                          timerStartedAt
                            ? timerRunning
                              ? "일시정지"
                              : "재개"
                            : "시작"
                        }
                        className="w-[92px] justify-center"
                        onClick={() => {
                          if (!timerStartedAt) {
                            setTimerStartedAt(Date.now());
                            setElapsedMs(0);
                            setTimerRunning(true);
                            return;
                          }
                          if (timerRunning) setTimerRunning(false);
                          else {
                            setTimerStartedAt(Date.now() - elapsedMs);
                            setTimerRunning(true);
                          }
                        }}
                      >
                        {timerStartedAt
                          ? timerRunning
                            ? "일시정지"
                            : "재개"
                          : "시작"}
                      </IconButton>

                      <IconButton
                        title="초기화"
                        className="w-[92px] justify-center"
                        onClick={() => {
                          setTimerRunning(false);
                          setTimerStartedAt(null);
                          setElapsedMs(0);
                          setToast({
                            title: "타이머 초기화",
                            body: "00:00:00 으로 초기화했습니다.",
                          });
                        }}
                      >
                        <RotateCcw className="h-4 w-4" />
                        초기화
                      </IconButton>
                    </div>

                    <IconButton
                      title="코드 실행"
                      onClick={run}
                      variant="primary"
                    >
                      <Play className="h-4 w-4" />
                      코드 실행
                    </IconButton>

                    <IconButton
                      title="제출"
                      onClick={() => {
                        if (timerRunning) setTimerRunning(false);
                        setToast({
                          title: "제출(와이어프레임)",
                          body: `소요 시간: ${fmt(elapsedMs)}`,
                        });
                      }}
                    >
                      <Send className="h-4 w-4" />
                      제출 및 채점하기
                    </IconButton>
                  </div>
                </div>

                <div className="h-[460px] overflow-hidden rounded-b-2xl">
                  <Editor
                    height="100%"
                    beforeMount={(monaco) => {
                      monaco.editor.defineTheme("navy-dusk", {
                        base: "vs-dark",
                        inherit: true,
                        rules: [],
                        colors: {
                          "editor.background": "#203341",
                          "editor.foreground": "#D6E2EA",
                          "editor.selectionBackground": "#2F4B5E",
                          "editor.lineHighlightBackground": "#243B4B",
                        },
                      });
                    }}
                    language={editorLanguage}
                    value={code}
                    onChange={(v) => setCode(v ?? "")}
                    theme="navy-dusk"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      automaticLayout: true,
                    }}
                  />
                </div>
              </div>

              {/* Result */}
              <div className="rounded-2xl border border-white/10 bg-[#1D2E3A]">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-white/90">
                      실행 결과
                    </div>
                    <Pill>{runState.summary}</Pill>
                  </div>

                  <Tabs
                    items={[
                      { key: "results", label: "테스트 결과" },
                      { key: "console", label: "콘솔" },
                      { key: "testcases", label: "테스트 케이스" },
                    ]}
                    activeKey={activeResultTab}
                    onChange={setActiveResultTab}
                  />
                </div>

                <div className="min-h-[240px] px-4 py-4">
                  {activeResultTab === "results" ? (
                    <div className="text-sm text-white/70">
                      (와이어프레임) 결과 카드 리스트 영역
                    </div>
                  ) : activeResultTab === "console" ? (
                    <pre className="rounded-xl border border-white/10 bg-[#203341] p-3 text-xs text-white/80">
                      (stdout/stderr)
                    </pre>
                  ) : (
                    <div className="space-y-2">
                      <IconButton
                        title="테스트 케이스 추가"
                        onClick={() => setIsModalOpen(true)}
                      >
                        테스트 케이스 추가
                      </IconButton>
                      <div className="text-xs text-white/60">
                        (와이어프레임) 테스트케이스 리스트…
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[60] w-[min(360px,92vw)] rounded-2xl border border-white/10 bg-[#1D2E3A] p-4">
          <div className="text-sm font-semibold text-white/90">
            {toast.title}
          </div>
          <div className="mt-1 text-sm text-white/70">{toast.body}</div>
        </div>
      )}

      {/* Add testcase modal */}
      <Modal
        open={isModalOpen}
        title="테스트 케이스 추가"
        onClose={() => setIsModalOpen(false)}
        footer={
          <>
            <button
              className="rounded-xl border border-black/10 bg-black/[0.02] px-4 py-2 text-sm"
              onClick={() => setIsModalOpen(false)}
            >
              취소
            </button>
            <button
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
              onClick={addTestcase}
            >
              확인
            </button>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-sm font-semibold">Parameters</div>
            <textarea
              value={tcInput}
              onChange={(e) => setTcInput(e.target.value)}
              rows={6}
              className="mt-2 w-full rounded-xl border border-black/10 px-3 py-2 font-mono text-xs"
            />
          </div>
          <div>
            <div className="text-sm font-semibold">Return</div>
            <input
              value={tcExpected}
              onChange={(e) => setTcExpected(e.target.value)}
              className="mt-2 w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
