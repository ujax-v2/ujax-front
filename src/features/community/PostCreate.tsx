import React, { useState, useEffect } from 'react';
import { Card, Button } from '@/components/ui/Base';
import { useWorkspaceNavigate } from '@/hooks/useWorkspaceNavigate';
import { useRecoilValue } from 'recoil';
import { currentWorkspaceState } from '@/store/atoms';
import { createBoard, LABEL_TO_BOARD_TYPE, getBoardImagePresignedUrl } from '@/api/board';
import type { MemberRole } from '@/api/board';
import { getMyMembership } from '@/api/workspace';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { parseApiError } from '@/utils/error';
import { useT } from '@/i18n';
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
  Pin,
  PinOff,
} from 'lucide-react';

type EditorTab = 'write' | 'preview';

const TOOLBAR_ACTIONS = [
  { icon: Heading1, labelKey: 'H1', insert: '# ', type: 'prefix' as const },
  { icon: Heading2, labelKey: 'H2', insert: '## ', type: 'prefix' as const },
  { icon: Bold, labelKey: 'post.toolbar.bold', insert: '**', type: 'wrap' as const },
  { icon: Italic, labelKey: 'post.toolbar.italic', insert: '_', type: 'wrap' as const },
  { icon: Code, labelKey: 'post.toolbar.code', insert: '`', type: 'wrap' as const },
  { icon: Quote, labelKey: 'post.toolbar.quote', insert: '> ', type: 'prefix' as const },
  { icon: Minus, labelKey: 'post.toolbar.divider', insert: '\n---\n', type: 'insert' as const },
  { icon: List, labelKey: 'post.toolbar.list', insert: '- ', type: 'prefix' as const },
  { icon: ListOrdered, labelKey: 'post.toolbar.numberedList', insert: '1. ', type: 'prefix' as const },
  { icon: Link, labelKey: 'post.toolbar.link', insert: '[텍스트](url)', type: 'insert' as const },
  { icon: Image, labelKey: 'post.toolbar.image', insert: '![대체텍스트](url)', type: 'insert' as const },
];

