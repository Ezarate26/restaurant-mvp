'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ModalFrame } from '@/components/ui/ModalFrame';
import {
  uiBtnPrimary,
  uiBtnSecondary,
  uiError,
  uiInput,
  uiLabel,
  uiModalPanel,
  uiModalTitle,
  uiModalText,
} from '@/components/ui/ui-classes';

type JoinByCodeModalProps = {
  open: boolean;
  onClose: () => void;
};

export function JoinByCodeModal({ open, onClose }: JoinByCodeModalProps) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError('Introduce un código de invitación.');
      return;
    }
    setError(null);
    onClose();
    router.push(`/join/${encodeURIComponent(trimmed)}`);
  };

  return (
    <ModalFrame open={open} labelledBy="join-code-title">
      <div className={uiModalPanel}>
        <h2 id="join-code-title" className={uiModalTitle}>
          Unirse a conversación
        </h2>
        <p className={uiModalText}>
          Introduce el código que te compartieron.
        </p>

        <label className={`${uiLabel} mt-4`} htmlFor="join-code-input">
          Código de invitación
        </label>
        <input
          id="join-code-input"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Ej. ABC12345"
          className={`${uiInput} font-mono uppercase tracking-widest`}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
        />

        {error ? <p className={`${uiError} mt-3`}>{error}</p> : null}

        <div className="mt-6 flex flex-col gap-2">
          <button type="button" className={uiBtnPrimary} onClick={handleSubmit}>
            Continuar
          </button>
          <button type="button" className={uiBtnSecondary} onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </ModalFrame>
  );
}
