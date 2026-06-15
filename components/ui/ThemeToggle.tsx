'use client';

import { useId } from 'react';
import { useTheme } from '@/lib/theme/ThemeProvider';

type ThemeToggleProps = {
  className?: string;
  showLabel?: boolean;
  compact?: boolean;
};

/**
 * Switch de tema con input+label (fiable en Android/iOS; no depende de click sintético).
 */
export function ThemeToggle({
  className = '',
  showLabel = false,
  compact = false,
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const inputId = useId();
  const isDark = theme === 'nebula-dark';

  const trackH = compact ? 'h-7 w-12' : 'h-8 w-14';
  const thumb = compact ? 'h-5 w-5' : 'h-6 w-6';
  const thumbOn = compact ? 'translate-x-5' : 'translate-x-6';
  const iconCls = compact ? 'h-3 w-3' : 'h-3.5 w-3.5';

  return (
    <div
      className={`relative z-10 flex items-center gap-2 ${className}`}
      title={isDark ? 'Cambiar a Nebula Light' : 'Cambiar a Nebula Dark'}
    >
      {showLabel ? (
        <span className="text-xs font-medium text-[var(--app-muted)]">
          {isDark ? 'Oscuro' : 'Claro'}
        </span>
      ) : null}
      <input
        id={inputId}
        type="checkbox"
        className="peer sr-only"
        checked={!isDark}
        onChange={() => setTheme(isDark ? 'nebula-light' : 'nebula-dark')}
        aria-label={
          isDark
            ? 'Activar modo claro (Nebula Light)'
            : 'Activar modo oscuro (Nebula Dark)'
        }
      />
      <label
        htmlFor={inputId}
        className="app-touchable touch-target inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-full p-2"
      >
        <span
          className={`nebula-glass relative block shrink-0 rounded-full p-0.5 ${trackH}`}
          aria-hidden
        >
          <span
            className={`absolute inset-0 rounded-full transition duration-300 ${
              isDark ? 'opacity-30' : 'opacity-100'
            }`}
            style={{ background: 'var(--app-gradient)' }}
          />
          <span
            className={`relative flex ${thumb} items-center justify-center rounded-full bg-[var(--app-card)] shadow-md transition-transform duration-300 ${
              isDark ? 'translate-x-0.5' : thumbOn
            }`}
          >
            {isDark ? (
              <MoonIcon className={iconCls} />
            ) : (
              <SunIcon className={iconCls} />
            )}
          </span>
        </span>
      </label>
    </div>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.5 5.5 0 01-4.4 2.26 5.5 5.5 0 01-5.18-7.24A9 9 0 0112 3z" />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 7a5 5 0 100 10 5 5 0 000-10zm0-5v2h0v-2zm0 18v2h0v-2zM4.22 4.22l1.42 1.42h0l-1.42-1.42zm14.14 14.14l1.42 1.42h0l-1.42-1.42zM2 12h2v0H2zm18 0h2v0h-2zM4.22 19.78l1.42-1.42h0l-1.42 1.42zm14.14-14.14l1.42-1.42h0l-1.42 1.42z" />
    </svg>
  );
}
