'use client';

import { useEffect, useRef, type UIEvent } from 'react';
import { MessageBubble } from '@/components/chat/MessageBubble';
import type { Message, SessionUser } from '@/lib/model/types';

type ChatMessagesPaneProps = {
  messages: Message[];
  currentSessionUserId?: string | null;
  lastReadAt?: string | null;
  sessionUsers?: SessionUser[];
  waiterIncomingBubbleLabel?: string | null;
  typingIndicator?: string | null;
  onMessagesScroll?: (e: UIEvent<HTMLDivElement>) => void;
};

export function ChatMessagesPane({
  messages,
  currentSessionUserId = null,
  lastReadAt = null,
  sessionUsers = [],
  waiterIncomingBubbleLabel = null,
  typingIndicator = null,
  onMessagesScroll,
}: ChatMessagesPaneProps) {
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  return (
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
          waiterIncomingBubbleLabel={waiterIncomingBubbleLabel}
        />
      ))}
      {typingIndicator ? (
        <p className="px-1 text-xs italic text-[#6B7280]">{typingIndicator}</p>
      ) : null}
      <div ref={messageEndRef} />
    </div>
  );
}

