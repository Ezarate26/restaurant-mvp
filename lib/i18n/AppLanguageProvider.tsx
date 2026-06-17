'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  APP_LANG_STORAGE_KEY,
  isAppLang,
  type AppLang,
} from '@/lib/i18n/lang';
import { MESSAGES, type AppMessages } from '@/lib/i18n/messages';

type AppLanguageContextValue = {
  lang: AppLang;
  setLang: (lang: AppLang) => void;
  t: AppMessages;
  ready: boolean;
};

const AppLanguageContext = createContext<AppLanguageContextValue | null>(null);

export function AppLanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<AppLang>('es');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(APP_LANG_STORAGE_KEY);
      if (isAppLang(stored)) setLangState(stored);
    } catch {
      /* noop */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = lang;
  }, [lang, ready]);

  const setLang = useCallback((next: AppLang) => {
    setLangState(next);
    try {
      localStorage.setItem(APP_LANG_STORAGE_KEY, next);
    } catch {
      /* noop */
    }
  }, []);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t: MESSAGES[lang],
      ready,
    }),
    [lang, setLang, ready]
  );

  return (
    <AppLanguageContext.Provider value={value}>
      {children}
    </AppLanguageContext.Provider>
  );
}

export function useAppLanguage(): AppLanguageContextValue {
  const ctx = useContext(AppLanguageContext);
  if (!ctx) {
    throw new Error('useAppLanguage must be used within AppLanguageProvider');
  }
  return ctx;
}

/** Para componentes que pueden renderizarse fuera del provider (fallback ES). */
export function useAppLanguageOptional(): AppLanguageContextValue {
  const ctx = useContext(AppLanguageContext);
  return (
    ctx ?? {
      lang: 'es',
      setLang: () => undefined,
      t: MESSAGES.es,
      ready: true,
    }
  );
}