export const PostCreate = () => {
  const { toWs } = useWorkspaceNavigate();
  const wsId = useRecoilValue(currentWorkspaceState);
  const t = useT();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('free');
  const [activeTab, setActiveTab] = useState<EditorTab>('write');
  const [pinned, setPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [myRole, setMyRole] = useState<MemberRole>('MEMBER');

  // 내 역할 조회 → OWNER만 공지 태그 노출
  useEffect(() => {
    if (!wsId) return;
    getMyMembership(wsId).then(data => {
      if (data.role) setMyRole(data.role as MemberRole);
    }).catch(() => { /* 권한 조회 실패 시 기본 MEMBER */ });
  }, [wsId]);

  const TAG_LABEL_MAP: Record<string, string> = {
    free: 'community.tags.free',
    question: 'community.tags.question',
    data: 'community.tags.data',
    notice: 'community.tags.notice',
  };

  const availableTags = myRole === 'OWNER'
    ? ['free', 'question', 'data', 'notice']
    : ['free', 'question', 'data'];
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const IMAGE_URL_RE = /^https?:\/\/\S+\.(png|jpe?g|gif|webp|svg|bmp|ico)(\?\S*)?$/i;
  const GENERAL_URL_RE = /^https?:\/\/\S+$/i;

  const insertAtCursor = (textarea: HTMLTextAreaElement, text: string) => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.substring(0, start) + text + content.substring(end);
    setContent(newContent);
    const cursorPos = start + text.length;
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPos, cursorPos);
    });
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current!;

    // 이미지 파일(스크린샷 포함) 붙여넣기 처리
    const imageItem = Array.from(e.clipboardData.items).find(
      item => item.kind === 'file' && item.type.startsWith('image/')
    );
    if (imageItem) {
      e.preventDefault();
      const file = imageItem.getAsFile();
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        setError('이미지 크기는 5MB를 초과할 수 없습니다.');
        return;
      }
      const placeholder = '![이미지 업로드 중...]()';
      const start = textarea.selectionStart;
      insertAtCursor(textarea, placeholder);
      setImageUploading(true);
      try {
        const { presignedUrl, imageUrl } = await getBoardImagePresignedUrl(wsId, file.size, file.type);
        await fetch(presignedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });
        setContent(prev => prev.replace(placeholder, `![이미지](${imageUrl})`));
        requestAnimationFrame(() => {
          textarea.focus();
          const pos = start + `![이미지](${imageUrl})`.length;
          textarea.setSelectionRange(pos, pos);
        });
      } catch {
        setContent(prev => prev.replace(placeholder, ''));
        setError('이미지 업로드에 실패했습니다.');
      } finally {
        setImageUploading(false);
      }
      return;
    }

    const pasted = e.clipboardData.getData('text/plain').trim();
    if (!pasted) return;

    // 이미지 URL이면 ![이미지](url) 로 변환
    if (IMAGE_URL_RE.test(pasted)) {
      e.preventDefault();
      const textarea = textareaRef.current!;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const md = `![이미지](${pasted})`;
      const newContent = content.substring(0, start) + md + content.substring(end);
      setContent(newContent);
      const cursorPos = start + md.length;
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(cursorPos, cursorPos);
      });
      return;
    }

    // 일반 URL이면 [링크](url) 로 변환
    if (GENERAL_URL_RE.test(pasted) && !pasted.includes('\n')) {
      e.preventDefault();
      const textarea = textareaRef.current!;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = content.substring(start, end);
      const label = selected || '링크';
      const md = `[${label}](${pasted})`;
      const newContent = content.substring(0, start) + md + content.substring(end);
      setContent(newContent);
      // 라벨 텍스트를 선택 상태로 (바로 수정 가능하게)
      const labelStart = start + 1;
      const labelEnd = labelStart + label.length;
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(labelStart, labelEnd);
      });
    }
  };

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
      setError(t('post.validation.titleContentRequired'));
      return;
    }
    if (title.trim().length > 50) {
      setError(t('post.validation.titleMaxLength'));
      return;
    }
    if (content.trim().length > 2000) {
      setError(t('post.validation.contentMaxLength'));
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
        ...(boardType === 'NOTICE' && pinned ? { pinned: true } : {}),
      });
      toWs('community');
    } catch (err: any) {
      setError(parseApiError(err, t('common.error')));
    } finally {
      setSubmitting(false);
    }
  };

  const charCount = content.length;
  const charOver = charCount > 2000;

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-page h-full">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4 border-b border-border-default pb-6">
          <button
            onClick={() => toWs('community')}
            className="p-2 text-text-muted hover:text-text-secondary hover:bg-surface-subtle rounded-full transition-colors focus:outline-none"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">{t('post.create')}</h1>
          </div>
        </div>

        {/* Editor Form */}
        <Card className="bg-surface border-border-default p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Tag Selection */}
            <div>
              <label className="block text-sm font-bold text-text-secondary mb-3">{t('post.tagCategory')}</label>
              <div className="flex gap-2">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTag(tag)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all border ${selectedTag === tag
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-sm'
                      : 'bg-input-bg text-text-muted border-border-default hover:bg-surface-subtle hover:text-text-secondary'
                    }`}
                  >
                    {selectedTag === tag && <Check className="w-3.5 h-3.5" />}
                    {t(TAG_LABEL_MAP[tag])}
                  </button>
                ))}
              </div>
              {/* 공지 선택 시 고정 토글 */}
              {selectedTag === 'notice' && (
                <button
                  type="button"
                  onClick={() => setPinned(!pinned)}
                  className={`mt-3 inline-flex items-center gap-2.5 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                    pinned
                      ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                      : 'bg-input-bg text-text-muted border-border-default hover:bg-surface-subtle hover:text-text-secondary'
                  }`}
                >
                  {pinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
                  {pinned ? t('post.pin.pinned') : t('post.pin.notPinned')}
                </button>
              )}
            </div>

            {/* Title Input */}
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('post.titlePlaceholder')}
                maxLength={50}
                className="w-full bg-transparent border-0 border-b border-border-default focus:outline-none focus:ring-0 text-2xl font-bold text-text-primary placeholder:text-text-faint focus:border-emerald-500/50 transition-colors pb-3"
                autoFocus
              />
              <div className="flex justify-end mt-1">
                <span className={`text-xs font-mono ${title.length > 50 ? 'text-red-400' : 'text-text-faint'}`}>
                  {title.length}/50
                </span>
              </div>
            </div>

            {/* Markdown Editor */}
            <div className="border border-border-default rounded-xl overflow-hidden">
              {/* Editor Tabs */}
              <div className="flex items-center justify-between bg-page border-b border-border-default px-4">
                <div className="flex">
                  <button
                    type="button"
                    onClick={() => setActiveTab('write')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-bold transition-colors border-b-2 ${
                      activeTab === 'write'
                        ? 'text-emerald-400 border-emerald-500'
                        : 'text-text-faint border-transparent hover:text-text-secondary'
                    }`}
                  >
                    <Edit3 className="w-4 h-4" />
                    {t('post.editorTabs.write')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-bold transition-colors border-b-2 ${
                      activeTab === 'preview'
                        ? 'text-emerald-400 border-emerald-500'
                        : 'text-text-faint border-transparent hover:text-text-secondary'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    {t('post.editorTabs.preview')}
                  </button>
                </div>
                <span className={`text-xs font-mono ${charOver ? 'text-red-400' : 'text-text-faint'}`}>
                  {charCount}/2000
                </span>
              </div>

              {/* Toolbar (작성 탭에서만) */}
              {activeTab === 'write' && (
                <div className="flex items-center gap-1 px-3 py-2 bg-page/50 border-b border-border-default/50 flex-wrap">
                  {TOOLBAR_ACTIONS.map((action, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleToolbarAction(action)}
                      title={t(action.labelKey)}
                      className="p-1.5 text-text-faint hover:text-text-secondary hover:bg-surface-subtle rounded transition-colors"
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
                  onPaste={handlePaste}
                  placeholder="마크다운으로 작성해보세요...&#10;&#10;# 제목&#10;## 소제목&#10;**굵게** *기울임* `코드`&#10;- 목록 항목&#10;```python&#10;print('Hello!')&#10;```&#10;&#10;이미지 URL 붙여넣기 시 자동 변환됩니다."
                  className="w-full min-h-[400px] bg-input-bg/30 p-5 text-text-secondary text-sm font-mono placeholder:text-text-faint focus:outline-none resize-y leading-relaxed"
                />
              ) : (
                <div className="min-h-[400px] p-5 bg-input-bg/30">
                  {content.trim() ? (
                    <div className="prose dark:prose-invert max-w-none
                      prose-headings:text-text-primary prose-headings:font-bold prose-headings:tracking-tight
                      prose-h1:text-2xl prose-h1:mt-8 prose-h1:mb-4
                      prose-h2:text-xl prose-h2:mt-7 prose-h2:mb-3
                      prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2
                      prose-p:text-[15px] prose-p:text-text-secondary prose-p:leading-[1.8] prose-p:my-3
                      prose-a:text-emerald-600 dark:prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline
                      prose-strong:text-text-primary prose-strong:font-bold
                      prose-code:text-emerald-600 dark:prose-code:text-emerald-300 prose-code:bg-surface-subtle/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[13px] prose-code:before:content-none prose-code:after:content-none
                      prose-pre:bg-page-deep prose-pre:border prose-pre:border-border-subtle/50 prose-pre:rounded-xl prose-pre:my-4
                      prose-blockquote:border-l-emerald-500/40 prose-blockquote:bg-emerald-500/5 prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:text-text-muted prose-blockquote:not-italic
                      prose-ul:my-3 prose-ol:my-3
                      prose-li:text-[15px] prose-li:text-text-secondary prose-li:leading-[1.8] prose-li:my-0.5
                      prose-hr:border-border-subtle/50 prose-hr:my-6
                      prose-img:rounded-xl
                      prose-th:text-text-secondary prose-td:text-text-muted
                    ">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-text-faint text-sm">미리볼 내용이 없습니다. 작성 탭에서 마크다운을 입력해주세요.</p>
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
            <div className="flex justify-end items-center gap-3 pt-4 border-t border-border-default">
              {imageUploading && (
                <span className="flex items-center gap-1.5 text-xs text-text-faint">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  이미지 업로드 중...
                </span>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => toWs('community')}
                className="border-border-subtle text-text-secondary hover:bg-surface-subtle hover:text-text-primary"
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={submitting || charOver || imageUploading}
                className="bg-emerald-600 hover:bg-emerald-700 font-bold px-6 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {t('post.creating')}</>
                ) : (
                  <><PenSquare className="w-4 h-4" /> {t('post.created')}</>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
