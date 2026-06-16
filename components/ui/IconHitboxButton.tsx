'use client';

import type { ReactNode } from 'react';

type IconHitboxButtonProps = {
  onAction: () => void;
  disabled?: boolean;
  className?: string;
  'aria-label': string;
  title?: string;
  children: ReactNode;
};

/** Botón icono semántico nativo con área mínima 44×44. */
export function IconHitboxButton({
  onAction,
  disabled = false,
  className = '',
  children,
  'aria-label': ariaLabel,
  title,
}: IconHitboxButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={title}
      disabled={disabled}
      onClick={() => onAction()}
      className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}
