'use client';

import { useEffect, useRef } from 'react';
import type { Message } from '@/lib/model/types';
import { MessageBubble } from '@/components/chat/MessageBubble';

export interface ChatWindowProps {
  activeTableId: string | null;
  messages: Message[];
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  emptyTitle?: string;
  emptySubtitle?: string;
}

const inputClass =
  'min-w-0 flex-1 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-[15px] text-[#1F2937] placeholder:text-[#6B7280] shadow-sm outline-none transition focus:border-[#229ED9] focus:ring-2 focus:ring-[#229ED9]/30';

export function ChatWindow({
  activeTableId,
  messages,
  draft,
  onDraftChange,
  onSend,
  emptyTitle = 'Selecciona una mesa',
  emptySubtitle = 'Abre el chat desde una mesa asignada para ver la conversación.',
}: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const isNearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < 80;

    if (isNearBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !activeTableId) return;
    el.scrollTop = el.scrollHeight;
  }, [activeTableId]);

  if (!activeTableId) {
    return (
      <div className="flex h-full min-h-[12rem] flex-1 flex-col items-center justify-center bg-[#E9EEF2] px-6 py-12 text-center md:min-h-0">
        <p className="text-base font-medium text-[#1F2937]">{emptyTitle}</p>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-[#6B7280]">
          {emptySubtitle}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-[#FFFFFF] shadow-sm md:rounded-xl md:border md:border-[#E5E7EB]">
      <header className="shrink-0 border-b border-[#E5E7EB] bg-[#FFFFFF] px-4 py-3 md:rounded-t-xl">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">
          Conversación
        </p>
        <h2 className="font-mono text-lg font-semibold text-[#1F2937]">
          Mesa {activeTableId}
        </h2>
      </header>

      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto bg-[#E9EEF2] px-3 py-3"
      >
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-[#6B7280]">
            Sin mensajes aún. Saluda al cliente.
          </p>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
      </div>

      <div className="sticky bottom-0 z-10 shrink-0 border-t border-[#E5E7EB] bg-[#FFFFFF] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:rounded-b-xl">
        <div className="flex gap-2">
          <input
            className={inputClass}
            placeholder="Escribe un mensaje…"
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            aria-label="Mensaje"
          />
          <button
            type="button"
            onClick={onSend}
            className="shrink-0 rounded-xl bg-[#229ED9] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1c8ec6] active:brightness-95"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
