'use client';

import { useEffect, useRef, useState } from 'react';

export interface CustomerAddDataDraft {
  displayName: string;
  username: string;
  email: string;
}

export type CustomerAddDataSubmitResult = {
  message?: string | null;
  advanceToChat?: boolean;
  openLoginModal?: boolean;
};

export interface CustomerAddDataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  busy?: boolean;
  onSubmit: (draft: CustomerAddDataDraft) => Promise<CustomerAddDataSubmitResult>;
}

const fieldClass =
  'w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] outline-none transition focus:border-[#229ED9] focus:ring-2 focus:ring-[#229ED9]/35';

export function CustomerAddDataModal({
  open,
  onOpenChange,
  busy = false,
  onSubmit,
}: CustomerAddDataModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = () => {
    setDisplayName('');
    setUsername('');
    setEmail('');
    setError(null);
    setSuccess(null);
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/35 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-data-title"
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
        <h2
          id="add-data-title"
          className="text-base font-semibold text-[#1F2937]"
        >
          Agregar tus datos
        </h2>
        <p className="mt-1 text-xs text-[#6B7280]">
          Todo es opcional. Si añades correo, podremos reconocerte o invitarte a
          completar tu perfil.
        </p>

        <div className="mt-4 grid gap-3.5">
          <div>
            <label className="mb-1 block text-xs font-medium text-[#374151]">
              Nombre
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={fieldClass}
              placeholder="Ej. María González"
              disabled={busy}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#374151]">
              Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={fieldClass}
              placeholder="Ej. maria_g"
              disabled={busy}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#374151]">
              Correo
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClass}
              placeholder="tu@correo.com"
              disabled={busy}
            />
          </div>
        </div>

        {error ? (
          <p className="mt-2 text-xs text-amber-800">{error}</p>
        ) : null}
        {success ? (
          <p className="mt-2 text-xs font-medium text-emerald-800">{success}</p>
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
            Cerrar
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setError(null);
              setSuccess(null);
              try {
                const { message, advanceToChat, openLoginModal } =
                  await onSubmit({
                    displayName: displayName.trim(),
                    username: username.trim(),
                    email: email.trim(),
                  });
                if (advanceToChat || openLoginModal) {
                  onOpenChange(false);
                  reset();
                  return;
                }
                if (message) {
                  setSuccess(message);
                  closeTimerRef.current = setTimeout(() => {
                    onOpenChange(false);
                    reset();
                  }, 2800);
                } else {
                  onOpenChange(false);
                  reset();
                }
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : 'No se pudo guardar. Intenta de nuevo.'
                );
              }
            }}
            className="rounded-lg bg-[#229ED9] px-3 py-2 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-50"
          >
            {busy ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
