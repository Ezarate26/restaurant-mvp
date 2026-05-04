'use client';

import { useEffect, useRef, type ReactNode, type UIEvent } from 'react';
import type { Message, SessionUser } from '@/lib/model/types';
import { MessageBubble } from '@/components/chat/MessageBubble';

export interface TableChatViewProps {
  tableId: string;
  messages: Message[];
  message: string;
  onMessageChange: (value: string) => void;
  onSend: () => void;
  onCallWaiter: () => void;
  /** Etiqueta legible (ej. nombre del service_point). Si no, se muestra `tableId`. */
  headerLabel?: string;
  /** Slot opcional debajo del header para inyectar UI extra (ej. SessionUsersList). */
  usersSlot?: ReactNode;
  currentSessionUserId?: string | null;
  lastReadAt?: string | null;
  typingIndicator?: string | null;
  onMessagesScroll?: (e: UIEvent<HTMLDivElement>) => void;
  /** Si el perfil opcional sigue pendiente; al pasar a false se cierra el modal. */
  profilePromptActive?: boolean;
  optionalProfileEditorOpen?: boolean;
  onOptionalProfileEditorOpenChange?: (open: boolean) => void;
  profileDisplayName?: string;
  profileUsername?: string;
  profileEmail?: string;
  profileNotice?: string | null;
  onProfileDisplayNameChange?: (value: string) => void;
  onProfileUsernameChange?: (value: string) => void;
  onProfileEmailChange?: (value: string) => void;
  onSaveProfile?: () => void | Promise<void>;
  sessionUsers?: SessionUser[];
}

