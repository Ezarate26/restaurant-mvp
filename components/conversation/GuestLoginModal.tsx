'use client';

import { useEffect, useState } from 'react';
import { ModalFrame } from '@/components/ui/ModalFrame';
import {
  uiBtnPrimary,
  uiBtnSecondary,
  uiError,
  uiInput,
  uiLabel,
  uiModalPanel,
  uiModalText,
  uiModalTitle,
} from '@/components/ui/ui-classes';

export interface GuestLoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  busy?: boolean;
  onSubmit: (email: string, password: string) => Promise<void>;
  introMessage?: string | null;
  initialEmail?: string | null;
}

export function GuestLoginModal({
  open,
  onOpenChange,
  busy = false,
  onSubmit,
  introMessage = null,
  initialEmail = null,
}: GuestLoginModalProps) {
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
    if (next) setEmail(next);
  }, [open, initialEmail]);

  const handleClose = () => {
    if (!busy) {
      onOpenChange(false);
      reset();
    }
  };

  const handleSubmit = async () => {
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
  };

  return (
    <ModalFrame
      open={open}
      labelledBy="login-title"
      zClass="z-modal"
      onClose={handleClose}
    >
      <div className={uiModalPanel}>
        <h2 id="login-title" className={uiModalTitle}>
          Iniciar sesión
        </h2>
        <p className={uiModalText}>
          Con el correo y contraseña de tu cuenta.
        </p>

        {introMessage?.trim() ? (
          <p className="mt-3 rounded-xl border border-[var(--app-primary)]/25 bg-purple-50 px-3 py-2.5 text-xs leading-relaxed text-[var(--modal-text)]">
            {introMessage.trim()}
          </p>
        ) : null}

        <div className="mt-4 grid gap-3.5">
          <div>
            <label className={uiLabel}>Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={uiInput}
              autoComplete="email"
              disabled={busy}
            />
          </div>
          <div>
            <label className={uiLabel}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={uiInput}
              autoComplete="current-password"
              disabled={busy}
            />
          </div>
        </div>

        {error ? <p className={`${uiError} mt-2`}>{error}</p> : null}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            className={`${uiBtnSecondary} w-auto`}
            onClick={handleClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={busy}
            className={`${uiBtnPrimary} w-auto px-4`}
            onClick={() => void handleSubmit()}
          >
            {busy ? 'Entrando…' : 'Entrar'}
          </button>
        </div>
      </div>
    </ModalFrame>
  );
}
