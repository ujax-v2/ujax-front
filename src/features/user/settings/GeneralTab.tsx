import { useRecoilState } from 'recoil';
import { themeState, ThemeMode, languageState, Language } from '@/store/atoms';
import { useT } from '@/i18n';

export const GeneralTab = () => {
  const [theme, setTheme] = useRecoilState(themeState);
  const [language, setLanguage] = useRecoilState(languageState);
  const t = useT();

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <h2 className="text-xl font-bold text-text-primary pb-4 border-b border-border-default">{t('settings.general.title')}</h2>

      <div className="space-y-6">
        <div className="flex items-center justify-between py-2">
          <div>
            <div className="text-sm font-medium text-text-secondary">{t('settings.general.theme')}</div>
            <div className="text-xs text-text-faint">{t('settings.general.themeDesc')}</div>
          </div>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as ThemeMode)}
            className="bg-transparent border border-border-subtle rounded px-2 py-1 text-sm text-text-secondary"
          >
            <option value="system">{t('settings.general.systemTheme')}</option>
            <option value="light">{t('settings.general.lightMode')}</option>
            <option value="dark">{t('settings.general.darkMode')}</option>
          </select>
        </div>

        <div className="pt-6 border-t border-border-default">
          <h3 className="text-sm font-bold text-text-secondary mb-4">{t('settings.general.languageAndTime')}</h3>

          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm font-medium text-text-secondary">{t('settings.general.language')}</div>
              <div className="text-xs text-text-faint">{t('settings.general.languageDesc')}</div>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-transparent border border-border-subtle rounded px-2 py-1 text-sm text-text-secondary"
            >
              <option value="ko">{t('settings.general.korean')}</option>
              <option value="en">{t('settings.general.english')}</option>
            </select>
          </div>

          <div className="flex items-center justify-between py-2 mt-4">
            <div>
              <div className="text-sm font-medium text-text-secondary">{t('settings.general.textDirection')}</div>
              <div className="text-xs text-text-faint max-w-md">{t('settings.general.textDirectionDesc')}</div>
            </div>
            <div className="relative inline-block w-10 h-5 transition duration-200 ease-in-out">
              <input type="checkbox" className="peer absolute opacity-0 w-0 h-0" />
              <label className="block w-10 h-5 bg-border-subtle rounded-full cursor-pointer peer-checked:bg-emerald-500 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:left-[22px]"></label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
