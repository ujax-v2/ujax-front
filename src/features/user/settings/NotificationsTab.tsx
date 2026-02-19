export const NotificationsTab = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 pb-4 border-b border-slate-200 dark:border-slate-800">알림 설정</h2>
      <div className="space-y-6">
        <div className="flex items-center justify-between py-2">
          <div>
            <div className="text-sm font-medium text-slate-900 dark:text-slate-200">이메일 알림</div>
            <div className="text-xs text-slate-500">새로운 멘션, 페이지 초대 등에 대한 알림을 받습니다.</div>
          </div>
          <div className="relative inline-block w-10 h-5">
            <input type="checkbox" defaultChecked className="peer absolute opacity-0 w-0 h-0" />
            <label className="block w-10 h-5 bg-slate-300 dark:bg-slate-700 rounded-full cursor-pointer peer-checked:bg-emerald-500 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:left-[22px]"></label>
          </div>
        </div>
        <div className="flex items-center justify-between py-2">
          <div>
            <div className="text-sm font-medium text-slate-900 dark:text-slate-200">모바일 푸시 알림</div>
            <div className="text-xs text-slate-500">모바일 기기로 중요 알림을 전송합니다.</div>
          </div>
          <div className="relative inline-block w-10 h-5">
            <input type="checkbox" className="peer absolute opacity-0 w-0 h-0" />
            <label className="block w-10 h-5 bg-slate-300 dark:bg-slate-700 rounded-full cursor-pointer peer-checked:bg-emerald-500 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:left-[22px]"></label>
          </div>
        </div>
      </div>
    </div>
  );
};
