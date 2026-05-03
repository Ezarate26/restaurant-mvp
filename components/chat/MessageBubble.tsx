'use client';

import type { Message } from '@/lib/model/types';

export interface MessageBubbleProps {
  message: Message;
}

function bubbleStyle(sender: Message['sender']) {
  if (sender === 'waiter') {
    return 'ml-auto rounded-xl rounded-br-sm bg-[#DCF8C6] text-[#1F2937] shadow-sm';
  }
  if (sender === 'customer') {
    return 'mr-auto rounded-xl rounded-bl-sm border border-[#E5E7EB] bg-[#FFFFFF] text-[#1F2937] shadow-sm';
  }
  return 'mx-auto rounded-xl border border-[#E5E7EB] bg-[#E3F2FD] text-center text-sm text-[#1F2937] shadow-sm';
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const align =
    message.sender === 'waiter'
      ? 'justify-end'
      : message.sender === 'customer'
        ? 'justify-start'
        : 'justify-center';

  return (
    <div className={`flex w-full ${align}`}>
      <div
        className={`max-w-[min(85%,20rem)] px-3.5 py-2 ${bubbleStyle(message.sender)}`}
      >
        {message.sender !== 'system' && (
          <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">
            {message.sender === 'waiter' ? 'Tú' : 'Cliente'}
          </span>
        )}
        <p className="whitespace-pre-wrap text-[15px] leading-snug text-[#1F2937]">
          {message.text}
        </p>
      </div>
    </div>
  );
}
