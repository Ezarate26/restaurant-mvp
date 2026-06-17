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

type UpgradeInviteModalProps = {
  open: boolean;
  onClose: () => void;
  onGoPro: () => void;
};

export function UpgradeInviteModal({
  open,
  onClose,
  onGoPro,
}: UpgradeInviteModalProps) {
  return (
    <ModalFrame open={open} labelledBy="pro-invite-title" onClose={onClose}>
      <div className={uiModalPanel}>
        <h2 id="pro-invite-title" className={uiModalTitle}>
          ¡Cuenta creada!
        </h2>
        <p className={uiModalText}>
          Tu cuenta quedó en plan <strong>Free</strong>. Puedes crear salas y chatear
          con texto en español e inglés. ¿Quieres desbloquear voz, todos los idiomas
          y salas más largas con <strong>Pro</strong> ($9.99/mes USD)?
        </p>
        <ul className="mt-4 space-y-2 text-sm text-[var(--app-muted)]">
          <li>· Voz con traducción en tiempo real</li>
          <li>· Hasta 10 participantes por sala</li>
          <li>· Salas de 60 minutos</li>
        </ul>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={onClose} className={uiBtnSecondary}>
            Seguir en Free
          </button>
          <button type="button" onClick={onGoPro} className={uiBtnPrimary}>
            Ver planes Pro
          </button>
        </div>
        <p className="mt-4 text-center text-xs text-[var(--app-muted)]">
          También puedes cambiar tu plan desde el menú lateral →{' '}
          <Link href="/app/billing" className="text-[var(--app-primary)] hover:underline">
            Cambiar plan
          </Link>
        </p>
      </div>
    </ModalFrame>
  );
}
