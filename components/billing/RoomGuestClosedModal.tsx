'use client';

import Link from 'next/link';
import { ModalFrame } from '@/components/ui/ModalFrame';
import {
  uiBtnPrimary,
  uiBtnSecondary,
  uiModalPanel,
  uiModalText,
  uiModalTitle,
} from '@/components/ui/ui-classes';

type RoomGuestClosedModalProps = {
  open: boolean;
  closerDisplayName: string;
  isAuthenticated: boolean;
  onUpgrade: () => void;
  onGoHome: () => void;
};

export function RoomGuestClosedModal({
  open,
  closerDisplayName,
  isAuthenticated,
  onUpgrade,
  onGoHome,
}: RoomGuestClosedModalProps) {
  if (!open) return null;

  return (
    <ModalFrame open={open} labelledBy="room-guest-closed-title">
      <div className={uiModalPanel}>
        <h2 id="room-guest-closed-title" className={uiModalTitle}>
          Sala finalizada
        </h2>
        <p className={uiModalText}>
          <strong>{closerDisplayName}</strong> cerró esta sala. Crea tu propia
          conversación con más tiempo y funciones Pro.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          {!isAuthenticated ? (
            <>
              <Link href="/auth/register" className={uiBtnPrimary}>
                Crear cuenta gratis
              </Link>
              <Link href="/auth/login" className={uiBtnSecondary}>
                Iniciar sesión
              </Link>
            </>
          ) : (
            <button type="button" onClick={onUpgrade} className={uiBtnPrimary}>
              Ver planes Pro
            </button>
          )}
          <button type="button" onClick={onGoHome} className={uiBtnSecondary}>
            Volver al inicio
          </button>
        </div>
      </div>
    </ModalFrame>
  );
}
