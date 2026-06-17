'use client';

import { ModalFrame } from '@/components/ui/ModalFrame';
import {
  uiBtnPrimary,
  uiModalPanel,
  uiModalText,
  uiModalTitle,
} from '@/components/ui/ui-classes';

type RoomFreeSessionEndedGuestModalProps = {
  open: boolean;
  ownerDisplayName: string;
  onGoHome: () => void;
};

export function RoomFreeSessionEndedGuestModal({
  open,
  ownerDisplayName,
  onGoHome,
}: RoomFreeSessionEndedGuestModalProps) {
  if (!open) return null;

  return (
    <ModalFrame open={open} labelledBy="free-session-ended-guest-title">
      <div className={uiModalPanel}>
        <h2 id="free-session-ended-guest-title" className={uiModalTitle}>
          Sesión finalizada
        </h2>
        <p className={uiModalText}>
          Se acabó la sesión de la sala de <strong>{ownerDisplayName}</strong>.
        </p>
        <button
          type="button"
          onClick={onGoHome}
          className={`${uiBtnPrimary} mt-6 w-full`}
        >
          Volver al inicio
        </button>
      </div>
    </ModalFrame>
  );
}
