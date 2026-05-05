'use client';

import { useEffect, useRef, useState } from 'react';
import { normalizeLanguageCode } from '@/constants/languages';
import type { Message, SessionUser } from '@/lib/model/types';
import { customerPeerHeaderLabels } from '@/lib/utils/chat-peer-label';

export interface MessageBubbleProps {
  message: Message;
  currentUserType: Exclude<Message['sender'], 'system'>;
  /** Idioma del usuario que está viendo el chat (para elegir traducción). */
  viewerLanguage?: string | null;
  /** Sesión actual del cliente (QR); obligatorio en vista cliente para multisesión. */
  currentSessionUserId?: string | null;
  /** Solo vista cliente: marca temporal local “leído” sin backend. */
  lastReadAt?: string | null;
  showReadReceipts?: boolean;
  /** Clientes activos de la sesión (orden por joined_at en el helper). */
  sessionUsers?: SessionUser[] | null;
  /**
   * Vista cliente: texto sobre la burbuja del mesero (p. ej. nombre + " · Personal").
   * Si falta, se usa "Mesero".
   */
  waiterIncomingBubbleLabel?: string | null;
}

const LONG_PRESS_MS = 480;

type PeerHeaderFields = ReturnType<typeof customerPeerHeaderLabels>;

function PeerCustomerBubble({
  peerHeader,
  headerMuted,
  bubbleClass,
  primaryLine,
  secondaryOriginalLine,
  translationMutedClass,
}: {
  peerHeader: PeerHeaderFields;
  headerMuted: string;
  bubbleClass: string;
  primaryLine: string;
  secondaryOriginalLine?: string | null;
  translationMutedClass: string;
}) {
  const [open, setOpen] = useState(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressConsumedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
  }, []);

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const openModal = () => setOpen(true);

  const onTouchStart = () => {
    longPressConsumedRef.current = false;
    clearLongPressTimer();
    longPressTimerRef.current = setTimeout(() => {
      longPressConsumedRef.current = true;
      openModal();
    }, LONG_PRESS_MS);
  };

  const onTouchEnd = () => {
    clearLongPressTimer();
  };

  const onActivate = () => {
    if (longPressConsumedRef.current) {
      longPressConsumedRef.current = false;
      return;
    }
    openModal();
  };

  const nameLine = peerHeader.displayName.trim() || 'No indicado';
  const aliasLine = peerHeader.username.trim() || 'No indicado';

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Mensaje de ${peerHeader.shortLabel}. Toca para ver nombre y alias.`}
        className={`${bubbleClass} cursor-pointer transition hover:brightness-[1.02] active:brightness-[0.98]`}
        onClick={onActivate}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onActivate();
          }
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        <span
          className={`mb-0.5 block text-[11px] font-semibold leading-snug normal-case tracking-normal underline decoration-dotted decoration-[#6B7280]/55 underline-offset-2 ${headerMuted}`}
        >
          {peerHeader.shortLabel}
        </span>
        <p className="whitespace-pre-wrap text-[15px] font-semibold leading-snug text-[#1F2937]">
          {primaryLine}
        </p>
        {secondaryOriginalLine?.trim() ? (
          <p
            className={`mt-1 whitespace-pre-wrap text-xs leading-snug opacity-60 ${translationMutedClass}`}
          >
            {secondaryOriginalLine.trim()}
          </p>
        ) : null}
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="peer-sender-dialog-title"
            className="w-full max-w-sm rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="peer-sender-dialog-title"
              className="text-base font-semibold text-[#1F2937]"
            >
              Remitente
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                  Nombre
                </dt>
                <dd className="mt-0.5 font-medium text-[#1F2937]">{nameLine}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                  Alias
                </dt>
                <dd className="mt-0.5 font-medium text-[#1F2937]">{aliasLine}</dd>
              </div>
            </dl>
            <button
              type="button"
              className="mt-6 w-full rounded-xl bg-[#229ED9] py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 active:brightness-95"
              onClick={() => setOpen(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function parseTime(iso: string | undefined | null): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return t;
}

export function MessageBubble({
  message,
  currentUserType,
  viewerLanguage = null,
  currentSessionUserId,
  lastReadAt,
  showReadReceipts = false,
  sessionUsers = null,
  waiterIncomingBubbleLabel = null,
}: MessageBubbleProps) {
  const text = message.text ?? '';
  const viewerLangRaw = (viewerLanguage ?? '').trim();
  const viewerNorm = viewerLangRaw ? normalizeLanguageCode(viewerLangRaw) : null;
  const originalLang =
    (message.original_language ?? '').trim().toLowerCase() || null;
  const translation = viewerNorm
    ? message.translations?.find(
        (t) =>
          t.message_id === message.id &&
          normalizeLanguageCode(t.language ?? '') === viewerNorm
      )
    : undefined;
  const isLegacyUnlinked =
    (message.sender === 'waiter' || message.sender === 'customer') &&
    (!message.session_user_id || !message.user_identifier);
  const isInvalidParticipantMessage =
    (message.sender === 'waiter' || message.sender === 'customer') &&
    (!message.session_user_id ||
      !message.user_identifier ||
      !originalLang ||
      !text.trim());

  if (message.sender === 'system') {
    return (
      <div className="flex w-full justify-center">
        <div className="max-w-[85%] rounded-xl bg-[#E5E7EB]/90 px-3 py-2 text-center">
          <p className="whitespace-pre-wrap text-xs leading-snug text-[#4B5563]">
            {text}
          </p>
        </div>
      </div>
    );
  }

  // Mensajes antiguos o incompletos: no romper UI ni mezclar con chat activo.
  if (isInvalidParticipantMessage) return null;

  const isWaiterMessage = message.sender === 'waiter';
  const isCustomerMessage = message.sender === 'customer';

  const isMeWaiter = currentUserType === 'waiter' && isWaiterMessage;

  const isMeCustomer =
    currentUserType === 'customer' &&
    isCustomerMessage &&
    Boolean(currentSessionUserId) &&
    message.session_user_id === currentSessionUserId;

  let variant: 'me' | 'waiter_in' | 'peer' | 'waiter_self';

  if (isMeWaiter) {
    variant = 'waiter_self';
  } else if (isMeCustomer) {
    variant = 'me';
  } else if (isWaiterMessage) {
    variant = 'waiter_in';
  } else {
    variant = 'peer';
  }

  const readTs = parseTime(lastReadAt);
  const createdTs = parseTime(message.created_at ?? null);
  const isRead =
    showReadReceipts &&
    variant === 'me' &&
    readTs !== null &&
    createdTs !== null &&
    createdTs <= readTs;

  const bubbleClass =
    variant === 'me' || variant === 'waiter_self'
      ? 'max-w-[78%] rounded-2xl rounded-br-sm bg-[#229ED9] px-3 py-2 text-white shadow-sm'
      : variant === 'waiter_in'
      ? 'max-w-[78%] rounded-2xl rounded-bl-sm border border-amber-200 bg-[#FEF9C3] px-3 py-2 text-[#1F2937] shadow-sm'
      : 'max-w-[78%] rounded-2xl rounded-bl-sm border border-[#E5E7EB] bg-white px-3 py-2 text-[#1F2937] shadow-sm';

  const rowAlign =
    variant === 'me' || variant === 'waiter_self'
      ? 'justify-end'
      : 'justify-start';

  const headerLabel =
    variant === 'me'
      ? 'Tú'
      : variant === 'waiter_self'
      ? 'Tú'
      : variant === 'waiter_in'
      ? currentUserType === 'customer' && waiterIncomingBubbleLabel?.trim()
        ? waiterIncomingBubbleLabel.trim()
        : 'Mesero'
      : 'Cliente';

  const peerHeader =
    variant === 'peer' && isCustomerMessage
      ? customerPeerHeaderLabels(message, sessionUsers ?? [])
      : null;

  const headerMuted =
    variant === 'me' || variant === 'waiter_self'
      ? 'text-white/80'
      : 'text-[#6B7280]';

  const staffNamedHeader =
    variant === 'waiter_in' &&
    currentUserType === 'customer' &&
    Boolean(waiterIncomingBubbleLabel?.trim());

  const defaultHeaderClass =
    'mb-0.5 block text-[10px] font-semibold uppercase tracking-wide';
  const staffHeaderClass =
    'mb-0.5 block max-w-[85%] text-[11px] font-semibold leading-snug normal-case tracking-normal';

  const translationMutedClass =
    variant === 'me' || variant === 'waiter_self'
      ? 'text-white/70'
      : variant === 'waiter_in'
      ? 'text-amber-900/55'
      : 'text-[#9CA3AF]';

  const primaryLine =
    (translation?.translated_text ?? '').trim() || text.trim() || '…';
  const secondaryOriginalLine =
    translation && text.trim() ? text.trim() : null;

  if (peerHeader) {
    return (
      <div className={`flex w-full ${rowAlign}`}>
        <PeerCustomerBubble
          peerHeader={peerHeader}
          headerMuted={headerMuted}
          bubbleClass={bubbleClass}
          primaryLine={primaryLine}
          secondaryOriginalLine={secondaryOriginalLine}
          translationMutedClass={translationMutedClass}
        />
      </div>
    );
  }

  return (
    <div className={`flex w-full ${rowAlign}`}>
      <div className={bubbleClass}>
        <span
          className={`${staffNamedHeader ? staffHeaderClass : defaultHeaderClass} ${headerMuted}`}
        >
          {headerLabel}
        </span>
        <p
          className={`whitespace-pre-wrap text-[15px] font-semibold leading-snug ${
            variant === 'me' || variant === 'waiter_self'
              ? 'text-white'
              : 'text-[#1F2937]'
          }`}
        >
          {primaryLine}
        </p>
        {isLegacyUnlinked ? (
          <p
            className={`mt-1 whitespace-pre-wrap text-[11px] italic leading-snug ${translationMutedClass}`}
          >
            (legacy: mensaje sin vínculo de sesión)
          </p>
        ) : null}
        {secondaryOriginalLine ? (
          <p
            className={`mt-1 whitespace-pre-wrap text-xs leading-snug opacity-60 ${translationMutedClass}`}
          >
            {secondaryOriginalLine}
          </p>
        ) : null}
        {showReadReceipts && variant === 'me' && (
          <div className="mt-1 flex justify-end text-[11px] tracking-tight text-white/75">
            <span aria-hidden title={isRead ? 'Leído' : 'Enviado'}>
              {isRead ? '✓✓' : '✓'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
