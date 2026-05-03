'use client';

import type { Message } from '@/lib/model/types';

export interface MessageBubbleProps {
  message: Message;
  currentUserType: Exclude<Message['sender'], 'system'>;
}

function getMessageAlignment(
  message: Message,
  currentUserType: Exclude<Message['sender'], 'system'>
) {
  if (message.sender === 'system') {
    return {
      container: 'justify-center',
      bubble: 'max-w-[70%] rounded-xl bg-gray-200 p-2 text-center text-xs text-[#4B5563]',
      label: null as string | null,
      text: 'text-center',
    };
  }

  if (message.sender === currentUserType) {
    return {
      container: 'justify-end',
      bubble: 'max-w-[70%] rounded-xl bg-green-200 p-2 text-right text-[#1F2937]',
      label: 'Tú',
      text: 'text-right',
    };
  }

  return {
    container: 'justify-start',
    bubble:
      'max-w-[70%] rounded-xl bg-white p-2 text-left text-[#1F2937] border border-[#E5E7EB]',
    label: message.sender === 'waiter' ? 'Mesero' : 'Cliente',
    text: 'text-left',
  };
}

export function MessageBubble({ message, currentUserType }: MessageBubbleProps) {
  const styles = getMessageAlignment(message, currentUserType);

  return (
    <div className={`flex w-full ${styles.container}`}>
      <div className={styles.bubble}>
        {styles.label && (
          <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">
            {styles.label}
          </span>
        )}
        <p className={`whitespace-pre-wrap text-[15px] leading-snug ${styles.text}`}>
          {message.text}
        </p>
      </div>
    </div>
  );
}
