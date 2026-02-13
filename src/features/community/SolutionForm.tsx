import React from 'react';
import { Card, Button, Badge } from '../../components/ui/Base';
import { ArrowLeft, Save, FileCode, MessageSquare, Tag } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { ideCodeState, ideLanguageState, navigationState } from '../../store/atoms';

export const SolutionForm = () => {
  const code = useRecoilValue(ideCodeState);
  const language = useRecoilValue(ideLanguageState);
  const setPage = useSetRecoilState(navigationState);

  const handleRegister = () => {
    // Logic to save the post would go here
    // Redirect to the community/solution view page
    setPage('community');
  };

  return (
    <div className="flex h-full flex-col bg-[#0F1117] text-slate-300">
      {/* Header */}
      <div className="h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-[#0F1117]">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setPage('ide')} className="text-slate-400 hover:text-slate-100">
            <ArrowLeft className="w-4 h-4 mr-2" /> 돌아가기
          </Button>
          <div className="h-4 w-px bg-slate-800" />
          <h1 className="font-semibold text-slate-100">풀이 공유하기</h1>
        </div>
        
        <Button 
          className="bg-emerald-600 hover:bg-emerald-700 text-white" 
          size="sm"
          onClick={handleRegister}
        >
          <Save className="w-4 h-4 mr-2" /> 게시글 등록
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Read-only Code View */}
        <div className="w-1/2 border-r border-slate-800 flex flex-col bg-[#1e1e1e]">
          <div className="h-10 border-b border-slate-800 flex items-center px-4 bg-[#0F1117]">
            <FileCode className="w-4 h-4 text-emerald-500 mr-2" />
            <span className="text-xs font-medium text-slate-300">My Solution ({language})</span>
          </div>
          <div className="flex-1 relative">
            <Editor
              height="100%"
              theme="vs-dark"
              language={language}
              value={code}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                readOnly: true,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 16 },
                renderLineHighlight: 'none'
              }}
            />
          </div>
        </div>

        {/* Right Panel: Write Post */}
        <div className="flex-1 flex flex-col bg-[#0F1117] overflow-y-auto">
          <div className="p-8 max-w-2xl mx-auto w-full space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">제목</label>
              <input 
                type="text" 
                placeholder="풀이의 핵심 내용을 요약해주세요"
                className="w-full h-12 bg-slate-900 border border-slate-800 rounded-lg px-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Description Removed as per request */}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Tag className="w-4 h-4" /> 태그
              </label>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex flex-wrap gap-2 min-h-[50px]">
                <Badge variant="default" className="bg-slate-800 pr-1 gap-1">
                  DP <button className="hover:text-red-400">×</button>
                </Badge>
                <Badge variant="default" className="bg-slate-800 pr-1 gap-1">
                  Greedy <button className="hover:text-red-400">×</button>
                </Badge>
                <input 
                  type="text" 
                  placeholder="태그 입력..." 
                  className="bg-transparent border-none text-sm text-slate-300 focus:outline-none min-w-[100px]"
                />
              </div>
            </div>

            <Card className="p-4 bg-emerald-500/5 border-emerald-500/10 flex gap-4">
              <MessageSquare className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-emerald-400 mb-1">풀이 공유 팁</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  다른 사용자들이 이해하기 쉽도록 변수명과 로직을 명확하게 설명해주세요. 
                  코드 복잡도(Big-O)를 포함하면 더 좋은 평가를 받을 수 있습니다.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
