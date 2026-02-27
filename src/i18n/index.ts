import { useRecoilValue } from 'recoil';
import { useEffect } from 'react';
import { languageState, type Language } from '@/store/atoms';
import { ko } from './locales/ko';
import { en } from './locales/en';

const translations: Record<Language, Record<string, string>> = { ko, en };

/**
 * Main translation hook.
 * Returns a function t(key, vars?) that resolves a translation key.
 * Falls back to Korean, then to the raw key.
 * Supports {var} interpolation: t('hello', { name: 'World' })
 */
export function useT() {
  const lang = useRecoilValue(languageState);
  return (key: string, vars?: Record<string, string | number>) => {
    let text = translations[lang]?.[key] ?? translations.ko[key] ?? key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return text;
  };
}

/** Returns the current language code ('ko' | 'en'). */
export function useLang(): Language {
  return useRecoilValue(languageState);
}

// --- Class component support (e.g. ErrorBoundary) ---

let _lang: Language = 'ko';

/**
 * Place <LangSync /> near the top of the component tree (inside RecoilRoot).
 * It keeps the module-level _lang in sync so getT() always returns current language.
 */
export function LangSync() {
  const lang = useRecoilValue(languageState);
  useEffect(() => { _lang = lang; }, [lang]);
  return null;
}

/**
 * Translation function for class components (cannot use hooks).
 * Uses module-level _lang kept in sync by <LangSync />.
 */
export function getT() {
  return (key: string, vars?: Record<string, string | number>) => {
    let text = translations[_lang]?.[key] ?? translations.ko[key] ?? key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return text;
  };
}
