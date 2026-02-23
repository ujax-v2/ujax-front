import React, { useState } from 'react';
import { Card, Button } from '@/components/ui/Base';
import { useWorkspaceNavigate } from '@/hooks/useWorkspaceNavigate';
import {
    PenSquare,
    ArrowLeft,
    Check
} from 'lucide-react';

export const PostCreate = () => {
    const { toWs } = useWorkspaceNavigate();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedTag, setSelectedTag] = useState<string>('자유');

    const availableTags = ['자유', '질문', '꿀팁', '공지'];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            alert('제목과 내용을 모두 입력해주세요.');
            return;
        }
        // TODO: 백엔드 연동 영역 (현재는 임시)
        console.log('--- 새 게시물 작성 ---');
        console.log({
            title,
            content,
            tag: selectedTag,
        });
        alert('게시글이 성공적으로 작성되었습니다!');
        toWs('community');
    };

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
                        <p className="text-slate-400 text-sm mt-1">팀원들에게 유용한 정보를 공유하거나 질문해보세요.</p>
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
                                className="w-full bg-transparent border-0 border-b border-transparent focus:outline-none focus:ring-0 text-2xl font-bold text-slate-100 placeholder:text-slate-600 focus:border-b focus:border-emerald-500/50 transition-colors pb-2"
                                autoFocus
                            />
                        </div>

                        {/* Content Textarea */}
                        <div>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="여기에 내용을 작성하세요..."
                                className="w-full min-h-[400px] bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-slate-200 text-sm placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:bg-slate-900 transition-colors resize-y leading-relaxed"
                            />
                        </div>

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
                                className="bg-emerald-600 hover:bg-emerald-700 font-bold px-6 gap-2"
                            >
                                <PenSquare className="w-4 h-4" /> 작성 완료
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
};
