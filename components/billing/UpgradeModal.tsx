'use client';

import { useEffect, useState } from 'react';
import { ActivitySpinner } from '@/components/ui/ActivitySpinner';
import { RegisterLeaveChatModal } from '@/components/billing/RegisterLeaveChatModal';
import { ModalFrame } from '@/components/ui/ModalFrame';
import {
  uiBtnPrimary,
  uiBtnSecondary,
  uiModalPanel,
  uiModalText,
  uiModalTitle,
} from '@/components/ui/ui-classes';
import { PRO_TRIAL_DAYS, FREE_LIMITS, FREE_DAILY_CONVERSATION_LIMIT } from '@/lib/billing/constants';

type CheckoutBusy = 'pro' | 'room_pass' | null;

type UpgradeModalProps = {
  open: boolean;
  onClose: () => void;
  onUpgrade: () => void | Promise<void>;
  onBuyRoomPass?: () => void | Promise<void>;
  onRegisterLeave?: () => void | Promise<void>;
  registerHref?: string;
  requiresAuth?: boolean;
  variant?: 'voice' | 'free-time-expired' | 'chat-ended';
};

export function UpgradeModal({
  open,
  onClose,
  onUpgrade,
  onBuyRoomPass,
  onRegisterLeave,
  registerHref = '/auth/register?redirect=/app/billing',
  requiresAuth = false,
  variant = 'voice',
}: UpgradeModalProps) {
  const isFreeTime = variant === 'free-time-expired';
  const isChatEnded = variant === 'chat-ended';
  const [busy, setBusy] = useState<CheckoutBusy>(null);
  const [registerConfirmOpen, setRegisterConfirmOpen] = useState(false);
  const [registerBusy, setRegisterBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setBusy(null);
      setRegisterConfirmOpen(false);
      setRegisterBusy(false);
    }
  }, [open]);

  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setBusy(null);
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  const runCheckout = async (
    kind: Exclude<CheckoutBusy, null>,
    action: () => void | Promise<void>
  ) => {
    if (busy) return;
    setBusy(kind);
    try {
      await action();
    } catch {
      setBusy(null);
    }
  };

  const handleRegisterContinue = async () => {
    if (registerBusy) return;
    setRegisterBusy(true);
    try {
      if (onRegisterLeave) {
        await onRegisterLeave();
        return;
      }
      window.location.href = registerHref;
    } catch {
      setRegisterBusy(false);
    }
  };

  const showRoomPass = Boolean(onBuyRoomPass) && !requiresAuth;

  return (
    <>
      <ModalFrame
        open={open && !registerConfirmOpen}
        labelledBy="upgrade-modal-title"
        onClose={isFreeTime || isChatEnded ? (busy ? undefined : onClose) : busy ? undefined : onClose}
      >
        <div className={`${uiModalPanel} relative`}>
          {busy ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-[var(--app-panel)]/90 backdrop-blur-sm">
              <ActivitySpinner
                className="h-9 w-9"
                label={
                  busy === 'pro'
                    ? 'Preparando pago Pro…'
                    : 'Preparando pago del pase…'
                }
              />
            </div>
          ) : null}

          <h2 id="upgrade-modal-title" className={uiModalTitle}>
            {isChatEnded
              ? 'La conversación finalizó'
              : isFreeTime
                ? 'Tu tiempo gratuito se agotó'
                : 'Habla con voz en Pro'}
          </h2>
          <p className={uiModalText}>
            {isChatEnded
              ? 'Pásate a Pro ($9.99/mes) para salas de 60 minutos, voz con traducción y todos los idiomas, o compra un pase solo para esta sala ($2.99 USD, pago único con tarjeta).'
              : isFreeTime
                ? `Las salas gratuitas duran ${FREE_LIMITS.roomDurationMinutes} minutos por chat (hasta ${FREE_DAILY_CONVERSATION_LIMIT} chats al día). Pásate a Pro ($9.99/mes) para salas de 60 minutos, voz con traducción y todos los idiomas, o compra un pase solo para esta sala ($2.99 USD, pago único con tarjeta).`
                : 'Los mensajes de voz con traducción en tiempo real están disponibles en Pro ($9.99/mes USD) o con un pase por sala ($2.99 USD, pago único con tarjeta).'}
          </p>

          <ul className="mt-4 space-y-2 text-sm text-[var(--app-muted)]">
            <li>· Todos los idiomas</li>
            <li>· Hasta 10 participantes</li>
            <li>· Salas de 60 minutos</li>
          </ul>

          {!requiresAuth ? (
            <p className="mt-4 rounded-xl border border-[var(--app-success)]/35 bg-[var(--app-success)]/10 px-3 py-2.5 text-sm font-medium text-[var(--app-text)]">
              <strong className="text-[var(--app-success)]">
                {PRO_TRIAL_DAYS} días de prueba gratis
              </strong>{' '}
              en Pro — no se te cobrará hasta que termine el periodo de prueba (si eres
              elegible).
            </p>
          ) : null}

          {requiresAuth ? (
            <p className="mt-4 rounded-xl bg-[var(--app-warning)]/10 px-3 py-2 text-xs text-[var(--app-warning)]">
              Debes registrarte antes de contratar un plan o pase por sala.
            </p>
          ) : null}

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={onClose}
              className={uiBtnSecondary}
            >
              Ahora no
            </button>
            {showRoomPass ? (
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => void runCheckout('room_pass', onBuyRoomPass!)}
                className={uiBtnSecondary}
              >
                {busy === 'room_pass' ? 'Procesando…' : 'Pase por sala · $2.99'}
              </button>
            ) : null}
            {requiresAuth ? (
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => setRegisterConfirmOpen(true)}
                className={uiBtnPrimary}
              >
                Registrarse para contratar
              </button>
            ) : (
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => void runCheckout('pro', onUpgrade)}
                className={uiBtnPrimary}
              >
                {busy === 'pro' ? 'Procesando…' : `Pro · ${PRO_TRIAL_DAYS} días gratis`}
              </button>
            )}
          </div>
        </div>
      </ModalFrame>

      <RegisterLeaveChatModal
        open={open && registerConfirmOpen}
        busy={registerBusy}
        onStay={() => setRegisterConfirmOpen(false)}
        onContinue={handleRegisterContinue}
      />
    </>
  );
}
