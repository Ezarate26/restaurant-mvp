'use client';

import type { AppLang } from '@/lib/i18n/lang';

type LandingLanguageToggleProps = {
  lang: AppLang;
  onChange: (lang: AppLang) => void;
  /** En el header del landing (mobile-first); si no, flotante fijo. */
  embedded?: boolean;
};

export function LandingLanguageToggle({
  lang,
  onChange,
  embedded = false,
}: LandingLanguageToggleProps) {
  return (
    <div
      className={
        embedded
          ? 'flex shrink-0 overflow-hidden rounded-xl ring-1 ring-[var(--app-border)]'
          : 'pointer-events-auto fixed left-3 top-3 z-50 flex overflow-hidden rounded-xl ring-1 ring-[var(--app-border)] sm:left-4 sm:top-4'
      }
      role="group"
      aria-label="Idioma del landing"
    >
      <button
        type="button"
        onClick={() => onChange('es')}
        aria-pressed={lang === 'es'}
        className={`app-touchable touch-target flex min-h-[44px] items-center gap-1.5 px-3 text-sm font-medium transition ${
          lang === 'es'
            ? 'bg-[var(--app-primary)] text-white'
            : 'bg-[var(--app-card)] text-[var(--app-muted)] hover:bg-[var(--app-hover-bg)]'
        }`}
      >
        <span aria-hidden>🇲🇽</span>
        <span>ES</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('en')}
        aria-pressed={lang === 'en'}
        className={`app-touchable touch-target flex min-h-[44px] items-center gap-1.5 px-3 text-sm font-medium transition ${
          lang === 'en'
            ? 'bg-[var(--app-primary)] text-white'
            : 'bg-[var(--app-card)] text-[var(--app-muted)] hover:bg-[var(--app-hover-bg)]'
        }`}
      >
        <span aria-hidden>🇺🇸</span>
        <span>EN</span>
      </button>
    </div>
  );
}
