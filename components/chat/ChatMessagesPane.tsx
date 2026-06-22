'use client';

import { useEffect, useRef, useState, type UIEvent } from 'react';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ChatActivityIndicator } from '@/components/chat/ChatActivityIndicator';
import { SystemMessageCard } from '@/components/chat/SystemMessageCard';
import { SoloOwnerInvitePrompt } from '@/components/chat/SoloOwnerInvitePrompt';
import { useChatAutoScroll } from '@/lib/hooks/useChatAutoScroll';
import type { ConversationMember, Message } from '@/lib/model/types';

type ActivityEvent = {
  id: string;
  text: string;
};

type ChatMessagesPaneProps = {
  messages: Message[];
  currentMemberId?: string | null;
  viewerLanguage?: string | null;
  lastReadAt?: string | null;
  members?: ConversationMember[];
  typingLabel?: string | null;
  recordingLabel?: string | null;
  closureBanner?: string | null;
  onMessagesScroll?: (e: UIEvent<HTMLDivElement>) => void;
  isOwner?: boolean;
  inviteCode?: string | null;
  onOpenInvite?: () => void;
  onShareInvite?: () => void;
  composerDisabled?: boolean;
};

function useMemberActivityEvents(members: ConversationMember[]): ActivityEvent[] {
  const prevRef = useRef<Map<string, string>>(new Map());
  const initializedRef = useRef(false);
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    const active = members.filter((m) => !m.left_at);
    const prev = prevRef.current;
    const next = new Map<string, string>();

    for (const m of active) {
      const name = m.display_name?.trim() || 'Alguien';
      next.set(m.id, name);
      if (initializedRef.current && !prev.has(m.id)) {
        setEvents((e) => [
          ...e,
          {
            id: `join-${m.id}-${Date.now()}`,
            text: `${name} se unió a la conversación.`,
          },
        ]);
      }
    }

    if (initializedRef.current) {
      for (const [id, name] of prev) {
        if (!next.has(id)) {
          setEvents((e) => [
            ...e,
            {
              id: `leave-${id}-${Date.now()}`,
              text: `${name} abandonó la conversación.`,
            },
          ]);
        }
      }
    }

    prevRef.current = next;
    initializedRef.current = true;
  }, [members]);

  return events;
}

export function ChatMessagesPane({
  messages,
  currentMemberId = null,
  viewerLanguage = null,
  lastReadAt = null,
  members = [],
  typingLabel = null,
  recordingLabel = null,
  closureBanner = null,
  onMessagesScroll,
  isOwner = false,
  inviteCode = null,
  onOpenInvite,
  onShareInvite,
  composerDisabled = false,
}: ChatMessagesPaneProps) {
  const activityEvents = useMemberActivityEvents(members);
  const { containerRef, handleScroll } = useChatAutoScroll(messages);

  const activeCount = members.filter((m) => !m.left_at).length;
  const showSoloOwnerInvite =
    isOwner &&
    activeCount <= 1 &&
    messages.length === 0 &&
    activityEvents.length === 0 &&
    Boolean(onOpenInvite || onShareInvite);

  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    handleScroll();
    onMessagesScroll?.(e);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        ref={containerRef}
        className="chat-pane-bg app-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain py-3"
        onScroll={onScroll}
      >
        {showSoloOwnerInvite ? (
          <SoloOwnerInvitePrompt
            inviteCode={inviteCode}
            onOpenQr={onOpenInvite}
            onShare={onShareInvite}
            composerDisabled={composerDisabled}
          />
        ) : messages.length === 0 && activityEvents.length === 0 ? (
          <p className="py-16 text-center text-sm text-[var(--app-muted)]">
            Aún no hay mensajes. Escribe o graba un audio para iniciar la
            conversación.
          </p>
        ) : null}

        {activityEvents.map((ev) => (
          <SystemMessageCard key={ev.id}>{ev.text}</SystemMessageCard>
        ))}

        {messages.map((m, idx) => {
          const prev = idx > 0 ? messages[idx - 1] : null;
          const grouped =
            prev &&
            prev.member_id === m.member_id &&
            m.created_at &&
            prev.created_at &&
            Date.parse(m.created_at) - Date.parse(prev.created_at) <= 120_000;

          return (
            <MessageBubble
              key={m.id}
              message={m}
              currentMemberId={currentMemberId}
              viewerLanguage={viewerLanguage}
              lastReadAt={lastReadAt}
              showReadReceipts
              members={members}
              showAvatar={!grouped}
              showHeader={!grouped}
            />
          );
        })}

        {closureBanner ? (
          <SystemMessageCard>{closureBanner}</SystemMessageCard>
        ) : null}
      </div>

      {typingLabel ? (
        <ChatActivityIndicator label={typingLabel} variant="typing" />
      ) : null}
      {recordingLabel ? (
        <ChatActivityIndicator label={recordingLabel} variant="recording" />
      ) : null}
    </div>
  );
}
