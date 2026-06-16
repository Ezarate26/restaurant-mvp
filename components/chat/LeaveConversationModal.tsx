'use client';

import { ModalFrame } from '@/components/ui/ModalFrame';
import {
  uiModalBtnCancel,
  uiModalBtnDanger,
  uiModalPanel,
  uiModalText,
  uiModalTitle,
} from '@/components/ui/ui-classes';

type LeaveConversationModalProps = {
  open: boolean;
  busy?: boolean;
  mode?: 'leave' | 'close';
  ownerEndsForAll?: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
};

export function LeaveConversationModal({
  open,
  busy = false,
  mode = 'close',
  ownerEndsForAll = false,
  onCancel,
  onConfirm,
}: LeaveConversationModalProps) {
  const isLeave = mode === 'leave';

  const description = isLeave
    ? ownerEndsForAll
      ? 'Como propietario, al salir finalizarás la conversación para todos los participantes. Esta acción no se puede deshacer.'
      : 'Vas a salir de esta conversación. Los demás participantes podrán seguir chateando.'
    : 'Vas a finalizar la conversación para todos los participantes. Esta acción no se puede deshacer.';

  return (
    <ModalFrame open={open} labelledBy="leave-chat-title" onClose={onCancel}>
      <div className={uiModalPanel}>
        <h2 id="leave-chat-title" className={uiModalTitle}>
          {isLeave ? 'Salir de la conversación' : 'Finalizar conversación'}
        </h2>
        <p className={uiModalText}>{description}</p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" disabled={busy} className={uiModalBtnCancel} onClick={onCancel}>
            Cancelar
          </button>
          <button
            type="button"
            disabled={busy}
            className={isLeave ? uiModalBtnCancel : uiModalBtnDanger}
            onClick={() => void onConfirm()}
          >
            {busy
              ? isLeave
                ? 'Saliendo…'
                : 'Finalizando…'
              : isLeave
                ? 'Salir'
                : 'Finalizar'}
          </button>
        </div>
      </div>
    </ModalFrame>
  );
}

/** @deprecated */
export const LeaveSessionModal = LeaveConversationModal;
