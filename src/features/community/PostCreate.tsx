import React, { useState, useEffect } from 'react';
import { Card, Button } from '@/components/ui/Base';
import { useWorkspaceNavigate } from '@/hooks/useWorkspaceNavigate';
import { useRecoilValue } from 'recoil';
import { currentWorkspaceState } from '@/store/atoms';
import { createBoard, LABEL_TO_BOARD_TYPE } from '@/api/board';
import type { MemberRole } from '@/api/board';
import { getMyMembership } from '@/api/workspace';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  PenSquare,
  ArrowLeft,
  Check,
  Eye,
  Edit3,
  Bold,
  Italic,
  List,
  ListOrdered,
  Code,
  Link,
  Image,
  Heading1,
  Heading2,
  Quote,
  Minus,
  Loader2,
} from 'lucide-react';

type EditorTab = 'write' | 'preview';

const TOOLBAR_ACTIONS = [
  { icon: Heading1, label: 'H1', insert: '# ', type: 'prefix' as const },
  { icon: Heading2, label: 'H2', insert: '## ', type: 'prefix' as const },
  { icon: Bold, label: '굵게', insert: '**', type: 'wrap' as const },
  { icon: Italic, label: '기울임', insert: '_', type: 'wrap' as const },
  { icon: Code, label: '코드', insert: '`', type: 'wrap' as const },
  { icon: Quote, label: '인용', insert: '> ', type: 'prefix' as const },
  { icon: Minus, label: '구분선', insert: '\n---\n', type: 'insert' as const },
  { icon: List, label: '목록', insert: '- ', type: 'prefix' as const },
  { icon: ListOrdered, label: '번호 목록', insert: '1. ', type: 'prefix' as const },
  { icon: Link, label: '링크', insert: '[텍스트](url)', type: 'insert' as const },
  { icon: Image, label: '이미지', insert: '![대체텍스트](url)', type: 'insert' as const },
];

