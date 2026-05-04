'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import type { Message } from '@/lib/model/types';
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
}: TableChatViewProps) {
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  return (
    <div className="flex h-screen min-h-0 flex-col bg-[#F4F6F8]">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-lg flex-1 flex-col px-4 pt-6 pb-4 sm:px-6">
        <header className="shrink-0 rounded-2xl border border-[#E5E7EB] bg-white px-5 py-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
            Mesa
          </p>
          <h1 className="mt-1 text-xl font-semibold text-[#1F2937]">
            {headerLabel ?? tableId}
          </h1>
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
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-[#EEF1F4] px-3 py-4">
            {messages.length === 0 && (
              <p className="py-8 text-center text-sm text-[#6B7280]">
                Aún no hay mensajes. Escribe abajo para iniciar el chat.
              </p>
            )}
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} currentUserType="customer" />
            ))}
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
    </div>
  );
}
