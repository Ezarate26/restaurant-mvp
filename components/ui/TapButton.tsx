'use client';

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';

type TapButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> & {
  onTap?: () => void;
  onClick?: () => void;
  children?: ReactNode;
};

/**
 * Botón de acción semántico nativo.
 * Para navegación, preferir Link de Next.js.
 */
export const TapButton = forwardRef<HTMLButtonElement, TapButtonProps>(
  function TapButton(
    { onTap, onClick, disabled, children, type = 'button', className = '', ...rest },
    ref
  ) {
    const action = onTap ?? onClick;

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={className}
        onClick={() => action?.()}
        {...rest}
      >
        {children}
      </button>
    );
  }
);
