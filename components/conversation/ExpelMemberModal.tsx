'use client';

import { ModalFrame } from '@/components/ui/ModalFrame';
import {
  uiModalBtnCancel,
  uiModalBtnDanger,
  uiModalPanel,
  uiModalText,
  uiModalTitle,
} from '@/components/ui/ui-classes';

type ExpelMemberModalProps = {
  open: boolean;
  busy?: boolean;
  memberName: string;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
};

export function ExpelMemberModal({
  open,
  busy = false,
  memberName,
  onCancel,
  onConfirm,
}: ExpelMemberModalProps) {
  return (
    <ModalFrame open={open} labelledBy="expel-member-title" onClose={onCancel}>
      <div className={uiModalPanel}>
        <h2 id="expel-member-title" className={uiModalTitle}>
          Expulsar participante
        </h2>
        <p className={uiModalText}>
          ¿Expulsar a{' '}
          <span className="font-semibold text-[var(--modal-text)]">
            {memberName}
          </span>{' '}
          de la conversación? Podrá volver a unirse con el enlace de invitación.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" disabled={busy} className={uiModalBtnCancel} onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" disabled={busy} className={uiModalBtnDanger} onClick={() => void onConfirm()}>
            {busy ? 'Expulsando…' : 'Expulsar'}
          </button>
        </div>
      </div>
    </ModalFrame>
  );
}
