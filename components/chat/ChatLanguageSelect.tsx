'use client';

import { uiLabel, uiSelect } from '@/components/ui/ui-classes';
import { languageDisplayName } from '@/constants/languages';

type LanguageOption = { code: string; name: string };

type ChatLanguageSelectProps = {
  value: string;
  options: LanguageOption[];
  disabled?: boolean;
  busy?: boolean;
  label?: string;
  onChange: (code: string) => void;
  className?: string;
};

export function ChatLanguageSelect({
  value,
  options,
  disabled = false,
  busy = false,
  label = 'Mi idioma en el chat',
  onChange,
  className = '',
}: ChatLanguageSelectProps) {
  return (
    <div className={className}>
      <label className={`${uiLabel} mb-1.5 block px-0.5 text-[11px]`}>
        {label}
      </label>
      <select
        className={uiSelect}
        value={value}
        disabled={disabled || busy}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
      >
        {options.map((opt) => (
          <option key={opt.code} value={opt.code}>
            {opt.name || languageDisplayName(opt.code)}
          </option>
        ))}
      </select>
      {busy ? (
        <p className="mt-1 px-0.5 text-[10px] text-[var(--app-muted)]">
          Actualizando traducciones…
        </p>
      ) : null}
    </div>
  );
}
