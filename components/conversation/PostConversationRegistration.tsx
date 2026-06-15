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

type PostConversationRegistrationProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PostConversationRegistration({
  open,
  onOpenChange,
}: PostConversationRegistrationProps) {
  return (
    <ModalFrame open={open} onClose={() => onOpenChange(false)}>
      <div className={uiModalPanel}>
        <h2 className={uiModalTitle}>¿Te gustó la experiencia?</h2>
        <p className={uiModalText}>
          Crea una cuenta gratuita para guardar tu perfil y unirte más rápido a
          futuras conversaciones.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/register"
            className={uiBtnPrimary}
            onClick={() => onOpenChange(false)}
          >
            Crear cuenta gratuita
          </Link>
          <button
            type="button"
            className={uiBtnSecondary}
            onClick={() => onOpenChange(false)}
          >
            Ahora no
          </button>
        </div>
      </div>
    </ModalFrame>
  );
}
