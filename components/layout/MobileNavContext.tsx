'use client';

import { useId } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { uiIconBtn } from '@/components/ui/ui-classes';

type MobileNavContextValue = {
  open: boolean;
  openNav: () => void;
  closeNav: () => void;
};

const MobileNavContext = createContext<MobileNavContextValue | null>(null);

export function MobileNavProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const openNav = useCallback(() => setOpen(true), []);
  const closeNav = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ open, openNav, closeNav }),
    [open, openNav, closeNav]
  );

  return (
    <MobileNavContext.Provider value={value}>{children}</MobileNavContext.Provider>
  );
}

export function useMobileNav(): MobileNavContextValue {
  const ctx = useContext(MobileNavContext);
  if (!ctx) {
    throw new Error('useMobileNav must be used within MobileNavProvider');
  }
  return ctx;
}

export function useMobileNavOptional(): MobileNavContextValue | null {
  return useContext(MobileNavContext);
}

/** Menú hamburguesa con checkbox+label (fiable en táctil). */
export function MobileNavButton({ className = '' }: { className?: string }) {
  const ctx = useMobileNavOptional();
  const inputId = useId();

  if (!ctx) return null;

  return (
    <div className={`relative z-10 lg:hidden ${className}`}>
      <input
        id={inputId}
        type="checkbox"
        className="peer sr-only"
        checked={ctx.open}
        onChange={(e) => (e.target.checked ? ctx.openNav() : ctx.closeNav())}
        aria-label="Abrir menú de navegación"
      />
      <label
        htmlFor={inputId}
        className={`${uiIconBtn} inline-flex cursor-pointer`}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
        </svg>
      </label>
    </div>
  );
}
