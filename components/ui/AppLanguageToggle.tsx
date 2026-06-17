'use client';

import { useAppLanguage } from '@/lib/i18n/AppLanguageProvider';
import type { AppLang } from '@/lib/i18n/lang';

type AppLanguageToggleProps = {
  compact?: boolean;
  className?: string;
};

export function AppLanguageToggle({
  compact = false,
  className = '',
}: AppLanguageToggleProps) {
  const { lang, setLang, t } = useAppLanguage();

  const btn = (code: AppLang, flag: string, label: string) => (
    <button
      key={code}
      type="button"
      onClick={() => setLang(code)}
      aria-pressed={lang === code}
      className={`app-touchable touch-target flex min-h-[44px] items-center gap-1.5 px-3 text-sm font-medium transition ${
        lang === code
          ? 'bg-[var(--app-primary)] text-white'
          : 'bg-[var(--app-card)] text-[var(--app-muted)] hover:bg-[var(--app-hover-bg)]'
      }`}
    >
      <span aria-hidden>{flag}</span>
      <span>{label}</span>
    </button>
  );

  if (compact) {
    return (
      <div
        className={`inline-flex overflow-hidden rounded-xl ring-1 ring-[var(--app-border)] ${className}`}
        role="group"
        aria-label={t.common.language}
      >
        {btn('es', '🇲🇽', 'ES')}
        {btn('en', '🇺🇸', 'EN')}
      </div>
    );
  }

  return (
    <div className={className}>
      <p className="text-sm font-medium text-[var(--form-text)]">
        {t.settings.appLanguage}
      </p>
      <p className="mt-1 text-xs text-[var(--app-muted)]">
        {t.settings.appLanguageHint}
      </p>
      <div
        className="mt-3 inline-flex overflow-hidden rounded-xl ring-1 ring-[var(--app-border)]"
        role="group"
        aria-label={t.common.language}
      >
        {btn('es', '🇲🇽', 'ES')}
        {btn('en', '🇺🇸', 'EN')}
      </div>
    </div>
  );
}
