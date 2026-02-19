import { Button } from '@/components/ui/Base';
import { Github, Trello, Slack } from 'lucide-react';

export const ConnectionsTab = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 pb-4 border-b border-slate-200 dark:border-slate-800">연결된 계정</h2>
      <div className="space-y-4">
        <p className="text-sm text-slate-500">다른 서비스와 연결하여 UJAX의 기능을 확장하세요.</p>

        <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded flex items-center justify-center text-black">
              <Github className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">GitHub</div>
              <div className="text-xs text-slate-500">PR 및 이슈 상태 동기화</div>
            </div>
          </div>
          <Button variant="secondary" size="sm">연결하기</Button>
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0079BF] rounded flex items-center justify-center text-white">
              <Trello className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">Trello</div>
              <div className="text-xs text-slate-500">보드 가져오기 및 동기화</div>
            </div>
          </div>
          <Button variant="secondary" size="sm">연결하기</Button>
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#4A154B] rounded flex items-center justify-center text-white">
              <Slack className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">Slack</div>
              <div className="text-xs text-slate-500">알림 전송 및 미리보기</div>
            </div>
          </div>
          <Button variant="secondary" size="sm">연결하기</Button>
        </div>
      </div>
    </div>
  );
};
