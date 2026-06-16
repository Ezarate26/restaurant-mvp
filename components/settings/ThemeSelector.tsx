'use client';

import { THEMES, type ThemeId } from '@/lib/theme/constants';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useId } from 'react';

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const groupId = useId();
  const options = Object.values(THEMES);

  return (
    <div className="nebula-glass rounded-2xl p-1.5" role="radiogroup" aria-labelledby={groupId}>
      <p
        id={groupId}
        className="px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]"
      >
        Tema visual
      </p>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {options.map((opt) => {
          const active = theme === opt.id;
          const inputId = `${groupId}-${opt.id}`;
          return (
            <label
              key={opt.id}
              htmlFor={inputId}
              className={`relative flex min-h-[44px] cursor-pointer rounded-xl px-3 py-3 transition duration-200 ${
                active
                  ? 'ring-2 ring-[var(--app-primary)]'
                  : 'hover:bg-[var(--app-hover-bg)]'
              }`}
              style={
                active ? { background: 'var(--app-hover-bg)' } : undefined
              }
            >
              <input
                type="radio"
                id={inputId}
                name={groupId}
                checked={active}
                onChange={() => setTheme(opt.id as ThemeId)}
                className="absolute inset-0 z-10 m-0 h-full w-full cursor-pointer opacity-0"
              />
              <span className="pointer-events-none relative z-0 block w-full text-left">
                <span className="flex items-center gap-2">
                  <span
                    className="h-4 w-4 shrink-0 rounded-full"
                    style={{
                      background:
                        opt.id === 'nebula-dark'
                          ? 'linear-gradient(135deg, #181A22, #8B5CF6)'
                          : 'linear-gradient(135deg, #F8F9FD, #EC4899)',
                    }}
                    aria-hidden
                  />
                  <span className="text-sm font-semibold text-[var(--app-text)]">
                    {opt.label}
                  </span>
                </span>
                <span className="mt-1 block text-xs text-[var(--app-muted)]">
                  {opt.description}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