export const PostCreate = () => {
  const { toWs } = useWorkspaceNavigate();
  const wsId = useRecoilValue(currentWorkspaceState);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('자유');
  const [activeTab, setActiveTab] = useState<EditorTab>('write');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [myRole, setMyRole] = useState<MemberRole>('MEMBER');

  // 내 역할 조회 → OWNER만 공지 태그 노출
  useEffect(() => {
    if (!wsId) return;
    getMyMembership(wsId).then(data => {
      if (data.role) setMyRole(data.role as MemberRole);
    }).catch(() => { /* 권한 조회 실패 시 기본 MEMBER */ });
  }, [wsId]);

  const availableTags = myRole === 'OWNER'
    ? ['자유', '질문', '자료', '공지']
    : ['자유', '질문', '자료'];
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleToolbarAction = (action: typeof TOOLBAR_ACTIONS[number]) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);

    let newContent: string;
    let cursorPos: number;

    if (action.type === 'wrap') {
      const wrapped = `${action.insert}${selected || '텍스트'}${action.insert}`;
      newContent = content.substring(0, start) + wrapped + content.substring(end);
      cursorPos = start + action.insert.length + (selected ? selected.length : 3);
    } else if (action.type === 'prefix') {
      newContent = content.substring(0, start) + action.insert + selected + content.substring(end);
      cursorPos = start + action.insert.length + selected.length;
    } else {
      newContent = content.substring(0, start) + action.insert + content.substring(end);
      cursorPos = start + action.insert.length;
    }

    setContent(newContent);
    // 커서 위치 복원
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPos, cursorPos);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('제목과 내용을 모두 입력해주세요.');
      return;
    }
    if (title.trim().length > 50) {
      setError('제목은 50자 이내로 입력해주세요.');
      return;
    }
    if (content.trim().length > 2000) {
      setError('내용은 2000자 이내로 입력해주세요.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const boardType = LABEL_TO_BOARD_TYPE[selectedTag];
      await createBoard(wsId, {
        type: boardType,
        title: title.trim(),
        content: content.trim(),
      });
      toWs('community');
    } catch (err: any) {
      const msg = err?.message || '';
      const jsonMatch = msg.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          setError(parsed.detail || '요청에 실패했습니다.');
        } catch {
          setError('요청에 실패했습니다.');
        }
      } else {
        setError('요청에 실패했습니다.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const charCount = content.length;
  const charOver = charCount > 2000;

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#0F1117] h-full">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
          <button
            onClick={() => toWs('community')}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-full transition-colors focus:outline-none"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">새 게시물 작성</h1>
            <p className="text-slate-400 text-sm mt-1">마크다운 문법을 지원합니다. 팀원들에게 유용한 정보를 공유하거나 질문해보세요.</p>
          </div>
        </div>

        {/* Editor Form */}
        <Card className="bg-[#141820] border-slate-800 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Tag Selection */}
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-3">태그 분류</label>
              <div className="flex gap-2">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTag(tag)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all border ${selectedTag === tag
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {selectedTag === tag && <Check className="w-3.5 h-3.5" />}
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Title Input */}
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="게시물 제목을 입력하세요"
                maxLength={50}
                className="w-full bg-transparent border-0 border-b border-slate-800 focus:outline-none focus:ring-0 text-2xl font-bold text-slate-100 placeholder:text-slate-600 focus:border-emerald-500/50 transition-colors pb-3"
                autoFocus
              />
              <div className="flex justify-end mt-1">
                <span className={`text-xs font-mono ${title.length > 50 ? 'text-red-400' : 'text-slate-600'}`}>
                  {title.length}/50
                </span>
              </div>
            </div>

            {/* Markdown Editor */}
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              {/* Editor Tabs */}
              <div className="flex items-center justify-between bg-[#0F1117] border-b border-slate-800 px-4">
                <div className="flex">
                  <button
                    type="button"
                    onClick={() => setActiveTab('write')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-bold transition-colors border-b-2 ${
                      activeTab === 'write'
                        ? 'text-emerald-400 border-emerald-500'
                        : 'text-slate-500 border-transparent hover:text-slate-300'
                    }`}
                  >
                    <Edit3 className="w-4 h-4" />
                    작성
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-bold transition-colors border-b-2 ${
                      activeTab === 'preview'
                        ? 'text-emerald-400 border-emerald-500'
                        : 'text-slate-500 border-transparent hover:text-slate-300'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    미리보기
                  </button>
                </div>
                <span className={`text-xs font-mono ${charOver ? 'text-red-400' : 'text-slate-600'}`}>
                  {charCount}/2000
                </span>
              </div>

              {/* Toolbar (작성 탭에서만) */}
              {activeTab === 'write' && (
                <div className="flex items-center gap-1 px-3 py-2 bg-[#0F1117]/50 border-b border-slate-800/50 flex-wrap">
                  {TOOLBAR_ACTIONS.map((action, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleToolbarAction(action)}
                      title={action.label}
                      className="p-1.5 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                    >
                      <action.icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              )}

              {/* Content Area */}
              {activeTab === 'write' ? (
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="마크다운으로 작성해보세요...&#10;&#10;# 제목&#10;## 소제목&#10;**굵게** *기울임* `코드`&#10;- 목록 항목&#10;```python&#10;print('Hello!')&#10;```"
                  className="w-full min-h-[400px] bg-slate-900/30 p-5 text-slate-200 text-sm font-mono placeholder:text-slate-600 focus:outline-none resize-y leading-relaxed"
                />
              ) : (
                <div className="min-h-[400px] p-5 bg-slate-900/30">
                  {content.trim() ? (
                    <div className="prose prose-invert prose-sm max-w-none
                      prose-headings:text-slate-100 prose-headings:font-bold
                      prose-p:text-slate-300 prose-p:leading-relaxed
                      prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline
                      prose-strong:text-slate-100
                      prose-code:text-emerald-300 prose-code:bg-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none
                      prose-pre:bg-[#0F1117] prose-pre:border prose-pre:border-slate-800 prose-pre:rounded-lg
                      prose-blockquote:border-emerald-500/50 prose-blockquote:text-slate-400
                      prose-li:text-slate-300
                      prose-hr:border-slate-700
                      prose-img:rounded-lg
                      prose-th:text-slate-300 prose-td:text-slate-400
                    ">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-slate-600 text-sm">미리볼 내용이 없습니다. 작성 탭에서 마크다운을 입력해주세요.</p>
                  )}
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => toWs('community')}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={submitting || charOver}
                className="bg-emerald-600 hover:bg-emerald-700 font-bold px-6 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> 작성 중...</>
                ) : (
                  <><PenSquare className="w-4 h-4" /> 작성 완료</>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
