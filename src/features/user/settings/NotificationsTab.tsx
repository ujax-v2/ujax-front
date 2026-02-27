import { useT } from '@/i18n';

export const NotificationsTab = () => {
  const t = useT();

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <h2 className="text-xl font-bold text-text-primary pb-4 border-b border-border-default">{t('settings.notifications.title')}</h2>
      <div className="space-y-6">
        <div className="flex items-center justify-between py-2">
          <div>
            <div className="text-sm font-medium text-text-secondary">{t('settings.notifications.emailNotifications')}</div>
            <div className="text-xs text-text-faint">{t('settings.notifications.emailDesc')}</div>
          </div>
          <div className="relative inline-block w-10 h-5">
            <input type="checkbox" defaultChecked className="peer absolute opacity-0 w-0 h-0" />
            <label className="block w-10 h-5 bg-border-subtle rounded-full cursor-pointer peer-checked:bg-emerald-500 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:left-[22px]"></label>
          </div>
        </div>
        <div className="flex items-center justify-between py-2">
          <div>
            <div className="text-sm font-medium text-text-secondary">{t('settings.notifications.pushNotifications')}</div>
            <div className="text-xs text-text-faint">{t('settings.notifications.pushDesc')}</div>
          </div>
          <div className="relative inline-block w-10 h-5">
            <input type="checkbox" className="peer absolute opacity-0 w-0 h-0" />
            <label className="block w-10 h-5 bg-border-subtle rounded-full cursor-pointer peer-checked:bg-emerald-500 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:left-[22px]"></label>
          </div>
        </div>
      </div>
    </div>
  );
};