export function TableChatView({
  tableId,
  messages,
  message,
  onMessageChange,
  onSend,
  onCallWaiter,
  headerLabel,
  usersSlot,
  currentSessionUserId = null,
  lastReadAt = null,
  typingIndicator = null,
  onMessagesScroll,
  profilePromptActive = false,
  optionalProfileEditorOpen = false,
  onOptionalProfileEditorOpenChange,
  profileDisplayName = '',
  profileUsername = '',
  profileEmail = '',
  profileNotice = null,
  onProfileDisplayNameChange,
  onProfileUsernameChange,
  onProfileEmailChange,
  onSaveProfile,
  sessionUsers = [],
}: TableChatViewProps) {
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  useEffect(() => {
    if (!profilePromptActive) {
      onOptionalProfileEditorOpenChange?.(false);
    }
  }, [profilePromptActive, onOptionalProfileEditorOpenChange]);

  return (
    <div className="flex h-screen min-h-0 flex-col bg-[#F4F6F8]">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-lg flex-1 flex-col px-4 pt-6 pb-4 sm:px-6">
        <header className="flex shrink-0 items-center justify-between gap-3 rounded-2xl border border-[#E5E7EB] bg-white px-5 py-4 shadow-sm">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
              Mesa
            </p>
            <h1 className="mt-1 truncate text-xl font-semibold text-[#1F2937]">
              {headerLabel ?? tableId}
            </h1>
          </div>
          {profilePromptActive && onOptionalProfileEditorOpenChange ? (
            <button
              type="button"
              onClick={() => onOptionalProfileEditorOpenChange(true)}
              className="profile-chip-bounce shrink-0 rounded-lg bg-[#229ED9] px-3 py-2 text-center text-[11px] font-semibold leading-snug text-white shadow-sm transition hover:brightness-110 active:brightness-95"
            >
              Agrega tu nombre
            </button>
          ) : null}
        </header>

        {usersSlot && <div className="mt-3 shrink-0">{usersSlot}</div>}

        <button
          type="button"
          onClick={onCallWaiter}
          className="mt-4 w-full shrink-0 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-semibold text-[#1F2937] shadow-sm transition hover:bg-[#F1F5F9] hover:brightness-[0.98] active:brightness-95"
        >
          Llamar mesero
        </button>

        <div className="mt-4 flex min-h-0 flex-1 flex-col rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
          <div
            className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-[#EEF1F4] px-3 py-4"
            onScroll={onMessagesScroll}
          >
            {messages.length === 0 && (
              <p className="py-8 text-center text-sm text-[#6B7280]">
                Aún no hay mensajes. Escribe abajo para iniciar el chat.
              </p>
            )}
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                currentUserType="customer"
                currentSessionUserId={currentSessionUserId}
                lastReadAt={lastReadAt}
                showReadReceipts
                sessionUsers={sessionUsers}
              />
            ))}
            {typingIndicator ? (
              <p className="px-1 text-xs italic text-[#6B7280]">{typingIndicator}</p>
            ) : null}
            <div ref={messageEndRef} />
          </div>

          <div className="shrink-0 border-t border-[#E5E7EB] bg-white p-3">
            <div className="flex gap-2">
              <input
                className="min-w-0 flex-1 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-[15px] text-[#1F2937] placeholder:text-[#6B7280] shadow-sm outline-none transition focus:border-[#229ED9] focus:ring-2 focus:ring-[#229ED9]/35"
                placeholder="Escribe un mensaje…"
                value={message}
                onChange={(e) => onMessageChange(e.target.value)}
                aria-label="Mensaje"
              />
              <button
                type="button"
                onClick={onSend}
                className="shrink-0 rounded-xl bg-[#229ED9] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 active:brightness-90"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      </div>

      {optionalProfileEditorOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-xl">
            <h2 className="text-base font-semibold text-[#1F2937]">
              Mejora tu experiencia (opcional)
            </h2>
            <p className="mt-1 text-xs text-[#6B7280]">
              Puedes continuar sin llenar esto, pero te ayudaremos mejor si lo haces 😉
            </p>
            <div className="mt-3 grid gap-3.5">
              <div>
                <label
                  htmlFor="modal-profile-display-name"
                  className="mb-1 block text-xs font-medium leading-snug text-[#374151]"
                >
                  ¿Cómo te llamas o cómo te gustaría que te llamemos?
                </label>
                <input
                  id="modal-profile-display-name"
                  type="text"
                  value={profileDisplayName}
                  onChange={(e) => onProfileDisplayNameChange?.(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] outline-none transition focus:border-[#229ED9] focus:ring-2 focus:ring-[#229ED9]/35"
                  placeholder="Nombre: ej. María González"
                  aria-label="Nombre"
                />
              </div>
              <div>
                <label
                  htmlFor="modal-profile-username"
                  className="mb-1 block text-xs font-medium leading-snug text-[#374151]"
                >
                  ¿Tienes un alias?
                </label>
                <input
                  id="modal-profile-username"
                  type="text"
                  value={profileUsername}
                  onChange={(e) => onProfileUsernameChange?.(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] outline-none transition focus:border-[#229ED9] focus:ring-2 focus:ring-[#229ED9]/35"
                  placeholder="Usuario: ej. juan123"
                  aria-label="Usuario o alias"
                />
              </div>
              <div>
                <label
                  htmlFor="modal-profile-email"
                  className="mb-1 block text-xs font-medium leading-snug text-[#374151]"
                >
                  Tu correo para recordarte en tus futuras visitas (opcional)
                </label>
                <input
                  id="modal-profile-email"
                  type="email"
                  value={profileEmail}
                  onChange={(e) => onProfileEmailChange?.(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] outline-none transition focus:border-[#229ED9] focus:ring-2 focus:ring-[#229ED9]/35"
                  placeholder="Email: ej. maria@correo.com"
                  aria-label="Correo electrónico"
                />
              </div>
            </div>
            {profileNotice ? (
              <p className="mt-2 text-xs text-amber-700">{profileNotice}</p>
            ) : null}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => onOptionalProfileEditorOpenChange?.(false)}
                className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#4B5563] hover:bg-[#F9FAFB]"
              >
                Ahora no
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onSaveProfile?.();
                }}
                className="rounded-lg bg-[#229ED9] px-3 py-2 text-sm font-semibold text-white hover:brightness-95"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
