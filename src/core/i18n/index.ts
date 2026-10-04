import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { UDKeys } from '../prefs/UDKeys';
import { prefs } from '../prefs/prefs';
import en from './en';
import vi from './vi';

export type AppLanguage = 'en' | 'vi';

export function detectLanguage(): AppLanguage {
  const stored = prefs.get<AppLanguage | null>(UDKeys.APP_SELECTED_LANGUAGE, null);
  if (stored === 'en' || stored === 'vi') return stored;
  const nav = typeof navigator !== 'undefined' ? navigator.language.toLowerCase() : 'en';
  return nav.startsWith('vi') ? 'vi' : 'en';
}

export function applyHtmlLang(language: AppLanguage): void {
  if (typeof document !== 'undefined') document.documentElement.lang = language;
}

export function initI18n(): typeof i18n {
  const language = detectLanguage();
  void i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      vi: { translation: vi },
    },
    lng: language,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
  applyHtmlLang(language);
  return i18n;
}

export function setLanguage(language: AppLanguage): void {
  prefs.set(UDKeys.APP_SELECTED_LANGUAGE, language);
  applyHtmlLang(language);
  void i18n.changeLanguage(language);
}

export default i18n;
