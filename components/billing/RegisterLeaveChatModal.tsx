'use client';

import { ModalFrame } from '@/components/ui/ModalFrame';
import {
  uiBtnPrimary,
  uiBtnSecondary,
  uiModalPanel,
  uiModalText,
  uiModalTitle,
} from '@/components/ui/ui-classes';

type RegisterLeaveChatModalProps = {
  open: boolean;
  busy?: boolean;
  onStay: () => void;
  onContinue: () => void | Promise<void>;
};

export function RegisterLeaveChatModal({
  open,
  busy = false,
  onStay,
  onContinue,
}: RegisterLeaveChatModalProps) {
  if (!open) return null;

  return (
    <ModalFrame open={open} labelledBy="register-leave-chat-title" onClose={onStay}>
      <div className={uiModalPanel}>
        <h2 id="register-leave-chat-title" className={uiModalTitle}>
          ¿Abandonar este chat?
        </h2>
        <p className={uiModalText}>
          Para registrarte y contratar un plan debes salir de esta conversación.
          Si continúas, abandonarás el chat actual. También puedes permanecer aquí
          y seguir escribiendo mensajes de texto.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={onStay}
            className={uiBtnPrimary}
          >
            Permanecer en el chat
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void onContinue()}
            className={uiBtnSecondary}
          >
            {busy ? 'Saliendo…' : 'Continuar con registro'}
          </button>
        </div>
      </div>
    </ModalFrame>
  );
}
