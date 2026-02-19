import { Button } from '@/components/ui/Base';
import { FileUp } from 'lucide-react';

export const WsImportTab = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 pb-4 border-b border-slate-200 dark:border-slate-800">가져오기</h2>
      <div className="space-y-4">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3">
          <FileUp className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-slate-200">데이터 가져오기</div>
            <div className="text-xs text-slate-500 mt-1">다른 앱의 데이터를 UJAX로 쉽게 이동하세요.</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button variant="secondary" className="justify-start gap-3 h-auto py-3">
            <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center text-xs">Txt</div>
            <div className="text-left">
              <div className="text-sm font-bold">Text & Markdown</div>
              <div className="text-[10px] text-slate-500">파일 업로드</div>
            </div>
          </Button>
          <Button variant="secondary" className="justify-start gap-3 h-auto py-3">
            <div className="w-8 h-8 bg-[#217346] rounded flex items-center justify-center text-white">Xls</div>
            <div className="text-left">
              <div className="text-sm font-bold">Excel</div>
              <div className="text-[10px] text-slate-500">.xls, .xlsx</div>
            </div>
          </Button>
          <Button variant="secondary" className="justify-start gap-3 h-auto py-3">
            <div className="w-8 h-8 bg-[#4285F4] rounded flex items-center justify-center text-white">W</div>
            <div className="text-left">
              <div className="text-sm font-bold">Word</div>
              <div className="text-[10px] text-slate-500">.docx</div>
            </div>
          </Button>
          <Button variant="secondary" className="justify-start gap-3 h-auto py-3">
            <div className="w-8 h-8 bg-[#E34F26] rounded flex items-center justify-center text-white">H</div>
            <div className="text-left">
              <div className="text-sm font-bold">HTML</div>
              <div className="text-[10px] text-slate-500">.html</div>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};
