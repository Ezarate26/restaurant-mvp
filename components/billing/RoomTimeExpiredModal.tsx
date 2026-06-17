'use client';

import { ModalFrame } from '@/components/ui/ModalFrame';
import {
  uiBtnPrimary,
  uiBtnSecondary,
  uiModalBtnDanger,
  uiModalPanel,
  uiModalText,
  uiModalTitle,
} from '@/components/ui/ui-classes';
import type { BillingUiMode } from '@/lib/billing/billing-state';

function formatGrace(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

type RoomTimeExpiredModalProps = {
  open: boolean;
  isOwner: boolean;
  ownerDisplayName: string;
  uiMode: BillingUiMode;
  graceRemainingMs?: number;
  busy?: boolean;
  onContinuePro: () => void;
  onBuyRoomPass: () => void;
  onEndSession: () => void;
  onLeave?: () => void;
};

export function RoomTimeExpiredModal({
  open,
  isOwner,
  ownerDisplayName,
  uiMode,
  graceRemainingMs = 0,
  busy = false,
  onContinuePro,
  onBuyRoomPass,
  onEndSession,
  onLeave,
}: RoomTimeExpiredModalProps) {
  if (!open || uiMode === 'free') return null;

  if (!isOwner) {
    return (
      <ModalFrame open={open} labelledBy="room-time-guest-title">
        <div className={uiModalPanel}>
          <h2 id="room-time-guest-title" className={uiModalTitle}>
            Tiempo de sala agotado
          </h2>
          <p className={uiModalText}>
            Espera una nueva sesión de <strong>{ownerDisplayName}</strong>. El
            chat está pausado hasta que el propietario decida continuar o
            finalizar la sala.
          </p>

          {onLeave ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void onLeave()}
              className={`${uiModalBtnDanger} mt-6 w-full`}
            >
              Salir del chat
            </button>
          ) : null}
        </div>
      </ModalFrame>
    );
  }

  const showGrace = graceRemainingMs > 0;

  const description =
    uiMode === 'pro'
      ? '¿Deseas continuar en esta conversación? Puedes extender la sala otros 60 minutos o finalizarla ahora.'
      : 'El pase de esta sala ha terminado. Compra otro pase para seguir con las funciones Pro o finaliza la conversación.';

  return (
    <ModalFrame open={open} labelledBy="room-time-expired-title">
      <div className={uiModalPanel}>
        <h2 id="room-time-expired-title" className={uiModalTitle}>
          Tiempo de sala agotado
        </h2>
        <p className={uiModalText}>{description}</p>

        {showGrace ? (
          <p className="mt-4 rounded-xl bg-[var(--app-warning)]/10 px-3 py-2 text-xs font-medium text-[var(--app-warning)]">
            Si no respondes en {formatGrace(graceRemainingMs)}, la sesión se
            cerrará automáticamente.
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-2">
          {uiMode === 'pro' ? (
            <button
              type="button"
              disabled={busy}
              onClick={onContinuePro}
              className={uiBtnPrimary}
            >
              Continuar otros 60 min
            </button>
          ) : null}

          {uiMode === 'room_pass' ? (
            <button
              type="button"
              disabled={busy}
              onClick={onBuyRoomPass}
              className={uiBtnSecondary}
            >
              Comprar otro pase · $2.99
            </button>
          ) : null}

          <button
            type="button"
            disabled={busy}
            onClick={() => void onEndSession()}
            className={`${uiModalBtnDanger} w-full`}
          >
            {busy ? 'Finalizando…' : 'Finalizar conversación'}
          </button>
        </div>
      </div>
    </ModalFrame>
  );
}
