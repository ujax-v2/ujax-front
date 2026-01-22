// SolutionsPage.jsx
import React, { useMemo, useState } from "react";
import { MessageSquare, ThumbsUp, User, Users, X } from "lucide-react";

const LANGS = [
  { key: "java", label: "Java" },
  { key: "python", label: "Python" },
  { key: "cpp", label: "C++" },
];

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

function TextArea({ value, onChange, placeholder, rows = 2 }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-xl border border-white/10 bg-[#162732]/50 px-3 py-2 text-sm text-white/90 placeholder:text-white/30 outline-none focus:border-white/20"
    />
  );
}

function CodeBlock({ code }) {
  return (
    <pre className="whitespace-pre-wrap rounded-2xl border border-white/10 bg-[#162732]/60 p-4 text-xs leading-6 text-white/85">
      {code}
    </pre>
  );
}

function CommentRow({ c }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-xl border border-white/10 bg-[#203341] text-white/70">
        <User className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="font-semibold text-white/90">{c.user}</span>
          <span className="text-xs text-white/50">{c.at}</span>
        </div>
        <div className="mt-1 text-sm leading-6 text-white/75">{c.body}</div>
      </div>
    </div>
  );
}

/**
 * props:
 * - onBack(): 뒤로가기(해결 화면으로)
 */
export default function SolutionsPage({ onBack }) {
  const [tab, setTab] = useState("all");
  const [lang, setLang] = useState("java");

  // ✅ mock 최소화(요청 반영)
  const [solutions, setSolutions] = useState([
    {
      id: "s1",
      authorLine: "박도현 외 18명",
      lang: "java",
      likes: 44,
      code: `public class Solution { /* ... */ }`,
      comments: [
        { id: "c1", user: "reviewer", at: "2026.01.22", body: "깔끔해요." },
      ],
    },
    {
      id: "s2",
      authorLine: "bestian",
      lang: "cpp",
      likes: 12,
      code: `int main(){ /* ... */ }`,
      comments: [],
    },
  ]);

  const filtered = useMemo(() => {
    const byLang = solutions.filter((s) => s.lang === lang);
    if (tab === "mine") return byLang.filter((s) => s.authorLine === "bestian");
    return byLang;
  }, [solutions, lang, tab]);

  const [draftById, setDraftById] = useState({});

  const addComment = (solutionId) => {
    const draft = (draftById[solutionId] || "").trim();
    if (!draft) return;

    setSolutions((prev) =>
      prev.map((s) => {
        if (s.id !== solutionId) return s;
        return {
          ...s,
          comments: [
            ...s.comments,
            {
              id: `c-${Date.now()}`,
              user: "me",
              at: new Date().toISOString().slice(0, 10),
              body: draft,
            },
          ],
        };
      }),
    );
    setDraftById((p) => ({ ...p, [solutionId]: "" }));
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_circle_at_20%_0%,rgba(124,183,255,0.10),transparent_45%),radial-gradient(900px_circle_at_85%_10%,rgba(151,230,176,0.06),transparent_42%),linear-gradient(180deg,#16222B_0%,#1b2b36_35%,#1b2b36_100%)] text-white">
      {/* Top bar (same tone) */}
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#1b2b36]/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-4 py-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#203341]/80 px-3 py-2 text-sm text-white/85 hover:bg-[#2B4354]"
          >
            ← 뒤로가기
          </button>

          <div className="flex items-center gap-2">
            <Tabs
              items={[
                { key: "all", label: "모든 풀이" },
                { key: "mine", label: "나의 풀이" },
              ]}
              activeKey={tab}
              onChange={setTab}
            />
            <Select value={lang} onChange={setLang} options={LANGS} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] px-4 py-5">
        <div className="space-y-4">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-[#1D2E3A] shadow-[0_24px_70px_-52px_rgba(0,0,0,0.95)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#203341] text-white/75">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white/90">
                      {s.authorLine}
                    </div>
                    <div className="mt-0.5 text-xs text-white/55">
                      사용 언어: {LANGS.find((l) => l.key === s.lang)?.label}
                    </div>
                  </div>
                </div>

                <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#203341] px-3 py-2 text-sm text-white/80 hover:bg-[#2B4354]">
                  <ThumbsUp className="h-4 w-4" /> 좋아요 {s.likes}
                </button>
              </div>

              <div className="px-5 py-4">
                <CodeBlock code={s.code} />

                <div className="mt-4 rounded-2xl border border-white/10 bg-[#203341] p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
                    <MessageSquare className="h-4 w-4" /> 댓글
                  </div>

                  <div className="mt-3 space-y-3">
                    {s.comments.length === 0 ? (
                      <div className="text-sm text-white/60">
                        아직 댓글이 없습니다.
                      </div>
                    ) : (
                      s.comments.map((c) => <CommentRow key={c.id} c={c} />)
                    )}
                  </div>

                  <div className="mt-4 flex items-end gap-2">
                    <TextArea
                      value={draftById[s.id] || ""}
                      onChange={(v) =>
                        setDraftById((p) => ({ ...p, [s.id]: v }))
                      }
                      placeholder="댓글을 입력하세요."
                    />
                    <button
                      onClick={() => addComment(s.id)}
                      className="h-[42px] whitespace-nowrap rounded-xl bg-white px-4 text-sm font-semibold text-black hover:bg-white/90"
                    >
                      등록
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-[#1D2E3A] p-5 text-sm text-white/70">
              해당 조건의 풀이가 없습니다.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
