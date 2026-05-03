'use client';

import { useEffect, useRef } from 'react';
import type { Message } from '@/lib/model/types';

export interface TableChatViewProps {
  tableId: string;
  messages: Message[];
  message: string;
  onMessageChange: (value: string) => void;
  onSend: () => void;
  onCallWaiter: () => void;
}

function bubbleClasses(sender: Message['sender']) {
  if (sender === 'waiter') {
    return 'ml-auto rounded-2xl rounded-br-md bg-[#DCF8C6] text-[#1F2937] shadow-sm';
  }
  if (sender === 'customer') {
    return 'mr-auto rounded-2xl rounded-bl-md bg-white text-[#1F2937] border border-[#E5E7EB] shadow-sm';
  }
  return 'mx-auto rounded-2xl bg-[#E3F2FD] text-[#1F2937] border border-[#E5E7EB] text-center text-sm shadow-sm';
}

export function TableChatView({
  tableId,
  messages,
  message,
  onMessageChange,
  onSend,
  onCallWaiter,
}: TableChatViewProps) {
  const chatRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = chatRef.current;
    if (!el) return;

    el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F8]">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pt-6 pb-4 sm:px-6">
        <header className="mb-5 rounded-2xl border border-[#E5E7EB] bg-white px-5 py-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
            Mesa
          </p>
          <h1 className="mt-1 text-xl font-semibold text-[#1F2937]">
            {tableId}
          </h1>
        </header>

        <button
          type="button"
          onClick={onCallWaiter}
          className="mb-4 w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-semibold text-[#1F2937] shadow-sm transition hover:bg-[#F1F5F9] hover:brightness-[0.98] active:brightness-95"
        >
          Llamar mesero
        </button>

        <div
          ref={chatRef}
          className="mb-4 flex min-h-[min(420px,50vh)] flex-1 flex-col gap-3 overflow-y-auto rounded-2xl border border-[#E5E7EB] bg-[#EEF1F4] px-3 py-4 shadow-inner sm:min-h-[320px]"
        >
          {messages.length === 0 && (
            <p className="py-8 text-center text-sm text-[#6B7280]">
              Aún no hay mensajes. Escribe abajo para iniciar el chat.
            </p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex w-full max-w-full ${m.sender === 'waiter' ? 'justify-end' : m.sender === 'customer' ? 'justify-start' : 'justify-center'}`}
            >
              <div
                className={`max-w-[85%] px-4 py-2.5 ${bubbleClasses(m.sender)}`}
              >
                {m.sender !== 'system' && (
                  <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">
                    {m.sender === 'customer' ? 'Tú' : 'Mesero'}
                  </span>
                )}
                <p className="whitespace-pre-wrap text-[15px] leading-snug">
                  {m.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="sticky bottom-0 mt-auto rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-sm">
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
  );
}
