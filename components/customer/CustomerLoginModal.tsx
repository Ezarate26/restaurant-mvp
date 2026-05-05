'use client';

import { useEffect, useState } from 'react';

export interface CustomerLoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  busy?: boolean;
  onSubmit: (email: string, password: string) => Promise<void>;
  /** Mensaje destacado (p. ej. bienvenida de vuelta antes del formulario). */
  introMessage?: string | null;
  /** Correo sugerido para prellenar cuando ya se capturó en otro paso. */
  initialEmail?: string | null;
}

const fieldClass =
  'w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] outline-none transition focus:border-[#229ED9] focus:ring-2 focus:ring-[#229ED9]/35';

export function CustomerLoginModal({
  open,
  onOpenChange,
  busy = false,
  onSubmit,
  introMessage = null,
  initialEmail = null,
}: CustomerLoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setEmail('');
    setPassword('');
    setError(null);
  };

  useEffect(() => {
    if (!open) return;
    const next = initialEmail?.trim() ?? '';
    if (next) {
      setEmail(next);
    }
  }, [open, initialEmail]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/35 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) {
          onOpenChange(false);
          reset();
        }
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="login-title" className="text-base font-semibold text-[#1F2937]">
          Iniciar sesión
        </h2>
        <p className="mt-1 text-xs text-[#6B7280]">
          Con el correo y contraseña de tu cuenta en este restaurante.
        </p>

        {introMessage?.trim() ? (
          <p className="mt-3 rounded-lg border border-[#BBDEFB] bg-[#E3F2FD] px-3 py-2.5 text-xs leading-relaxed text-[#0D47A1]">
            {introMessage.trim()}
          </p>
        ) : null}

        <div className="mt-4 grid gap-3.5">
          <div>
            <label className="mb-1 block text-xs font-medium text-[#374151]">
              Correo
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClass}
              autoComplete="email"
              disabled={busy}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#374151]">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldClass}
              autoComplete="current-password"
              disabled={busy}
            />
          </div>
        </div>

        {error ? (
          <p className="mt-2 text-xs text-amber-800">{error}</p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (!busy) {
                onOpenChange(false);
                reset();
              }
            }}
            className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#4B5563] hover:bg-[#F9FAFB] disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setError(null);
              const em = email.trim();
              if (!em || !password) {
                setError('Completa correo y contraseña.');
                return;
              }
              try {
                await onSubmit(em, password);
                onOpenChange(false);
                reset();
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : 'No se pudo iniciar sesión.'
                );
              }
            }}
            className="rounded-lg bg-[#229ED9] px-3 py-2 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-50"
          >
            {busy ? 'Entrando…' : 'Entrar'}
          </button>
        </div>
      </div>
    </div>
  );
}
