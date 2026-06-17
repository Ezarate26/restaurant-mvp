'use client';

import { useAppLanguage } from '@/lib/i18n/AppLanguageProvider';
import type { AppLang } from '@/lib/i18n/lang';

/** Compatibilidad con el landing — usa el idioma global de la app. */
export function useLandingLanguage() {
  const { lang, setLang, t, ready } = useAppLanguage();
  return {
    lang: lang as AppLang,
    setLang,
    t: t.landing,
    ready,
  };
}

// Re-exports para código existente
export type { AppLang as LandingLang } from '@/lib/i18n/lang';
export { APP_LANG_STORAGE_KEY as LANDING_LANG_STORAGE_KEY } from '@/lib/i18n/lang';
export type { AppMessages } from '@/lib/i18n/messages';
