'use client';

import { ModalFrame } from '@/components/ui/ModalFrame';
import {
  uiModalBtnCancel,
  uiModalBtnConfirm,
  uiModalPanel,
  uiModalText,
  uiModalTitle,
} from '@/components/ui/ui-classes';

export type LeaveConversationIntent = 'join' | 'register' | 'login' | 'logout';

type SwitchConversationModalProps = {
  open: boolean;
  busy?: boolean;
  isOwner: boolean;
  intent?: LeaveConversationIntent;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
};

export function SwitchConversationModal({
  open,
  busy = false,
  isOwner,
  intent = 'join',
  onCancel,
  onConfirm,
}: SwitchConversationModalProps) {
  const isAuth = intent === 'register' || intent === 'login';
  const isLogout = intent === 'logout';

  const title = isLogout
    ? 'Cerrar sesión'
    : isAuth
      ? intent === 'register'
        ? 'Registrarse'
        : 'Iniciar sesión'
      : 'Cambiar de conversación';

  const description = isLogout
    ? isOwner
      ? 'Eres el propietario de esta conversación. Al cerrar sesión saldrás de la sala y la conversación se cerrará para todos los participantes.'
      : 'Actualmente participas en una conversación. Al cerrar sesión saldrás de la sala antes de salir de tu cuenta.'
    : isOwner
      ? 'Eres el propietario de esta conversación. Si abandonas la conversación actual esta será cerrada para todos los participantes. ¿Deseas continuar?'
      : 'Actualmente participas en una conversación. Si continúas abandonarás la conversación actual. ¿Deseas continuar?';

  const confirmLabel = busy
    ? isLogout
      ? 'Cerrando sesión…'
      : 'Procesando…'
    : isLogout
      ? 'Cerrar sesión'
      : isOwner
        ? 'Cerrar conversación y continuar'
        : 'Salir y continuar';

  return (
    <ModalFrame open={open} labelledBy="switch-conv-title" onClose={onCancel}>
      <div className={uiModalPanel}>
        <h2 id="switch-conv-title" className={uiModalTitle}>
          {title}
        </h2>
        <p className={uiModalText}>{description}</p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={busy}
            className={uiModalBtnCancel}
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={busy}
            className={uiModalBtnConfirm}
            onClick={() => void onConfirm()}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </ModalFrame>
  );
}
